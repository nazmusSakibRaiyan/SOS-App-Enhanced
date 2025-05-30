import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SOS() {
	const navigate = useNavigate();
	const { user, token } = useAuth();
	const { respondingVolunteers, socket } = useSocket();
	const [coordinates, setCoordinates] = useState(null);
	const [locationName, setLocationName] = useState("Fetching location...");
	const [message, setMessage] = useState("");
	const [receiver, setReceiver] = useState("volunteer");
	const [loading, setLoading] = useState(false);
	const [mySOS, setMySOS] = useState([]);
	const [nonResolvedSOS, setNonResolvedSOS] = useState([]);
	const [sosReadReceipts, setSosReadReceipts] = useState({});
	const [pulsating, setPulsating] = useState(true);

	useEffect(() => {
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;
				setCoordinates({ latitude, longitude });

				try {
					const res = await fetch(
						`https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`
					);
					const data = await res.json();
					setLocationName(data.display_name || "Unknown Location");
				} catch (error) {
					setLocationName("Failed to fetch location name");
				}
			},
			(error) => {
				toast.error("Failed to fetch location");
				setLocationName("Location access denied");
			}
		);

		fetchMySOS();

		fetchNonResolvedSOS();
	}, []);

	useEffect(() => {
		if (!socket) return;

		const handleSOSReadReceipt = (data) => {
			const { sosId, volunteer, readAt } = data;

			setSosReadReceipts((prev) => ({
				...prev,
				[sosId]: [
					...(prev[sosId] || []),
					{
						volunteerId: volunteer.id,
						volunteerName: volunteer.name,
						readAt,
					},
				],
			}));
		};

		socket.on("sosReadReceipt", handleSOSReadReceipt);

		return () => {
			socket.off("sosReadReceipt", handleSOSReadReceipt);
		};
	}, [socket]);

	const fetchMySOS = async () => {
		try {
			setLoading(true);
			const res = await fetch("http://localhost:5000/api/sos/mySOS", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ myId: user._id }),
			});
			const data = await res.json();
			setMySOS(data);

			for (const sos of data) {
				if (!sos.isResolved) {
					fetchSOSDetails(sos._id);
				}
			}
		} catch (error) {
			toast.error("Failed to fetch your SOS");
		} finally {
			setLoading(false);
		}
	};

	const fetchSOSDetails = async (sosId) => {
		try {
			const response = await axios.get(
				`http://localhost:5000/api/sos/${sosId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data.readReceipts) {
				setSosReadReceipts((prev) => ({
					...prev,
					[sosId]: response.data.readReceipts,
				}));
			}
		} catch (error) {
			console.error("Error fetching SOS details:", error);
		}
	};

	const fetchNonResolvedSOS = async () => {
		try {
			setLoading(true);
			const res = await fetch("http://localhost:5000/api/sos", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const data = await res.json();
			setNonResolvedSOS(data);
		} catch (error) {
			toast.error("Failed to fetch non-resolved SOS");
		} finally {
			setLoading(false);
		}
	};

	const sendSOS = async () => {
		if (!coordinates) {
			toast.error("Location not available");
			return;
		}

		try {
			setLoading(true);
			const endpoint =
				receiver === "silent"
					? "http://localhost:5000/api/sos/sendSilentSOS"
					: "http://localhost:5000/api/sos/sendSoftSOS";
			const res = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					userId: user._id,
					message,
					coordinates,
					receiver: receiver !== "silent" ? receiver : undefined,
				}),
			});
			if (res.ok) {
				toast.success("SOS sent successfully");
				fetchMySOS();
			} else {
				toast.error("Failed to send SOS");
			}
		} catch (error) {
			toast.error("An error occurred while sending SOS");
		} finally {
			setLoading(false);
		}
	};

	const resolveSOS = async (sosId) => {
		try {
			setLoading(true);
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
				toast.success("SOS marked as resolved");
				fetchMySOS();
				fetchNonResolvedSOS();
			} else {
				toast.error("Failed to resolve SOS");
			}
		} catch (error) {
			toast.error("An error occurred while resolving SOS");
		} finally {
			setLoading(false);
		}
	};

	const hasResponders = (sosId) => {
		return (
			respondingVolunteers[sosId] &&
			Object.keys(respondingVolunteers[sosId]).length > 0
		);
	};

	const formatDate = (date) => {
		return new Date(date).toLocaleString();
	};

	return (
		<div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
			<div className="max-w-4xl mx-auto">
				<div className="relative flex items-center justify-center mb-6 py-4 border-b border-red-500/30">
					<div className={`absolute -left-2 w-4 h-4 rounded-full bg-red-600 ${pulsating ? 'animate-ping' : ''}`}></div>
					<div className={`absolute -right-2 w-4 h-4 rounded-full bg-blue-600 ${pulsating ? 'animate-ping' : ''}`}></div>
					<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300">
						Emergency SOS Center
					</h1>
				</div>

				<div className="mb-8 bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-lg relative overflow-hidden">
					<div className="absolute right-0 top-0 w-20 h-20 bg-red-500/10 rounded-bl-full"></div>
					<h2 className="text-xl font-bold text-red-400 flex items-center mb-3">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						YOUR CURRENT LOCATION
					</h2>
					<div className="bg-slate-900/60 rounded-lg p-4 backdrop-blur-sm">
						<p className="text-gray-300 mb-2 truncate">{locationName}</p>
						{coordinates && (
							<div className="flex space-x-3">
								<span className="text-sm text-gray-400">
									{coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
								</span>
								<a
									href={`https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-400 hover:text-blue-300 flex items-center text-sm"
								>
									<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
									</svg>
									View in Maps
								</a>
							</div>
						)}
					</div>
				</div>

				<div className="mb-8 relative">
					<div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-amber-500 rounded-xl blur-md opacity-50"></div>
					<div className="relative bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-700/50">
						<h2 className="text-2xl font-bold mb-4 text-red-400 flex items-center">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
							SEND EMERGENCY ALERT
						</h2>
						<div className="space-y-4">
							<textarea
								className="w-full p-4 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
								placeholder="Describe your emergency situation..."
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								rows="3"
							></textarea>

							<div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Send Alert To:
								</label>
								<div className="flex flex-wrap gap-3">
									{['volunteer', 'contact', 'silent'].map((option) => (
										<label 
											key={option} 
											className={`flex-1 flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all ${
												receiver === option 
													? 'bg-red-600 text-white ring-2 ring-red-400' 
													: 'bg-slate-700 text-gray-300 hover:bg-slate-600'
											}`}
										>
											<input 
												type="radio" 
												name="receiver" 
												value={option} 
												checked={receiver === option} 
												onChange={() => setReceiver(option)} 
												className="sr-only" 
											/>
											<span className="capitalize">
												{option === 'volunteer' ? 'Volunteers' : 
												 option === 'contact' ? 'Emergency Contacts' : 
												 'Silent Alert'}
											</span>
										</label>
									))}
								</div>
							</div>

							<button
								className={`w-full py-4 px-6 rounded-lg font-bold text-xl relative overflow-hidden transition-all
									${loading ? 'bg-gray-600 cursor-wait' : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 shadow-lg hover:shadow-red-500/30'}
								`}
								onClick={sendSOS}
								disabled={loading}
							>
								<span className="relative z-10 flex items-center justify-center">
									{loading ? (
										<>
											<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Sending Alert...
										</>
									) : (
										<>
											SEND EMERGENCY ALERT
											<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
												<path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
											</svg>
										</>
									)}
								</span>
							</button>
						</div>
					</div>
				</div>

				<div className="mb-8">
					<h2 className="text-2xl font-bold mb-6 text-gray-100 flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
						</svg>
						YOUR SOS HISTORY
					</h2>

					{loading ? (
						<div className="flex justify-center items-center p-10">
							<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
						</div>
					) : mySOS.length === 0 ? (
						<div className="bg-slate-800/60 rounded-xl p-6 text-center">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
							</svg>
							<p className="text-gray-400">You haven't sent any SOS alerts yet</p>
						</div>
					) : (
						<div className="space-y-6">
							{mySOS.map((sos) => (
								<div 
									key={sos._id} 
									className={`bg-slate-800/80 backdrop-blur-sm rounded-xl overflow-hidden border ${
										sos.isResolved 
											? 'border-green-500/30' 
											: 'border-red-500/30 animate-pulse-slow'
									}`}
								>
									<div className={`p-4 ${sos.isResolved ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
										<div className="flex justify-between items-center">
											<div className="flex items-center">
												{sos.isResolved ? (
													<div className="bg-green-500/20 p-2 rounded-full mr-3">
														<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
															<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
														</svg>
													</div>
												) : (
													<div className="bg-red-500/20 p-2 rounded-full mr-3">
														<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
															<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
														</svg>
													</div>
												)}
												<span className={`font-semibold ${sos.isResolved ? 'text-green-400' : 'text-red-400'}`}>
													{sos.isResolved ? 'RESOLVED' : 'ACTIVE EMERGENCY'}
												</span>
											</div>
											<span className="text-xs text-gray-400">
												{formatDate(sos.createdAt)}
											</span>
										</div>
									</div>

									<div className="p-5 space-y-4">
										<div className="bg-slate-700/40 p-4 rounded-lg">
											<h4 className="text-sm text-gray-400 mb-1">MESSAGE</h4>
											<p className="text-white">{sos.message || "No message provided"}</p>
										</div>

										<div>
											<h4 className="text-sm text-gray-400 mb-1">LOCATION</h4>
											<div className="flex items-center bg-slate-700/40 p-3 rounded-lg">
												<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
												</svg>
												<span className="text-sm text-gray-300">{sos.coordinates.latitude}, {sos.coordinates.longitude}</span>
												<a
													href={`https://www.google.com/maps?q=${sos.coordinates.latitude},${sos.coordinates.longitude}`}
													target="_blank"
													rel="noopener noreferrer"
													className="ml-auto text-blue-400 hover:text-blue-300 text-sm"
												>
													View in Maps
												</a>
											</div>
										</div>

										<div className="flex space-x-3 pt-2">
											{!sos.isResolved && (
												<button
													className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
													onClick={() => resolveSOS(sos._id)}
												>
													<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
														<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
													</svg>
													Mark as Resolved
												</button>
											)}
											
											{!sos.isResolved && (
												<button
													className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
													onClick={() => navigate(`/sos/${sos._id}`)}
												>
													<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
														<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
														<path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
													</svg>
													View Details
												</button>
											)}
										</div>

										{sosReadReceipts[sos._id] && sosReadReceipts[sos._id].length > 0 && (
											<div className="mt-4 bg-slate-700/30 rounded-lg p-4">
												<h4 className="flex items-center text-sm text-blue-300 mb-3">
													<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
														<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
													</svg>
													SEEN BY VOLUNTEERS
												</h4>
												<div className="space-y-2 max-h-40 overflow-y-auto">
													{sosReadReceipts[sos._id].map((receipt, index) => (
														<div
															key={`${receipt.volunteerId}-${index}`}
															className="flex justify-between items-center text-sm bg-slate-800/50 p-2 rounded"
														>
															<span className="font-medium text-gray-300">{receipt.volunteerName}</span>
															<span className="text-xs text-gray-400">{formatDate(receipt.readAt)}</span>
														</div>
													))}
												</div>
											</div>
										)}

										{!sos.isResolved && hasResponders(sos._id) && (
											<div className="mt-4 bg-slate-700/30 rounded-lg p-4">
												<h4 className="flex items-center text-sm text-green-300 mb-3">
													<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
														<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
													</svg>
													RESPONDING VOLUNTEERS
												</h4>
												<div className="space-y-3 max-h-60 overflow-y-auto">
													{Object.entries(respondingVolunteers[sos._id]).map(([volunteerId, volunteer]) => (
														<div
															key={volunteerId}
															className="bg-slate-800/50 rounded-lg p-3"
														>
															<div className="flex justify-between items-center mb-2">
																<span className="font-medium text-white">{volunteer.name}</span>
																<span className="text-xs text-gray-400">Updated: {new Date(volunteer.lastUpdated).toLocaleTimeString()}</span>
															</div>
															<div className="flex items-center text-sm text-gray-400">
																<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
																</svg>
																({volunteer.coordinates.latitude.toFixed(6)}, {volunteer.coordinates.longitude.toFixed(6)})
																
																<a
																	href={`https://www.google.com/maps?q=${volunteer.coordinates.latitude},${volunteer.coordinates.longitude}`}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="ml-auto text-blue-400 hover:text-blue-300 text-xs"
																>
																	View location
																</a>
															</div>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>

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
}
