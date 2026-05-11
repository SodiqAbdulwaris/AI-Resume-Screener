const ApiError = require('../utils/apiError')

const authorise = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, 'Forbidden')
  }
  next()
}

module.exports = authorise
