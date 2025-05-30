

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";

const Login = () => {
	const navigate = useNavigate();
	const { login, user } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [otp, setOtp] = useState("");
	const [otpSent, setOtpSent] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (user) {
			navigate("/dashboard");
		}
	}, [user]);

	const handleLogin = async () => {
		setLoading(true);
		try {
			const baseURI =
				process.env.NODE_ENV === "development"
					? "http://localhost:5000"
					: "";
			const res = await fetch(baseURI + "/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			if (res.ok) {
				setOtpSent(true);
				toast.success("OTP sent to your email!");
			} else {
				toast.error("Invalid login credentials.");
			}
		} catch (error) {
			toast.error("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyOTP = async () => {
		setLoading(true);
		try {
			const baseURI =
				process.env.NODE_ENV === "development"
					? "http://localhost:5000"
					: "";
			const res = await fetch(baseURI + "/api/auth/verify-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, otp }),
			});

			const data = await res.json();
			if (data.token) {
				login(data.token, data.user);
				navigate("/dashboard");
				toast.success("Login successful!");
			} else {
				toast.error("Invalid OTP. Please try again.");
			}
		} catch (error) {
			toast.error("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
			<h1 className="text-3xl font-bold text-gray-800 mb-6">
				{otpSent ? "Enter OTP" : "Login"}
			</h1>

			<div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-sm">
				{!otpSent ? (
					<>
						<input
							name="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Email Address"
							className="border p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
						<input
							type="password"
							name="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Password"
							className="border p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>						<button
							onClick={handleLogin}
							className={`w-full py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition ${
								loading ? "opacity-50 cursor-not-allowed" : ""
							}`}
							disabled={loading}
						>
							{loading ? "Sending OTP..." : "Send OTP"}
						</button>
						
						<div className="mt-4 text-center">
							<Link
								to="/forgot-password"
								className="text-blue-600 hover:text-blue-700 text-sm font-medium"
							>
								Forgot your password?
							</Link>
						</div>
					</>
				) : (
					<>
						<input
							name="otp"
							value={otp}
							onChange={(e) => setOtp(e.target.value)}
							placeholder="Enter OTP"
							className="border p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
							required
						/>
						<button
							onClick={handleVerifyOTP}
							className={`w-full py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition ${
								loading ? "opacity-50 cursor-not-allowed" : ""
							}`}
							disabled={loading}
						>
							{loading ? "Verifying OTP..." : "Verify OTP"}
						</button>
					</>
				)}
			</div>
		</div>
	);
};

export default Login;
