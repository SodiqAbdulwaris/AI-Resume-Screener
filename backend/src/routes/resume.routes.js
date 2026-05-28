const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const { uploadResume, getResume } = require('../controllers/resume.controller');
const { authenticate, authorise } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /api/resumes:
 *   post:
 *     summary: Upload a resume for parsing
 *     description: Accepts a PDF or DOCX file, extracts text, runs the AI service parser, creates a candidate profile, and returns document IDs. Only accessible by Recruiters.
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Resume file to upload (PDF or DOCX)
 *     responses:
 *       201:
 *         description: Resume uploaded and parsed successfully.
 *       400:
 *         description: No file uploaded or invalid file format.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden. Recruiter role required.
 */
router.post('/', authenticate, authorise('candidate'), upload.single('file'), uploadResume);

/**
 * @swagger
 * /api/resumes/{resumeId}:
 *   get:
 *     summary: Get resume parsing status and metadata
 *     description: Returns the uploader details, processing state (pending, processing, done, failed), and any errors. Accessible by Recruiters.
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resumeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique MongoDB ObjectId of the Resume document
 *     responses:
 *       200:
 *         description: Resume record retrieved.
 *       404:
 *         description: Resume not found.
 */
router.get('/:resumeId', authenticate, authorise('recruiter'), getResume);

module.exports = router;
