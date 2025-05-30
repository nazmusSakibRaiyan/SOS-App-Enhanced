import express from "express";
import {
	sendSoftSOS,
	sendSilentSOS,
	setAsResolved,
	getAllNonResolvedSOS,
	getAllMySOS,
	acceptSOS,
	generateSafetyReport,
	getSOSById,
	monitorActiveSOSCases,
	getSOSStatistics,
	getSOSDetails,
} from "../controllers/sosController.js";
import {
	adminMiddleware,
	authMiddleware,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/sendSoftSOS", sendSoftSOS);
router.post("/sendSilentSOS", sendSilentSOS);
router.post("/setAsResolved", setAsResolved);
router.get("/", getAllNonResolvedSOS);
router.get("/active", authMiddleware, getAllNonResolvedSOS); 
router.get("/stats", authMiddleware, getSOSStatistics); 
router.post("/mySOS", getAllMySOS);
router.post("/acceptSOS", acceptSOS);


router.get("/report", authMiddleware, adminMiddleware, generateSafetyReport);
router.post(
	"/safety-report",
	authMiddleware,
	adminMiddleware,
	generateSafetyReport
);

router.get(
	"/monitor-active",
	authMiddleware,
	adminMiddleware,
	monitorActiveSOSCases
);
router.get("/:sosId", authMiddleware, getSOSById);
router.get("/:id", authMiddleware, getSOSDetails); 

export default router;
