const express = require('express');
const router = express.Router();
const { getProfile } = require('../controllers/candidateController');

// GET /api/candidate-profiles/:profileId
router.get('/:profileId', getProfile);

module.exports = router;
