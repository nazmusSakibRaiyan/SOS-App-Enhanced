import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
	Box,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Avatar,
	Typography,
	Paper,
	CircularProgress,
	TextField,
	Button,
	Modal,
} from "@mui/material";

export default function Chats() {
	const { user, token } = useAuth();
	const [chatList, setChatList] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [openModal, setOpenModal] = useState(false);
	const navigate = useNavigate();

	const fetchChatList = async () => {
		try {
			const response = await axios.get(
				"http://localhost:5000/api/chats",
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			setChatList(response.data);
		} catch (error) {
			console.error("Error fetching chat list:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = async () => {
		try {
			const response = await axios.post(
				`http://localhost:5000/api/user/search`,
				{ query: searchQuery },
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			setSearchResults(response.data);
		} catch (error) {
			console.error("Error searching users:", error);
		}
	};

	const startChat = async (receiverId) => {
		try {
			navigate(`/chats/${receiverId}`);
			setOpenModal(false);
		} catch (error) {
			console.error("Error starting chat:", error);
		}
	};

	useEffect(() => {
		fetchChatList();
	}, [token]);

	if (loading) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
				}}
			>
				<CircularProgress />
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
				p: 2,
			}}
		>
			<Typography variant="h5" sx={{ mb: 2 }}>
				My Chats
			</Typography>
			<Box sx={{ display: "flex", mb: 2 }}>
				<TextField
					fullWidth
					variant="outlined"
					placeholder="Search users by name or email..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					sx={{ mr: 1 }}
				/>
				<Button
					variant="contained"
					color="primary"
					onClick={() => {
						setOpenModal(true);
						handleSearch();
					}}
				>
					Search
				</Button>
			</Box>
			<Paper
				sx={{
					flex: 1,
					overflowY: "auto",
					bgcolor: "background.paper",
					p: 2,
				}}
			>
				<List>
					{chatList.map((chat: any) => (
						<ListItem
							key={chat._id}
							component="div"
							onClick={() =>
								navigate(`/chats/${chat.otherUser._id}`)
							}
							sx={{
								mb: 1,
								borderRadius: 1,
								boxShadow: 1,
								cursor: "pointer",
							}}
						>
							<ListItemAvatar>
								<Avatar
									src={chat.otherUser.avatar}
									alt={chat.otherUser.name}
								/>
							</ListItemAvatar>
							<ListItemText
								primary={chat.otherUser.name}
								secondary={
									<>
										<Typography
											variant="body2"
											color="text.secondary"
											noWrap
										>
											{chat.lastMessage}
										</Typography>
										<Typography
											variant="caption"
											color="text.secondary"
										>
											{new Date(
												chat.updatedAt
											).toLocaleString()}
										</Typography>
									</>
								}
							/>
						</ListItem>
					))}
				</List>
			</Paper>

			<Modal open={openModal} onClose={() => setOpenModal(false)}>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: 400,
						bgcolor: "background.paper",
						boxShadow: 24,
						p: 4,
						borderRadius: 2,
					}}
				>
					<Typography variant="h6" sx={{ mb: 2 }}>
						Search Results
					</Typography>
					<TextField
						fullWidth
						variant="outlined"
						placeholder="Search users by name or email..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						sx={{ mb: 2 }}
					/>
					<Button
						variant="contained"
						color="primary"
						onClick={handleSearch}
						fullWidth
						sx={{ mb: 2 }}
					>
						Search
					</Button>
					<List>
						{searchResults.map((user: any) => (
							<ListItem
								key={user._id}
								component="button"
								onClick={() => startChat(user._id)}
								sx={{ mb: 1, borderRadius: 1, boxShadow: 1 }}
							>
								<ListItemAvatar>
									<Avatar src={user.avatar} alt={user.name} />
								</ListItemAvatar>
								<ListItemText
									primary={user.name}
									secondary={user.email}
								/>
							</ListItem>
						))}
					</List>
				</Box>
			</Modal>
		</Box>
	);
}
