const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // 1. Check karein ki kya request ke Headers mein Authorization token aaya hai aur wo 'Bearer' se shuru ho raha hai
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Token nikaalein (Format hota hai: "Bearer <asli_token_string>")
            token = req.headers.authorization.split(' ')[1];

            // Token ko verify/decode karein hamare secret key se
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Database se user ka data nikaalein (bina password ke) aur req.user mein daal dein
            req.user = await User.findById(decoded.id).select('-password');

            // Sab sahi hai! Agle function (controller) par jao
            next();
        } catch (error) {
            console.error('Middleware Error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // 2. Agar token aaya hi nahi
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };