const jwt = require('jsonwebtoken')
const User = require('../models/User')
const env = require('../config/env')
const ApiError = require('../utils/apiError')
const asyncHandler = require('../utils/asyncHandler')

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body

  if (!fullName || !email || !password || !role) {
    throw new ApiError(400, 'All fields are required')
  }

  if (!['candidate', 'recruiter'].includes(role)) {
    throw new ApiError(400, 'Invalid role')
  }

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new ApiError(409, 'Email already in use')
  }

  await User.create({ fullName, email, password, role })

  res.status(201).json({
    success: true,
    message: 'Registered successfully',
    data: null,
  })
})

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new ApiError(400, 'All fields are required')
  }

  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    throw new ApiError(401, 'Invalid credentials')
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials')
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_LAST_FOR }
  )

  const safeUser = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  }

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { token, user: safeUser },
  })
})

module.exports = { register, login }
