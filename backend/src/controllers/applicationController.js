const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendApplicationStatusEmail } = require('../services/mailService');
const { emitToUser } = require('../services/socketService');

const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'jobId is required' });
    }

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: 'Invalid job id' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : req.body.resumeUrl || req.user.resumeUrl;
    if (!resumeUrl) {
      return res.status(400).json({ message: 'Resume is required' });
    }

    if (req.file) {
      await User.findByIdAndUpdate(req.user._id, { resumeUrl }).catch(() => null);
    }

    const application = await Application.create({
      jobId,
      applicantId: req.user._id,
      resumeUrl
    });

    return res.status(201).json({ application });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You already applied for this job' });
    }
    return res.status(500).json({ message: 'Failed to apply', error: error.message });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicantId: req.user._id })
      .populate('jobId')
      .sort({ createdAt: -1 });

    return res.json({ applications });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch applications', error: error.message });
  }
};

const getApplicationsForJob = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) {
      return res.status(400).json({ message: 'Invalid job id' });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only view applicants for jobs posted by your account.' });
    }

    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('applicantId', 'name email skills education experience resumeUrl')
      .sort({ createdAt: -1 });

    return res.json({ applications });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch applications', error: error.message });
  }
};

const getApplicationsForEmployer = async (req, res) => {
  try {
    const jobs = await Job.find({ employerId: req.user._id }).select('_id');
    const jobIds = jobs.map((job) => job._id);

    if (!jobIds.length) {
      return res.json({ applications: [] });
    }

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('applicantId', 'name email skills education experience resumeUrl')
      .populate('jobId', 'title companyName')
      .sort({ createdAt: -1 });

    return res.json({ applications });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch applications', error: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    if (!['Applied', 'Shortlisted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = await Job.findById(application.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update applications for jobs posted by your account.' });
    }

    application.status = status;
    await application.save();

    const populatedApplication = await Application.findById(application._id)
      .populate('applicantId', 'name email')
      .populate('jobId', 'title companyName');

    let notification = null;
    let emailSent = false;

    if (['Shortlisted', 'Rejected'].includes(status)) {
      const isShortlisted = status === 'Shortlisted';
      const title = isShortlisted ? "You've been shortlisted 🎉" : 'Application Rejected';
      const message = isShortlisted
        ? 'Congratulations! You have been shortlisted for the selected role.'
        : 'We appreciate your interest in this role. Unfortunately, you were not selected for this position.';
      const detail = isShortlisted
        ? 'Further information has been sent to your registered email address.'
        : 'A detailed message has been sent to your registered email.';

      notification = await Notification.create({
        recipientId: application.applicantId,
        applicationId: application._id,
        jobId: application.jobId,
        type: isShortlisted ? 'shortlisted' : 'rejected',
        status,
        title,
        message,
        detail,
        jobTitle: job.title,
        companyName: job.companyName || '',
        emailSent: false
      });

      try {
        await sendApplicationStatusEmail({
          applicant: populatedApplication.applicantId,
          job,
          status
        });
        emailSent = true;
        notification.emailSent = true;
        await notification.save();
      } catch (emailError) {
        console.error('Failed to send application status email', emailError);
      }

      const notificationPayload = {
        id: notification._id,
        ...notification.toObject()
      };

      emitToUser(application.applicantId, 'application-status-updated', {
        application: populatedApplication,
        notification: notificationPayload
      });
      emitToUser(application.applicantId, 'notification:new', notificationPayload);
    }

    return res.json({
      application: populatedApplication || application,
      notification: notification ? { id: notification._id, ...notification.toObject() } : null,
      emailSent,
      message: emailSent ? 'Email notification sent successfully.' : 'Application status updated.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update application', error: error.message });
  }
};

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  getApplicationsForEmployer,
  updateApplicationStatus
};
