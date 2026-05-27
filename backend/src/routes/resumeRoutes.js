const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { uploadResume, getResume } = require('../controllers/resumeController');
const authenticate = require('../middleware/authenticate');
const authorise = require('../middleware/authorise');

// POST /api/resumes — multipart upload (candidate only)
router.post('/', authenticate, authorise('candidate'), upload.single('file'), uploadResume);

// GET /api/resumes/:resumeId (candidate only)
router.get('/:resumeId', authenticate, authorise('candidate'), getResume);

module.exports = router;
