import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSOSModal } from "./SOSModalContext";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const { showSOSModal } = useSOSModal();
	const { user } = useAuth();
	const [respondingVolunteers, setRespondingVolunteers] = useState({});

	const [unreadNotifications, setUnreadNotifications] = useState(0);

	useEffect(() => {
		const newSocket = io("http://localhost:5000", {
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
			transports: ['websocket', 'polling']
		});


		newSocket.on('connect', () => {
			console.log('Socket connected:', newSocket.id);
		});

		newSocket.on('connect_error', (err) => {
			console.error('Socket connection error:', err);
			toast.error('Connection error. Notifications may not work properly.');
		});

		newSocket.on('disconnect', (reason) => {
			console.log('Socket disconnected:', reason);
		});
		
		setSocket(newSocket);

		return () => {
			console.log('Closing socket connection');
			newSocket.close();
		};
	}, []);

	useEffect(() => {
		if (socket && user && user._id) {
			console.log('Authenticating socket for user:', user._id);
			socket.emit("authenticate", { userId: user._id });
		}
	}, [socket, user]);

	useEffect(() => {
		if (socket) {

			const handleNewSOS = (data) => {
				console.log('SOS alert received:', data);
				if (user && user.role === 'volunteer') {
					showSOSModal(data);
				}
			};

			socket.on("newSOS", handleNewSOS);
			socket.on("respondingVolunteerLocation", (data) => {
				setRespondingVolunteers(prev => ({
					...prev,
					[data.sosId]: {
						...prev[data.sosId],
						[data.volunteerId]: {
							name: data.volunteerName,
							coordinates: data.coordinates,
							lastUpdated: new Date()
						}
					}
				}));
			});

			socket.on("sosResolved", (data) => {
				toast.info(`SOS #${data.sosId.substring(0, 6)} has been resolved.`);

				setRespondingVolunteers(prev => {
					const updated = { ...prev };
					delete updated[data.sosId];
					return updated;
				});
			});

			socket.on("sosAlert", (data) => {

				toast.custom(
					(t) => (
						<div
							className={`${
								t.visible ? 'animate-enter' : 'animate-leave'
							} max-w-md w-full bg-red-100 shadow-lg rounded-lg pointer-events-auto flex`}
						>
							<div className="flex-1 p-4">
								<div className="flex items-start">
									<div className="flex-shrink-0 pt-0.5">
										<span className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center text-white">
											SOS
										</span>
									</div>
									<div className="ml-3 flex-1">
										<p className="text-sm font-medium text-gray-900">
											Emergency SOS Alert
										</p>
										<p className="mt-1 text-sm text-gray-500">
											{data.notification.message}
										</p>
									</div>
								</div>
							</div>
							<div className="border-l border-gray-200">
								<button
									onClick={() => {
										window.location.href = `/sos/${data.notification.relatedId}`;
										toast.dismiss(t.id);
									}}
									className="w-full h-full p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500"
								>
									View
								</button>
							</div>
						</div>
					),
					{ duration: 8000 }
				);


				const audio = new Audio('/emergency-alarm.mp3');
				audio.play().catch(() => {
	
				});

				setUnreadNotifications(prev => prev + 1);
			});

			socket.on("reminder", (notification) => {
				toast.info(notification.message);
				setUnreadNotifications(prev => prev + 1);
			});

			socket.on("sosAccepted", (data) => {
				toast.success(`${data.volunteer.name} has accepted your SOS request and is on the way.`);
			});

			socket.on("userTyping", (data) => {

			});

			socket.on("messageReadReceipt", (data) => {
				
			});

			socket.on("sosReadReceipt", (data) => {
				
			});

			return () => {
				socket.off("newSOS", handleNewSOS);
				socket.off("respondingVolunteerLocation");
				socket.off("sosResolved");
				socket.off("newMessage");
				socket.off("newChat");
				socket.off("sosAlert");
				socket.off("reminder");
				socket.off("sosAccepted");
				socket.off("userTyping");
				socket.off("messageReadReceipt");
				socket.off("sosReadReceipt");
			};
		}
	}, [socket, showSOSModal, user]);

	const updateVolunteerLocation = (sosId, coordinates) => {
		if (socket && user && sosId && coordinates) {
			socket.emit("volunteerLocationUpdate", {
				sosId,
				volunteerId: user._id,
				coordinates
			});
		}
	};

	const resetUnreadNotifications = () => {
		setUnreadNotifications(0);
	};

	return (
		<SocketContext.Provider value={{ 
			socket, 
			respondingVolunteers, 
			updateVolunteerLocation,
			unreadNotifications,
			resetUnreadNotifications
		}}>
			{children}
		</SocketContext.Provider>
	);
};
