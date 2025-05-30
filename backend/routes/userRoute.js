import express from "express";
import {
	getAllUserExceptMe,
	updateVolunteerStatus,
	getUserById,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/getAllUser", getAllUserExceptMe);
router.patch("/updateVolunteerStatus", updateVolunteerStatus);
router.get("/:id", getUserById);

export default router;
