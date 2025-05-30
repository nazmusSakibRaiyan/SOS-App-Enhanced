import express from "express";
import {
  blacklistUser,
  getBlacklistedUsers,
  removeFromBlacklist, 
} from "../controllers/blacklistUserController.js";
import { adminMiddleware, authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.patch("/:id", blacklistUser);

router.get("/", getBlacklistedUsers);

router.patch("/remove/:id", removeFromBlacklist); // <-- corrected

router.patch("/blacklist/:id", authMiddleware, adminMiddleware, blacklistUser);

export default router;
