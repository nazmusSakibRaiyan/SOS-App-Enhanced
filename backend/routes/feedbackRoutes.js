import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { submitVolunteerFeedback } from "../controllers/feedbackController.js";
const router = express.Router();
router.post("/volunteer", authMiddleware, submitVolunteerFeedback);
export default router;