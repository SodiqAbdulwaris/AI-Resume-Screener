const CandidateProfile = require('../models/CandidateProfile');

async function getProfile(req, res) {
  const profile = await CandidateProfile.findOne({ user: req.user._id }).lean();
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Candidate profile not found.', data: null });
  }
  return res.json({ success: true, message: 'Candidate profile retrieved successfully.', data: profile });
}

module.exports = { getProfile };