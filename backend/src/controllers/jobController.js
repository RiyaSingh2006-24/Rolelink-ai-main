const mongoose = require('mongoose');
const Job = require('../models/Job');

const createJob = async (req, res) => {
  try {
    const {
      companyName,
      companyLogoUrl,
      title,
      description,
      qualifications,
      responsibilities,
      location,
      salaryRange,
      jobType
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const job = await Job.create({
      companyName: companyName || req.user.companyName || req.user.name,
      companyLogoUrl: companyLogoUrl || req.user.companyLogoUrl || '',
      title,
      description,
      qualifications: qualifications || '',
      responsibilities: responsibilities || '',
      location: location || '',
      salaryRange: salaryRange || '',
      jobType: jobType || '',
      employerId: req.user._id
    });

    const populatedJob = await Job.findById(job._id).populate('employerId', 'name companyName companyLogoUrl');
    return res.status(201).json({ job: populatedJob });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create job', error: error.message });
  }
};

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate('employerId', 'name companyName companyLogoUrl').sort({ createdAt: -1 });
    return res.json({ jobs });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch jobs', error: error.message });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employerId: req.user._id })
      .populate('employerId', 'name companyName companyLogoUrl')
      .sort({ createdAt: -1 });
    return res.json({ jobs });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch employer jobs', error: error.message });
  }
};

const getJobById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job id' });
    }

    const job = await Job.findById(req.params.id).populate('employerId', 'name companyName companyLogoUrl');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    return res.json({ job });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch job', error: error.message });
  }
};

const updateJob = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job id' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit jobs posted by your account.' });
    }

    const updates = req.body;
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, updates, { new: true });

    return res.json({ job: updatedJob });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update job', error: error.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job id' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete jobs posted by your account.' });
    }

    await job.deleteOne();
    return res.json({ message: 'Job deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete job', error: error.message });
  }
};

module.exports = { createJob, getJobs, getMyJobs, getJobById, updateJob, deleteJob };
