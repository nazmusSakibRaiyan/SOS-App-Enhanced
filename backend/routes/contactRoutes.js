import express from "express";
import {
	addNewContact,
	deleteContact,
	getAllContacts,
	getContactCount
} from "../controllers/contactController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/addContact", addNewContact);
router.post("/getAllContacts", getAllContacts);
router.delete("/deleteContact", deleteContact);
router.get("/count", authMiddleware, getContactCount); 

export default router;
