const mongoose = require('mongoose');
const User = require('../models/User');
const JobRequirement = require('../models/JobRequirement');
const Application = require('../models/Application');
const MatchResult = require('../models/MatchResult');
const Settings = require('../models/Settings');
const config = require('../config/env');

function paginate(req) {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || config.defaultPageLimit, 1), config.maxPageLimit);
  const cursor = req.query.cursor;
  const filter = {};
  if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
    filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }
  return { limit, filter };
}

function pageResult(docs, limit) {
  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id.toString() : null;
  return { items, nextCursor, hasMore };
}

async function getUsers(req, res) {
  const { limit, filter } = paginate(req);

  const users = await User.find(filter)
    .select('-password')
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  return res.json({
    success: true,
    message: 'Users retrieved successfully.',
    data: pageResult(users, limit),
  });
}

async function deactivateUser(req, res) {
  const { userId } = req.params;
  const { isDeleted } = req.body;

  if (userId === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.', data: null });
  }

  const user = await User.findByIdAndUpdate(userId, { isDeleted }, { new: true }).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.', data: null });
  }

  return res.json({
    success: true,
    message: `User ${isDeleted ? 'deactivated' : 'reactivated'} successfully.`,
    data: user,
  });
}

async function getJobs(req, res) {
  const { limit, filter } = paginate(req);

  const jobs = await JobRequirement.find(filter)
    .populate('createdBy', 'fullName email')
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  return res.json({
    success: true,
    message: 'Jobs retrieved successfully.',
    data: pageResult(jobs, limit),
  });
}

async function getStats(req, res) {
  const [totalCandidates, totalRecruiters, totalJobs, openJobs, jobsMatched, totalApplications, totalMatches] =
    await Promise.all([
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'recruiter' }),
      JobRequirement.countDocuments({}),
      JobRequirement.countDocuments({ isOpen: true }),
      JobRequirement.countDocuments({ lastMatchedAt: { $ne: null } }),
      Application.countDocuments({}),
      MatchResult.countDocuments({}),
    ]);

  return res.json({
    success: true,
    message: 'Stats retrieved successfully.',
    data: { totalCandidates, totalRecruiters, totalJobs, openJobs, jobsMatched, totalApplications, totalMatches },
  });
}

async function getSettings(req, res) {
  const settings = await Settings.getGlobalSettings();
  return res.json({ success: true, message: 'Settings retrieved successfully.', data: settings });
}

async function updateSettings(req, res) {
  const { defaultWeights } = req.body;
  const settings = await Settings.getGlobalSettings();
  settings.defaultWeights = defaultWeights;
  await settings.save();

  return res.json({ success: true, message: 'Settings updated successfully.', data: settings });
}

module.exports = {
  getUsers,
  deactivateUser,
  getJobs,
  getStats,
  getSettings,
  updateSettings,
};
