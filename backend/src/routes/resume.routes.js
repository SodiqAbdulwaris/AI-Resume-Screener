const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const { uploadResume, getResume, listMyResumes, setDefaultResume, deleteResume } = require('../controllers/resume.controller');
const { authenticate, authorise } = require('../middlewares/auth.middleware');
const validateObjectId = require('../middlewares/validateObjectId.middleware');

/**
 * @swagger
 * /api/resumes:
 *   post:
 *     summary: Upload a resume for parsing
 *     description: Accepts a PDF or DOCX file, extracts text, runs the AI service parser, creates a candidate profile, and returns document IDs. Only accessible by candidates.
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
 *         description: Forbidden. Candidate role required.
 */
router.post('/', authenticate, authorise('candidate'), upload.single('file'), uploadResume);

/**
 * @swagger
 * /api/resumes/mine:
 *   get:
 *     summary: List the current candidate's resumes
 *     description: Returns all resumes the candidate has uploaded (up to 5), newest first.
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumes retrieved.
 */
router.get('/mine', authenticate, authorise('candidate'), listMyResumes);

/**
 * @swagger
 * /api/resumes/{resumeId}:
 *   get:
 *     summary: Get resume parsing status and metadata
 *     description: Returns the uploader details, processing state (pending, processing, done, failed), and any errors. Candidates can read their own resumes; recruiters can read resumes for matching/review flows.
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
router.get('/:resumeId', authenticate, authorise('candidate', 'recruiter'), getResume);

/**
 * @swagger
 * /api/resumes/{resumeId}/default:
 *   patch:
 *     summary: Set a resume as the candidate's default
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resumeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Default resume updated.
 *       404:
 *         description: Resume not found.
 */
router.patch('/:resumeId/default', authenticate, authorise('candidate'), validateObjectId('resumeId'), setDefaultResume);

/**
 * @swagger
 * /api/resumes/{resumeId}:
 *   delete:
 *     summary: Delete a resume from the candidate's library
 *     description: Refuses to delete the candidate's only remaining resume. Deleting the default resume promotes the next most recent one.
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resumeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Resume deleted.
 *       400:
 *         description: Candidate has only one resume left.
 *       404:
 *         description: Resume not found.
 */
router.delete('/:resumeId', authenticate, authorise('candidate'), validateObjectId('resumeId'), deleteResume);

module.exports = router;
