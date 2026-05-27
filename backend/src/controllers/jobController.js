const JobRequirement = require('../models/JobRequirement');
const MatchResult = require('../models/MatchResult');
const { runMatch } = require('../services/matchService');

/**
 * POST /api/jobs
 * Create a new job requirement.
 */
async function createJob(req, res) {
  const { jobTitle, description, requiredSkills, preferredSkills, educationLevel, experienceYears } =
    req.body;

  if (!jobTitle || !description) {
    return res.status(400).json({ success: false, message: 'jobTitle and description are required.' });
  }

  const job = await JobRequirement.create({
    jobTitle,
    description,
    requiredSkills: requiredSkills || [],
    preferredSkills: preferredSkills || [],
    educationLevel: educationLevel || 'any',
    experienceYears: experienceYears || 0,
  });

  return res.status(201).json({ success: true, job });
}

/**
 * POST /api/jobs/:jobId/match
 * Run AI matching for the job against all stored candidates. Upserts MatchResult rows.
 */
async function runJobMatch(req, res, next) {
  const job = await JobRequirement.findById(req.params.jobId);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found.' });
  }

  try {
    const results = await runMatch(job);
    return res.json({ success: true, matchCount: results.length, results });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/jobs/:jobId/matches
 * Return persisted match results for a job, sorted by score descending.
 * Supports optional ?shortlisted=true filter.
 */
async function getJobMatches(req, res) {
  const { jobId } = req.params;
  const filter = { jobId };

  if (req.query.shortlisted === 'true') {
    filter.shortlisted = true;
  }

  const matches = await MatchResult.find(filter)
    .sort({ matchScore: -1 })
    .populate('candidateId', 'personalInfo skills yearsExperience educationLevel')
    .lean();

  return res.json({ success: true, count: matches.length, matches });
}

module.exports = { createJob, runJobMatch, getJobMatches };
