const Task = require("../models/Task");
const Project = require("../models/Project");
const Notification = require("../models/Notification");

// @desc    Create a new task inside a project
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  const { title, description, project, assignedTo, dueDate, priority } =
    req.body;
  

  try {
    // 1. Check karo ki kya wo project sach mein exist karta hai
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 2. Naya task create karo
    const task = await Task.create({
      title,
      description,
      project,
      priority: priority || "medium",
      assignedTo: assignedTo || null,
      dueDate,
    });

    //  3. REAL-TIME TEAM NOTIFICATION YAHAN AAYEGI 
    try {
      // Check karo ki members ka array hai ya nahi
      if (projectExists.members && projectExists.members.length > 0) {
        // Un members ko filter karo jinko notification bhejni hai (Khud ko chhod kar)
        const membersToNotify = projectExists.members.filter(
          (memberId) => memberId.toString() !== req.user._id.toString(),
        );

        if (membersToNotify.length > 0) {
          // Database mein save karne ke liye array banao
          const notificationsArray = membersToNotify.map((memberId) => ({
            user: memberId,
            text: `New Task '${task.title}' was added in '${projectExists.name}' by ${req.user.name}. 📝`,
          }));

          await Notification.insertMany(notificationsArray);

          // Socket.io se saare members ko instant update krdo 
          if (req.io) {
            membersToNotify.forEach((memberId) => {
              req.io.to(memberId.toString()).emit("new-notification");
              req.io.to(memberId.toString()).emit("dashboard-updated");
            });
            // Owner (Jisne task banaya/delete kiya hai) uska dashboard bhi toh update hona chahiye!
            req.io.to(String(req.user._id)).emit("dashboard-updated");
          }
        }
      }
    } catch (notifError) {
      console.error("⚠️ Task creation notification failed:", notifError);
      // Notification fail hone par app crash nahi karni
    }

    // 4. Frontend ko response bhej do
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all tasks for a specific project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getProjectTasks = async (req, res) => {
  try {
    // URL se projectId nikaal kar uske saare tasks dhoondhein
    // .populate() use karke assigned user ka naam aur email bhi sath mein le aayenge
    const tasks = await Task.find({ project: req.params.projectId }).populate(
      "assignedTo",
      "name email",
    );

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update task status (For Kanban Drag and Drop)
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
  const { status } = req.body;

  // Check karo ki status sahi hai ya nahi
  const validStatuses = ["To-Do", "In Progress", "Review", "Done"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    // Task ko dhoondhein aur uska status update karein
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after" },
    ).populate("project");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    // notification send krna jb bhi task complete hojyga
    if (status === "Done" && task.project) {
      try {
        const ownerId = task.project.owner.toString();
        const currentUserId = req.user._id.toString();

        // Check: Agar member khud owner nahi hai, tabhi notification bhejo
        if (ownerId !== currentUserId) {
          await Notification.create({
            user: ownerId,
            text: `${req.user.name} has successfully completed the task '${task.title}' in '${task.project.name}'. ✅`,
          });

          // Socket.io se owner ke Personal Room mein instant alert
          if (req.io) {
            req.io.to(ownerId).emit("new-notification");
          }
        }
      } catch (notifError) {
        console.error("⚠️ Task completion notification failed:", notifError);
      }
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update task (title, description, priority)
// @route   PUT /api/tasks/:id
// @access  Private (Owner only — frontend pe enforce hai)
const updateTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, priority, dueDate },
      { returnDocument: "after", runValidators: true },
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Owner only — frontend pe enforce hai)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task deleted succesfully ", taskId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  updateTaskStatus,
  updateTask,
  deleteTask,
};
