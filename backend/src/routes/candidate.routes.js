const express = require('express');
const router = express.Router();
const { getProfile, acceptParsedName } = require('../controllers/candidate.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorise } = require('../middlewares/auth.middleware');

router.get('/me', authenticate, authorise('candidate'), getProfile);
router.post('/me/accept-parsed-name', authenticate, authorise('candidate'), acceptParsedName);
router.patch('/me/accept-parsed-name', authenticate, authorise('candidate'), acceptParsedName);

module.exports = router;
