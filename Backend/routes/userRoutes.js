import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Update logged-in user profile
router.put("/profile", protect, async (req, res) => {
  try {
    // Extract fields from request body
    const { name, email, contact, title, availability } = req.body;

    // Handle missing fields by keeping existing values
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, contact, title, availability }, // Update only the fields that are provided
      { new: true } // Ensure the updated user is returned
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser); // Send back the updated user data
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ message: "Error updating user", error: err.message });
  }
});

// Get logged-in user profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
});

export default router;
