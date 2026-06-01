const Application = require('../models/Application');
const CandidateProfile = require('../models/CandidateProfile');
const JobRequirement = require('../models/JobRequirement');
const MatchResult = require('../models/MatchResult');

async function applyToJob(req, res) {
  const { jobId } = req.params;

  // 1. Confirm job exists and is open
  const job = await JobRequirement.findById(jobId).lean();
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found.', data: null });
  }
  if (!job.isOpen) {
    return res.status(400).json({ success: false, message: 'This job is no longer accepting applications.', data: null });
  }

  // 2. Confirm candidate has a profile (i.e. has uploaded a resume)
  const profile = await CandidateProfile.findOne({ user: req.user._id }).lean();
  if (!profile) {
    return res.status(400).json({ success: false, message: 'You must upload a resume before applying.', data: null });
  }

  // 3. Create application — unique index on { candidate, job } will reject duplicates
  const application = await Application.create({
    candidate: req.user._id,
    job: jobId,
    candidateProfile: profile._id,
    status: 'pending',
  });

  return res.status(201).json({ success: true, message: 'Application submitted successfully.', data: application });
}

async function getMyApplications(req, res) {
  const applications = await Application.find({ candidate: req.user._id })
    .populate('job', 'title description requiredSkills requiredExperienceYears requiredEducationLevel')
    .sort({ appliedAt: -1 })
    .lean();

  return res.json({ success: true, message: 'Applications retrieved successfully.', data: applications });
}

async function cancelApplication(req, res) {
  const { jobId } = req.params;
  const application = await Application.findOneAndDelete({ candidate: req.user._id, job: jobId }).lean();

  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found.', data: null });
  }

  await MatchResult.deleteOne({ job: jobId, candidate: application.candidateProfile });

  return res.json({ success: true, message: 'Application cancelled successfully.', data: application });
}

module.exports = { applyToJob, getMyApplications, cancelApplication };
