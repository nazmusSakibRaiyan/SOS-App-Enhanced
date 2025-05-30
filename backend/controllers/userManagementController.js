import User from "../models/user.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const getAllUsers = async (req, res) => {
	try {
		const users = await User.find({ 
			_id: { $ne: req.user.id },
			blacklisted: { $ne: true }  
		}).select(
			"-password -otp -otpExpires"
		); 
		res.status(200).json(users);
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ message: "Failed to fetch users" });
	}
};


export const deleteUser = async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		await user.deleteOne();
		res.status(200).json({ message: "User deleted successfully" });
	} catch (error) {
		console.error("Error deleting user:", error);
		res.status(500).json({ message: "Failed to delete user" });
	}
};


export const verifyVolunteer = async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user || user.role !== "volunteer") {
			return res.status(404).json({ message: "Volunteer not found" });
		}

		if (user.isVerified && user.isApproved) {
			return res
				.status(400)
				.json({ message: "Volunteer is already verified and approved" });
		}

		user.isVerified = true;
		user.isApproved = true;  
		user.verifiedAt = new Date();
		await user.save();

		try {
			const transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: process.env.EMAIL_USER,
					pass: process.env.EMAIL_PASS,
				},
				tls: {
					rejectUnauthorized: false,
				},
			});
			
			await transporter.sendMail({
				from: process.env.EMAIL_USER,
				to: user.email,
				subject: "Volunteer Account Approved",
				text: `Congratulations ${user.name}!\n\nYour volunteer account has been verified and approved. You can now log in to the SOS platform and start helping others.\n\nThank you for joining our emergency response team.\n\nBest Regards,\nSOS Team`,
			});
		} catch (emailError) {
			console.error("Error sending verification email:", emailError);

		}

		res.status(200).json({ message: "Volunteer verified and approved successfully" });
	} catch (error) {
		console.error("Error verifying volunteer:", error);
		res.status(500).json({ message: "Failed to verify volunteer" });
	}
};


export const getPendingUsers = async (req, res) => {
    try {
        const pendingUsers = await User.find({ 
            isApproved: false,
            _id: { $ne: req.user.id } 
        }).select("-password -otp -otpExpires");
        
        res.status(200).json(pendingUsers);
    } catch (error) {
        console.error("Error fetching pending users:", error);
        res.status(500).json({ message: "Failed to fetch pending users" });
    }
};

export const approveOrRejectUser = async (req, res) => {
    try {
        const { userId, action } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (action === "approve") {
            user.isApproved = true;
            await user.save();
            return res.status(200).json({ message: "User approved successfully" });
        } else if (action === "reject") {
            await user.deleteOne();
            return res.status(200).json({ message: "User rejected and deleted successfully" });
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }
    } catch (error) {
        console.error("Error approving/rejecting user:", error);
        res.status(500).json({ message: "Failed to approve/reject user" });
    }
};

export const getUnverifiedVolunteers = async (req, res) => {
    try {
        const unverifiedVolunteers = await User.find({ 
            role: "volunteer",
            isVerified: false,
            _id: { $ne: req.user.id }
        }).select("-password -otp -otpExpires");
        
        res.status(200).json(unverifiedVolunteers);
    } catch (error) {
        console.error("Error fetching unverified volunteers:", error);
        res.status(500).json({ message: "Failed to fetch unverified volunteers" });
    }
};
