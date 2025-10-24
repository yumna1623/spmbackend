import Department from "../models/Department.js";
import User from "../models/User.js"; // ✅ You forgot this import!

export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const department = await Department.create({
      name,
      team: req.user.team,
      members: [req.user._id], // ✅ Add admin as first member
    });

    res.status(201).json(department);
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all departments for a team (with members & tasks)
export const getDepartments = async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) {
      return res.status(400).json({ message: "Team ID is required" });
    }

    // Fetch departments and populate tasks and members
    const departments = await Department.find({ team: teamId })
      .populate({
        path: "tasks",
        populate: { path: "assignedTo", select: "name email role" },
      })
      .populate("members", "name email role");

    // ✅ Add assigned task users to members (if not already)
    for (let dept of departments) {
      const assignedUsers = dept.tasks
        .map((t) => t.assignedTo?._id?.toString())
        .filter(Boolean);

      const existingMembers = dept.members.map((m) => m._id.toString());

      const uniqueMemberIds = [...new Set([...existingMembers, ...assignedUsers])];

      // Fetch all unique members with their details
      const members = await User.find({ _id: { $in: uniqueMemberIds } }).select(
        "name email role"
      );

      dept.members = members; // ✅ Replace with full member info
    }

    res.json(departments);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ message: "Server error fetching departments" });
  }
};
