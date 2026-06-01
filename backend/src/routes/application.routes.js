const express = require('express');
const router = express.Router();
const { applyToJob, getMyApplications, cancelApplication } = require('../controllers/application.controller');
const { authenticate, authorise } = require('../middlewares/auth.middleware');

router.post('/jobs/:jobId/apply', authenticate, authorise('candidate'), applyToJob);
router.delete('/jobs/:jobId/apply', authenticate, authorise('candidate'), cancelApplication);
router.get('/my', authenticate, authorise('candidate'), getMyApplications);

module.exports = router;
