const express = require('express');
const router = express.Router();
const { getProfile } = require('../controllers/candidateController');
const authenticate = require('../middleware/authenticate');
const authorise = require('../middleware/authorise');

// GET /api/candidate-profiles/:profileId (candidate only)
router.get('/:profileId', authenticate, authorise('candidate'), getProfile);

module.exports = router;
