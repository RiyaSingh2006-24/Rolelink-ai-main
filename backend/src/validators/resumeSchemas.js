const { z } = require('zod');

const emptyStringToUndefined = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const normalizeUrl = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const optionalTrimmedString = () => z.preprocess(emptyStringToUndefined, z.string().optional());
const optionalEmail = () => z.preprocess(emptyStringToUndefined, z.string().email('Valid email is required').optional());
const optionalUrl = () => z.preprocess(normalizeUrl, z.string().url('Valid URL is required').optional());

const projectSchema = z.object({
  name: optionalTrimmedString(),
  link: optionalUrl(),
  description: optionalTrimmedString()
});

const resumeGenerateSchema = z.object({
  name: z.preprocess(emptyStringToUndefined, z.string().min(1, 'Name is required')),
  email: optionalEmail(),
  phone: optionalTrimmedString(),
  location: optionalTrimmedString(),
  skills: z.union([z.string(), z.array(z.string())]).optional(),
  education: optionalTrimmedString(),
  experience: optionalTrimmedString(),
  certifications: optionalTrimmedString(),
  achievements: optionalTrimmedString(),
  competitions: optionalTrimmedString(),
  github: optionalUrl(),
  linkedin: optionalUrl(),
  portfolio: optionalUrl(),
  projects: z.array(projectSchema).optional(),
  skillsCategories: z
    .object({
      programmingLanguages: optionalTrimmedString(),
      webTechnologies: optionalTrimmedString(),
      databases: optionalTrimmedString(),
      tools: optionalTrimmedString(),
      interests: optionalTrimmedString()
    })
    .optional()
});

const resumePdfSchema = z.object({
  name: z.preprocess(emptyStringToUndefined, z.string().min(1, 'Name is required')),
  resumeText: z.preprocess(emptyStringToUndefined, z.string().min(1, 'resumeText is required')),
  links: z
    .object({
      github: optionalUrl(),
      linkedin: optionalUrl(),
      portfolio: optionalUrl()
    })
    .optional()
});

module.exports = { resumeGenerateSchema, resumePdfSchema };
