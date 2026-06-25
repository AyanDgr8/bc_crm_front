// src/components/Main/Main.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './Main.css';
import Afirst from '../routes/Afirst/Afirst';
import Landing from '../routes/Landing/Landing';
import { PopupProvider } from '../../context/PopupContext';
import Popup from '../routes/Other/Popup/Popup';
import UCP from '../routes/Other/UCP/UCP';
import WhatsAppScanner from '../routes/Other/Whatsapp/Whatsapp';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useParams } from 'react-router-dom';

// PopupWrapper component to render the Popup
const PopupWrapper = () => {
    return <Popup />;
};

// Inline component that handles redirection from legacy /team/<teamName> URLs for receptionists
const TeamRedirect = () => {
    const navigate = useNavigate();
    const { teamName } = useParams();

    React.useEffect(() => {
        // Read token from storage – align with existing auth logic
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            // If no token, just push to landing (user will be asked to login)
            navigate('/', { replace: true });
            return;
        }
        try {
            const decoded = jwtDecode(token);
            const { role, business_center_id } = decoded;
            // Receptionists are forced to their business-scoped dashboard URL
            if (role === 'receptionist' && business_center_id) {
                navigate(`/dashboard/business/${business_center_id}/team/${encodeURIComponent(teamName)}`, { replace: true });
            } else {
                // For any other role just fallback to dashboard root (or update as needed)
                navigate('/dashboard', { replace: true });
            }
        } catch (err) {
            console.error('Failed to decode JWT in TeamRedirect:', err);
            navigate('/', { replace: true });
        }
    }, [navigate, teamName]);

    // Render nothing while redirecting
    return null;
};

const Main = () => {
  // Determine if user is logged in (using the same approach as in your existing authentication system)
  const isLoggedIn = localStorage.getItem('token') || sessionStorage.getItem('token');
    return (
        <Router>
            <PopupProvider>
                {/* Render Popup component */}
                <PopupWrapper />
                <UCP isLoggedIn={isLoggedIn}/>
                {isLoggedIn && <WhatsAppScanner />}
                
                {/* Main content */}
                <div className="main-content">
                    <Routes>
                        {/* Legacy /team/<teamName> path – redirects receptionists to correct dashboard URL */}
                        <Route path="/team/:teamName" element={<TeamRedirect />} />
                        {/* Route to the Landing component at the root path */}
                        <Route path="/" element={<Landing />} />

                        {/* Add a route for the Afirst component */}
                        <Route path="*" element={<Afirst />} />
                    </Routes>
                </div>
            </PopupProvider>
        </Router>
    );
};

export default Main;
