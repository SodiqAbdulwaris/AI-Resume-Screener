const Resume = require('../models/Resume').default;
const CandidateProfile = require('../models/CandidateProfile');
const aiClient = require('../services/aiClient');
const { parsedCandidateToBackend } = require('../mappers/aiPayloadMapper');

/**
 * POST /api/resumes
 * Upload a resume, call AI /parse, persist profile, return ids + status.
 */
async function uploadResume(req, res, next) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  // 1. Create Resume row with pending status
  let resume = await Resume.create({
    originalFileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    parseStatus: 'pending',
  });

  // 2. Mark as processing
  resume.parseStatus = 'processing';
  resume.parseStartedAt = new Date();
  await resume.save();

  try {
    // 3. Call AI parse
    const parsed = await aiClient.parseResume(file.buffer, file.originalname, file.mimetype);

    // 4. Map AI response to backend shapes
    const { resumeFields, profileFields } = parsedCandidateToBackend(parsed);

    // 5. Persist parsed text onto the Resume document
    resume.parsedText = resumeFields.parsedText;

    // 6. Create CandidateProfile
    const profile = await CandidateProfile.create({
      resumeId: resume._id,
      ...profileFields,
    });

    // 7. Link profile back to resume and mark done
    resume.candidateProfileId = profile._id;
    resume.parseStatus = 'done';
    resume.parseCompletedAt = new Date();
    await resume.save();

    return res.status(201).json({
      success: true,
      resumeId: resume._id,
      candidateProfileId: profile._id,
      parseStatus: resume.parseStatus,
    });
  } catch (err) {
    // Mark resume as failed before passing error to global handler
    resume.parseStatus = 'failed';
    resume.parseError = err.message;
    await resume.save();
    return next(err);
  }
}

/**
 * GET /api/resumes/:resumeId
 * Return resume metadata plus parse status and any error message.
 */
async function getResume(req, res) {
  const resume = await Resume.findById(req.params.resumeId).lean();
  if (!resume) {
    return res.status(404).json({ success: false, message: 'Resume not found.' });
  }
  return res.json({ success: true, resume });
}

module.exports = { uploadResume, getResume };
