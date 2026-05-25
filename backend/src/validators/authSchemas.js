const { z } = require('zod');
const { buildEmailDomainTypoMessage, hasKnownEmailDomainTypo } = require('./emailDomain');

const authEmail = () =>
  z
    .string()
    .trim()
    .email('Valid email is required')
    .superRefine((email, ctx) => {
      if (hasKnownEmailDomainTypo(email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: buildEmailDomainTypoMessage(email)
        });
      }
    });

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: authEmail(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['jobseeker', 'employer']),
  companyName: z.string().optional(),
  companyLogoUrl: z.string().optional(),
  skills: z.array(z.string()).optional(),
  education: z.string().optional(),
  experience: z.string().optional()
});

const loginSchema = z.object({
  email: authEmail(),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: authEmail().optional(),
  companyName: z.string().optional(),
  companyLogoUrl: z.string().optional(),
  skills: z.union([z.string(), z.array(z.string())]).optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  portfolio: z.string().optional(),
  certifications: z.string().optional(),
  achievements: z.string().optional(),
  competitions: z.string().optional(),
  skillsCategories: z
    .object({
      programmingLanguages: z.string().optional(),
      webTechnologies: z.string().optional(),
      databases: z.string().optional(),
      tools: z.string().optional(),
      interests: z.string().optional()
    })
    .optional()
});

module.exports = { registerSchema, loginSchema, updateProfileSchema };
