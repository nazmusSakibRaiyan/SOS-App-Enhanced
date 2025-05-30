import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { MapPin, User, Phone, Clock, CheckCircle, XCircle } from "lucide-react";

export default function ActiveSOS() {
  const { token } = useAuth();
  const [activeCases, setActiveCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const fetchActiveCases = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/sos/monitor-active",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setActiveCases(data);
      } else {
        toast.error("Failed to fetch active SOS cases");
      }
    } catch (error) {
      console.error("Error fetching active SOS cases:", error);
      toast.error("Error fetching active SOS cases");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchActiveCases();
    

    const interval = setInterval(() => {
      fetchActiveCases();
    }, 30000);
    
    setRefreshInterval(interval);
    

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);


  const handleRefresh = () => {
    toast.success("Refreshing active cases...");
    fetchActiveCases();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeElapsed = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    
    if (diffHrs > 0) {
      return `${diffHrs} hr ${diffMins % 60} min ago`;
    } else {
      return `${diffMins} min ago`;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">Active SOS Monitoring</h1>
        <button 
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
          Refresh
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-3 text-gray-600">Loading active SOS cases...</p>
        </div>
      ) : activeCases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mx-auto mb-4"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Active SOS Cases</h2>
          <p className="text-gray-500">There are currently no active SOS cases to monitor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeCases.map((sos) => (
            <div key={sos._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                  <h3 className="font-semibold text-red-700">LIVE SOS Alert</h3>
                </div>
                <span className="text-sm text-gray-500">{getTimeElapsed(sos.createdAt)}</span>
              </div>
              
              <div className="p-5">
                <div className="flex items-start mb-4">
                  <User className="mr-3 text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="font-medium">{sos.user?.name || "Unknown User"}</p>
                    <p className="text-sm text-gray-500">{sos.user?.email || "No email"}</p>
                  </div>
                </div>
                
                <div className="flex items-center mb-4">
                  <Phone className="mr-3 text-gray-400" size={18} />
                  <p>{sos.user?.phone || "No phone number"}</p>
                </div>
                
                <div className="flex items-start mb-4">
                  <MapPin className="mr-3 text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-gray-500">
                      {sos.coordinates ? 
                        `${sos.coordinates.latitude}, ${sos.coordinates.longitude}` : 
                        "No location data"
                      }
                    </p>
                    <a 
                      href={`https://www.google.com/maps?q=${sos.coordinates?.latitude},${sos.coordinates?.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start mb-4">
                  <Clock className="mr-3 text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="font-medium">Timestamp</p>
                    <p className="text-sm text-gray-500">{formatTime(sos.createdAt)}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="font-medium mb-1">Message</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{sos.message || "No message provided"}</p>
                </div>

                <div>
                  <p className="font-medium mb-2">Responders ({sos.acceptedBy?.length || 0})</p>
                  {sos.acceptedBy && sos.acceptedBy.length > 0 ? (
                    <div className="space-y-2">
                      {sos.acceptedBy.map((responder, index) => (
                        <div key={index} className="flex items-center p-2 bg-green-50 rounded-md">
                          <CheckCircle className="mr-2 text-green-500" size={16} />
                          <span>{responder.name || "Volunteer"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center p-2 bg-yellow-50 rounded-md">
                      <XCircle className="mr-2 text-yellow-500" size={16} />
                      <span>No volunteers have responded yet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}