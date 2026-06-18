const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const Notification = require('../models/Notification')

// 🔑 Helper Function: JWT Token Generate karne ke liye
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token 30 dino tak valid rahega
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // 1. Check karein ki kya user pehle se exist karta hai
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // 2. Naya user create karein (Password models/User.js ke pre-save hook se automatic hash ho jayega)
        const user = await User.create({
            name,
            email,
            password,
            role
        });

        // 3. Agar user successfully bana, toh data aur token response mein bhejein
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePic: user.profilePic,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. User ko email se dhoondhein aur password ko explicit select karein (kyunki model mein select: false tha)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 2. Password match ho raha hai ya nahi check karein (custom method calling)
        const isMatch = await user.matchPassword(password);

        if (isMatch) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePic: user.profilePic,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const googleLogin = async (req,res) => {
    try {
        const {access_token} = req.body;

        //google se user ka data ko maango jo ki email aur naame hoga
        const {data} = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo',
            {headers: {Authorization:`Bearer ${access_token}`}},
        );
        const {name , email} = data;

        //checking ki ye email hmare database mai hai ya nahi hai
        let user = await User.findOne({email});

        //agr user nahi hai toh new user bna do
        if(!user){
            const randomPassword = Math.random().toString(36).slice(-8);// Random Password
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = await User.create({
                name,
                email,
                password:hashedPassword,
            });
        }

        res.status(200).json({
            _id:user._id,
            name:user.name,
            email:user.email,
            profilePic: user.profilePic,
            token:generateToken(user._id),
        });
    } catch (error) {
        console.error("Google Login Backend Error: ", error);
        res.status(400).json({message:'Google Authentication Failed'});
    }
};

const githubLogin = async (req,res) => {
    console.log("🚀 BACKEND: GitHub Route Hit Hua! Code mila:", req.body.code);
    try {
        const {code} = req.body;
        
        // github se acces token mangege
        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            },
            {headers:{Accept:'application/json'}}

        );

        const accessToken = tokenResponse.data.access_token;
        if(!accessToken){
            return res.status(400).json({message: "Github Token exchange failed"});
        }

        //agr access token mil gya hai toh User ka profile mango
        const userResponse = await axios.get(
            'https://api.github.com/user',
            {
                headers:{Authorization: `Bearer ${accessToken}`}
            }
        );

        let {name , email , login} = userResponse.data;
        // qki git hub pr logged email private hota hai toh usko alg se manga jyga
        if(!email){
            const emailResponse = await axios.get(
                'https://api.github.com/user/emails',
                {headers:{Authorization:`Bearer ${accessToken}`}}
            );
            const primaryEmailObj = emailResponse.data.find(e => e.primary);
            email = primaryEmailObj ? primaryEmailObj.email : `${login}@github.com`;
        }

        // check in database agr nahi hai toh naya user cretae krdo
        let user = await User.findOne({email});
        if(!user){
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword,10);

            user = await User.create({
                name: name || login,// agr github pr user name nahi hai toh username lelo
                email,
                password:hashedPassword,
            });
        }

        res.status(200).json({
            _id : user._id,
            name: user.name,
            email:user.email,
            profilePic: user.profilePic,
            token:generateToken(user._id),
        });
    } catch (error) {
        console.error("GitHUb Login error: 0, error");
        res.status(400).json({message:"Github Authentication failed"});
        
    }
};

const updateProfilePic = async (req,res) => {
    console.log("🚀 BACKEND HIT HUA! File Data:", req.file);
    try {
        //multer upload krne ke badd req.file mai data bhejdeta hia
        if(!req.file){
            return res.status(400).json({message:"Please Upload an Image"});
        }
        //req.file.path mai cloudinary ka permanent secured URL hota hai
        const imageUrl = req.file.path;

        //user ko DB mai dhundo aur uski profile pic update krdo
        // req.user._id ye hmre protect wlaa middleware se aayga
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {profilePic:imageUrl},
            {returnDocument:'after'}
        ).select("-password");

        // 🔥 SOCKET: Doosre browser/tab ko live update bhejo
        if (req.io) {
            req.io.to(String(req.user._id)).emit('profile-updated', updatedUser.profilePic);
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("profile pic update error:", error);
        res.status(500).json({message:"Server error during image upload"});
        
    }
};

// Profile Pic Delete karne ka logic
const deleteProfilePic = async (req, res) => {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // profilePic ko empty string "" set kar rahe hain
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: "" }, 
      { returnDocument: 'after' }
    ).select("-password");

    // 🔥 SOCKET: Doosre browser/tab ko live update bhejo
        if (req.io) {
            req.io.to(String(req.user._id)).emit('profile-updated', updatedUser.profilePic);
        }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Delete pic error:", error);
    res.status(500).json({ message: "Server error during image deletion" });
  }
};

// Name aur Password Update karne ka logic
const updateProfile = async (req, res) => {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const { name, password } = req.body; // Frontend se naya naam aur password nikalna

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // User ko database mein dhundo
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let actionText = "";//pta karne ke liye ki kya update hua hai

    // Agar frontend se naya naam aaya hai, toh use update kar do
    if (name) {
      user.name = name;
      actionText = "Your Profile name was updated."
    }
    
    // Agar frontend se naya password aaya hai, toh use bhi update kar do
    if (password) {
      user.password = password; 
      actionText = "Your Password was changed."
    }

    // Naye data ko database mein save kar do
    const updatedUser = await user.save();

    // 🔥 REAL NOTIFICATION YAHAN CREATE HOGI 🔥
    if (actionText !== "") {
      await Notification.create({
        user: userId,
        text: actionText
      });
    }

    // Frontend ko naya data wapas bhej do
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error during profile update" });
  }
};

// Account Delete logic
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    if (!userId) return res.status(401).json({ message: "User not authenticated" });

    // Database se user ko uda do
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server error during account deletion" });
  }
};


module.exports = {
    registerUser,
    loginUser,
    googleLogin,
    githubLogin,
    updateProfilePic,
    deleteProfilePic,
    updateProfile,
    deleteAccount,
};