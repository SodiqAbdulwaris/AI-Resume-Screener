const JobRequirement = require('../models/JobRequirement');
const MatchResult = require('../models/MatchResult');
const { runMatch } = require('../services/match.service');
const Application = require('../models/Application');
const CandidateProfile = require('../models/CandidateProfile');

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = Array.isArray(value) ? value.join('; ') : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

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
  const filter = req.user.role === 'recruiter' ? { createdBy: req.user._id } : { isOpen: true };
  const jobs = await JobRequirement.find(filter).sort({ createdAt: -1 }).lean();
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
  if (job.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You can only run matches for your own jobs.', data: null });
  }

  try {
    await runMatch(job);
    const results = await MatchResult.find({ job: job._id })
      .sort({ totalScore: -1 })
      .populate('candidate', 'fullName email phone skills yearsExperience educationLevel')
      .lean();

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
  const job = await JobRequirement.findById(jobId).select('createdBy').lean();
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found.', data: null });
  }
  if (job.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You can only view matches for your own jobs.', data: null });
  }

  const filter = { job: jobId };

  if (req.query.shortlisted === 'true') {
    filter.shortlisted = true;
  }

  const matches = await MatchResult.find(filter)
    .sort({ totalScore: -1 })
    .populate('candidate', 'fullName email phone skills yearsExperience educationLevel')
    .lean();

  return res.json({
    success: true,
    message: 'Matching results fetched successfully.',
    data: { count: matches.length, matches },
  });
}

async function exportJobMatchesCsv(req, res) {
  const { jobId } = req.params;
  const job = await JobRequirement.findById(jobId).select('title createdBy').lean();
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found.', data: null });
  }
  if (job.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You can only export matches for your own jobs.', data: null });
  }

  const matches = await MatchResult.find({ job: jobId })
    .sort({ totalScore: -1 })
    .populate('candidate', 'fullName email phone skills yearsExperience educationLevel')
    .lean();

  const headers = [
    'Rank',
    'Candidate Name',
    'Email',
    'Phone',
    'Match %',
    'Skills Score %',
    'Experience Score %',
    'Education Score %',
    'Semantic Score %',
    'Years Experience',
    'Education Level',
    'Matched Skills',
    'Missing Skills',
    'Shortlisted',
    'Explanation',
  ];

  const rows = matches.map((match, index) => {
    const candidate = match.candidate || {};
    const pct = (value) => (typeof value === 'number' ? Math.round(value * 100) : '');
    return [
      match.rankedPosition || index + 1,
      candidate.fullName || '',
      candidate.email || '',
      candidate.phone || '',
      pct(match.totalScore),
      pct(match.scoreBreakdown?.skills),
      pct(match.scoreBreakdown?.experience),
      pct(match.scoreBreakdown?.education),
      pct(match.scoreBreakdown?.semantic),
      candidate.yearsExperience ?? '',
      candidate.educationLevel || '',
      match.matchedSkills || [],
      match.missingSkills || [],
      match.shortlisted ? 'Yes' : 'No',
      match.explanation || '',
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
  const filename = `${job.title || 'match-results'}-matches.csv`.replace(/[^a-z0-9._-]+/gi, '-');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(`\uFEFF${csv}`);
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

async function cancelApplication(req, res) {
  const { jobId } = req.params;
  const application = await Application.findOneAndDelete({ candidate: req.user._id, job: jobId }).lean();

  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found.', data: null });
  }

  await MatchResult.deleteOne({ job: jobId, candidate: application.candidateProfile });

  return res.json({ success: true, message: 'Application cancelled successfully.', data: application });
}

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  applyToJob,
  cancelApplication,
  getMyApplications,
  runJobMatch,
  getJobMatches,
  exportJobMatchesCsv,
};
