import mongoose from "mongoose";
import User from "./user.js";

const ContactSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		contacts: [
            {
                user_name: {
                    type: String,
                    required: true,
                },
                user_email: {
                    type: String,
                    required: true,
                },
            }
		],
	},
	{ timestamps: true }
);

const Contact = mongoose.model("Contact", ContactSchema);
export default Contact;
