const Resume = require('../models/Resume');
const CandidateProfile = require('../models/CandidateProfile');
const aiClient = require('../services/ai.client');
const { parsedCandidateToBackend } = require('../mappers/ai.payload.mapper');

// Worst case, N concurrent uploads for the same user can make one unlucky
// request lose the race up to N-1 times before it's the last one standing —
// this is cheap to retry (two quick Mongo ops), so be generous rather than
// risk a real request failing under realistic multi-tab/double-click load.
const MAX_ACTIVATE_ATTEMPTS = 10;

function jitterDelay(attempt) {
  return new Promise((resolve) => setTimeout(resolve, Math.random() * 20 * attempt));
}

// Demote-then-create isn't atomic on its own, so a unique partial index
// (Resume.js: {uploadedBy, isDefault:true}) rejects a second concurrent upload
// that also lands isDefault:true. Retrying re-runs the demote step, which
// converges once the racing request's write has landed. Jittered backoff
// spreads out competing retries instead of having them collide again in lockstep.
async function createDefaultResume(userId, file) {
  for (let attempt = 1; attempt <= MAX_ACTIVATE_ATTEMPTS; attempt++) {
    await Resume.updateMany({ uploadedBy: userId, isDefault: true }, { isDefault: false });
    try {
      return await Resume.create({
        uploadedBy: userId,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        isDefault: true,
        parseStatus: 'pending',
      });
    } catch (err) {
      if (err.code !== 11000 || attempt === MAX_ACTIVATE_ATTEMPTS) throw err;
      await jitterDelay(attempt);
    }
  }
}

async function uploadResume(req, res, next) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.', data: null });
  }

  const existingCount = await Resume.countDocuments({ uploadedBy: req.user._id });
  if (existingCount >= Resume.MAX_PER_CANDIDATE) {
    return res.status(400).json({
      success: false,
      message: `You can keep at most ${Resume.MAX_PER_CANDIDATE} resumes. Delete one before uploading another.`,
      data: null,
    });
  }

  // 1-2. Demote any existing default resume and create the new one atomically
  let resume = await createDefaultResume(req.user._id, file);

  // 3. Mark as processing
  resume.parseStatus = 'processing';
  resume.parseStartedAt = new Date();
  await resume.save();

  try {
    // 4. Call AI parse
    const parsed = await aiClient.parseResume(file.buffer, file.originalname, file.mimetype);

    // 5. Map AI response to backend shapes
    const { resumeFields, profileFields } = parsedCandidateToBackend(parsed);

    // 6. Persist raw text onto Resume
    resume.rawText = resumeFields.rawText;
    resume.needsReview = resumeFields.needsReview;
    resume.fallbackReasons = resumeFields.fallbackReasons;
    resume.extractionMethod = resumeFields.extractionMethod;
    resume.ocrConfidence = resumeFields.ocrConfidence;
    resume.parseStatus = resumeFields.needsReview ? 'needs_review' : 'done';
    resume.parseCompletedAt = new Date();
    await resume.save();

    // 7. Upsert CandidateProfile — one profile per candidate, updated on each upload
    const profile = await CandidateProfile.findOneAndUpdate(
      { user: req.user._id },
      { resumeId: resume._id, ...profileFields, fullName: req.user.fullName },
      { upsert: true, new: true }
    );

    const scannedNeedsReview = resumeFields.needsReview && resumeFields.extractionMethod === 'ocr';
    return res.status(201).json({
      success: true,
      message: scannedNeedsReview
        ? 'This resume was scanned — please verify the extracted details in your profile.'
        : resumeFields.needsReview
        ? "We couldn't extract much from this resume — please check your profile and fill in any missing details."
        : 'Resume uploaded and parsed successfully.',
      data: {
        resumeId: resume._id,
        candidateProfileId: profile._id,
        parseStatus: resume.parseStatus,
      },
    });
  } catch (err) {
    resume.parseStatus = 'failed';
    resume.parseError = err.message;
    await resume.save();
    return next(err);
  }
}

async function getResume(req, res) {
  const resume = await Resume.findById(req.params.resumeId).lean();
  if (!resume) {
    return res.status(404).json({ success: false, message: 'Resume not found.', data: null });
  }

  if (req.user.role === 'candidate' && resume.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. You can only view your own resume.',
      data: null,
    });
  }

  return res.json({ success: true, message: 'Resume retrieved successfully.', data: resume });
}

async function listMyResumes(req, res) {
  const resumes = await Resume.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 }).lean();
  return res.json({ success: true, message: 'Resumes retrieved successfully.', data: resumes });
}

async function setDefaultResume(req, res) {
  const { resumeId } = req.params;
  const resume = await Resume.findOne({ _id: resumeId, uploadedBy: req.user._id });
  if (!resume) {
    return res.status(404).json({ success: false, message: 'Resume not found.', data: null });
  }

  await Resume.updateMany({ uploadedBy: req.user._id, isDefault: true }, { isDefault: false });
  resume.isDefault = true;
  await resume.save();

  // Repoints which file is "current" for attachments/downloads. Does not
  // re-parse — the profile's structured fields (skills, experience, etc.)
  // stay whatever the most recent upload produced, not this resume's own
  // parse. Re-parsing on every default switch would mean either storing a
  // full parsed snapshot per resume or an extra AI-service round trip here;
  // neither is justified yet for a library that exists to hold alternate
  // resume files, not alternate profiles.
  await CandidateProfile.findOneAndUpdate({ user: req.user._id }, { resumeId: resume._id });

  return res.json({ success: true, message: 'Default resume updated.', data: resume });
}

async function deleteResume(req, res) {
  const { resumeId } = req.params;
  const resume = await Resume.findOne({ _id: resumeId, uploadedBy: req.user._id });
  if (!resume) {
    return res.status(404).json({ success: false, message: 'Resume not found.', data: null });
  }

  const totalCount = await Resume.countDocuments({ uploadedBy: req.user._id });
  if (totalCount <= 1) {
    return res.status(400).json({ success: false, message: 'You must keep at least one resume.', data: null });
  }

  await resume.deleteOne();

  if (resume.isDefault) {
    const nextDefault = await Resume.findOne({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    if (nextDefault) {
      nextDefault.isDefault = true;
      await nextDefault.save();
      await CandidateProfile.findOneAndUpdate({ user: req.user._id }, { resumeId: nextDefault._id });
    }
  }

  return res.json({ success: true, message: 'Resume deleted.', data: null });
}

module.exports = { uploadResume, getResume, listMyResumes, setDefaultResume, deleteResume };
