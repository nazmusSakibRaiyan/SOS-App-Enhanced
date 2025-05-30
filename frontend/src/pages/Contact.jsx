import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Contact() {
	const { user, token } = useAuth();
	const [contacts, setContacts] = useState([]);
	const [allUsers, setAllUsers] = useState([]);
	const [newContact, setNewContact] = useState({ name: "", email: "" });

	useEffect(() => {
		fetchContacts();
		fetchAllUsers();
	}, []);

	const fetchContacts = async () => {
		try {
			const res = await fetch(
				"http://localhost:5000/api/contact/getAllContacts",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ myId: user._id }),
				}
			);

			if (res.ok) {
				const data = await res.json();
				setContacts(data);
			} else {
				toast.error("Failed to fetch contacts.");
			}
		} catch (error) {
			console.error(error);
			toast.error("An error occurred while fetching contacts.");
		}
	};

	const fetchAllUsers = async () => {
		try {
			const res = await fetch(
				"http://localhost:5000/api/user/getAllUser",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ myId: user._id }),
				}
			);

			if (res.ok) {
				const data = await res.json();
				const filteredUsers = data.filter(
					(user) =>
						!contacts.some(
							(contact) => contact.email === user.email
						)
				);
				setAllUsers(filteredUsers);
			} else {
				toast.error("Failed to fetch users.");
			}
		} catch (error) {
			console.error(error);
			toast.error("An error occurred while fetching users.");
		}
	};

	const addContact = async (friendId, friendName, friendEmail) => {
		try {
			let friend_mail = null;
			let friend_name = null;
			if (friendId) {
				const tempUser = allUsers.find((user) => user._id === friendId);
				if (!tempUser) {
					toast.error("User not found.");
					return;
				}
				friend_mail = tempUser.email;
				friend_name = tempUser.name;
			} else {
				friend_mail = friendEmail;
				friend_name = friendName;
			}
			const body = {
				myId: user._id,
				friendName: friend_name,
				friendEmail: friend_mail,
			};

			const res = await fetch(
				"http://localhost:5000/api/contact/addContact",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(body),
				}
			);

			if (res.ok) {
				toast.success("Contact added successfully.");
				await fetchContacts();
				await fetchAllUsers();
			} else {
				toast.error("Failed to add contact.");
			}
		} catch (error) {
			console.error(error);
			toast.error("An error occurred while adding the contact.");
		}
	};

	const deleteContact = async (friendEmail) => {
		try {
			const tempUser = contacts.find(
				(contact) => contact.user_email === friendEmail
			);
			if (!tempUser) {
				toast.error("Contact not found.");
				return;
			}
			const res = await fetch(
				"http://localhost:5000/api/contact/deleteContact",
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ myId: user._id, friendEmail }),
				}
			);

			if (res.ok) {
				toast.success("Contact deleted successfully.");
				setContacts((prevContacts) =>
					prevContacts.filter(
						(contact) => contact.user_email !== friendEmail
					)
				);
				await fetchAllUsers();
			} else {
				toast.error("Failed to delete contact.");
			}
		} catch (error) {
			console.error(error);
			toast.error("An error occurred while deleting the contact.");
		}
	};

	const addUnregisteredContact = async () => {
		if (!newContact.name || !newContact.email) {
			toast.error("Name and email are required.");
			return;
		}

		try {
			await addContact(null, newContact.name, newContact.email);
			setNewContact({ name: "", email: "" });
		} catch (error) {
			console.error(error);
			toast.error("An error occurred while adding the contact.");
		}
	};

	return (
		<div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
			<h1 className="text-4xl font-bold mb-6 text-blue-600">
				Emergency Contact Management
			</h1>

			<div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-2xl font-semibold mb-4 text-gray-700">
						My Contacts
					</h2>
					<ul className="space-y-4 overflow-y-auto max-h-96">
						{contacts.map((contact, index) => (
							<li
								key={index}
								className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm"
							>
								<span className="text-gray-800 font-medium">
									{contact.user_name} ({contact.user_email})
								</span>
								<button
									onClick={() =>
										deleteContact(contact.user_email)
									}
									className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
								>
									Delete
								</button>
							</li>
						))}
					</ul>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-2xl font-semibold mb-4 text-gray-700">
						Add New Contact
					</h2>
					<ul className="space-y-4 overflow-y-auto max-h-96">
						{allUsers.map((user) => (
							<li
								key={user._id}
								className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm"
							>
								<span className="text-gray-800 font-medium">
									{user.name} ({user.email})
								</span>
								<button
									onClick={() => addContact(user._id)}
									className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
								>
									Add
								</button>
							</li>
						))}
					</ul>
					<div className="mt-6">
						<h3 className="text-xl font-semibold mb-2 text-gray-700">
							Add Unregistered Contact
						</h3>
						<input
							type="text"
							placeholder="Name"
							value={newContact.name}
							onChange={(e) =>
								setNewContact({
									...newContact,
									name: e.target.value,
								})
							}
							className="w-full p-2 border rounded mb-2"
						/>
						<input
							type="email"
							placeholder="Email"
							value={newContact.email}
							onChange={(e) =>
								setNewContact({
									...newContact,
									email: e.target.value,
								})
							}
							className="w-full p-2 border rounded mb-2"
						/>
						<button
							onClick={addUnregisteredContact}
							className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
						>
							Add Contact
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
