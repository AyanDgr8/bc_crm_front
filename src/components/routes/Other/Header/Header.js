
// src/components/routes/Other/Header/Header.js

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../../utils/api';
// import FileUpload from './Upload/FileUpload';
import { handleLogoutApi } from '../../../../utils/api';
import "./Header.css";

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [queueSearchQuery, setQueueSearchQuery] = useState('');
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const navigate = useNavigate();

    useEffect(() => {
        console.log('Header mounted');
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Parse the JWT token (it's in base64)
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const tokenData = JSON.parse(window.atob(base64));

                console.log('Parsed token data:', tokenData);

                if (tokenData.username && tokenData.role) {
                    setUsername(tokenData.username);
                    setUserRole(tokenData.role);
                    console.log('Set user data from token:', {
                        username: tokenData.username,
                        role: tokenData.role
                    });
                } else {
                    console.log('Token data missing username or role, falling back to API');
                    fetchUser();
                }
            } catch (error) {
                console.error('Error parsing token:', error);
                fetchUser(); // Fallback to API call if token parsing fails
            }
        }
        setIsLoading(false);
    }, []);

    const fetchUser = async () => {
        console.log('Fetching user data from API...');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No token found');
                return;
            }

            const response = await api.get('/current-user', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const userData = response.data;
            console.log('API Response:', userData);

            if (userData.username && userData.role) {
                setUsername(userData.username);
                setUserRole(userData.role);
                console.log('Set user data from API:', {
                    username: userData.username,
                    role: userData.role
                });
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setUsername('');
        }
    }, [localStorage.getItem('token')]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            alert("Please enter a search term.");
            return;
        }

        try {
            const searchTerm = encodeURIComponent(searchQuery.trim());
            const searchPath = userRole === 'receptionist'
                ? `/dashboard/customers/search?query=${searchTerm}`
                : `/customers/search?query=${searchTerm}`;
            navigate(searchPath);
            setSearchQuery('');
        } catch (error) {
            console.error('Error in search:', error);
        }
    };

    const handleQueueSearch = () => {
        if (!queueSearchQuery.trim()) {
            alert("Please enter a team name to search.");
            return;
        }

        try {
            const searchTerm = encodeURIComponent(queueSearchQuery.trim());
            const searchPath = userRole === 'receptionist'
                ? `/dashboard/customers/search?team=${searchTerm}`
                : `/customers/search?team=${searchTerm}`;
            navigate(searchPath);
            setQueueSearchQuery('');
        } catch (error) {
            console.error('Error in queue search:', error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleQueueKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleQueueSearch();
        }
    };

    const handleLogout = async () => {
        const confirmLogout = window.confirm("Are you sure you want to log out?");
        if (!confirmLogout) return;
        try {
            await handleLogoutApi();
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const isLoggedIn = !!localStorage.getItem("token");

    const handleReminderClick = () => {
        navigate(userRole === 'receptionist' ? '/dashboard/customers/reminders' : '/customers/reminders');
    };

    const handleLogoClick = () => {
        navigate(userRole === 'receptionist' ? '/dashboard/first-reception' : '/');
    };

    const renderMenuLink = ({ label, to, icon }) => (
        <Link key={to} to={to} className="dropdown-menu-link">
            <i className={`fas ${icon} dropdown-menu-icon`}></i>
            <span>{label}</span>
        </Link>
    );

    const receptionistMenuItems = [
        { label: 'Dashboard', to: '/dashboard/first-reception', icon: 'fa-chart-line' },
        { label: 'Companies', to: '/dashboard/companies', icon: 'fa-building' },
        { label: 'Add New Record', to: '/dashboard/customers/create', icon: 'fa-user-plus' },
        { label: 'Reminders', to: '/dashboard/customers/reminders', icon: 'fa-bell' }
    ].filter(Boolean);

    return (
        <div className="header-container">
            {isLoggedIn ? (
                <div className="logo-container" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
                    <img
                        src="/uploads/logo.webp"
                        className="logo"
                        alt="Company Logo"
                        aria-label="Logo"
                    />
                </div>
            ) : (
                <img
                    src="/uploads/logo.webp"
                    className="logo"
                    alt="Company Logo"
                    aria-label="Logo"
                />
            )}
            <div className="header-right">
                {isLoggedIn ? (
                    <>
                    <div className="header-search queue-search">
                        <input
                            type="text"
                            className="form-control form-cont"
                            aria-label="Team search input"
                            placeholder="Search records"
                            value={queueSearchQuery}
                            onChange={(e) => setQueueSearchQuery(e.target.value)}
                            onKeyDown={handleQueueKeyDown}
                        />
                        <img
                            src="/uploads/search.svg"
                            className="srch-icon"
                            alt="search-icon"
                            onClick={handleQueueSearch}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                    {/* <div className="header-search">
                        <input
                            type="text"
                            className="form-control form-cont"
                            aria-label="Search input"
                            placeholder="Search Records"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <img
                            src="/uploads/search.svg"
                            className="srch-icon"
                            alt="search-icon"
                            onClick={handleSearch}
                            style={{ cursor: 'pointer' }}
                        />
                    </div> */}

                        {/* Upload button */}
                        {/* <div className="file-upload-section">
                            <FileUpload />
                        </div> */}

                        {/* <div className="notification-section">
                            <img
                                src="/uploads/bell.svg"
                                className="notification-icon"
                                alt="notification icon"
                                aria-label="Notification"
                                onClick={handleReminderClick}
                                style={{ cursor: 'pointer' }}
                            />
                        </div> */}
                    <div className="profile-section">
                        <div className="profile-dropdown">
                            <img
                                src="/uploads/MultyLogo.png"
                                className="pro-icon"
                                alt="profile icon"
                                aria-label="Profile"
                            />
                            <div className="header-user-meta">
                                <span className="header-username">{username || 'User'}</span>
                                <span className="header-datetime">
                                    {currentDateTime.toLocaleString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <div className="dropdown-content">
                                {process.env.NODE_ENV === 'development' && (
                                    <div style={{padding: '1px', borderBottom: '1px solid #ccc', fontSize: '12px', color: '#666'}}>
                                        Current Role: {userRole || 'none'}
                                    </div>
                                )}

                                {/* Admin check */}
                                {userRole === 'admin' && (
                                    <>
                                        {renderMenuLink({ label: 'Brand Management', to: '/brand', icon: 'fa-layer-group' })}
                                        {renderMenuLink({ label: 'Business Center Management', to: '/business', icon: 'fa-briefcase' })}
                                        {renderMenuLink({ label: 'Receptionist Management', to: '/receptionist', icon: 'fa-headset' })}
                                        {/* <Link to="/admin">Companies and Users</Link> */}
                                    </>
                                )}

                                {/* Brand user menu */}
                                {(userRole === 'brand_user' || userRole === 'business_admin') && (
                                    <>
                                        {renderMenuLink({ label: 'Business Center Management', to: '/business', icon: 'fa-briefcase' })}
                                        {renderMenuLink({ label: 'Receptionist Management', to: '/receptionist', icon: 'fa-headset' })}
                                    </>
                                )}

                                {userRole === 'receptionist' && (
                                    <>
                                        {receptionistMenuItems.map(renderMenuLink)}
                                    </>
                                )}

                                {renderMenuLink({ label: 'Download', to: '/download', icon: 'fa-download' })}
                                {renderMenuLink({
                                    label: 'Agent Stats Reports',
                                    to: userRole === 'receptionist' ? '/dashboard/agent-stats' : '/agent-stats',
                                    icon: 'fa-chart-bar'
                                })}

                                <div className="dropdown-divider"></div>
                                <div className="dropdown-footer" onClick={handleLogout}>
                                    <span className="logout-btn">
                                        <i className="fas fa-sign-out-alt dropdown-menu-icon"></i>
                                        Logout
                                    </span>
                                    {!isLoading && username && (
                                        <span className="username-logout">{username}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <Link to="/login">
                    <img
                        src="/uploads/profile.svg"
                        className="pro-icon"
                        alt="profile icon"
                        aria-label="Profile"
                    />
                </Link>
            )}
        </div>
        </div>
    );
};

export default Header;
