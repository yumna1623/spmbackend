import User from "../models/User.js";
import Team from "../models/Team.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // ✅ add this

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ------------------------------------------------------ Create Team (Admin)
export const createTeam = async (req, res) => {
  const { teamName, leaderName, email, password, passcode } = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Create admin user
    const adminUser = await User.create({
      name: leaderName,
      email,
      password,
      role: "admin",
    });

    if (!adminUser) {
      return res.status(500).json({ message: "Failed to create admin user" });
    }

    // ✅ 3. Hash team passcode before saving
    const hashedPasscode = await bcrypt.hash(passcode, 10);

    // 4. Create team
    const team = await Team.create({
      name: teamName,
      passcode: hashedPasscode, // ✅ stored securely
      leader: adminUser._id,
      members: [adminUser._id],
    });

    // 5. Link admin to team
    adminUser.team = team._id;
    await adminUser.save();

    // 6. Respond
    res.status(201).json({
      message: "✅ Team created successfully",
      token: generateToken(adminUser._id),
      team,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        team: adminUser.team,
      },
    });
  } catch (err) {
    console.error("❌ Error creating team:", err);
    res.status(500).json({ message: err.message });
  }
};



// ---------------------------------------------------------------Join Team
// ----------------- Join Team (Member)

export const joinTeam = async (req, res) => {
  const { name, email, password, passcode } = req.body;

  try {
    // 1️⃣ Fetch all teams and match passcode
    const teams = await Team.find();
    let matchedTeam = null;

    for (const t of teams) {
      const isMatch = await bcrypt.compare(passcode, t.passcode);
      if (isMatch) {
        matchedTeam = t;
        break;
      }
    }

    if (!matchedTeam) {
      return res.status(404).json({ message: "Invalid passcode or team not found" });
    }

    // 2️⃣ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 3️⃣ Create member and explicitly assign team
    const user = await User.create({
      name,
      email,
      password,
      role: "member",
      team: matchedTeam._id,
    });

    // 4️⃣ Push member to team members
    matchedTeam.members.push(user._id);
    await matchedTeam.save();

    // ✅ populate team for immediate response
    const populatedUser = await User.findById(user._id).populate("team");

    res.json({
      message: "Joined team successfully",
      token: generateToken(populatedUser._id),
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        team: populatedUser.team?._id,
      },
    });
  } catch (err) {
    console.error("❌ Join error:", err);
    res.status(500).json({ message: err.message });
  }
};




export const getTeamMembers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.team) {
      return res.status(404).json({ message: "User or team not found" });
    }

    const team = await Team.findById(user.team).populate("members", "name email");
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json(team.members);
  } catch (err) {
    console.error("❌ Error fetching members:", err);
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------------------------------- Get Admin Dashboard Info
export const getAdminDashboard = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const team = await Team.findById(admin.team)
      .populate("leader", "name email")
      .populate("members", "name email");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json({
      user: {   // ✅ include admin info
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        team: admin.team,
      },
      team: {
        id: team._id,
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

// --------------------------------------------------------------------------------------------------

export const getUserDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("team");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let teamData = null;

    if (user.team) {
const team = await Team.findById(user.team)
  .populate({ path: "leader", model: "User", select: "name email" })
  .populate({ path: "members", model: "User", select: "name email" }); // optional if you need members too



      if (team) {
        teamData = {
          id: team._id,
          name: team.name,
          leaderName: team.leader?.name || "Unknown",
          leaderEmail: team.leader?.email || "Unknown",
        };
      }
      console.log("👉 Team fetched:", team);
console.log("👉 Leader inside team:", team?.leader);

    }
    

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      team: teamData, // ✅ send actual team info
    });
  } catch (err) {
    console.error("Error fetching user dashboard:", err);
    res.status(500).json({ message: "Server error" });
  }
};
