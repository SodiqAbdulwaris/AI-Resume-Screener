const express = require('express');
const router = express.Router();
const { createJob, runJobMatch, getJobMatches } = require('../controllers/jobController');
const authenticate = require('../middleware/authenticate');
const authorise = require('../middleware/authorise');

// POST /api/jobs (recruiter only)
router.post('/', authenticate, authorise('recruiter'), createJob);

// POST /api/jobs/:jobId/match (recruiter only)
router.post('/:jobId/match', authenticate, authorise('recruiter'), runJobMatch);

// GET /api/jobs/:jobId/matches (both roles)
router.get('/:jobId/matches', authenticate, getJobMatches);

module.exports = router;
