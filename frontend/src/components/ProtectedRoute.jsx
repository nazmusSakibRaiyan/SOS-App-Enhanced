import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ adminOnly }) => {
	const { user, loading } = useAuth();

	if (loading) {
		return <div>Loading...</div>; 
	}

	if (!user) {
		return <Navigate to="/login" />;
	}

	if (adminOnly && user.role !== "admin") {
		return <Navigate to="/dashboard" />;
	}

	return <Outlet />;
};

export default ProtectedRoute;
