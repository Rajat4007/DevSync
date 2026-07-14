const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); 
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createTestNotification,
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.put('/mark-all-read', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);



module.exports = router;