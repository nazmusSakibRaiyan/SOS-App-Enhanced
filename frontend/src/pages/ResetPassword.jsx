import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";

const ResetPassword = () => {
	const { token } = useParams();
	const navigate = useNavigate();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [tokenValid, setTokenValid] = useState(true);

	useEffect(() => {
		// Basic token validation (check if token exists)
		if (!token) {
			setTokenValid(false);
		}
	}, [token]);

	const handleResetPassword = async (e) => {
		e.preventDefault();
		
		if (!password || !confirmPassword) {
			toast.error("Please fill in all fields");
			return;
		}

		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		if (password.length < 6) {
			toast.error("Password must be at least 6 characters long");
			return;
		}

		setLoading(true);
		try {
			const baseURI =
				process.env.NODE_ENV === "development"
					? "http://localhost:5000"
					: "";
			
			const res = await fetch(baseURI + `/api/auth/reset-password/${token}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password, confirmPassword }),
			});

			const data = await res.json();

			if (res.ok) {
				toast.success("Password reset successful! Redirecting to login...");
				setTimeout(() => {
					navigate("/login");
				}, 2000);
			} else {
				toast.error(data.message || "Failed to reset password");
				if (data.message?.includes("invalid") || data.message?.includes("expired")) {
					setTokenValid(false);
				}
			}
		} catch (error) {
			toast.error("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (!tokenValid) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
				<div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md text-center">
					<div className="mb-6">
						<div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
							<svg 
								className="w-8 h-8 text-red-500" 
								fill="none" 
								stroke="currentColor" 
								viewBox="0 0 24 24"
							>
								<path 
									strokeLinecap="round" 
									strokeLinejoin="round" 
									strokeWidth={2} 
									d="M6 18L18 6M6 6l12 12" 
								/>
							</svg>
						</div>
						<h1 className="text-2xl font-bold text-gray-800 mb-2">
							Invalid Reset Link
						</h1>
						<p className="text-gray-600 mb-6">
							This password reset link is invalid or has expired. Please request a new one.
						</p>
					</div>
					
					<div className="space-y-4">
						<Link
							to="/forgot-password"
							className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
						>
							Request New Reset Link
						</Link>
						<Link
							to="/login"
							className="block text-gray-600 hover:text-gray-800 font-medium"
						>
							← Back to Login
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
			<h1 className="text-3xl font-bold text-gray-800 mb-6">
				Reset Password
			</h1>

			<div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md">
				<p className="text-gray-600 mb-6 text-center">
					Enter your new password below.
				</p>
				
				<form onSubmit={handleResetPassword}>
					<input
						type="password"
						name="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="New Password"
						className="border p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
						minLength={6}
					/>
					
					<input
						type="password"
						name="confirmPassword"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="Confirm New Password"
						className="border p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
						minLength={6}
					/>
					
					{password && confirmPassword && password !== confirmPassword && (
						<p className="text-red-500 text-sm mb-4">Passwords do not match</p>
					)}
					
					<button
						type="submit"
						className={`w-full py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition ${
							loading ? "opacity-50 cursor-not-allowed" : ""
						}`}
						disabled={loading || password !== confirmPassword}
					>
						{loading ? "Resetting Password..." : "Reset Password"}
					</button>
				</form>
				
				<div className="mt-6 text-center">
					<Link
						to="/login"
						className="text-gray-600 hover:text-gray-800 font-medium"
					>
						← Back to Login
					</Link>
				</div>
			</div>
		</div>
	);
};

export default ResetPassword;
