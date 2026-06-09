const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.user.id })
      .populate("sender", "name username avatar isVerified badge")
      .populate({
        path: "post",
        select: "content image",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { receiver: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ receiver: req.user.id });

    res.status(200).json({
      success: true,
      message: "Notifications cleared successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  markNotificationsRead,
  clearNotifications,
};
