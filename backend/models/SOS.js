import mongoose from "mongoose";
import User from "./user.js";

const SOSSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: User,
			required: true,
		},
		message: { type: String, required: true },
		coordinates: {
			latitude: { type: Number, required: true },
			longitude: { type: Number, required: true },
		},
		isResolved: { type: Boolean, default: false },
		acceptedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: User }],
		isContact: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

const SOS = mongoose.model("SOS", SOSSchema);
export default SOS;
