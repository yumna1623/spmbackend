import express from "express";
import { createDepartment, getDepartments } from "../controllers/departmentController.js";
import  {protect}  from "../middleware/authMiddleware.js";

const router = express.Router();

// Leader/Admin creates department
router.post("/", protect, createDepartment);

// All members can view departments
router.get("/", protect, getDepartments);
export default router;


