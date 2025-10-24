import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { createTeam, getAdminDashboard, joinTeam } from "../controllers/teamController.js";
import { getUserDashboard } from "../controllers/userController.js";
import { getTeamMembers } from "../controllers/teamController.js";



const router = express.Router();

// ✅ No adminOnly here → creating a team will make the user admin
router.post("/create", createTeam);  
router.post("/join", joinTeam);
router.get("/admin-dashboard", protect, getAdminDashboard); 
router.get("/user-dashboard", protect, getUserDashboard);
router.get("/members", protect, getTeamMembers);



export default router;
