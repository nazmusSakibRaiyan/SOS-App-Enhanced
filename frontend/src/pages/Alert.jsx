import { useEffect, useState, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
	MapPin,
	User,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Phone,
	Clock,
	Shield,
	Users,
} from "lucide-react";

const Alert = () => {
	const { socket, updateVolunteerLocation } = useSocket();
	const { token, user, loading } = useAuth();
	const [notifications, setNotifications] = useState([]);
	const [acceptedSOS, setAcceptedSOS] = useState(new Set());
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const locationIntervalRefs = useRef({});
	const navigate = useNavigate();
	const [pulsating, setPulsating] = useState(true);

	useEffect(() => {
		if (loading) return;

		if (user && user.role !== "volunteer") {
			navigate("/");
		}
	}, [user, loading, navigate]);

	useEffect(() => {
		const fetchUnresolvedSOS = async () => {
			setIsLoading(true);
			setError(null);

			try {
				console.log("Fetching SOS with token:", token ? "Token exists" : "No token");

				const res = await fetch("http://localhost:5000/api/sos", {
					method: "GET",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				console.log("SOS API response status:", res.status);

				if (res.ok) {
					const data = await res.json();
					console.log("SOS data received:", data);
					setNotifications(data);

					if (Array.isArray(data) && user && user._id) {
						data.forEach((sos) => {
							if (sos.acceptedBy && sos.acceptedBy.includes(user._id)) {
								setAcceptedSOS(
									(prev) => new Set([...prev, sos._id])
								);
								startLocationTracking(sos._id);
							}
						});
					}
				} else {
					console.error("Failed to fetch SOS:", res.status);
					setError("Failed to load alerts. Please try again.");
					toast.error("Failed to fetch unresolved SOS.");
				}
			} catch (error) {
				console.error("Error fetching SOS:", error);
				setError(`Error: ${error.message}`);
				toast.error("An error occurred while fetching SOS.");
			} finally {
				setIsLoading(false);
			}
		};

		if (token && user) {
			fetchUnresolvedSOS();
		}

		return () => {
			Object.values(locationIntervalRefs.current).forEach((interval) => {
				clearInterval(interval);
			});
		};
	}, [token, user]);

	useEffect(() => {
		if (socket) {
			socket.on("newSOS", (data) => {

				const audio = new Audio('/alert-sound.mp3');
				audio.play().catch(e => console.log('Audio play prevented by browser policy'));
				
				toast.error("🚨 NEW EMERGENCY ALERT!", {
					duration: 6000,
				});
				setNotifications((prev) => [data, ...prev]);
			});

			socket.on("sosResolved", (data) => {
				toast.success(`SOS alert has been resolved.`);

				// Stop location tracking for this SOS
				if (locationIntervalRefs.current[data.sosId]) {
					clearInterval(locationIntervalRefs.current[data.sosId]);
					delete locationIntervalRefs.current[data.sosId];
				}

				// Remove the resolved SOS from the notifications list
				setNotifications((prev) =>
					prev.filter((sos) => sos._id !== data.sosId)
				);

				// Remove from accepted SOS set
				setAcceptedSOS((prev) => {
					const updated = new Set(prev);
					updated.delete(data.sosId);
					return updated;
				});
			});
		}

		return () => {
			if (socket) {
				socket.off("newSOS");
				socket.off("sosResolved");
			}
		};
	}, [socket]);

	const startLocationTracking = (sosId) => {

		if (locationIntervalRefs.current[sosId]) {
			clearInterval(locationIntervalRefs.current[sosId]);
		}


		const sendLocation = () => {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						const coordinates = {
							latitude: position.coords.latitude,
							longitude: position.coords.longitude,
						};
						updateVolunteerLocation(sosId, coordinates);
					},
					(error) => {
						console.error("Error getting location:", error);
					}
				);
			}
		};

		sendLocation();


		const intervalId = setInterval(sendLocation, 30000);
		locationIntervalRefs.current[sosId] = intervalId;
	};

	const handleAcceptSOS = async (sosId) => {
		try {
			if (!sosId || !user || !user._id) {
				toast.error("Invalid data for accepting SOS");
				return;
			}

			const res = await fetch("http://localhost:5000/api/sos/acceptSOS", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ sosId, userId: user._id }),
			});
			if (res.ok) {
				toast.success("SOS accepted successfully!");


				setNotifications((prev) =>
					prev.map((sos) =>
						sos._id === sosId
							? {
									...sos,
									acceptedBy: [...(sos.acceptedBy || []), user._id],
							  }
							: sos
					)
				);

				setAcceptedSOS((prev) => new Set([...prev, sosId]));

		
				startLocationTracking(sosId);
			} else {
				toast.error("Failed to accept SOS.");
			}
		} catch (error) {
			console.error("Error accepting SOS:", error);
			toast.error("An error occurred while accepting SOS.");
		}
	};

	const handleResolveSOS = async (sosId) => {
		try {
			const res = await fetch(
				"http://localhost:5000/api/sos/setAsResolved",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ sosId }),
				}
			);
			if (res.ok) {
				toast.success("SOS marked as resolved!");

				if (locationIntervalRefs.current[sosId]) {
					clearInterval(locationIntervalRefs.current[sosId]);
					delete locationIntervalRefs.current[sosId];
				}

				setAcceptedSOS((prev) => {
					const updated = new Set(prev);
					updated.delete(sosId);
					return updated;
				});

				setNotifications((prev) =>
					prev.filter((sos) => sos._id !== sosId)
				);
			} else {
				toast.error("Failed to resolve SOS.");
			}
		} catch (error) {
			toast.error("An error occurred while resolving SOS.");
		}
	};

	const formatTime = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};


	const getElapsedTime = (dateString) => {
		const now = new Date();
		const past = new Date(dateString);
		const diffMs = now - past;
		
		const minutes = Math.floor(diffMs / 60000);
		if (minutes < 60) return `${minutes} min ago`;
		
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} hr ago`;
		
		const days = Math.floor(hours / 24);
		return `${days} day${days > 1 ? 's' : ''} ago`;
	};

	if (loading) {
		return (
			<div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen flex justify-center items-center text-white">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-t-transparent"></div>
					<p className="mt-3 text-gray-300">Loading emergency alerts...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
			<div className="max-w-7xl mx-auto">
				<div className="relative flex items-center justify-center mb-8 py-4 border-b border-red-500/30">
					<div className={`absolute -left-2 w-4 h-4 rounded-full bg-red-600 ${pulsating ? 'animate-ping' : ''}`}></div>
					<div className={`absolute -right-2 w-4 h-4 rounded-full bg-blue-600 ${pulsating ? 'animate-ping' : ''}`}></div>
					<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300 flex items-center">
						<AlertTriangle className="h-8 w-8 mr-3 text-red-500" />
						Emergency Alert Center
					</h1>
				</div>

				{error && (
					<div className="mb-6 relative overflow-hidden">
						<div className="absolute inset-0 bg-red-900/20 blur"></div>
						<div className="relative bg-red-900/40 border border-red-500/30 rounded-xl p-4 flex items-start">
							<XCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
							<div>
								<h3 className="font-medium text-red-300">Error Loading Alerts</h3>
								<p className="text-sm text-red-200/80 mt-1">{error}</p>
								<button 
									onClick={() => window.location.reload()}
									className="mt-3 px-4 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
								>
									Retry Loading
								</button>
							</div>
						</div>
					</div>
				)}

				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-12">
						<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500 mb-4"></div>
						<p className="text-lg text-gray-300">Loading emergency alerts...</p>
						<p className="text-sm text-gray-400 mt-2">Please wait while we fetch the latest alerts</p>
					</div>
				) : (
					<>
						<div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 mb-8 border border-slate-700/50">
							<div className="flex items-center text-gray-300 mb-3">
								<Shield className="h-5 w-5 mr-2 text-blue-400" />
								<h2 className="text-lg font-medium">Volunteer Response Dashboard</h2>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="bg-slate-700/50 rounded-lg p-3 text-center">
									<p className="text-sm text-gray-400">Active Alerts</p>
									<p className="text-2xl font-bold text-white">{notifications.length}</p>
								</div>
								<div className="bg-slate-700/50 rounded-lg p-3 text-center">
									<p className="text-sm text-gray-400">Your Accepted</p>
									<p className="text-2xl font-bold text-green-400">{acceptedSOS.size}</p>
								</div>
								<div className="bg-slate-700/50 rounded-lg p-3 text-center">
									<p className="text-sm text-gray-400">Responding Volunteers</p>
									<p className="text-2xl font-bold text-blue-400">
										{notifications.reduce((sum, alert) => 
											sum + (Array.isArray(alert?.acceptedBy) ? alert.acceptedBy.length : 0), 0)}
									</p>
								</div>
								<div className="bg-slate-700/50 rounded-lg p-3 text-center">
									<p className="text-sm text-gray-400">Status</p>
									<p className="text-lg font-bold text-green-400 flex items-center justify-center">
										<span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
										Online
									</p>
								</div>
							</div>
						</div>

						{!Array.isArray(notifications) || notifications.length === 0 ? (
							<div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 text-center">
								<div className="inline-block p-4 bg-slate-700/50 rounded-full mb-4">
									<CheckCircle className="h-12 w-12 text-green-400" />
								</div>
								<h3 className="text-xl font-medium text-gray-200 mb-2">No Active Emergency Alerts</h3>
								<p className="text-gray-400 max-w-md mx-auto">
									There are currently no active SOS alerts that require your response. 
									You'll be notified immediately when a new emergency comes in.
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{notifications.map((notification) => (
									<div
										key={notification?._id || `sos-${Math.random()}`}
										className="bg-slate-800/70 backdrop-blur-sm rounded-xl overflow-hidden border-l-4 border-red-500 shadow-lg relative group"
									>
										<div className="absolute top-3 right-3 flex items-center">
											<span className="animate-ping absolute h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
											<span className="relative rounded-full h-3 w-3 bg-red-500"></span>
										</div>
										
										<div className="bg-gradient-to-r from-red-900/40 to-red-800/20 px-5 py-4 flex justify-between items-center">
											<div className="flex items-center">
												<AlertTriangle className="text-red-500 mr-2" size={20} />
												<h3 className="font-bold text-red-300">EMERGENCY ALERT</h3>
											</div>
											{notification?.createdAt && (
												<div className="text-xs text-gray-400 flex items-center">
													<Clock className="h-3 w-3 mr-1" />
													{getElapsedTime(notification.createdAt)}
												</div>
											)}
										</div>
										
										<div className="p-5 space-y-4">
				
											{notification?.user ? (
												<div className="flex items-center space-x-3 bg-slate-700/30 p-3 rounded-lg">
													<div className="bg-slate-600/50 p-2 rounded-full">
														<User className="text-blue-300" size={18} />
													</div>
													<div>
														<h4 className="text-sm text-gray-400">REQUESTER</h4>
														<p className="text-white font-medium">
															{notification.user.name || "Unknown"}
														</p>
													</div>
													{notification.user.phone && (
														<a
															href={`tel:${notification.user.phone}`}
															className="ml-auto bg-slate-700 hover:bg-slate-600 text-blue-300 p-2 rounded-md transition-colors"
														>
															<Phone size={16} />
														</a>
													)}
												</div>
											) : (
												<div className="bg-slate-700/30 p-3 rounded-lg">
													<p className="text-gray-400">User information not available</p>
												</div>
											)}

											<div className="bg-slate-700/30 p-4 rounded-lg">
												<h4 className="text-sm text-gray-400 mb-1">EMERGENCY MESSAGE</h4>
												<p className="text-white">
													{notification?.message || "No message provided"}
												</p>
											</div>

											{notification?.coordinates && (
												<div className="bg-slate-700/30 p-4 rounded-lg">
													<h4 className="text-sm text-gray-400 mb-1">LOCATION</h4>
													<div className="flex items-center">
														<MapPin className="text-red-400 mr-2" size={16} />
														<span className="text-sm text-gray-300">
															{notification.coordinates.latitude.toFixed(6)}, {notification.coordinates.longitude.toFixed(6)}
														</span>
													</div>
													<a
														href={`https://www.google.com/maps?q=${notification.coordinates.latitude},${notification.coordinates.longitude}`}
														target="_blank"
														rel="noopener noreferrer"
														className="mt-3 block w-full text-center bg-blue-600/80 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
													>
														View Location on Maps
													</a>
												</div>
											)}
											
		
											<div className="flex items-center space-x-2 bg-slate-700/20 p-2 rounded-lg">
												<Users className="text-blue-400" size={16} />
												<span className="text-gray-300 text-sm">
													<strong className="text-blue-300">
														{Array.isArray(notification?.acceptedBy) ? notification.acceptedBy.length : 0}
													</strong> responders
												</span>
											</div>
										</div>

										<div className="grid grid-cols-2 divide-x divide-slate-700/50 mt-2">
											{notification?.user && user && notification.user._id === user._id ? (
												<button
													onClick={() => handleResolveSOS(notification._id)}
													className="bg-green-600/80 hover:bg-green-600 text-white py-3 font-medium transition-colors flex items-center justify-center"
												>
													<CheckCircle className="mr-2" size={16} />
													Mark as Resolved
												</button>
											) : notification?._id && acceptedSOS.has(notification._id) ? (
												<div className="py-3 text-center bg-slate-700/50 text-green-400 font-medium flex items-center justify-center">
													<CheckCircle className="mr-2" size={16} />
													Accepted
												</div>
											) : (
												<button
													onClick={() => handleAcceptSOS(notification?._id)}
													className="bg-red-600/80 hover:bg-red-600 text-white py-3 font-medium transition-colors flex items-center justify-center"
													disabled={!notification?._id}
												>
													<Shield className="mr-2" size={16} />
													Accept & Respond
												</button>
											)}
											
											{notification?._id && (
												<button
													onClick={() => {
														console.log("Navigating to SOS details:", notification._id);
														navigate(`/sos/${notification._id}`);
													}}
													className="bg-slate-700 hover:bg-slate-600 text-white py-3 font-medium transition-colors flex items-center justify-center"
												>
													View Details
												</button>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</>
				)}

				<style jsx>{`
					@keyframes pulseSlow {
						0%, 100% { opacity: 1; }
						50% { opacity: 0.7; }
					}
					.animate-pulse-slow {
						animation: pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
					}
				`}</style>
			</div>
		</div>
	);
};

export default Alert;
