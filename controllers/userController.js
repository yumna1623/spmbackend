import User from "../models/User.js";
import Team from "../models/Team.js";

// -------------------------------------------------------- Get User Dashboard Info
export const getUserDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("team");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const team = await Team.findById(user.team)
      .populate("leader", "name email")
      .populate("members", "name email");

    res.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      team: {
        name: team.name,
        leader: team.leader,
        totalMembers: team.members.length,
        members: team.members,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
