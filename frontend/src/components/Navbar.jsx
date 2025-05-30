import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Notifications from "./Notifications";
import { useState, useEffect, useRef } from "react";

const Navbar = () => {
	const { user, logout } = useAuth();
	const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const adminDropdownRef = useRef(null);
	const mobileMenuRef = useRef(null);

	const toggleAdminDropdown = () => {
		setIsAdminDropdownOpen(!isAdminDropdownOpen);
	};

	const closeAdminDropdown = () => {
		setIsAdminDropdownOpen(false);
	};

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				adminDropdownRef.current &&
				!adminDropdownRef.current.contains(event.target)
			) {
				closeAdminDropdown();
			}
			
			if (
				mobileMenuRef.current && 
				!mobileMenuRef.current.contains(event.target) &&
				!event.target.classList.contains('mobile-menu-button')
			) {
				setIsMobileMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<nav className="bg-gradient-to-r from-red-600 to-red-800 shadow-lg sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">

					<div className="flex-shrink-0 flex items-center">
						<Link to="/" className="flex items-center text-white">
							<div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-2 pulse-animation">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
								</svg>
							</div>
							<span className="text-xl font-bold tracking-wide">Quick Response</span>
						</Link>
					</div>

					<div className="hidden md:block">
						<div className="flex items-center space-x-4">
							{!user ? (
								<>
									<Link to="/login" className="text-white hover:bg-red-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all duration-200">
										Login
									</Link>
									<Link to="/register" className="bg-white text-red-600 hover:bg-gray-100 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200">
										Register
									</Link>
								</>
							) : (
								<div className="flex items-center space-x-1">
									<Link to="/dashboard" className="text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200">
										Dashboard
									</Link>
									
									<Link to="/sos" className="relative group">
										<div className="bg-white text-red-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 hover:bg-gray-100 transition-all duration-200">
											<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
												<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
											</svg>
											<span>SOS</span>
										</div>
										<span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-white group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
									</Link>
									
									<Link to="/profile" className="text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200">
										Profile
									</Link>
									
									<Link to="/contact" className="text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200">
										Contacts
									</Link>
									
									<Link to="/chats" className="text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200">
										Chats
									</Link>

									{user.role === "volunteer" && (
										<>
											<Link to="/alert" className="text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200">
												<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
													<path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
												</svg>
												Alerts
											</Link>
											<Link to="/status" className="text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200">
												Status
											</Link>
										</>
									)}

									{user.role === "admin" && (
										<div className="relative" ref={adminDropdownRef}>
											<button
												onClick={toggleAdminDropdown}
												className="text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200"
											>
												<span>Admin</span>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className={`h-4 w-4 ml-1 transform transition-transform duration-200 ${isAdminDropdownOpen ? 'rotate-180' : ''}`}
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M19 9l-7 7-7-7"
													/>
												</svg>
											</button>
											
											{isAdminDropdownOpen && (
												<div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10 fade-in">
													<div className="py-1">
														<Link
															to="/user-approvals"
															className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
															onClick={closeAdminDropdown}
														>
															<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
																<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
															</svg>
															User Approvals
														</Link>
														<Link
															to="/user-management"
															className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
															onClick={closeAdminDropdown}
														>
															<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
																<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
															</svg>
															User Management
														</Link>
													</div>
													<div className="py-1">
														<Link
															to="/active-sos"
															className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
															onClick={closeAdminDropdown}
														>
															<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
																<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
															</svg>
															Monitor Active SOS
														</Link>
														<Link
															to="/safety-reports"
															className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
															onClick={closeAdminDropdown}
														>
															<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
																<path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
															</svg>
															Safety Reports
														</Link>
														<Link
															to="/broadcast"
															className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
															onClick={closeAdminDropdown}
														>
															<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
																<path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
															</svg>
															Emergency Broadcast
														</Link>
													</div>
												</div>
											)}
										</div>
									)}									<div className="px-3 py-2">
										<Notifications />
									</div>
									
									{/* Profile Picture */}
									<Link to="/profile" className="flex items-center">
										<div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300 border-2 border-white">
											{user.profilePicture ? (
												<img
													src={`http://localhost:5000${user.profilePicture}`}
													alt="Profile"
													className="w-full h-full object-cover"
													onError={(e) => {
														e.target.style.display = 'none';
														e.target.nextSibling.style.display = 'flex';
													}}
												/>
											) : null}
											<div className={`w-full h-full flex items-center justify-center text-gray-500 ${user.profilePicture ? 'hidden' : 'flex'}`}>
												<svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
													<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
												</svg>
											</div>
										</div>
									</Link>
									
									<button
										onClick={logout}
										className="bg-white text-red-600 hover:bg-gray-100 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
									>
										Logout
									</button>
								</div>
							)}
						</div>
					</div>

	
					<div className="md:hidden flex items-center">
						{user && (
							<div className="mr-4">
								<Notifications />
							</div>
						)}
						<button 
							onClick={toggleMobileMenu}
							className="mobile-menu-button inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-red-700 focus:outline-none"
						>
							<span className="sr-only">Open main menu</span>
							{!isMobileMenuOpen ? (
								<svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							) : (
								<svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							)}
						</button>
					</div>
				</div>
			</div>

			{isMobileMenuOpen && (
				<div className="md:hidden bg-red-900 fade-in" ref={mobileMenuRef}>
					<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
						{!user ? (
							<>
								<Link to="/login" className="text-white hover:bg-red-700 block px-3 py-2 rounded-md text-base font-medium">
									Login
								</Link>
								<Link to="/register" className="text-white hover:bg-red-700 block px-3 py-2 rounded-md text-base font-medium">
									Register
								</Link>
							</>
						) : (
							<>
								<Link to="/dashboard" className="text-white hover:bg-red-700 block px-3 py-2 rounded-md text-base font-medium">
									Dashboard
								</Link>
								<Link to="/profile" className="text-white hover:bg-red-700 block px-3 py-2 rounded-md text-base font-medium">
									Profile
								</Link>
								<Link to="/contact" className="text-white hover:bg-red-700 block px-3 py-2 rounded-md text-base font-medium">
									Contacts
								</Link>
								<Link to="/sos" className="bg-white text-red-600 block px-3 py-2 rounded-md text-base font-medium">
									SOS
								</Link>
								<Link to="/chats" className="text-white hover:bg-red-700 block px-3 py-2 rounded-md text-base font-medium">
									Chats
								</Link>

								{user.role === "volunteer" && (
									<>
											<Link to="/alert" className="text-white hover:bg-red-700 block px-3 py-2 rounded-md text-base font-medium">
											Alerts
										</Link>
										<Link to="/status" className="text-white hover:bg-red-700 block px-3 py-2 rounded-md text-base font-medium">
											Status
										</Link>
										<Link to="/volunteer-feedback" className="text-white hover:bg-red-700 block px-3 py-2 rounded-md text-base font-medium">
											Feedback
										</Link>
									</>
								)}

								{user.role === "admin" && (
									<>
										<div className="border-t border-red-800 my-2 pt-2">
											<p className="px-3 text-xs font-semibold text-white uppercase tracking-wider">
												Admin Controls
											</p>
										</div>
										<Link to="/user-approvals" className="text-gray-300 hover:bg-red-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
											User Approvals
										</Link>
										<Link to="/user-management" className="text-gray-300 hover:bg-red-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
											User Management
										</Link>
										<Link to="/blacklisted-users" className="text-gray-300 hover:bg-red-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
											Blacklisted Users
										</Link>
										<Link to="/active-sos" className="text-gray-300 hover:bg-red-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
											Monitor Active SOS
										</Link>
										<Link to="/safety-reports" className="text-gray-300 hover:bg-red-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
											Safety Reports
										</Link>
										<Link to="/broadcast" className="text-gray-300 hover:bg-red-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
											Emergency Broadcast
										</Link>
									</>
								)}
								
								<div className="border-t border-red-800 mt-2 pt-2">
									<button
										onClick={logout}
										className="w-full text-left text-white hover:bg-red-700 block px-3 py-2 rounded-md text-base font-medium"
									>
										Logout
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			)}
		</nav>
	);
};

export default Navbar;
