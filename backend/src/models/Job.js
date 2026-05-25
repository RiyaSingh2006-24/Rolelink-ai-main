const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: '' },
    companyLogoUrl: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    qualifications: { type: String, default: '' },
    responsibilities: { type: String, default: '' },
    location: { type: String, default: '' },
    salaryRange: { type: String, default: '' },
    jobType: { type: String, default: '' },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('Job', jobSchema);
