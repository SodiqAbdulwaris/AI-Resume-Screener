const JobRequirement = require('../models/JobRequirement');
const MatchResult = require('../models/MatchResult');
const { runMatch } = require('../services/match.service');
const Application = require('../models/Application');
const CandidateProfile = require('../models/CandidateProfile');

async function createJob(req, res) {
  const { title, description, requiredSkills, preferredSkills, requiredEducationLevel, requiredExperienceYears } =
    req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'title and description are required.', data: null });
  }

  const job = await JobRequirement.create({
    createdBy: req.user._id,
    title,
    description,
    requiredSkills: requiredSkills || [],
    preferredSkills: preferredSkills || [],
    requiredEducationLevel: requiredEducationLevel || 'any',
    requiredExperienceYears: requiredExperienceYears || 0,
  });

  return res.status(201).json({ success: true, message: 'Job requirement created successfully.', data: job });
}

async function getAllJobs(req, res) {
  const jobs = await JobRequirement.find({ isOpen: true }).sort({ createdAt: -1 }).lean();
  return res.json({ success: true, message: 'Jobs retrieved successfully.', data: jobs });
}

async function getJobById(req, res) {
  const job = await JobRequirement.findById(req.params.jobId).lean();
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found.', data: null });
  }
  return res.json({ success: true, message: 'Job retrieved successfully.', data: job });
}

async function runJobMatch(req, res, next) {
  const job = await JobRequirement.findById(req.params.jobId);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found.', data: null });
  }

  try {
    const results = await runMatch(job);
    return res.json({
      success: true,
      message: 'Job matching completed successfully.',
      data: { matchCount: results.length, results },
    });
  } catch (err) {
    return next(err);
  }
}

async function getJobMatches(req, res) {
  const { jobId } = req.params;
  const filter = { job: jobId };

  if (req.query.shortlisted === 'true') {
    filter.shortlisted = true;
  }

  const matches = await MatchResult.find(filter)
    .sort({ totalScore: -1 })
    .populate('candidate', 'fullName skills yearsExperience educationLevel')
    .lean();

  return res.json({
    success: true,
    message: 'Matching results fetched successfully.',
    data: { count: matches.length, matches },
  });
}

async function applyToJob(req, res) {
  const { jobId } = req.params;

  const job = await JobRequirement.findById(jobId).lean();
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found.', data: null });
  }
  if (!job.isOpen) {
    return res.status(400).json({ success: false, message: 'This job is no longer accepting applications.', data: null });
  }

  const profile = await CandidateProfile.findOne({ user: req.user._id }).lean();
  if (!profile) {
    return res.status(400).json({ success: false, message: 'You must upload a resume before applying.', data: null });
  }

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

module.exports = { createJob, getAllJobs, getJobById, applyToJob, getMyApplications, runJobMatch, getJobMatches };