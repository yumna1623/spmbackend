import User from "../models/User.js";
import Task from "../models/Task.js";
import Team from "../models/Team.js";
import Department from "../models/Department.js";

// Create Task (Admin assigns)
// Create Task (Admin assigns)
export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, deadline, priority, department } = req.body;

    const admin = await User.findById(req.user.id);
    const team = await Team.findById(admin.team);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Verify assigned member is in same team
    const member = await User.findOne({ _id: assignedTo, team: team._id });
    if (!member) {
      return res.status(400).json({ message: "Assigned member not found in team" });
    }

    // ✅ Create the task
    const task = await Task.create({
      title,
      description,
      deadline,
      priority,
      department,
      assignedTo: member._id,
      memberName: member.name,
      memberEmail: member.email,
      team: team._id,
      createdBy: admin._id,
    });

    // ✅ Link to Department (both task + member)
    if (department) {
      await Department.findByIdAndUpdate(
        department,
        {
          $push: { tasks: task._id },
          $addToSet: { members: member._id }, // avoid duplicates
        },
        { new: true }
      );
    }

    res.status(201).json({ message: "✅ Task created successfully", task });
  } catch (err) {
    console.error("❌ Error creating task:", err);
    res.status(500).json({ message: err.message });
  }
};


// Get tasks assigned to logged-in user
export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate("assignedTo", "name email");

    res.json(tasks);
  } catch (err) {
    console.error("Error fetching my tasks:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update task status (only by assigned user)
export const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    const newStatus = req.body.status || task.status;

    // ✅ If marking as Done for the first time, set completedAt
    if (newStatus === "Done" && task.status !== "Done") {
      task.completedAt = new Date();
    }

    task.status = newStatus;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("department", "name")
      .populate("assignedTo", "name email");

    res.json(updatedTask);
  } catch (err) {
    console.error("Error updating task status:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all tasks for a team
export const getTeamTasks = async (req, res) => {
  try {
    const { teamId } = req.params;
    const tasks = await Task.find({ team: teamId })
      .populate("assignedTo", "name email")
      .populate("department", "name"); // ✅ Add this line

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching team tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ Admin accepts/rejects a task
export const updateTaskDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body; // "Accepted" | "Rejected"

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can review tasks" });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.status !== "Done") {
      return res.status(400).json({ message: "Task must be marked Done before review" });
    }

    task.decision = decision;
    await task.save();

    res.json({ message: `Task ${decision} by admin`, task });
  } catch (err) {
    console.error("Error updating task decision:", err);
    res.status(500).json({ message: err.message });
  }
};

// Leaderboard
// Leaderboard (works for both users & admins)
export const getLeaderboard = async (req, res) => {
  try {
    // Optional: Limit to current team
    const user = await User.findById(req.user._id);
    const team = await Team.findById(user.team);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const tasks = await Task.find({ team: team._id }).populate("assignedTo", "name email");

    const leaderboard = {};

    tasks.forEach((task) => {
      const userId = task.assignedTo?._id?.toString();
      const userName = task.assignedTo?.name || "Unknown";

      if (!userId) return;

      if (!leaderboard[userId]) {
        leaderboard[userId] = { userId, name: userName, completed: 0, delayed: 0, pending: 0 };
      }

      if (task.status === "Done") leaderboard[userId].completed++;
      else leaderboard[userId].pending++;

      if (task.deadline && new Date(task.deadline) < new Date() && task.status !== "Done") {
        leaderboard[userId].delayed++;
      }
    });

    const sorted = Object.values(leaderboard).sort((a, b) => {
      if (b.completed !== a.completed) return b.completed - a.completed;
      return a.delayed - b.delayed;
    });

    res.json(sorted);
  } catch (err) {
    console.error("Error generating leaderboard:", err);
    res.status(500).json({ message: "Server error" });
  }
};


