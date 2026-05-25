const express = require('express');
const {
  createJob,
  getJobs,
  getMyJobs,
  getJobById,
  updateJob,
  deleteJob
} = require('../controllers/jobController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validateRequest');
const { jobCreateSchema, jobUpdateSchema } = require('../validators/jobSchemas');

const router = express.Router();

router.get('/', getJobs);
router.get('/mine', authMiddleware, requireRole('employer'), getMyJobs);
router.get('/:id', getJobById);
router.post('/', authMiddleware, requireRole('employer'), validateBody(jobCreateSchema), createJob);
router.put('/:id', authMiddleware, requireRole('employer'), validateBody(jobUpdateSchema), updateJob);
router.delete('/:id', authMiddleware, requireRole('employer'), deleteJob);

module.exports = router;
