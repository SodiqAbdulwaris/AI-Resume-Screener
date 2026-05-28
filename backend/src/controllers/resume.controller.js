const Resume = require('../models/Resume');
const CandidateProfile = require('../models/CandidateProfile');
const aiClient = require('../services/ai.client');
const { parsedCandidateToBackend } = require('../mappers/ai.payload.mapper');

async function uploadResume(req, res, next) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.', data: null });
  }

  // 1. Deactivate any existing active resume for this candidate
  await Resume.updateMany(
    { uploadedBy: req.user._id, isActive: true },
    { isActive: false }
  );

  // 2. Create Resume document
  let resume = await Resume.create({
    uploadedBy: req.user._id,
    originalFileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    isActive: true,
    parseStatus: 'pending',
  });

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
    resume.parseStatus = 'done';
    resume.parseCompletedAt = new Date();
    await resume.save();

    // 7. Upsert CandidateProfile — one profile per candidate, updated on each upload
    const profile = await CandidateProfile.findOneAndUpdate(
      { user: req.user._id },
      { resumeId: resume._id, ...profileFields },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Resume uploaded and parsed successfully.',
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
  return res.json({ success: true, message: 'Resume retrieved successfully.', data: resume });
}

module.exports = { uploadResume, getResume };