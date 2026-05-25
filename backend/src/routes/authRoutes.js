const express = require('express');
const { register, login, me, updateMe, uploadResume } = require('../controllers/authController');
const uploadResumeMiddleware = require('../middleware/uploadMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validateRequest');
const { registerSchema, loginSchema, updateProfileSchema } = require('../validators/authSchemas');

const router = express.Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authMiddleware, me);
router.put('/me', authMiddleware, validateBody(updateProfileSchema), updateMe);
router.post('/resume', authMiddleware, uploadResumeMiddleware.single('resume'), uploadResume);

module.exports = router;
