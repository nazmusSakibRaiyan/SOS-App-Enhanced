import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
	{		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		phone: { type: String, required: true },
		role: { type: String, enum: ["volunteer", "user", "admin"], required: true },
		address: { type: String, required: true },
		nid: { type: String, required: true },
		profilePicture: { type: String, default: null },		otp: { type: String },
		otpExpires: { type: Date },
		resetPasswordToken: { type: String },
		resetPasswordExpires: { type: Date },
		blacklisted: { type: Boolean, default: false },
		isVerified: { type: Boolean, default: false },
		verifiedAt: { type: Date }, 
		isApproved: { type: Boolean, default: false }, 
		volunteerStatus: {
			type: String,
			enum: ["active", "inactive"],
			default: "active",
		},
		isAdmin: { type: Boolean, default: false },
		socketId: { type: String, default: null }, 
	},
	{ timestamps: true }
);

const User = mongoose.model("User", UserSchema);
export default User;
