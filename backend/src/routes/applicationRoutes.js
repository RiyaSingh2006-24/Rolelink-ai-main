const express = require('express');
const {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  getApplicationsForEmployer,
  updateApplicationStatus
} = require('../controllers/applicationController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const uploadResume = require('../middleware/uploadMiddleware');
const { validateBody } = require('../middleware/validateRequest');
const { applicationCreateSchema } = require('../validators/applicationSchemas');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  requireRole('jobseeker'),
  uploadResume.single('resume'),
  validateBody(applicationCreateSchema),
  applyToJob
);
router.get('/my', authMiddleware, requireRole('jobseeker'), getMyApplications);
router.get('/employer', authMiddleware, requireRole('employer'), getApplicationsForEmployer);
router.get('/job/:jobId', authMiddleware, requireRole('employer'), getApplicationsForJob);
router.patch('/:id/status', authMiddleware, requireRole('employer'), updateApplicationStatus);

module.exports = router;
