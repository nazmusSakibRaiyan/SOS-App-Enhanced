import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Status() {
	const { user, token } = useAuth();
	const [status, setStatus] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchStatus = async () => {
			try {
				const res = await fetch("http://localhost:5000/api/auth/user", {
					method: "GET",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				if (res.ok) {
					const data = await res.json();
					setStatus(data.user.volunteerStatus);
				} else {
					toast.error("Failed to fetch current status.");
				}
			} catch (error) {
				toast.error("An error occurred while fetching status.");
			}
		};
		fetchStatus();
	}, [token]);

	const updateStatus = async () => {
		try {
			setLoading(true);
			const res = await fetch(
				"http://localhost:5000/api/user/updateVolunteerStatus",
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ userId: user._id, status }),
				}
			);

			if (res.ok) {
				toast.success("Status updated successfully!");
			} else {
				toast.error("Failed to update status.");
			}
		} catch (error) {
			toast.error("An error occurred while updating status.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-6 max-w-md mx-auto bg-white rounded shadow-md">
			<h1 className="text-2xl font-bold mb-4 text-blue-600">
				Update Status
			</h1>
			<div className="mb-4">
				<label className="block text-gray-700 font-medium mb-2">
					Current Status
				</label>
				<select
					value={status}
					onChange={(e) => setStatus(e.target.value)}
					className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
				</select>
			</div>
			<button
				onClick={updateStatus}
				disabled={loading}
				className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
			>
				{loading ? "Updating..." : "Update Status"}
			</button>
		</div>
	);
}
