const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeUrl: { type: String, required: true },
    status: { type: String, enum: ['Applied', 'Shortlisted', 'Rejected'], default: 'Applied' }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
