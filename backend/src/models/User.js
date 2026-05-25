const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['jobseeker', 'employer'], required: true },
    companyName: { type: String, default: '' },
    companyLogoUrl: { type: String, default: '' },
    skills: { type: [String], default: [] },
    education: { type: String, default: '' },
    experience: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    certifications: { type: String, default: '' },
    achievements: { type: String, default: '' },
    competitions: { type: String, default: '' },
    skillsCategories: {
      programmingLanguages: { type: String, default: '' },
      webTechnologies: { type: String, default: '' },
      databases: { type: String, default: '' },
      tools: { type: String, default: '' },
      interests: { type: String, default: '' }
    }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('User', userSchema);
