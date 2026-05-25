const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    type: { type: String, enum: ['shortlisted', 'rejected'], required: true },
    status: { type: String, enum: ['Shortlisted', 'Rejected'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    detail: { type: String, required: true },
    jobTitle: { type: String, default: '' },
    companyName: { type: String, default: '' },
    emailSent: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
