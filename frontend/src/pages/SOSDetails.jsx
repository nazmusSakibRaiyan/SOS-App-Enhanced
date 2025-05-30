import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  AlertTriangle,
  MapPin,
  User,
  MessageSquare,
  Download,
  Clock,
  Shield,
  Users,
  Send,
  ArrowLeft,
  CheckCircle,
  Loader2
} from "lucide-react";

const SOSDetails = () => {
	const { id } = useParams();
	const { token, user } = useAuth();
	const navigate = useNavigate();
	const [sosDetails, setSosDetails] = useState(null);
	const [loading, setLoading] = useState(true);
	const [pulsating, setPulsating] = useState(true);

	useEffect(() => {
		const fetchSOSDetails = async () => {
			try {
				const response = await axios.get(
					`http://localhost:5000/api/sos/${id}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				setSosDetails(response.data.sos);
			} catch (error) {
				toast.error("Failed to fetch emergency details.");
			} finally {
				setLoading(false);
			}
		};

		fetchSOSDetails();
	}, [id, token]);

	const formatTime = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleString('en-US', { 
			month: 'short',
			day: 'numeric', 
			year: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			hour12: true
		});
	};

	const getTimeSince = (dateString) => {
		const now = new Date();
		const past = new Date(dateString);
		const diffMs = now - past;
		
		const minutes = Math.floor(diffMs / 60000);
		if (minutes < 60) return `${minutes} minutes`;
		
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
		
		const days = Math.floor(hours / 24);
		return `${days} day${days > 1 ? 's' : ''}`;
	};

	const downloadCSV = () => {
		if (!sosDetails || !sosDetails.acceptedBy.length) {
			toast.error("No responder details available to download.");
			return;
		}

		const headers = ["Name", "Email", "Phone"];
		const rows = sosDetails.acceptedBy.map((responder) => [
			responder.name,
			responder.email,
			responder.phone || "N/A"
		]);

		const csvContent =
			"data:text/csv;charset=utf-8," +
			[headers, ...rows].map((e) => e.join(",")).join("\n");

		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", `emergency-responders-${id}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		
		toast.success("Responder list downloaded successfully");
	};

	if (loading) {
		return (
			<div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen flex justify-center items-center text-white">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
					<p className="text-xl text-gray-300">Loading emergency details...</p>
				</div>
			</div>
		);
	}

	if (!sosDetails) {
		return (
			<div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen flex justify-center items-center text-white">
				<div className="text-center max-w-md mx-auto bg-slate-800/80 backdrop-blur-sm p-8 rounded-xl border border-slate-700/50">
					<div className="inline-block p-3 bg-red-500/20 rounded-full mb-4">
						<AlertTriangle className="h-10 w-10 text-red-500" />
					</div>
					<h2 className="text-2xl font-bold text-red-300 mb-2">Emergency Not Found</h2>
					<p className="text-gray-300 mb-6">The emergency alert you're looking for doesn't exist or has been resolved.</p>
					<button 
						onClick={() => navigate(-1)} 
						className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg flex items-center justify-center mx-auto"
					>
						<ArrowLeft className="h-5 w-5 mr-2" />
						Go Back
					</button>
				</div>
			</div>
		);
	}

	const isResolved = sosDetails.resolved;
	const isUserResponder = sosDetails.acceptedBy && sosDetails.acceptedBy.some(responder => responder._id === user?._id);

	return (
		<div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
			<div className="max-w-5xl mx-auto">
				<div className="relative flex items-center justify-center mb-8 py-4 border-b border-red-500/30">
					<div className={`absolute -left-2 w-4 h-4 rounded-full bg-red-600 ${pulsating ? 'animate-ping' : ''}`}></div>
					<div className={`absolute -right-2 w-4 h-4 rounded-full bg-blue-600 ${pulsating ? 'animate-ping' : ''}`}></div>
					<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300 flex items-center">
						<AlertTriangle className="h-8 w-8 mr-3 text-red-500" />
						Emergency Details
					</h1>
				</div>

				<button 
					onClick={() => navigate(-1)} 
					className="mb-6 bg-slate-800/60 backdrop-blur-sm hover:bg-slate-700 text-gray-300 hover:text-white px-4 py-2 rounded-lg flex items-center transition-colors"
				>
					<ArrowLeft className="h-5 w-5 mr-2" />
					Back to alerts
				</button>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

					<div className="lg:col-span-2">

						<div className={`mb-4 inline-flex items-center text-sm px-4 py-1.5 rounded-full ${
							isResolved ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
						}`}>
							<div className={`w-2 h-2 rounded-full mr-2 ${isResolved ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`}></div>
							{isResolved ? 'Resolved' : 'Active Emergency'}
						</div>


						<div className="bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 mb-6">
							<div className="bg-gradient-to-r from-red-900/40 to-red-800/20 px-5 py-4">
								<div className="flex items-center justify-between">
									<h2 className="text-xl font-bold text-white flex items-center">
										<AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
										Emergency Alert
									</h2>
									{sosDetails.createdAt && (
										<div className="text-sm text-gray-300 flex items-center">
											<Clock className="h-4 w-4 mr-1.5" />
											{formatTime(sosDetails.createdAt)}
										</div>
									)}
								</div>
							</div>
							
							<div className="p-5">

								<div className="mb-6 bg-slate-700/30 p-4 rounded-lg border border-slate-600/30">
									<h3 className="text-sm uppercase text-gray-400 mb-1">Emergency Message</h3>
									<p className="text-lg text-white font-medium">{sosDetails.message}</p>
								</div>


								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
									<div className="flex items-center">
										<div className="bg-slate-700/50 p-2.5 rounded-full mr-3">
											<User className="h-5 w-5 text-blue-300" />
										</div>
										<div>
											<h3 className="text-sm text-gray-400">Requested By</h3>
											<p className="text-white font-medium">{sosDetails.user.name}</p>
										</div>
									</div>
									
									{sosDetails.user._id !== user?._id && (
										<button
											className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
											onClick={() => navigate(`/chats/${sosDetails.user._id}`)}
										>
											<MessageSquare className="h-5 w-5 mr-2" />
											Message Requester
										</button>
									)}
								</div>

			
								<div className="mb-6">
									<h3 className="text-sm uppercase text-gray-400 mb-3">Location</h3>
									<div className="bg-slate-700/30 rounded-lg overflow-hidden">
										
										<div className="h-48 bg-slate-700 relative">
											<div className="absolute inset-0 flex items-center justify-center">
												<div className="h-8 w-8 bg-red-500 rounded-full animate-pulse-slow border-2 border-white flex items-center justify-center">
													<AlertTriangle className="h-4 w-4 text-white" />
												</div>
											</div>
											<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent h-16"></div>
											<div className="absolute bottom-2 left-2 text-white text-sm font-medium bg-slate-800/70 px-2 py-1 rounded">
												{sosDetails.coordinates.latitude.toFixed(6)}, {sosDetails.coordinates.longitude.toFixed(6)}
											</div>
										</div>
										<div className="p-4">
											<a
												href={`https://www.google.com/maps?q=${sosDetails.coordinates.latitude},${sosDetails.coordinates.longitude}`}
												target="_blank"
												rel="noopener noreferrer"
												className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-colors text-center flex items-center justify-center"
											>
												<MapPin className="h-5 w-5 mr-2" />
												View on Google Maps
											</a>
										</div>
									</div>
								</div>

								{sosDetails.createdAt && (
									<div className="grid grid-cols-2 gap-4 mb-6">
										<div className="bg-slate-700/30 p-4 rounded-lg">
											<h3 className="text-sm uppercase text-gray-400 mb-1">Reported</h3>
											<p className="text-white">{formatTime(sosDetails.createdAt)}</p>
										</div>
										<div className="bg-slate-700/30 p-4 rounded-lg">
											<h3 className="text-sm uppercase text-gray-400 mb-1">Time Elapsed</h3>
											<p className="text-white">{getTimeSince(sosDetails.createdAt)}</p>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="lg:col-span-1">
						<div className="bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 h-full">
							<div className="bg-gradient-to-r from-blue-900/40 to-blue-800/20 px-5 py-4 flex justify-between items-center">
								<h2 className="text-xl font-bold text-white flex items-center">
									<Users className="h-5 w-5 mr-2 text-blue-400" />
									Responders
								</h2>
								<div className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-sm">
									{sosDetails.acceptedBy?.length || 0}
								</div>
							</div>
							
							<div className="p-5">
								{!sosDetails.acceptedBy?.length ? (
									<div className="text-center py-6">
										<div className="inline-block p-3 bg-slate-700/50 rounded-full mb-3">
											<Shield className="h-8 w-8 text-blue-400" />
										</div>
										<h4 className="text-lg font-medium text-gray-300 mb-2">No Responders Yet</h4>
										<p className="text-gray-400 text-sm mb-4">
											No volunteers have accepted this emergency alert yet
										</p>
										{isUserResponder ? (
											<div className="bg-blue-500/20 text-blue-300 py-2 px-3 rounded-lg inline-flex items-center">
												<CheckCircle className="h-5 w-5 mr-2" />
												You are responding
											</div>
										) : (
											<button
												onClick={() => navigate(-1)}
												className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
											>
												View All Emergencies
											</button>
										)}
									</div>
								) : (
									<div className="space-y-3">
										{sosDetails.acceptedBy?.length > 0 && (
											<button
												className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center mb-4"
												onClick={downloadCSV}
											>
												<Download className="h-5 w-5 mr-2" />
												Download Responder List
											</button>
										)}
										
										{sosDetails.acceptedBy?.map((responder) => (
											<div
												key={responder._id}
												className="bg-slate-700/50 rounded-lg p-4 transition-colors hover:bg-slate-700/80"
											>
												<div className="flex items-center justify-between mb-2">
													<div className="flex items-center">
														<div className="bg-slate-600/70 p-2 rounded-full mr-3">
															<User className="h-4 w-4 text-blue-300" />
														</div>
														<div>
															<h4 className="font-medium text-white">
																{responder.name}
															</h4>
															<p className="text-xs text-gray-400">
																{responder.email}
															</p>
														</div>
													</div>
													{responder._id === user?._id && (
														<div className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">
															You
														</div>
													)}
												</div>
												{user?._id !== responder._id && (
													<button
														className="w-full bg-blue-600/80 hover:bg-blue-600 text-white py-1.5 px-3 rounded transition-colors text-sm flex items-center justify-center"
														onClick={() => navigate(`/chats/${responder._id}`)}
													>
														<Send className="h-4 w-4 mr-1.5" />
														Send Message
													</button>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
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
	);
};

export default SOSDetails;
