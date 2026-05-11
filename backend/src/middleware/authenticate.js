const jwt = require('jsonwebtoken')
const env = require('../config/env')
const ApiError = require('../utils/apiError')
const asyncHandler = require('../utils/asyncHandler')

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'No token provided')
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    req.user = { userId: decoded.userId, role: decoded.role }
    next()
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token')
  }
})

module.exports = authenticate
