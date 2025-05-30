import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

export default function UserManagement() {
	const { token, user } = useAuth();
	const [users, setUsers] = useState([]);

	const fetchUsers = async () => {
		try {
			const res = await fetch(
				"http://localhost:5000/api/user-management",
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (res.ok) {
				const data = await res.json();
				setUsers(data);
			} else {
				toast.error("Failed to fetch users.");
			}
		} catch (error) {
			toast.error("Error fetching users.");
		}
	};

	const deleteUser = async (id) => {
		if (!window.confirm("Are you sure you want to delete this user?"))
			return;

		try {
			const res = await fetch(
				`http://localhost:5000/api/user-management/${id}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (res.ok) {
				toast.success("User deleted successfully.");
				fetchUsers();
			} else {
				toast.error("Failed to delete user.");
			}
		} catch (error) {
			toast.error("Error deleting user.");
		}
	};

	const verifyVolunteer = async (id) => {
		try {
			const res = await fetch(
				`http://localhost:5000/api/user-management/verify/${id}`,
				{
					method: "PATCH",
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (res.ok) {
				toast.success("Volunteer verified successfully.");
				fetchUsers();
			} else {
				toast.error("Failed to verify volunteer.");
			}
		} catch (error) {
			toast.error("Error verifying volunteer.");
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-6 text-blue-600">
				User Management
			</h1>

			<table className="w-full border border-gray-300">
				<thead>
					<tr className="bg-gray-100">
						<th className="p-2 border">Name</th>
						<th className="p-2 border">Email</th>
						<th className="p-2 border">Role</th>
						<th className="p-2 border">Phone</th>
						<th className="p-2 border">Status</th>{" "}
						<th className="p-2 border">Actions</th>
					</tr>
				</thead>
				<tbody>
					{users.map((u) =>
						u._id === user?._id ? null : ( 
							<tr key={u._id}>
								<td className="p-2 border">{u.name}</td>
								<td className="p-2 border">{u.email}</td>
								<td className="p-2 border capitalize">
									{u.role}
								</td>
								<td className="p-2 border">{u.phone}</td>
								<td className="p-2 border">
									{u.role === "volunteer" ? (
										<span className="text-gray-600">
											{u.volunteerStatus}
										</span>
									) : (
										"N/A"
									)}
								</td>
								<td className="p-2 border flex space-x-2 items-center">
									{u.role === "volunteer" && (
										<div className="flex flex-col space-y-2">
											{u.isVerified ? (
												<span className="text-green-600 font-semibold">
													Verified
												</span>
											) : (
												<button
													onClick={() =>
														verifyVolunteer(u._id)
													}
													className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
												>
													Verify
												</button>
											)}
										</div>
									)}
									<button
										onClick={() => deleteUser(u._id)}
										className="bg-red-500 text-white px-3 py-1 rounded mt-2"
									>
										Delete
									</button>
								</td>
							</tr>
						)
					)}
				</tbody>
			</table>
		</div>
	);
}
