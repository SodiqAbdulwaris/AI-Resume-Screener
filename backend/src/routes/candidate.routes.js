const express = require('express');
const router = express.Router();
const { getProfile } = require('../controllers/candidate.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorise } = require('../middlewares/auth.middleware');

router.get('/me', authenticate, authorise('candidate'), getProfile);

module.exports = router;