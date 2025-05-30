import express from "express";
import { broadcastMessage, getAllBroadcasts } from "../controllers/broadcastController.js";
import { adminMiddleware } from "../middleware/authMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, adminMiddleware, broadcastMessage);

router.get("/", authMiddleware, adminMiddleware, getAllBroadcasts);

export default router;

