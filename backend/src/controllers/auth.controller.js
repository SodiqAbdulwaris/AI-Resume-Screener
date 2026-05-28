const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

const TOKEN_EXPIRY = '7d';

/**
 * Sign a JWT token for a user.
 */
function signToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: TOKEN_EXPIRY }
  );
}

/**
 * POST /api/auth/register
 * Register a new user (Candidate or Recruiter).
 */
async function register(req, res, next) {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide fullName, email, password, and role.',
        data: null,
      });
    }

    // Check if role is valid
    if (role && !['candidate', 'recruiter'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed roles are candidate or recruiter.',
        data: null,
      });
    }

    // Check for existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered.',
        data: null,
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      role,
    });

    return res.status(201).json({
      success: true,
      message: 'Registered successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Log in a user using email/phone and password.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
        data: null,
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        data: null,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        data: null,
      });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Log out user (stateless JWT client cleanup helper).
 */
async function logout(req, res) {
  return res.json({
    success: true,
    message: 'Logged out successfully. Please clear token from client storage.',
    data: null,
  });
}

module.exports = {
  register,
  login,
  logout,
};
