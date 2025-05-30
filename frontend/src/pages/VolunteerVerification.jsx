import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function VolunteerVerification() {
  const { token } = useAuth();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAction, setCurrentAction] = useState(null);

  useEffect(() => {
    fetchUnverifiedVolunteers();
  }, []);


  const fetchUnverifiedVolunteers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:5000/api/user-management/volunteers/unverified",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVolunteers(data);
      } else {
        toast.error("Failed to fetch unverified volunteers");
      }
    } catch (error) {
      console.error("Error fetching volunteers:", error);
      toast.error("Error fetching volunteers");
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyVolunteer = async (volunteerId) => {
    try {
      setCurrentAction(volunteerId);
      const response = await fetch(
        `http://localhost:5000/api/user-management/verify/${volunteerId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Volunteer verified successfully");

        setVolunteers(volunteers.filter((volunteer) => volunteer._id !== volunteerId));
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to verify volunteer");
      }
    } catch (error) {
      console.error("Error verifying volunteer:", error);
      toast.error("Error verifying volunteer");
    } finally {
      setCurrentAction(null);
    }
  };


  const handleRejectVolunteer = async (volunteerId) => {
    try {
      if (!confirm("Are you sure you want to reject this volunteer? This action cannot be undone.")) {
        return;
      }
      
      setCurrentAction(volunteerId);
      const response = await fetch(
        `http://localhost:5000/api/user-management/reject/${volunteerId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Volunteer rejected successfully");

        setVolunteers(volunteers.filter((volunteer) => volunteer._id !== volunteerId));
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to reject volunteer");
      }
    } catch (error) {
      console.error("Error rejecting volunteer:", error);
      toast.error("Error rejecting volunteer");
    } finally {
      setCurrentAction(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-blue-600">Volunteer Verification</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold">Pending Volunteer Registrations</h2>
          <p className="text-sm text-gray-500">
            New volunteers must be verified before they can access the system
          </p>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : volunteers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No pending volunteer registrations found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {volunteers.map((volunteer) => (
                  <tr key={volunteer._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{volunteer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{volunteer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{volunteer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{volunteer.nid}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{volunteer.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(volunteer.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleVerifyVolunteer(volunteer._id)}
                          disabled={currentAction === volunteer._id}
                          className="text-green-600 hover:text-green-900 bg-green-100 px-3 py-1 rounded-md disabled:opacity-50"
                        >
                          {currentAction === volunteer._id ? "Processing..." : "Verify"}
                        </button>
                        <button
                          onClick={() => handleRejectVolunteer(volunteer._id)}
                          disabled={currentAction === volunteer._id}
                          className="text-red-600 hover:text-red-900 bg-red-100 px-3 py-1 rounded-md disabled:opacity-50"
                        >
                          {currentAction === volunteer._id ? "Processing..." : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}