const express = require('express');
const { analyzeResume, generateResume, generateResumePdf } = require('../controllers/resumeController');
const { authMiddleware } = require('../middleware/authMiddleware');
const uploadResume = require('../middleware/uploadMiddleware');
const { validateBody } = require('../middleware/validateRequest');
const { resumeGenerateSchema, resumePdfSchema } = require('../validators/resumeSchemas');

const router = express.Router();

router.post('/analyze', authMiddleware, uploadResume.single('resume'), analyzeResume);
router.post('/generate', authMiddleware, validateBody(resumeGenerateSchema), generateResume);
router.post('/generate-pdf', authMiddleware, validateBody(resumePdfSchema), generateResumePdf);

module.exports = router;
