import express from "express";
import {
	getAllUsers,
	deleteUser,
	verifyVolunteer,
	getPendingUsers,
	getUnverifiedVolunteers, 
	approveOrRejectUser
} from "../controllers/userManagementController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { approveUser, rejectUser } from "../controllers/approveUser.js";
import { adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getAllUsers);

router.delete("/:id", authMiddleware, deleteUser);

router.patch("/verify/:id", authMiddleware, adminMiddleware, verifyVolunteer);

router.get("/pending", authMiddleware, adminMiddleware, getPendingUsers);

router.get("/volunteers/unverified", authMiddleware, adminMiddleware, getUnverifiedVolunteers);

router.patch("/approve/:id", authMiddleware, adminMiddleware, approveUser);

router.delete("/reject/:id", authMiddleware, adminMiddleware, rejectUser);

router.post("/approval-action", authMiddleware, adminMiddleware, approveOrRejectUser);

export default router;
