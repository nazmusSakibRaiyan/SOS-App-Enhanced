import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

export default function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [blacklistedUsers, setBlacklistedUsers] = useState([]);


  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/user-management", {
        headers: { Authorization: `Bearer ${token}` },
      });

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

  const fetchBlacklistedUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/blacklist-users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setBlacklistedUsers(data);
      } else {
        toast.error("Failed to fetch blacklisted users.");
      }
    } catch (error) {
      toast.error("Error fetching blacklisted users.");
    }
  };

  // Blacklist a user
  const blacklistUser = async (id) => {
    if (!window.confirm("Are you sure you want to blacklist this user?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/blacklist-users/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const responseData = await res.json();
        toast.success("User blacklisted successfully.");
        
        const blacklistedUser = users.find(user => user._id === id);
        
        if (blacklistedUser) {
          setUsers(users.filter(user => user._id !== id));
          const updatedUser = { ...blacklistedUser, blacklisted: true };
          setBlacklistedUsers([...blacklistedUsers, updatedUser]);
        } else {
          fetchUsers();
          fetchBlacklistedUsers();
        }
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to blacklist user.");
      }
    } catch (error) {
      toast.error("Error blacklisting user.");
    }
  };

  const removeFromBlacklist = async (id) => {
    if (!window.confirm("Are you sure you want to remove this user from blacklist?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/blacklist-users/remove/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("User removed from blacklist successfully.");
        
        const unblacklistedUser = blacklistedUsers.find(user => user._id === id);
        
        if (unblacklistedUser) {
          setBlacklistedUsers(blacklistedUsers.filter(user => user._id !== id));
          
          const updatedUser = { ...unblacklistedUser, blacklisted: false };
          setUsers([...users, updatedUser]);
        } else {
          fetchUsers();
          fetchBlacklistedUsers();
        }
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to remove user from blacklist.");
      }
    } catch (error) {
      toast.error("Error removing user from blacklist.");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBlacklistedUsers();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-blue-600">User Management</h1>


      <h2 className="text-xl font-semibold mb-4 text-green-600">Active Users</h2>
      <table className="w-full border border-gray-300 mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Role</th>
            <th className="p-2 border">Phone</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((u) => (
              <tr key={u._id}>
                <td className="p-2 border">{u.name}</td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border capitalize">{u.role}</td>
                <td className="p-2 border">{u.phone}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => blacklistUser(u._id)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                  >
                    Blacklist
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-2 border text-center">
                No active users.
              </td>
            </tr>
          )}
        </tbody>
      </table>


      <h2 className="text-xl font-semibold mb-4 text-red-600">Blacklisted Users</h2>
      <table className="w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Role</th>
            <th className="p-2 border">Phone</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {blacklistedUsers.length > 0 ? (
            blacklistedUsers.map((u) => (
              <tr key={u._id}>
                <td className="p-2 border">{u.name}</td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border capitalize">{u.role}</td>
                <td className="p-2 border">{u.phone}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => removeFromBlacklist(u._id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-2 border text-center">
                No blacklisted users.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
