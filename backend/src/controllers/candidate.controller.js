const CandidateProfile = require('../models/CandidateProfile');
const Resume = require('../models/Resume');
const User = require('../models/User');

async function findOwnProfile(user) {
  let profile = await CandidateProfile.findOne({ user: user._id });
  if (profile) return profile;

  const defaultResume = await Resume.findOne({ uploadedBy: user._id, isDefault: true })
    .sort({ createdAt: -1 })
    .select('_id')
    .lean();

  if (!defaultResume) return null;

  profile = await CandidateProfile.findOne({ resumeId: defaultResume._id });
  if (profile && profile.user?.toString() !== user._id.toString()) {
    profile.user = user._id;
    await profile.save();
  }

  return profile;
}

async function getProfile(req, res) {
  const profile = await findOwnProfile(req.user);
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Candidate profile not found.', data: null });
  }
  return res.json({ success: true, message: 'Candidate profile retrieved successfully.', data: profile.toObject() });
}

async function acceptParsedName(req, res, next) {
  try {
    const profile = await findOwnProfile(req.user);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Candidate profile not found.', data: null });
    }

    const parsedFullName = profile.parsedFullName?.trim();
    if (!parsedFullName) {
      return res.status(400).json({ success: false, message: 'No parsed resume name is available.', data: null });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName: parsedFullName },
      { new: true, runValidators: true }
    ).select('_id fullName email role');

    profile.fullName = parsedFullName;
    await profile.save();

    return res.json({
      success: true,
      message: 'Resume name accepted successfully.',
      data: {
        profile,
        user,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getProfile, acceptParsedName };
