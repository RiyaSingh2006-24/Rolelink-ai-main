const { z } = require('zod');

const applicationCreateSchema = z.object({
  jobId: z.string().min(1, 'jobId is required'),
  resumeUrl: z.string().optional()
});

module.exports = { applicationCreateSchema };
