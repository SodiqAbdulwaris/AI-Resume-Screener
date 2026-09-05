const aiClient = require('./ai.client');
const { jobToAiInput, candidateToAiInput, aiRankedCandidateToMatchResult } = require('../mappers/ai.payload.mapper');
const Application = require('../models/Application');
const CandidateProfile = require('../models/CandidateProfile');
const Resume = require('../models/Resume');
const MatchResult = require('../models/MatchResult');
const Settings = require('../models/Settings');

async function runMatch(job) {
  // 1. Only match candidates who have applied to this job
  const applications = await Application.find({ job: job._id }).lean();
  if (applications.length === 0) {
    return [];
  }

  // 2. Load their candidate profiles
  const profileIds = applications.map((a) => a.candidateProfile);
  const profiles = await CandidateProfile.find({ _id: { $in: profileIds } });
  if (profiles.length === 0) {
    return [];
  }

  // 3. Fetch active resumes for raw_text
  const resumeIds = profiles.map((p) => p.resumeId);
  const resumes = await Resume.find({ _id: { $in: resumeIds }, isActive: true });
  const resumeById = Object.fromEntries(resumes.map((r) => [r._id.toString(), r]));

  // 4. Build AI payloads
  const settings = await Settings.getGlobalSettings();
  const aiJobInput = jobToAiInput(job, settings.defaultWeights);
  const aiCandidates = profiles.map((profile) => {
    const resume = resumeById[profile.resumeId?.toString()] || null;
    return candidateToAiInput(profile, resume);
  });

  // 5. Call AI service
  const aiResponse = await aiClient.matchCandidates(aiJobInput, aiCandidates);
  const ranked = aiResponse.ranked_candidates || [];

  // 6. Build profile lookup map
  const profileIdByString = Object.fromEntries(
    profiles.map((p) => [p._id.toString(), p._id])
  );

  // 7. Upsert one MatchResult per ranked candidate
  const upsertOps = ranked.map((r, index) => {
    const candidateId = profileIdByString[r.candidate_id];
    if (!candidateId) return null;

    const fields = aiRankedCandidateToMatchResult(r, index + 1);
    return MatchResult.findOneAndUpdate(
      { job: job._id, candidate: candidateId },
      { $set: { ...fields, job: job._id, candidate: candidateId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  });

  const results = await Promise.all(upsertOps.filter(Boolean));
  return results.sort((a, b) => b.totalScore - a.totalScore);
}

module.exports = { runMatch };