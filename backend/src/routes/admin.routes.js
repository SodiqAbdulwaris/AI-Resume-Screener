const express = require('express');
const router = express.Router();
const {
  getUsers,
  deactivateUser,
  getJobs,
  getStats,
  getSettings,
  updateSettings,
} = require('../controllers/admin.controller');
const { authenticate, authorise } = require('../middlewares/auth.middleware');
const validateObjectId = require('../middlewares/validateObjectId.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { updateSettingsSchema, deactivateUserSchema } = require('../validations/admin.validation');

// Every route here requires an authenticated admin — enforced once at the router
// level rather than per-route, since nothing under /admin is ever meant for
// candidates or recruiters.
router.use(authenticate, authorise('admin'));

router.get('/users', getUsers);
router.patch('/users/:userId/deactivate', validateObjectId('userId'), validate(deactivateUserSchema), deactivateUser);

router.get('/jobs', getJobs);

router.get('/stats', getStats);

router.get('/settings', getSettings);
router.patch('/settings', validate(updateSettingsSchema), updateSettings);

module.exports = router;
