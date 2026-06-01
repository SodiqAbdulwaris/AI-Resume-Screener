const express = require('express');
const router = express.Router();
const {
  createJob,
  getAllJobs,
  getJobById,
  runJobMatch,
  getJobMatches,
  exportJobMatchesCsv,
  applyToJob,
  cancelApplication,
  getMyApplications,
} = require('../controllers/job.controller');
const { authenticate, authorise } = require('../middlewares/auth.middleware');
const validateObjectId = require('../middlewares/validateObjectId.middleware');

router.post('/', authenticate, authorise('recruiter'), createJob);
router.get('/', authenticate, getAllJobs);
router.get('/my-applications', authenticate, authorise('candidate'), getMyApplications);
router.get('/:jobId', authenticate, validateObjectId('jobId'), getJobById);
router.post('/:jobId/apply', authenticate, authorise('candidate'), validateObjectId('jobId'), applyToJob);
router.delete('/:jobId/apply', authenticate, authorise('candidate'), validateObjectId('jobId'), cancelApplication);
router.post('/:jobId/match', authenticate, authorise('recruiter'), validateObjectId('jobId'), runJobMatch);
router.get('/:jobId/matches', authenticate, authorise('recruiter'), validateObjectId('jobId'), getJobMatches);
router.get('/:jobId/matches/export.csv', authenticate, authorise('recruiter'), validateObjectId('jobId'), exportJobMatchesCsv);

module.exports = router;
