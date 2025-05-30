import Broadcast from "../models/Broadcast.js";
import User from "../models/user.js";
import { sendBroadcastEmail } from "../utils/sendEmail.js";


export const broadcastMessage = async (req, res) => {
    try {
        const { title, message } = req.body;

        if (!title || !message) {
            return res.status(400).json({ message: "Title and message are required" });
        }

        const broadcast = new Broadcast({ title, message });
        await broadcast.save();

        if (req.io) {
            req.io.emit("broadcast", { title, message });
        }

        const users = await User.find({}, "email");
        const emailPromises = users.map((user) =>
            sendBroadcastEmail(user.email, `Emergency Broadcast: ${title}`, message)
        );

        await Promise.all(emailPromises);

        res.status(201).json({ message: "Broadcast message sent successfully", broadcast });
    } catch (error) {
        res.status(500).json({ message: "Failed to send broadcast message", error: error.message });
    }
};

export const getAllBroadcasts = async (req, res) => {
    try {
        const broadcasts = await Broadcast.find().sort({ createdAt: -1 });
        res.status(200).json(broadcasts);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch broadcast messages", error: error.message });
    }
};
