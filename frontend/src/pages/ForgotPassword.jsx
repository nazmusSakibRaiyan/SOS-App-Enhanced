import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

const ForgotPassword = () => {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [emailSent, setEmailSent] = useState(false);

	const handleForgotPassword = async (e) => {
		e.preventDefault();
		
		if (!email) {
			toast.error("Please enter your email address");
			return;
		}

		setLoading(true);
		try {
			const baseURI =
				process.env.NODE_ENV === "development"
					? "http://localhost:5000"
					: "";
			
			const res = await fetch(baseURI + "/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await res.json();

			if (res.ok) {
				setEmailSent(true);
				toast.success("Password reset link sent to your email!");
			} else {
				toast.error(data.message || "Failed to send reset email");
			}
		} catch (error) {
			toast.error("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (emailSent) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
				<div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md text-center">
					<div className="mb-6">
						<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
							<svg 
								className="w-8 h-8 text-green-500" 
								fill="none" 
								stroke="currentColor" 
								viewBox="0 0 24 24"
							>
								<path 
									strokeLinecap="round" 
									strokeLinejoin="round" 
									strokeWidth={2} 
									d="M5 13l4 4L19 7" 
								/>
							</svg>
						</div>
						<h1 className="text-2xl font-bold text-gray-800 mb-2">
							Check Your Email
						</h1>
						<p className="text-gray-600">
							We've sent a password reset link to <strong>{email}</strong>
						</p>
					</div>
					
					<div className="space-y-4">
						<p className="text-sm text-gray-500">
							Didn't receive the email? Check your spam folder or try again.
						</p>
						<button
							onClick={() => {
								setEmailSent(false);
								setEmail("");
							}}
							className="text-blue-600 hover:text-blue-700 font-medium"
						>
							Try with a different email
						</button>
						<div className="pt-4 border-t">
							<Link
								to="/login"
								className="text-gray-600 hover:text-gray-800 font-medium"
							>
								← Back to Login
							</Link>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
			<h1 className="text-3xl font-bold text-gray-800 mb-6">
				Forgot Password
			</h1>

			<div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md">
				<p className="text-gray-600 mb-6 text-center">
					Enter your email address and we'll send you a link to reset your password.
				</p>
				
				<form onSubmit={handleForgotPassword}>
					<input
						type="email"
						name="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Enter your email address"
						className="border p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
					
					<button
						type="submit"
						className={`w-full py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition ${
							loading ? "opacity-50 cursor-not-allowed" : ""
						}`}
						disabled={loading}
					>
						{loading ? "Sending Reset Link..." : "Send Reset Link"}
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

export default ForgotPassword;
