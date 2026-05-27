/**
 * Express global error handler.
 * Converts known error shapes into consistent JSON responses.
 * Must be registered as the last middleware in the app.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[ErrorHandler]', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File exceeds the 5 MB size limit.' });
  }

  // Multer invalid file type (set in upload middleware)
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ success: false, message: err.message });
  }

  // AI service returned a 400
  if (err.isAiError && err.aiStatus === 400) {
    return res.status(400).json({
      success: false,
      message: err.message,
      error_code: err.aiErrorCode,
    });
  }

  // AI service timeout
  if (err.isAiTimeout) {
    return res.status(504).json({ success: false, message: err.message });
  }

  // AI service 500 or unreachable
  if (err.isAiError) {
    return res.status(502).json({
      success: false,
      message: 'AI service error. The operation has been marked as failed.',
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Generic server error
  return res.status(500).json({ success: false, message: 'Internal server error.' });
}

module.exports = errorHandler;
