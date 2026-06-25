// src/components/Main/Main.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './Main.css';
import Afirst from '../routes/Afirst/Afirst';
import Landing from '../routes/Landing/Landing';
import { PopupProvider } from '../../context/PopupContext';
import Popup from '../routes/Other/Popup/Popup';
import UCP from '../routes/Other/UCP/UCP';
// import WhatsAppScanner from '../routes/Other/Whatsapp/Whatsapp';


// PopupWrapper component to render the Popup
const PopupWrapper = () => {
    return <Popup />;
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
                {/* <WhatsAppScanner/> */}
                
                {/* Main content */}
                <div className="main-content">
                    <Routes>
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
