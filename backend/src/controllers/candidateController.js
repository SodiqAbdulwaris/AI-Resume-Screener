const CandidateProfile = require('../models/CandidateProfile');

/**
 * GET /api/candidate-profiles/:profileId
 * Return the parsed candidate profile.
 */
async function getProfile(req, res) {
  const profile = await CandidateProfile.findById(req.params.profileId).lean();
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Candidate profile not found.' });
  }
  return res.json({ success: true, profile });
}

module.exports = { getProfile };
