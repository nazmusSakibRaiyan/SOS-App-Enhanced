import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  User,
  AlertTriangle,
  X as CloseIcon,
  Navigation as NavigationIcon,
  Clock as ClockIcon,
  MessageSquare,
  Shield,
  Users,
  RefreshCw,
  Maximize,
  Target
} from "lucide-react";

const NearbySOSMap = () => {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [sosAlerts, setSOSAlerts] = useState([]);
  const [selectedSOS, setSelectedSOS] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [pulsating, setPulsating] = useState(true);
  
  const [mapReady, setMapReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Could not access your location. Please enable location services.");
      }
    );
  }, []);

  useEffect(() => {
    if (!token || !user || user.role !== "volunteer") {
      toast.error("You need to be logged in as a volunteer to access this page.");
      navigate("/");
      return;
    }

    const fetchActiveSOSAlerts = async () => {
      try {
        setLoading(true);
        
        const response = await fetch("http://localhost:5000/api/sos/active", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch active SOS alerts");
        }

        const data = await response.json();
        setSOSAlerts(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching SOS alerts:", error);
        toast.error("Failed to load SOS alerts");
        setLoading(false);
      }
    };

    fetchActiveSOSAlerts();

  
    if (socket) {
      socket.on("newSOS", (data) => {
        toast.error("🚨 NEW EMERGENCY ALERT!", {
          duration: 6000,
        });
        setSOSAlerts((prevAlerts) => [data, ...prevAlerts]);
      });

      socket.on("sosResolved", ({ sosId }) => {
        toast.success("Emergency alert has been resolved");
        setSOSAlerts((prevAlerts) => 
          prevAlerts.filter((alert) => alert._id !== sosId)
        );
        
        if (selectedSOS && selectedSOS._id === sosId) {
          setSelectedSOS(null);
          setDrawerOpen(false);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("newSOS");
        socket.off("sosResolved");
      }
    };
  }, [token, user, socket, navigate, selectedSOS]);

  useEffect(() => {
    if (userLocation && !mapInitialized) {
      setTimeout(() => {
        setMapReady(true);
        setMapInitialized(true);
        setLoading(false);
      }, 1500);
    }
  }, [userLocation, mapInitialized]);

  const handleSOSClick = (sos) => {
    setSelectedSOS(sos);
    setDrawerOpen(true);
  };

  const handleAcceptSOS = async () => {
    if (!selectedSOS) return;

    try {
      const response = await fetch("http://localhost:5000/api/sos/acceptSOS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sosId: selectedSOS._id, userId: user._id })
      });

      if (!response.ok) {
        throw new Error("Failed to accept SOS");
      }

      toast.success("You have accepted this emergency alert");
      
      navigate(`/sos/${selectedSOS._id}`);
    } catch (error) {
      console.error("Error accepting SOS:", error);
      toast.error("Failed to accept emergency alert");
    }
  };

  const refreshAlerts = async () => {
    try {
      setRefreshing(true);
      
      const response = await fetch("http://localhost:5000/api/sos/active", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to refresh alerts");
      }

      const data = await response.json();
      setSOSAlerts(data);
      toast.success("Alerts refreshed");
    } catch (error) {
      console.error("Error refreshing alerts:", error);
      toast.error("Failed to refresh alerts");
    } finally {
      setRefreshing(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1); 
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getElapsedTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const renderMockMap = () => {
    if (!userLocation) return null;
    
    return (
      <div className="relative h-[500px] bg-slate-800 rounded-xl overflow-hidden border border-slate-700">

        <div className="absolute top-4 left-4 z-30 flex space-x-2">
          <button className="bg-slate-800/90 hover:bg-slate-700 text-white px-3 py-2 rounded-lg flex items-center text-sm">
            <Target className="h-4 w-4 mr-1" />
            <span>Center Map</span>
          </button>
          <button 
            onClick={refreshAlerts}
            disabled={refreshing}
            className="bg-blue-600/90 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center text-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="absolute top-4 right-4 z-30">
          <button className="bg-slate-800/90 hover:bg-slate-700 text-white p-2 rounded-lg">
            <Maximize className="h-4 w-4" />
          </button>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 to-slate-900/0 pointer-events-none"></div>
        
        <div className="h-full w-full bg-[#0e2e3a]">

          <div className="w-full h-full opacity-10" 
            style={{
              backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          ></div>

          <div className="absolute inset-0 flex items-center justify-center">

            <div className="absolute z-20" 
              style={{top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}>
              <div className="h-5 w-5 bg-blue-500 rounded-full border-2 border-white">
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-30"></div>
              </div>
              <div className="mt-1 px-2 py-1 bg-slate-800/80 text-white text-xs rounded-md text-center">
                You
              </div>
            </div>


            {sosAlerts.map((sos, index) => {
              const distance = userLocation && sos.coordinates ? 
                calculateDistance(
                  userLocation.latitude, 
                  userLocation.longitude, 
                  sos.coordinates.latitude, 
                  sos.coordinates.longitude
                ) : null;
                
              const angle = (index * (360 / sosAlerts.length)) * (Math.PI / 180);
              const scaledDistance = distance ? Math.min(distance * 5, 120) : 50 + (index * 20);
              const top = 50 + Math.sin(angle) * scaledDistance;
              const left = 50 + Math.cos(angle) * scaledDistance;

              return (
                <div 
                  key={sos._id || index} 
                  className="absolute z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                  style={{top: `${top}%`, left: `${left}%`}}
                  onClick={() => handleSOSClick(sos)}
                >
                  <div className="relative">
                    <div className="h-6 w-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                      <AlertTriangle className="h-3 w-3 text-white" />
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-30"></div>
                    </div>
                    <div className="mt-1 px-2 py-1 bg-red-500/90 text-white text-xs rounded-md whitespace-nowrap">
                      {distance ? `${distance} km` : 'Unknown'} 
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen flex justify-center items-center text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-t-transparent"></div>
          <p className="mt-3 text-gray-300">Loading emergency map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <div className="relative flex items-center justify-center mb-8 py-4 border-b border-red-500/30">
          <div className={`absolute -left-2 w-4 h-4 rounded-full bg-red-600 ${pulsating ? 'animate-ping' : ''}`}></div>
          <div className={`absolute -right-2 w-4 h-4 rounded-full bg-blue-600 ${pulsating ? 'animate-ping' : ''}`}></div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300 flex items-center">
            <MapPin className="h-8 w-8 mr-3 text-red-500" />
            Emergency Response Map
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

          <div className="md:col-span-2 lg:col-span-3">
            {renderMockMap()}
            

            <div className="mt-3 bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 text-sm text-gray-400">
              This is a prototype visualization showing nearby emergency alerts. In the final implementation, 
              this would be an interactive map using Leaflet or Google Maps showing accurate geo-positions.
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden h-full">
              <div className="bg-gradient-to-r from-slate-700/80 to-slate-700/40 px-4 py-3 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                  Active Alerts
                </h3>
                <div className="bg-red-500/20 text-red-300 py-1 px-2 rounded text-sm font-medium">
                  {sosAlerts.length}
                </div>
              </div>

              {sosAlerts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="inline-block p-3 bg-slate-700/40 rounded-full mb-3">
                    <Shield className="h-8 w-8 text-green-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-300 mb-2">Area is Clear</h4>
                  <p className="text-gray-400 text-sm">
                    No active emergency alerts in your area right now
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50 max-h-[530px] overflow-y-auto">
                  {sosAlerts.map((sos, index) => (
                    <div 
                      key={sos._id || index}
                      className={`p-4 hover:bg-slate-700/30 cursor-pointer transition-colors ${
                        selectedSOS && selectedSOS._id === sos._id ? 'bg-slate-700/50' : ''
                      }`}
                      onClick={() => handleSOSClick(sos)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <div className="mr-2 p-1.5 bg-red-500/20 rounded-full">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          </div>
                          <span className="font-medium">
                            {sos.user?.name || "Unknown User"}
                          </span>
                        </div>
                        {sos.createdAt && (
                          <span className="text-xs text-gray-400 flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {getElapsedTime(sos.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="mb-2 pl-7">
                        <p className="text-gray-300 text-sm line-clamp-2">
                          {sos.message || "Emergency assistance needed"}
                        </p>
                      </div>

                      <div className="flex justify-between items-center pl-7">
                        {userLocation && sos.coordinates && (
                          <span className="text-xs text-blue-300 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {calculateDistance(
                              userLocation.latitude,
                              userLocation.longitude,
                              sos.coordinates.latitude,
                              sos.coordinates.longitude
                            )} km away
                          </span>
                        )}

                        <span className="text-xs bg-slate-700 rounded-full px-2 py-0.5 text-gray-300 flex items-center">
                          <Users className="h-3 w-3 mr-1 text-blue-400" />
                          {Array.isArray(sos.acceptedBy) ? sos.acceptedBy.length : 0} responders
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 overflow-hidden flex justify-end">
          <div 
            className="bg-slate-900 border-l border-slate-700 w-full max-w-md transform transition-all duration-300 ease-in-out"
            style={{
              boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.5)"
            }}
          >
 
            <div className="border-b border-slate-700 p-4 flex justify-between items-center">
              <h3 className="font-bold text-xl flex items-center text-red-400">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Emergency Details
              </h3>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-full hover:bg-slate-700 text-gray-400 hover:text-white"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

  
            {selectedSOS && (
              <div className="p-4 overflow-auto max-h-screen pb-20">
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-red-500/20 rounded-full mr-3">
                      <User className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-red-300 font-medium">
                        {selectedSOS.user?.name || "Unknown User"}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {selectedSOS.user?.phone || "No contact information"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start mb-3">
                    <div className="p-2 bg-red-500/20 rounded-full mr-3 mt-0.5">
                      <MessageSquare className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-xs text-gray-400 mb-1">EMERGENCY MESSAGE</h4>
                      <p className="text-white">
                        {selectedSOS.message || "Emergency assistance needed"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="p-2 bg-red-500/20 rounded-full mr-3 mt-0.5">
                      <ClockIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-xs text-gray-400 mb-1">SENT AT</h4>
                      <p className="text-white">
                        {new Date(selectedSOS.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <h4 className="font-medium text-gray-300 mb-3">Location Details</h4>

                {selectedSOS.coordinates ? (
                  <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden mb-6">

                    <div className="h-40 bg-slate-700 relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 to-slate-900/0"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="h-8 w-8 bg-red-500 rounded-full animate-pulse-slow border-2 border-white flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center text-sm text-gray-300 mb-3">
                        <MapPin className="h-4 w-4 mr-2 text-red-400" />
                        <span>
                          {selectedSOS.coordinates.latitude.toFixed(6)}, {selectedSOS.coordinates.longitude.toFixed(6)}
                        </span>
                      </div>
                      
                      {userLocation && (
                        <div className="text-sm text-gray-400 mb-3 pl-6">
                          Approximately {calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            selectedSOS.coordinates.latitude,
                            selectedSOS.coordinates.longitude
                          )} km from your location
                        </div>
                      )}
                      
                      <a
                        href={`https://www.google.com/maps?q=${selectedSOS.coordinates.latitude},${selectedSOS.coordinates.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 w-full p-3 rounded-lg text-white transition-colors mt-2"
                      >
                        <NavigationIcon className="h-5 w-5 mr-2" />
                        View Location in Maps
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-4 mb-6">
                    <p className="text-gray-400">
                      No location information available for this emergency alert.
                    </p>
                  </div>
                )}


                <h4 className="font-medium text-gray-300 mb-3">Response Status</h4>
                <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-gray-300">
                      <Users className="h-4 w-4 mr-2 text-blue-400" />
                      <span>Responders</span>
                    </div>
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-sm">
                      {Array.isArray(selectedSOS.acceptedBy) ? selectedSOS.acceptedBy.length : 0}
                    </span>
                  </div>
                  
                  {Array.isArray(selectedSOS.acceptedBy) && selectedSOS.acceptedBy.length > 0 ? (
                    <div className="text-sm text-gray-400">
                      Other volunteers are already responding to this emergency.
                    </div>
                  ) : (
                    <div className="text-sm text-red-300">
                      No volunteers have accepted this emergency alert yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="py-3 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleAcceptSOS}
                  className="py-3 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-medium transition-colors flex items-center justify-center"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Accept & Respond
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      

      <style jsx>{`
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default NearbySOSMap;