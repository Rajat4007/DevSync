const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a project name"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Yeh batata hai ki yeh ID 'User' collection se aayegi
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Array of User IDs jo is project mein kaam kar rahe hain
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Project", ProjectSchema);
