const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { uploadResume, getResume } = require('../controllers/resumeController');

// POST /api/resumes — multipart upload
router.post('/', upload.single('file'), uploadResume);

// GET /api/resumes/:resumeId
router.get('/:resumeId', getResume);

module.exports = router;
