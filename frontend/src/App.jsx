import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { SOSModalProvider } from "./context/SOSModalContext";
import { ChatSocketProvider } from "./context/ChatSocketContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import { Toaster } from "react-hot-toast";
import Contact from "./pages/Contact";
import SOS from "./pages/SOS";
import Alert from "./pages/Alert";
import SOSModal from "./components/SOSModal";
import Broadcast from "./pages/Broadcast";
import UserManagement from "./pages/UserManagement";
import UserApprovals from "./pages/UserApprovals";
import BlacklistUsers from "./pages/BlacklistUsers";
import Status from "./pages/Status";
import SafetyReports from "./pages/SafetyReports";
import Profile from "./pages/Profile";
import ActiveSOS from "./pages/ActiveSOS";
import VolunteerFeedback from "./pages/VolunteerFeedback";
import VolunteerVerification from "./pages/VolunteerVerification";
import SOSDetails from "./pages/SOSDetails";
import Chats from "./pages/Chats";
import SingleChat from "./pages/SingleChat";

const App = () => (
	<Router>
		<AuthProvider>
			<SOSModalProvider>
				<SocketProvider>
					<ChatSocketProvider>
						<Navbar />
						<SOSModal />
						<Toaster position="top-right" />
						<Routes>							<Route path="/" element={<HomePage />} />
							<Route path="/register" element={<Register />} />
							<Route path="/login" element={<Login />} />
							<Route path="/forgot-password" element={<ForgotPassword />} />
							<Route path="/reset-password/:token" element={<ResetPassword />} />
							<Route path="/status" element={<Status />} />

							<Route element={<ProtectedRoute />}>
								<Route
									path="/dashboard"
									element={<Dashboard />}
								/>
								<Route path="/profile" element={<Profile />} />
								<Route path="/chats" element={<Chats />} />
								<Route
									path="/chats/:id"
									element={<SingleChat />}
								/>
								<Route path="/contact" element={<Contact />} />
								<Route path="/sos" element={<SOS />} />
								<Route path="/alert" element={<Alert />} />
								<Route
									path="/volunteer-feedback"
									element={<VolunteerFeedback />}
								/>
								<Route
									path="/sos/:id"
									element={<SOSDetails />}
								/>
							</Route>

							<Route
								element={<ProtectedRoute adminOnly={true} />}
							>
								<Route
									path="/broadcast"
									element={<Broadcast />}
								/>
								<Route
									path="/user-management"
									element={<UserManagement />}
								/>
								<Route
									path="/user-approvals"
									element={<UserApprovals />}
								/>
								<Route
									path="/volunteer-verification"
									element={<VolunteerVerification />}
								/>
								<Route
									path="/blacklisted-users"
									element={<BlacklistUsers />}
								/>
								<Route
									path="/active-sos"
									element={<ActiveSOS />}
								/>
								<Route
									path="/safety-reports"
									element={<SafetyReports />}
								/>
							</Route>
						</Routes>
					</ChatSocketProvider>
				</SocketProvider>
			</SOSModalProvider>
		</AuthProvider>
	</Router>
);

export default App;
