import express from "express";
import {  loginWithPasscode } from "../controllers/authController.js";

const router = express.Router();
// router.post("/register", register);
router.post("/login-passcode", loginWithPasscode);


export default router;
