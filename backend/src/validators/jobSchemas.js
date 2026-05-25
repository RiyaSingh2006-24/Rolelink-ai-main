const { z } = require('zod');

const companyLogoSchema = z
  .string()
  .optional()
  .refine(
    (value) => !value || value === '' || value.startsWith('/') || /^https?:\/\//i.test(value),
    'companyLogoUrl must be a valid URL or relative path'
  );

const jobCreateSchema = z.object({
  companyName: z.string().optional(),
  companyLogoUrl: companyLogoSchema.or(z.literal('')),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  qualifications: z.string().optional(),
  responsibilities: z.string().optional(),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  jobType: z.string().optional()
});

const jobUpdateSchema = jobCreateSchema.partial();

module.exports = { jobCreateSchema, jobUpdateSchema };
