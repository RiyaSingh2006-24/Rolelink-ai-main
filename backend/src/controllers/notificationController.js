const Application = require('../models/Application');
const Job = require('../models/Job');
const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    if (req.user.role === 'employer') {
      const jobs = await Job.find({ employerId: req.user._id }).select('_id title');
      const jobIds = jobs.map((job) => job._id);

      if (!jobIds.length) {
        return res.json({ notifications: [] });
      }

      const applications = await Application.find({ jobId: { $in: jobIds } })
        .populate('applicantId', 'name email')
        .populate('jobId', 'title')
        .sort({ createdAt: -1 })
        .limit(10);

      const notifications = applications.map((app) => ({
        id: app._id,
        type: 'new_application',
        message: `New application from ${app.applicantId?.name || 'Applicant'} for ${
          app.jobId?.title || 'a job'
        }.`,
        createdAt: app.createdAt,
        read: true
      }));

      return res.json({ notifications });
    }

    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({ recipientId: req.user._id, read: false });

    return res.json({
      notifications: notifications.map((notification) => ({
        id: notification._id,
        ...notification
      })),
      unreadCount
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.json({ notification });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    return res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark notifications as read', error: error.message });
  }
};

module.exports = { getNotifications, markNotificationRead, markAllNotificationsRead };
