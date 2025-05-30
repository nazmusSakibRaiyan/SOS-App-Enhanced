
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Broadcast() {
  const { user, token } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [broadcasts, setBroadcasts] = useState([]);

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/broadcast", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBroadcasts(data);
    } catch (error) {
      toast.error("Failed to fetch broadcasts.");
    }
  };
  

  const handleBroadcast = async () => {
    if (!title || !message) return toast.error("Title and message are required");

    try {
      const res = await fetch("http://localhost:5000/api/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, 
        },
        body: JSON.stringify({ title, message }),
      });

      if (res.ok) {
        setTitle("");
        setMessage("");
        fetchBroadcasts();
        toast.success("Broadcast sent successfully!");
      } else {
        toast.error("Failed to send broadcast.");
      }
    } catch (error) {
      toast.error("Error sending broadcast.");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-blue-600">Emergency Broadcast</h1>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded mb-3"
      />
      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-2 border rounded mb-3"
      ></textarea>
      <button
        onClick={handleBroadcast}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Broadcast
      </button>

      <h2 className="text-xl font-semibold mt-8 mb-4">All Broadcasts</h2>
      <ul className="space-y-2">
        {broadcasts.map((b) => (
          <li key={b._id} className="bg-gray-100 p-3 rounded">
            <strong>{b.title}</strong>
            <p>{b.message}</p>
            <small className="text-gray-500">
              {new Date(b.createdAt).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}
