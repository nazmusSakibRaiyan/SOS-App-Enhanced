import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { Bell, AlertTriangle, Info, Shield, Clock, CheckCircle, X, ChevronRight } from "lucide-react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); 
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchNotifications = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching notifications with token:", token ? "Token exists" : "No token");
      const response = await axios.get(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Notifications response:", response.data);
      setNotifications(response.data);
      
      const unread = response.data.filter((notification) => !notification.isRead);
      setUnreadCount(unread.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications");
      
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/notifications/read/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    
    if (notification.type === "SOS") {
      navigate(`/sos/${notification.relatedId}`);
    } else if (notification.type === "chat") {
      navigate(`/chats/${notification.relatedId}`);
    } else {
      navigate("/dashboard");
    }
    
    setShowNotifications(false);
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        "http://localhost:5000/api/notifications/read-all",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "SOS":
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case "user":
        return <Shield className="h-5 w-5 text-blue-400" />;
      case "chat":
        return <Info className="h-5 w-5 text-green-400" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const getNotificationBgColor = (type, read) => {
    const baseClass = read ? "bg-slate-800/40" : "bg-slate-700/60";
    
    switch (type) {
      case "SOS":
        return `${baseClass} ${read ? "" : "border-l-4 border-red-500"} hover:bg-slate-700/80`;
      case "user":
        return `${baseClass} ${read ? "" : "border-l-4 border-blue-500"} hover:bg-slate-700/80`;
      case "chat":
        return `${baseClass} ${read ? "" : "border-l-4 border-green-500"} hover:bg-slate-700/80`;
      case "REMINDER":
        return `${baseClass} ${read ? "" : "border-l-4 border-yellow-500"} hover:bg-slate-700/80`;
      default:
        return `${baseClass} ${read ? "" : "border-l-4 border-gray-500"} hover:bg-slate-700/80`;
    }
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        onClick={() => {
          setShowNotifications(!showNotifications);
          if (!showNotifications) {
            fetchNotifications(); 
          }
        }}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute top-12 right-0 w-80 sm:w-96 bg-slate-900 border border-slate-700/50 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between bg-slate-800/80 backdrop-blur-sm p-4 border-b border-slate-700/50">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Bell className="h-5 w-5 mr-2 text-blue-400" />
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs px-2 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded-md transition-colors"
                  title="Mark all as read"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Close notifications"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-[80vh] overflow-y-auto">
            {loading ? (
              <div className="py-10 px-4 text-center">
                <p className="text-gray-400">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="py-10 px-4 text-center">
                <p className="text-red-400">{error}</p>
                <button 
                  onClick={fetchNotifications}
                  className="mt-2 text-xs px-3 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded-md transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="bg-slate-800/50 h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`${getNotificationBgColor(notification.type, notification.isRead)} p-3 cursor-pointer transition-colors`}
                  >
                    <div className="flex items-start">
                      <div className={`p-2 rounded-full bg-slate-800/50 mt-0.5 mr-3`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                          <h4 className={`font-medium ${notification.isRead ? 'text-gray-300' : 'text-white'} truncate text-sm`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-500 mt-1.5 ml-1.5 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default Notifications;
