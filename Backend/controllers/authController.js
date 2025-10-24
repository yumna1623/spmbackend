import User from "../models/User.js";
import Team from "../models/Team.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ------------------------------------------------------------ LOGIN (Both Personal Password & Team Passcode)
export const loginWithPasscode = async (req, res) => {
  try {
    const { email, password, passcode } = req.body;
    console.log("👉 Incoming login:", { email, password, passcode });

    // Step 1: Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Validate the personal password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid personal password" });
    }

    // Step 3: If the user is a member, validate the team passcode
    let isPasscodeMatch = false;
    if (user.role === "member" && user.team) {
      const team = await Team.findById(user.team);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Step 4: Compare passcode with team passcode
      isPasscodeMatch = await bcrypt.compare(passcode, team.passcode);
    }
    
    // Step 5: If the passcode is incorrect, return error
    if (!isPasscodeMatch) {
      return res.status(401).json({ message: "Invalid team passcode" });
    }

    // Step 6: Generate a JWT token for a successful login
    const token = generateToken(user._id);

    // Step 7: Respond with the token and user data
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team || null,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
