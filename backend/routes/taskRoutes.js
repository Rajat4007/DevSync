const express = require('express');
const router = express.Router();
const { createTask, getProjectTasks, updateTaskStatus, deleteTask, updateTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Route: Task banane ke liye
router.route('/').post(protect, createTask);

// Route: Kisi project ke saare tasks lane ke liye
router.route('/project/:projectId').get(protect, getProjectTasks);

// Route: Task ka status update karne ke liye (PUT request)
router.route('/:id/status').put(protect, updateTaskStatus);

// Routes update aur delete krne ke liye
router.route('/:id').put(protect,updateTask);
router.route('/:id').delete(protect,deleteTask);

module.exports = router;