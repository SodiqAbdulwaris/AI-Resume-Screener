const express = require('express');
const router = express.Router();
const { createJob, runJobMatch, getJobMatches } = require('../controllers/jobController');

// POST /api/jobs
router.post('/', createJob);

// POST /api/jobs/:jobId/match
router.post('/:jobId/match', runJobMatch);

// GET /api/jobs/:jobId/matches
router.get('/:jobId/matches', getJobMatches);

module.exports = router;
