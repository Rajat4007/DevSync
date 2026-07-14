const Notification = require('../models/Notification');
const protect = require('../middleware/authMiddleware')

// 1. User ki saari notifications lana
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }); // Nayi wali upar aayengi
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// 2. Kisi ek notification ko "Read" mark karna
const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating notification" });
  }
};

// 3. Ek sath saari notifications ko "Read" mark karna
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id }, { isRead: true });
    res.status(200).json({ message: "All marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating notifications" });
  }
};

// 4. Notification delete karna
const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting notification" });
  }
};



module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};