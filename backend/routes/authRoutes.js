import express from "express";
import { register, login, verifyOTP, getUser, updateProfile, deleteAccount, forgotPassword, resetPassword, uploadProfilePicture, deleteProfilePicture } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js"; 
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/user", authMiddleware, getUser);
router.put("/update-profile", authMiddleware, updateProfile);
router.post("/upload-profile-picture", authMiddleware, upload.single('profilePicture'), uploadProfilePicture);
router.delete("/delete-profile-picture", authMiddleware, deleteProfilePicture);
router.delete("/delete-account", authMiddleware, deleteAccount);


export default router;
