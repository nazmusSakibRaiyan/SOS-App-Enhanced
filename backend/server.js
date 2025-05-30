import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import sosRoutes from "./routes/sosRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import userRoute from "./routes/userRoute.js";
import { Server } from "socket.io";
import User from "./models/user.js";
import SOS from "./models/SOS.js";
import Notification from "./models/Notification.js";

import broadcastRoutes from "./routes/broadcastRoutes.js";
import userManagementRoutes from "./routes/userManagementRoutes.js";
import blacklistUserRoutes from "./routes/blacklistUserRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { sendPendingResponseReminders } from "./controllers/notificationController.js";

import feedbackRoutes from "./routes/feedbackRoutes.js";
import Chat from "./models/Chat.js";
import { authMiddleware } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Serve static files for uploaded images
app.use('/uploads', express.static('uploads'));

mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("Connected to MongoDB"))
	.catch((err) => console.error("Failed to connect to MongoDB", err));

app.use("/api/auth", authRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/user", userRoute);
app.use("/api/broadcast", broadcastRoutes);
app.use("/api/user-management", userManagementRoutes);
app.use("/api/blacklist-users", blacklistUserRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feedback", feedbackRoutes);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
	console.log(`Server running on port ${PORT}`)
);

const io = new Server(server, {
	cors: {
		origin: "*",
	},
});

app.set("io", io);

io.on("connection", (socket) => {
	console.log("A user connected:", socket.id);

	socket.on("authenticate", async ({ userId }) => {
		try {
			if (!userId) return;

			const user = await User.findById(userId);
			if (user) {
				user.socketId = socket.id;
				await user.save();
				console.log(
					`User ${userId} authenticated with socket ${socket.id}`
				);

				socket.join(userId);
			}
		} catch (error) {
			console.error("Error storing socketId:", error);
		}
	});

	// Handle volunteer location updates for live tracking during SOS
	socket.on("volunteerLocationUpdate", async (data) => {
		try {
			const { sosId, volunteerId, coordinates } = data;

			// Verify the SOS exists and the volunteer is accepted
			const sos = await SOS.findById(sosId);
			if (!sos || !sos.acceptedBy.includes(volunteerId)) {
				return;
			}

			// Find the user who created the SOS
			const sosUser = await User.findById(sos.user);
			if (sosUser && sosUser.socketId) {
				const volunteer = await User.findById(volunteerId);
				if (!volunteer) return;

				io.to(sosUser.socketId).emit("respondingVolunteerLocation", {
					sosId,
					volunteerId,
					volunteerName: volunteer.name,
					coordinates,
				});
			}
		} catch (error) {
			console.error("Error handling volunteer location update:", error);
		}
	});

	socket.on("SOSRead", async (data) => {
		try {
			const { sosId, volunteerId } = data;

			await Notification.findOneAndUpdate(
				{
					recipient: volunteerId,
					relatedId: sosId,
					type: "SOS",
				},
				{
					isRead: true,
					readAt: new Date(),
				}
			);

			// Get SOS details
			const sos = await SOS.findById(sosId);
			if (!sos) return;

			// Find user who created the SOS
			const sosCreator = await User.findById(sos.user);
			const volunteer = await User.findById(volunteerId);

			if (sosCreator && sosCreator.socketId && volunteer) {
				// Notify SOS creator that a volunteer has seen the alert
				io.to(sosCreator.socketId).emit("sosReadReceipt", {
					sosId,
					volunteer: {
						id: volunteerId,
						name: volunteer.name,
					},
					readAt: new Date(),
				});
			}
		} catch (error) {
			console.error("Error handling SOS read status:", error);
		}
	});

	// Handle sending messages
	socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
		try {
			let chat = await Chat.findOne({
				$or: [
					{ user1: senderId, user2: receiverId },
					{ user1: receiverId, user2: senderId },
				],
			});

			if (!chat) {
				chat = new Chat({
					user1: senderId,
					user2: receiverId,
					messages: [],
				});
			}

			chat.messages.push({ message, sender: senderId });
			await chat.save();

			io.to(receiverId).emit("newMessage", { message, sender: senderId });
		} catch (error) {
			console.error("Error sending message:", error);
		}
	});

	socket.on("disconnect", async () => {
		console.log("A user disconnected:", socket.id);

		try {
			await User.findOneAndUpdate(
				{ socketId: socket.id },
				{ $set: { socketId: null } }
			);
		} catch (error) {
			console.error("Error clearing socketId:", error);
		}
	});
});

// Chat routes
app.get("/api/chats/:receiverId", authMiddleware, async (req, res) => {
	try {
		const { userId } = req.user;
		const { receiverId } = req.params;
		console.log(
			"Fetching chat for user:",
			userId,
			"with receiver:",
			receiverId
		);

		const chat = await Chat.findOne({
			$or: [
				{ user1: userId, user2: receiverId },
				{ user1: receiverId, user2: userId },
			],
		}).populate("messages.sender", "name");

		if (!chat) return res.status(200).json({ messages: [] });

		res.status(200).json(chat.messages);
	} catch (error) {
		console.error("Error fetching chat:", error);
		res.status(500).json({ message: "Server error" });
	}
});

app.post("/api/chats/:receiverId", authMiddleware, async (req, res) => {
	try {
		const { userId } = req.user;
		const { receiverId } = req.params;
		const { message } = req.body;

		let chat = await Chat.findOne({
			$or: [
				{ user1: userId, user2: receiverId },
				{ user1: receiverId, user2: userId },
			],
		});

		if (!chat) {
			chat = new Chat({ user1: userId, user2: receiverId, messages: [] });
		}

		chat.messages.push({ message, sender: userId });
		await chat.save();

		const io = req.app.get("io");
		if (io) {
			io.to(receiverId).emit("newMessage", { message, sender: userId });
		} else {
			console.error("Socket.io instance not found");
		}

		res.status(201).json({ success: true });
	} catch (error) {
		console.error("Error sending message:", error);
		res.status(500).json({ message: "Server error" });
	}
});

app.get("/api/chats", authMiddleware, async (req, res) => {
	try {
		const { userId } = req.user;

		const chats = await Chat.find({
			$or: [{ user1: userId }, { user2: userId }],
		})
			.populate("user1", "name avatar")
			.populate("user2", "name avatar")
			.sort({ updatedAt: -1 });

		const formattedChats = chats.map((chat) => {
			const otherUser =
				chat.user1._id.toString() === userId ? chat.user2 : chat.user1;

			return {
				_id: chat._id,
				otherUser: {
					_id: otherUser._id,
					name: otherUser.name,
					avatar: otherUser.avatar || "",
				},
				lastMessage:
					chat.messages.length > 0
						? chat.messages[chat.messages.length - 1].message
						: "No messages yet",
				updatedAt: chat.updatedAt,
			};
		});

		res.status(200).json(formattedChats);
	} catch (error) {
		console.error("Error fetching chats:", error);
		res.status(500).json({ message: "Server error" });
	}
});

app.post("/api/user/search", async (req, res) => {
	try {
		const { query } = req.body;
		console.log("Search query:", query);
		if (!query) {
			return res
				.status(400)
				.json({ message: "Query parameter is required" });
		}

		const users = await User.find({
			$or: [
				{ name: { $regex: query, $options: "i" } },
				{ email: { $regex: query, $options: "i" } },
			],
		}).select("name email");

		res.status(200).json(users);
	} catch (error) {
		console.error("Error searching users:", error);
		res.status(500).json({ message: "Server error" });
	}
});

app.get("/api/user/:id", async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ message: "Invalid user ID" });
		}

		const user = await User.findById(id).select(
			"-password -otp -otpExpires"
		);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.status(200).json(user);
	} catch (error) {
		console.error("Error fetching user by ID:", error);
		res.status(500).json({ message: "Server error" });
	}
});

setInterval(sendPendingResponseReminders,100* 5 * 60 * 1000); 

export { io };
