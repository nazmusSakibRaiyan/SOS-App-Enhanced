import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const ChatSocketContext = createContext();

export const useChatSocket = () => useContext(ChatSocketContext);

export const ChatSocketProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const { user } = useAuth();

	useEffect(() => {
		const newSocket = io("http://localhost:5000", {
			reconnectionAttempts: 5,
			transports: ["websocket", "polling"],
		});

		newSocket.on("connect", () => {
			console.log("Socket connected:", newSocket.id);
		});

		newSocket.on("disconnect", (reason) => {
			console.log("Socket disconnected:", reason);
		});

		setSocket(newSocket);

		return () => {
			newSocket.close();
		};
	}, []);

	useEffect(() => {
		if (socket && user && user._id) {
			socket.emit("authenticate", { userId: user._id });
		}
	}, [socket, user]);

	const sendMessage = (receiverId, message) => {
		if (socket) {
			socket.emit("sendMessage", {
				senderId: user._id,
				receiverId,
				message,
			});
		}
	};

	return (
		<ChatSocketContext.Provider value={{ socket, sendMessage }}>
			{children}
		</ChatSocketContext.Provider>
	);
};
