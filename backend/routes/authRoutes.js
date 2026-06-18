const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinaryConfig')
const {registerUser,loginUser,googleLogin, githubLogin, updateProfilePic, deleteProfilePic, updateProfile, deleteAccount} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// routes ko controller function se map kro
router.post('/register',registerUser);
router.post('/login',loginUser);

router.post('/google',googleLogin);
router.post('/github',githubLogin);

router.put('/update-profile-pic', protect, upload.single('profilePic'), updateProfilePic);
router.delete('/delete-profile-pic', protect, deleteProfilePic);
router.put('/update-profile', protect, updateProfile);

router.delete('/delete-account',protect,deleteAccount)
module.exports = router;