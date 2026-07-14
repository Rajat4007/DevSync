const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true, // Do users ka same email nahi ho sakta
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Jab bhi hum user ka data fetch karenge, password by default hide rahega (security ke liye)
    },
    role: {
        type: String,
        enum: ['Admin', 'Member', 'Viewer'],
        default: 'Member' // Naya user by default 'Member' banega
    },
    profilePic: { 
        type: String,
        default: "" 
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

//  Pre-save Hook: Password ko save karne se pehle encrypt (hash) karne ke liye
UserSchema.pre('save', async function () {
  // Agar password change nahi hua hai (sirf naam change hua hai), toh bina encrypt kiye wapas jao
  if (!this.isModified('password')) {
    return;
  }

  // Agar naya password aaya hai, toh use encrypt (hash) karo
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    console.log("Password hashing error:", error);
  }
});

// Method: Login ke waqt entered password aur hashed password ko compare karne ke liye
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);