import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
	{
		user1: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		user2: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		messages: [
			{
				message: {
					type: String,
					required: true,
				},
				createdAt: {
					type: Date,
					default: Date.now,
				},
				sender: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
			},
		],
	},
	{ timestamps: true }
);

ChatSchema.index({ user1: 1, user2: 1 });

const Chat = mongoose.model("Chat", ChatSchema);

export default Chat;
