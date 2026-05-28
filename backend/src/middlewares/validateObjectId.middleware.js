const mongoose = require('mongoose');

function validateObjectId(...paramNames) {
  return (req, res, next) => {
    for (const param of paramNames) {
      if (!mongoose.Types.ObjectId.isValid(req.params[param])) {
        return res.status(400).json({
          success: false,
          message: `Invalid ID format for parameter '${param}'.`,
          data: null,
        });
      }
    }
    next();
  };
}

module.exports = validateObjectId;