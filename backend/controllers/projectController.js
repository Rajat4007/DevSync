const Task = require("../models/Task");
const Project = require("../models/Project");
const { mongoose } = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Sirf logged-in users ke liye)
const createProject = async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res
      .status(400)
      .json({ message: "Please add a project name and description" });
  }

  try {
    // Naya project banayein. req.user._id hume authMiddleware se mil raha hai
    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [req.user._id], // By default owner bhi member list mein hoga
    });

    //  2. REAL NOTIFICATION MAGIC YAHAN AAYEGA 
    await Notification.create({
      user: req.user._id, // Jisne project banaya usko alert jayega
      text: `New project '${project.name}' created successfully! 🎯`,
    });

    // Owner ke personal room mein alert do  taaki uska dashboard update ho jaye
    if (req.io) {
      const userId = req.user._id || req.user.id;
      req.io.to(String(userId)).emit("dashboard-updated");
    }

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all projects for logged-in user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    // Sirf wahi projects dhoondhein jahan user owner hai YA members array ke andar hai
    const projects = await Project.find({
      $or: [
        //$or (MongoDB Magic Keyword): Iska matlab hota hai "Ya Toh Yeh, Ya Phir Wo".
        { owner: req.user._id },
        { members: req.user._id },
      ],
    }).populate("owner", "name email _id"); // Owner ki details (name, email) bhi sath mein laao

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get project analytics/stats (For Dashboard Charts)
// @route   GET /api/projects/:id/stats
// @access  Private
const getProjectStats = async (req, res) => {
  try {
    const projectId = req.params.id;

    // 1. Check karo ki kya project exist karta hai
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 2. Us project ke saare tasks nikaalo
    const tasks = await Task.find({ project: projectId });

    // 3. Status ke hisab se count calculate karo
    const stats = {
      totalTasks: tasks.length,
      todo: tasks.filter((t) => t.status === "To-Do").length,
      inProgress: tasks.filter((t) => t.status === "In Progress").length,
      review: tasks.filter((t) => t.status === "Review").length,
      done: tasks.filter((t) => t.status === "Done").length,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Invite user to project by Email
// @route   POST /api/projects/:id/invite
// @access  Private
const inviteUserToProject = async (req, res) => {
  const { email } = req.body;
  const projectId = req.params.id;

  try {
    // 1. Basic validation
    if (!email) {
      return res.status(400).json({ message: "Please provide an email" });
    }

    // 2. Safe Project ID Check (Mongoose crash protection)
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid Project ID format" });
    }

    // 3. Database mein user dhoondo
    const userToAdd = await User.findOne({ email: email.trim().toLowerCase() });
    if (!userToAdd) {
      return res
        .status(404)
        .json({ message: "This email is not registered on DevSync yet!" });
    }

    // 4. Project dhoondo
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found in database" });
    }

    // 5. Array safety check (Agar members field null/undefined ho toh empty array banao)
    if (!project.members || !Array.isArray(project.members)) {
      project.members = [];
    }

    // 6. Check karo ki user already member toh nahi hai (toString use karke string mapping karo)
    const isAlreadyMember = project.members.some(
      (memberId) => memberId.toString() === userToAdd._id.toString(),
    );
    if (isAlreadyMember) {
      return res
        .status(400)
        .json({ message: "This user is already a member of this project" });
    }

    // 7. Push and Save
    project.members.push(userToAdd._id);
    await project.save();

    // 🔥 8. REAL NOTIFICATIONS YAHAN AAYENGI 🔥
    try {
      // Owner ko notification (Jo invite kar raha hai)
      await Notification.create({
        user: req.user._id,
        text: `You successfully added ${userToAdd.name} to the project '${project.name}'. 🤝`,
      });

      // Naye member ko notification (Jisko add kiya gaya)
      await Notification.create({
        user: userToAdd._id,
        text: `${req.user.name} added you to the project '${project.name}'. Welcome! 🎉`,
      });
      // 🚀 SOCKET.IO SE INSTANT ALERT BHEJO (Bina refresh kiye frontend update hoga)
      // Owner ko alert
      req.io.to(req.user._id.toString()).emit("new-notification");
      // Jisko invite kiya usko alert
      req.io.to(userToAdd._id.toString()).emit("new-notification");

      // ✅ NAYA — naye member ko poora project object bhejo taaki Sidebar/Dashboard add kar sake
      const populatedProject = await Project.findById(project._id).populate(
        "owner",
        "name email _id",
      );
      req.io
        .to(userToAdd._id.toString())
        .emit("project-added", { project: populatedProject });
    } catch (notifError) {
      console.error("⚠️ Notification failed but user was added:", notifError);
      // Hum yahan response break nahi karenge, taaki invite ka process pura ho jaye
    }

    return res.status(200).json({
      message: `${userToAdd.name} added to project successfully!`,
      project,
    });
  } catch (error) {
    console.error("❌ CRITICAL BACKEND INVITE ERROR:", error);
    // 🔥 error.message ko direct response mein bhej do taaki browser console mein error ka naam dikh jaye!
    return res.status(500).json({
      message: "Server Error inside invite controller",
      error: error.message, // ◄── Yeh batayega ki kaunsi property undefined hai
      stack: error.stack,
    });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "owner",
      "name email _id",
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Delete a project and all its tasks
// @route   DELETE /api/projects/:id
// @access  Private (Owner only)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project Not Found" });
    }
    if (String(project.owner) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "Only project owner can delete the project" });
    }

    const projectIdStr = req.params.id;
    const memberIds = project.members.map((m) => String(m)); 

    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();

    if (req.io) {
      req.io
        .to(projectIdStr)
        .emit("project-deleted", { projectId: projectIdStr });
      memberIds.forEach((memberId) => {
        req.io
          .to(memberId)
          .emit("project-removed", { projectId: projectIdStr });
      });
      
    }

    try {
      const userId = req.user._id || req.user.id;
      await Notification.create({
        user: userId,
        text: `Project '${project.name}' was successfully permanently deleted. 🗑️`,
      });
      if (req.io) {
        req.io.to(String(userId)).emit("new-notification");
      }
    } catch (notifError) {
      console.error("⚠️ Project delete notification failed:", notifError);
    }

    // Owner ke personal room mein seeti bajao taaki uska dashboard update ho jaye
    if (req.io) {
      const userId = req.user._id || req.user.id;
      req.io.to(String(userId)).emit("dashboard-updated");
    }

    res.json({ message: "project aur uska sara task delete hogya hai" });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// module.exports ko update karke isme getProjectStats bhi daal do:
module.exports = {
  createProject,
  getProjects,
  getProjectStats,
  inviteUserToProject,
  getProjectById,
  deleteProject,
};
