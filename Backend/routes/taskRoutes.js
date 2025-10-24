import express from "express";
import {
  createTask,
  getMyTasks,
  getTeamTasks,
  updateTaskStatus,
  updateTaskDecision,
  getLeaderboard, // 👈 new controller
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Only admin can create a task
router.post("/", protect, createTask);

// ✅ Members update their task status
router.put("/:id/status", protect, updateTaskStatus);

// ✅ Admin reviews task (accept/reject)
router.put("/:id/decision", protect, updateTaskDecision);

// ✅ Fetch logged-in user’s tasks
router.get("/my", protect, getMyTasks);

// ✅ Fetch team tasks
router.get("/team/:teamId", protect, getTeamTasks);

// ✅ Leaderboard (progress of all team members)
router.get("/leaderboard", protect, getLeaderboard);

export default router;
