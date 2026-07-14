const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/devsync";
        
        console.log("Connecting to MongoDB.........");
        
        const conn = await mongoose.connect(MONGO_URI);
        
        console.log(`Succesfully Connected to MongoDB: ${conn.connection.host}`);
    } catch (error) {
        console.error(` DB Connection Error: ${error.message}`);
        process.exit(1); // Agar DB connect nahi hua, toh server ko band kar do
    }
};

module.exports = connectDB;