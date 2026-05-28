const multer = require('multer');
const config = require('../config/env');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const storage = multer.memoryStorage(); // keep file in memory buffer; no temp files needed

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeBytes },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        Object.assign(new Error('Only PDF and DOCX files are accepted'), {
          code: 'INVALID_FILE_TYPE',
        })
      );
    }
  },
});

module.exports = upload;
