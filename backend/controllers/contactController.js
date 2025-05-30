import User from "../models/user.js";
import Contact from "../models/Contact.js";

export const addNewContact = async (req, res) => {
	const { myId, friendName, friendEmail } = req.body;
	try {
		const myUser = await User.findById(myId);
		if (!myUser) return res.status(404).json({ message: "User not found" });

		const myContact = await Contact.findOne({ user: myId });
		const newContact = { user_name: friendName, user_email: friendEmail };

		if (!myContact) {
			const contact = new Contact({
				user: myId,
				contacts: [newContact],
			});
			await contact.save();
		} else {
			myContact.contacts.push(newContact);
			await myContact.save();
		}

		res.status(200).json({ message: "Contact added successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error", error });
	}
};

export const getAllContacts = async (req, res) => {
	const { myId } = req.body;
	try {
		const myUser = await User.findById(myId);
		if (!myUser) return res.status(404).json({ message: "User not found" });

		const myContacts = await Contact.findOne({ user: myId });
		if (!myContacts) return res.status(200).json([]);

		res.status(200).json(myContacts.contacts);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error", error });
	}
};

export const deleteContact = async (req, res) => {
	const { myId, friendEmail } = req.body;
	try {
		const contact = await Contact.findOne({ user: myId });
		if (!contact)
			return res.status(404).json({ message: "Contact not found" });

		const friendIndex = contact.contacts.findIndex(
			(contact) => contact.user_email === friendEmail
		);
		if (friendIndex === -1)
			return res
				.status(404)
				.json({ message: "Friend not found in contacts" });

		contact.contacts.splice(friendIndex, 1);
		await contact.save();

		res.status(200).json({ message: "Contact deleted successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error", error });
	}
};

export const getContactCount = async (req, res) => {
    try {

        const userId = req.user.userId || req.user.id;

        const userContacts = await Contact.findOne({ user: userId });
        

        const count = userContacts ? userContacts.contacts.length : 0;
        
        res.status(200).json({ count });
    } catch (error) {
        console.error("Error getting contact count:", error);
        res.status(500).json({ message: "Failed to get contact count" });
    }
};
