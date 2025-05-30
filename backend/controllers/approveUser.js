import User from "../models/user.js";
import { sendEmail } from "../utils/sendEmail.js";

export const approveUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.isApproved = true;
        await user.save();

        try {
            await sendEmail(
                user.email,
                "Account Approved",
                `Hello ${user.name},\n\nYour account has been approved by an administrator. You can now use all features of our application.\n\nBest regards,\nSOS Team`
            );
        } catch (emailError) {
            console.error("Failed to send approval email:", emailError);
        }

        res.status(200).json({ message: "User approved successfully" });
    } catch (error) {
        console.error("Error approving user:", error);
        res.status(500).json({ message: "Failed to approve user" });
    }
};

export const rejectUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        try {
            await sendEmail(
                user.email,
                "Account Registration Rejected",
                `Hello ${user.name},\n\nWe regret to inform you that your account registration request has been rejected by our administrators. If you believe this is an error, please contact our support team.\n\nBest regards,\nSOS Team`
            );
        } catch (emailError) {
            console.error("Failed to send rejection email:", emailError);
        }

        await user.deleteOne();

        res.status(200).json({ message: "User rejected and deleted successfully" });
    } catch (error) {
        console.error("Error rejecting user:", error);
        res.status(500).json({ message: "Failed to reject user" });
    }
};