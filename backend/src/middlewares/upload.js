const multer = require('multer');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB — matches AI service default

const storage = multer.memoryStorage(); // keep file in memory buffer; no temp files needed

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
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
