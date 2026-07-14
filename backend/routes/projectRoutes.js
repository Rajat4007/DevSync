const express = require('express');
const router = express.Router();
const { createProject, getProjects,getProjectStats, inviteUserToProject, getProjectById, deleteProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware'); 


// router.route() se hum ek hi path par alag-alag HTTP methods map kar sakte hain
// Dono routes ke aage protect lagaya hai, yaani bina token ke access nahi milega
router.route('/')
    .post(protect, createProject)
    .get(protect, getProjects);

router.route('/:id/stats').get(protect,getProjectStats);
router.route('/:id/invite').post(protect,inviteUserToProject);
router.route('/:id')
    .get(protect,getProjectById)
    .delete(protect, deleteProject);


module.exports = router;