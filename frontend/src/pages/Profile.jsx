import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const { user, token, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        nid: "",
    });    
    const [profilePicture, setProfilePicture] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const [isLoading, setIsLoading] = useState(true);useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                address: user.address || "",
                nid: user.nid || "",
            });
            setProfilePicture(user.profilePicture || null);
            setIsLoading(false);
        } else {
    
            const fetchUserData = async () => {
                try {
                    const response = await axios.get("http://localhost:5000/api/auth/user", {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (response.data && response.data.user) {
                        const fetchedUser = response.data.user;
                        setFormData({
                            name: fetchedUser.name || "",
                            email: fetchedUser.email || "",
                            phone: fetchedUser.phone || "",
                            address: fetchedUser.address || "",
                            nid: fetchedUser.nid || "",
                        });
                        setProfilePicture(fetchedUser.profilePicture || null);
                    }
                } catch (error) {
                    console.error("Error fetching user data for profile:", error);
                    toast.error("Failed to load profile data.");
                } finally {
                    setIsLoading(false);
                }
            };
            if (token) {
                fetchUserData();
            } else {
                setIsLoading(false);
                toast.error("You are not logged in.");
                navigate("/login");
            }
        }
    }, [user, token, navigate]);    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
                return;
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setSelectedFile(file);
            
            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfilePictureUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file first');
            return;
        }

        setUploadingPicture(true);
        try {
            const formData = new FormData();
            formData.append('profilePicture', selectedFile);

            const response = await axios.post(
                "http://localhost:5000/api/auth/upload-profile-picture",
                formData,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );            if (response.data && response.data.profilePicture) {
                setProfilePicture(response.data.profilePicture);
                // Update AuthContext with new profile picture
                updateUser({ profilePicture: response.data.profilePicture });
                setSelectedFile(null);
                setPreviewUrl(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                toast.success('Profile picture updated successfully!');
            }
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            toast.error(error.response?.data?.message || "Failed to upload profile picture.");
        } finally {
            setUploadingPicture(false);
        }
    };

    const handleProfilePictureDelete = async () => {
        if (!profilePicture) {
            return;
        }

        if (window.confirm("Are you sure you want to delete your profile picture?")) {
            try {
                const response = await axios.delete(
                    "http://localhost:5000/api/auth/delete-profile-picture",
                    { headers: { Authorization: `Bearer ${token}` } }
                );                setProfilePicture(null);
                // Update AuthContext to remove profile picture
                updateUser({ profilePicture: null });
                toast.success('Profile picture deleted successfully!');
            } catch (error) {
                console.error("Error deleting profile picture:", error);
                toast.error(error.response?.data?.message || "Failed to delete profile picture.");
            }
        }
    };

    const getProfilePictureUrl = (picturePath) => {
        if (!picturePath) return null;
        return `http://localhost:5000${picturePath}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log("Updating profile with data:", formData);
            const response = await axios.put(
                "http://localhost:5000/api/auth/update-profile",
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Profile update response:", response.data);
            toast.success("Profile updated successfully!");
  
            if (response.data && response.data.user) {
                window.location.reload();
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error(error.response?.data?.message || "Failed to update profile.");
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            try {
                await axios.delete("http://localhost:5000/api/auth/delete-account", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Account deleted successfully.");
                logout(); 
                navigate("/");
            } catch (error) {
                console.error("Error deleting account:", error);
                toast.error(error.response?.data?.message || "Failed to delete account.");
            }
        }
    };

    if (isLoading) {
        return <div className="p-6">Loading profile...</div>;
    }    return (
        <div className="p-6 max-w-2xl mx-auto bg-white shadow-md rounded-lg">
            <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Your Profile</h1>
            
            {/* Profile Picture Section */}
            <div className="mb-8 text-center">                <div className="relative inline-block">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200 border-4 border-gray-300">
                        {/* Show preview if file is selected, otherwise show current profile picture */}
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        ) : profilePicture ? (
                            <img
                                src={getProfilePictureUrl(profilePicture)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div 
                            className={`w-full h-full flex items-center justify-center text-gray-500 ${(previewUrl || profilePicture) ? 'hidden' : 'flex'}`}
                        >
                            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                        </div>
                    </div>
                    {/* Show preview indicator */}
                    {previewUrl && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                Preview
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="space-y-3">
                    <div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                            id="profile-picture-input"
                        />
                        <label
                            htmlFor="profile-picture-input"
                            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition"
                        >
                            Choose Photo
                        </label>
                    </div>
                      {selectedFile && (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Selected: {selectedFile.name}</p>
                            <p className="text-xs text-blue-600">Preview shown above</p>
                            <div className="space-x-2">
                                <button
                                    onClick={handleProfilePictureUpload}
                                    disabled={uploadingPicture}
                                    className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition ${
                                        uploadingPicture ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                >
                                    {uploadingPicture ? "Uploading..." : "Upload"}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setPreviewUrl(null);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {profilePicture && !selectedFile && (
                        <button
                            onClick={handleProfilePictureDelete}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                            Remove Photo
                        </button>
                    )}
                </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                        type="text"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                        type="text"
                        name="address"
                        id="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="nid" className="block text-sm font-medium text-gray-700">NID</label>
                    <input
                        type="text"
                        name="nid"
                        id="nid"
                        value={formData.nid}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Update Profile
                </button>
            </form>
            
            {/* Account Deactivation Section */}
            <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-medium text-red-600">Account Deactivation</h2>
                <p className="text-sm text-gray-600 mt-1 mb-3">
                    If you wish to delete your account, please be aware that this action is permanent and cannot be undone.
                </p>
                <button
                    onClick={handleDeleteAccount}
                    className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Delete My Account
                </button>
            </div>
        </div>
    );
};

export default Profile;
