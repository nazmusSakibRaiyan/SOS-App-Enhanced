import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChatSocket } from "../context/ChatSocketContext";
import axios from "axios";
import {
	Box,
	TextField,
	Button,
	Typography,
	Paper,
	Avatar,
	IconButton,
	Divider,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function SingleChat() {
	const { id: receiverId } = useParams();
	const { user, token } = useAuth();
	const { socket, sendMessage } = useChatSocket();
	const [messages, setMessages] = useState<any[]>([]);
	const [newMessage, setNewMessage] = useState("");
	const chatBoxRef = useRef<HTMLDivElement>(null);
	const [receiverProfile, setReceiverProfile] = useState<any>(null);

	const fetchReceiverProfile = async () => {
		try {
			const response = await axios.get(
				`http://localhost:5000/api/user/${receiverId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			if (response.data) {
				setReceiverProfile(response.data);
			} else {
				console.error("Receiver profile not found");
			}
		} catch (error) {
			console.error("Error fetching receiver profile:", error);
		}
	};

	const fetchMessages = async () => {
		try {
			const response = await axios.get(
				`http://localhost:5000/api/chats/${receiverId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			setMessages(Array.isArray(response.data) ? response.data : []);
		} catch (error) {
			console.error("Error fetching messages:", error);
			setMessages([]);
		}
	};

	useEffect(() => {
		fetchMessages();
		fetchReceiverProfile();
	}, [receiverId, token]);

	useEffect(() => {
		if (socket) {
			socket.on("newMessage", (message) => {
				setMessages((prev) => [...prev, message]);
			});
		}

		return () => {
			if (socket) socket.off("newMessage");
		};
	}, [socket]);

	useEffect(() => {
		if (chatBoxRef.current) {
			chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
		}
	}, [messages]);

	const handleSendMessage = () => {
		if (!newMessage.trim()) return;

		sendMessage(receiverId, newMessage);
		setNewMessage("");
		setMessages((prev) => [
			...prev,
			{
				message: newMessage,
				sender: { _id: user._id },
				receiver: { _id: receiverId },
			},
		]);
	};

	if (!receiverProfile) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
				}}
			>
				<Typography variant="h6">Loading...</Typography>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100vh",
				bgcolor: "background.default",
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					bgcolor: "primary.main",
					color: "white",
					p: 2,
				}}
			>
                <IconButton
                    color="inherit"
                    sx={{ mr: 1 }}
                    onClick={() => window.history.back()}
                >
                    <ArrowBackIcon />
                </IconButton>
				<Avatar
					sx={{ width: 40, height: 40, mr: 2 }}
					src={receiverProfile.avatar}
					alt={receiverProfile.name}
				/>
				<Typography variant="h6" noWrap>
					{receiverProfile.name}
				</Typography>
			</Box>
			<Paper
				ref={chatBoxRef}
				sx={{
					flex: 1,
					overflowY: "auto",
					p: 2,
					bgcolor: "background.paper",
				}}
			>
				{messages.map((msg, index) => (
					<Box
						key={index}
						sx={{
							display: "flex",
							justifyContent:
								msg.sender._id === user._id
									? "flex-end"
									: "flex-start",
							mb: 1,
						}}
					>
						<Box
							sx={{
								bgcolor:
									msg.sender._id === user._id
										? "primary.main"
										: "grey.300",
								color:
									msg.sender._id === user._id
										? "white"
										: "black",
								p: 1.5,
								borderRadius: 2,
								maxWidth: "70%",
								boxShadow: 1,
							}}
						>
							{msg.message}
						</Box>
					</Box>
				))}
			</Paper>
			<Divider />
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					p: 2,
					bgcolor: "background.paper",
				}}
			>
				<TextField
					fullWidth
					variant="outlined"
					placeholder="Type a message..."
					value={newMessage}
					onChange={(e) => setNewMessage(e.target.value)}
					sx={{ mr: 1 }}
				/>
				<Button
					variant="contained"
					color="primary"
					onClick={handleSendMessage}
					endIcon={<SendIcon />}
				>
					Send
				</Button>
			</Box>
		</Box>
	);
}
