const express = require('express');
const router = express.Router();
const {
  createJob,
  getAllJobs,
  getJobById,
  closeJob,
  runJobMatch,
  getJobMatches,
  exportJobMatchesCsv,
  applyToJob,
  cancelApplication,
  getMyApplications,
  getRecruiterAnalytics,
  getJobApplications,
  advanceApplicationStage,
  bulkAdvanceApplicationStage,
  toggleShortlist,
} = require('../controllers/job.controller');
const { authenticate, authorise, optionalAuthenticate } = require('../middlewares/auth.middleware');
const validateObjectId = require('../middlewares/validateObjectId.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createJobSchema,
  closeJobSchema,
  toggleShortlistSchema,
  updateApplicationStageSchema,
  bulkUpdateApplicationStageSchema,
} = require('../validations/job.validation');

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Jobs and matching operations management API
 */

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Create a job requirement (Recruiter only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title: { type: string, example: Node.js Developer }
 *               description: { type: string, example: Full-stack dev specializing in MERN stack. }
 *               requiredSkills: { type: array, items: { type: string }, example: ["Node.js", "Express", "MongoDB"] }
 *               preferredSkills: { type: array, items: { type: string }, example: ["TypeScript", "Docker"] }
 *               requiredEducationLevel: { type: string, enum: [olevel, bachelor, master, phd, any], example: bachelor }
 *               requiredExperienceYears: { type: number, example: 3 }
 *     responses:
 *       201:
 *         description: Job requirements created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobResponse'
 *       400:
 *         description: Missing fields or invalid body parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden, Recruiter role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authenticate, authorise('recruiter'), validate(createJobSchema), createJob);

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get all jobs (Optional authentication)
 *     description: Retrieve list of jobs with cursor-based pagination. Candidates/guests view open roles, recruiters view their own roles.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *         description: Next cursor (_id of the last item in the previous page)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Limit of items to return
 *     responses:
 *       200:
 *         description: Paginated jobs list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', optionalAuthenticate, getAllJobs);

/**
 * @swagger
 * /jobs/my-applications:
 *   get:
 *     summary: Retrieve applications submitted by the logged in candidate
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Applications retrieved. }
 *                 data: { type: array, items: { type: object } }
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: Candidate role required
 */
router.get('/my-applications', authenticate, authorise('candidate'), getMyApplications);

/**
 * @swagger
 * /jobs/analytics:
 *   get:
 *     summary: Recruiter-scoped applicant funnel and match-score distribution (Recruiter only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved
 */
router.get('/analytics', authenticate, authorise('recruiter'), getRecruiterAnalytics);

/**
 * @swagger
 * /jobs/{jobId}:
 *   get:
 *     summary: Get job details by ID
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobResponse'
 *       404:
 *         description: Job not found
 */
router.get('/:jobId', authenticate, validateObjectId('jobId'), getJobById);

/**
 * @swagger
 * /jobs/{jobId}:
 *   patch:
 *     summary: Update job open status (Recruiter only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isOpen]
 *             properties:
 *               isOpen: { type: boolean, example: false }
 *     responses:
 *       200:
 *         description: Job status updated successfully
 *       403:
 *         description: Forbidden, Recruiter role required
 *       404:
 *         description: Job not found
 */
router.patch('/:jobId', authenticate, authorise('recruiter'), validateObjectId('jobId'), validate(closeJobSchema), closeJob);

/**
 * @swagger
 * /jobs/{jobId}/applications:
 *   get:
 *     summary: List applications to a job (Recruiter only, own jobs)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Applications retrieved
 *       403:
 *         description: Forbidden — not your job
 *       404:
 *         description: Job not found
 */
router.get('/:jobId/applications', authenticate, authorise('recruiter'), validateObjectId('jobId'), getJobApplications);

/**
 * @swagger
 * /jobs/{jobId}/applications/bulk-stage:
 *   patch:
 *     summary: Advance multiple applications to a new pipeline stage (Recruiter only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [applicationIds, status]
 *             properties:
 *               applicationIds: { type: array, items: { type: string } }
 *               status: { type: string, enum: [pending, reviewed, shortlisted, rejected] }
 *     responses:
 *       200:
 *         description: Applications updated
 */
router.patch(
  '/:jobId/applications/bulk-stage',
  authenticate,
  authorise('recruiter'),
  validateObjectId('jobId'),
  validate(bulkUpdateApplicationStageSchema),
  bulkAdvanceApplicationStage
);

/**
 * @swagger
 * /jobs/{jobId}/applications/{applicationId}/stage:
 *   patch:
 *     summary: Advance one application to a new pipeline stage (Recruiter only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, reviewed, shortlisted, rejected] }
 *     responses:
 *       200:
 *         description: Application updated
 *       404:
 *         description: Application not found
 */
router.patch(
  '/:jobId/applications/:applicationId/stage',
  authenticate,
  authorise('recruiter'),
  validateObjectId('jobId'),
  validate(updateApplicationStageSchema),
  advanceApplicationStage
);

/**
 * @swagger
 * /jobs/{jobId}/apply:
 *   post:
 *     summary: Apply to a job (Candidate only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Applied successfully
 *       400:
 *         description: Already applied or profile incomplete
 *       403:
 *         description: Candidate role required
 *       404:
 *         description: Job not found
 */
router.post('/:jobId/apply', authenticate, authorise('candidate'), validateObjectId('jobId'), applyToJob);

/**
 * @swagger
 * /jobs/{jobId}/apply:
 *   delete:
 *     summary: Cancel a job application (Candidate only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Application cancelled successfully
 *       403:
 *         description: Candidate role required
 *       404:
 *         description: Application not found
 */
router.delete('/:jobId/apply', authenticate, authorise('candidate'), validateObjectId('jobId'), cancelApplication);

/**
 * @swagger
 * /jobs/{jobId}/match:
 *   post:
 *     summary: Run AI matching for a job against candidate pool (Recruiter only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Match calculation completed
 *       403:
 *         description: Recruiter role required or job belongs to another recruiter
 *       404:
 *         description: Job not found
 */
router.post('/:jobId/match', authenticate, authorise('recruiter'), validateObjectId('jobId'), runJobMatch);

/**
 * @swagger
 * /jobs/{jobId}/matches:
 *   get:
 *     summary: Get AI match results for a job (Recruiter only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *         description: Cursor for pagination (_id of the last item in previous page)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Limit of matches to return
 *       - in: query
 *         name: shortlisted
 *         schema: { type: string, enum: [true, false] }
 *         description: Filter matches by shortlisted status
 *     responses:
 *       200:
 *         description: Matches retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/:jobId/matches', authenticate, authorise('recruiter'), validateObjectId('jobId'), getJobMatches);

/**
 * @swagger
 * /jobs/{jobId}/matches/{matchId}:
 *   patch:
 *     summary: Toggle candidate shortlist status (Recruiter only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shortlisted]
 *             properties:
 *               shortlisted: { type: boolean }
 *     responses:
 *       200:
 *         description: Shortlist status toggled successfully
 */
router.patch('/:jobId/matches/:matchId', authenticate, authorise('recruiter'), validateObjectId('jobId'), validate(toggleShortlistSchema), toggleShortlist);

/**
 * @swagger
 * /jobs/{jobId}/matches/export.csv:
 *   get:
 *     summary: Export match results to CSV (Recruiter only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema: { type: string }
 */
router.get('/:jobId/matches/export.csv', authenticate, authorise('recruiter'), validateObjectId('jobId'), exportJobMatchesCsv);

module.exports = router;
