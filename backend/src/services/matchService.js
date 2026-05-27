const aiClient = require('./aiClient');
const { jobToAiInput, candidateToAiInput, aiRankedCandidateToMatchResult } = require('../mappers/aiPayloadMapper');
const CandidateProfile = require('../models/CandidateProfile');
const Resume = require('../models/Resume').default;
const MatchResult = require('../models/MatchResult');

/**
 * Run the full matching flow for a job:
 *   1. Load all candidate profiles + their resumes from the DB
 *   2. Build AI payloads via the mapper
 *   3. Call AI /match/
 *   4. Upsert one MatchResult per candidate
 *   5. Return the persisted results sorted by score descending
 *
 * @param {import('../models/JobRequirement')} job  Populated job document
 * @returns {Promise<MatchResult[]>}
 */
async function runMatch(job) {
  // Load all candidates that have a completed resume parse
  const profiles = await CandidateProfile.find({});
  if (profiles.length === 0) {
    return [];
  }

  // Fetch resumes for raw_text (one query, map by id)
  const resumeIds = profiles.map((p) => p.resumeId);
  const resumes = await Resume.find({ _id: { $in: resumeIds } });
  const resumeById = Object.fromEntries(resumes.map((r) => [r._id.toString(), r]));

  // Build AI input payloads
  const aiJobInput = jobToAiInput(job);
  const aiCandidates = profiles.map((profile) => {
    const resume = resumeById[profile.resumeId?.toString()] || null;
    return candidateToAiInput(profile, resume);
  });

  // Call AI service
  const aiResponse = await aiClient.matchCandidates(aiJobInput, aiCandidates);
  const ranked = aiResponse.ranked_candidates || [];

  // Build a map from candidate_id (string) -> profile ObjectId for upsert keys
  const profileIdByString = Object.fromEntries(
    profiles.map((p) => [p._id.toString(), p._id])
  );

  // Upsert one MatchResult per ranked candidate
  const upsertOps = ranked.map((r) => {
    const candidateId = profileIdByString[r.candidate_id];
    if (!candidateId) return null;

    const fields = aiRankedCandidateToMatchResult(r);
    return MatchResult.findOneAndUpdate(
      { jobId: job._id, candidateId },
      { $set: fields },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  });

  const results = await Promise.all(upsertOps.filter(Boolean));
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { runMatch };
