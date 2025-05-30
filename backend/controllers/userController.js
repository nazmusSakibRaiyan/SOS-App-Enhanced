import User from "../models/user.js";
import Contact from "../models/Contact.js";

export const getAllUserExceptMe = async (req, res) => {
	try {
		const { myId } = req.body;
		const myUser = await User.findById(myId);
		if (!myUser) return res.status(404).json({ message: "User not found" });

		const allUsers = await User.find({ _id: { $ne: myId } }).select(
			"-password"
		);

		const myContacts = await Contact.findOne({ user: myId });
		let filteredUsers = allUsers;

		if (myContacts) {
			const contactEmails = myContacts.contacts.map(
				(contact) => contact.user_email
			);
			filteredUsers = allUsers.filter(
				(user) => !contactEmails.includes(user.email)
			);
		}

		res.status(200).json(filteredUsers);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error", error });
	}
};

export const updateVolunteerStatus = async (req, res) => {
	try {
		const { userId, status } = req.body;

		if (!["active", "inactive"].includes(status)) {
			return res.status(400).json({ message: "Invalid status value" });
		}

		const user = await User.findById(userId);
		if (!user || user.role !== "volunteer") {
			return res.status(404).json({ message: "Volunteer not found" });
		}

		user.volunteerStatus = status;
		await user.save();

		res.status(200).json({
			message: "Volunteer status updated successfully",
		});
	} catch (error) {
		console.error("Error updating volunteer status:", error);
		res.status(500).json({ message: "Failed to update volunteer status" });
	}
};

export const getUserById = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id).select(
			"-password -otp -otpExpires"
		);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.status(200).json(user);
	} catch (error) {
		console.error("Error fetching user by ID:", error);
		res.status(500).json({ message: "Server error", error });
	}
};
