// src/components/routes/Other/Whatsapp/Whatsapp.js

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./Whatsapp.css";

const WhatsAppScanner = () => {
    const [instanceId, setInstanceId] = useState(() => {
        let storedId = localStorage.getItem('instanceId');
        if (!storedId) {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.username) {
                        storedId = decoded.username.toLowerCase().replace(/\s+/g, '_');
                        localStorage.setItem('instanceId', storedId);
                    }
                } catch (error) {
                    console.error('Failed to decode token:', error);
                }
            }
        }
        return storedId || '';
    });
    const [qrCode, setQrCode] = useState('');
    const [status, setStatus] = useState('disconnected');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true); // Start minimized by default
    const [isVisible, setIsVisible] = useState(false); // Control overall visibility
    const [lastQrUpdate, setLastQrUpdate] = useState(0);
    const [lastInitAttempt, setLastInitAttempt] = useState(0);
    const QR_REFRESH_THRESHOLD = 10000; // 10 seconds

    useEffect(() => {
        const storedInstanceId = localStorage.getItem('instanceId');
        if (storedInstanceId) {
            setInstanceId(storedInstanceId);
        } else {
            setError('Instance ID not found. Please log in again.');
            setStatus('error');
        }
    }, []);

    const initializeWhatsApp = async () => {
        try {
            setError('');
            setLoading(true);
            setLastInitAttempt(Date.now());
            const token = localStorage.getItem('token');
            console.log('JWT Token:', token);
            const deviceId = localStorage.getItem('deviceId') || getDeviceIdFromToken(token);
            
            if (!token) {
                setError('No authentication token found. Please log in again.');
                setStatus('disconnected');
                setQrCode('');
                return;
            }
            
            const apiUrl = process.env.REACT_APP_API_URL;
            console.log('Initializing WhatsApp with API URL:', apiUrl);
            
            // First check if user already has an instance
            try {
                const decoded = jwtDecode(token);
                const userEmail = decoded.email || decoded.id;
                
                if (userEmail) {
                    console.log('Checking for existing instances for user:', userEmail);
                    // Get user instances from the backend
                    const instancesResponse = await axios.get(`${apiUrl}/instances/${userEmail}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'x-device-id': deviceId
                        }
                    });
                    console.log('Instances response:', instancesResponse.data);
                    if (instancesResponse.data.success && instancesResponse.data.instances.length > 0) {
                        // Use the first instance from the backend
                        const backendInstance = instancesResponse.data.instances[0];
                        const backendInstanceId = backendInstance.instance_id;
                        
                        console.log('Using existing instance ID from backend:', backendInstanceId);
                        setInstanceId(backendInstanceId);
                        localStorage.setItem('instanceId', backendInstanceId);
                        
                        // Now initialize with the correct instance ID
                        const initResponse = await axios.get(`${apiUrl}/whatsapp/init/${backendInstanceId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'x-device-id': deviceId
                            }
                        });
                        
                        if (initResponse.data.success) {
                            if (initResponse.data.qrCode) {
                                setQrCode(initResponse.data.qrCode);
                                setLastQrUpdate(Date.now());
                                setStatus('waiting_for_scan');
                            } else if (initResponse.data.connected || initResponse.data.status === 'connected') {
                                setStatus('connected');
                                setQrCode('');
                            } else {
                                setStatus(initResponse.data.status || 'disconnected');
                            }
                        } else {
                            setError(initResponse.data.message || 'Failed to initialize WhatsApp');
                        }
                        return;
                    }
                }
            } catch (instanceError) {
                console.error('Error fetching instances:', instanceError);
                // Continue with the fallback approach if fetching instances fails
            }
            
            // Fallback to using the stored or generated instance ID
            const currentInstanceId = localStorage.getItem('instanceId');
            if (!currentInstanceId) {
                setError('No WhatsApp instance ID found. Please log in again.');
                setStatus('disconnected');
                setQrCode('');
                return;
            }
            
            console.log('Falling back to stored instance ID:', currentInstanceId);
            const initResponse = await axios.get(`${apiUrl}/whatsapp/init/${currentInstanceId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-device-id': deviceId
                }
            });
            
            if (initResponse.data.success) {
                if (initResponse.data.qrCode) {
                    setQrCode(initResponse.data.qrCode);
                    setLastQrUpdate(Date.now());
                    setStatus('waiting_for_scan');
                } else if (initResponse.data.connected || initResponse.data.status === 'connected') {
                    setStatus('connected');
                    setQrCode('');
                } else {
                    setStatus(initResponse.data.status || 'disconnected');
                }
            } else {
                setError(initResponse.data.message || 'Failed to initialize WhatsApp');
            }
        } catch (err) {
            setError('Failed to initialize WhatsApp connection');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInitResponse = (initResponse) => {
        if (initResponse.data.success) {
            if (initResponse.data.qrCode) {
                setQrCode(initResponse.data.qrCode);
                setLastQrUpdate(Date.now());
                setStatus('waiting_for_scan');
            } else if (initResponse.data.connected || initResponse.data.status === 'connected') {
                setStatus('connected');
                setQrCode('');
            } else {
                setStatus(initResponse.data.status || 'disconnected');
            }
        } else {
            setError(initResponse.data.message || 'Failed to initialize WhatsApp');
        }
    };

    const checkConnectionStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('JWT Token:', token);
            const deviceId = localStorage.getItem('deviceId') || getDeviceIdFromToken(token);
            let currentInstanceId = localStorage.getItem('instanceId');
            if (!currentInstanceId && token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.username) {
                        currentInstanceId = decoded.username.toLowerCase().replace(/\s+/g, '_');
                        localStorage.setItem('instanceId', currentInstanceId);
                        setInstanceId(currentInstanceId);
                    }
                } catch (error) {
                    console.error('Failed to decode token:', error);
                }
            }
            if (!currentInstanceId) {
                setError('No WhatsApp instance ID found. Please initialize a new instance.');
                setStatus('disconnected');
                setQrCode('');
                return;
            }
            if (!token) {
                setError('No authentication token found. Please log in again.');
                setStatus('disconnected');
                setQrCode('');
                return;
            }
            console.log('Token being used:', token);
            try {
                const decoded = jwtDecode(token);
                console.log('Decoded token content:', decoded);
            } catch (decodeError) {
                console.error('Token decode error:', decodeError);
            }
            const apiUrl = `${process.env.REACT_APP_API_URL}/whatsapp/status/${currentInstanceId}`;
            console.log(apiUrl);
            const response = await axios.get(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-device-id': deviceId
                }
            });
            const { status: newStatus, qrCode: newQrCode, lastUpdate } = response.data;
            setStatus(newStatus);
            const qrCodeAge = lastUpdate ? (Date.now() - new Date(lastUpdate).getTime()) / 1000 : 0;
            const qrCodeRefreshThreshold = 25; // seconds

            if (newQrCode && qrCodeAge < qrCodeRefreshThreshold) {
                setQrCode(newQrCode);
                if (newStatus === 'disconnected') {
                    setStatus('waiting_for_scan');
                }
            } else {
                setQrCode('');
                // Do NOT auto-reinit. User must press "Reset Connection" to request a fresh QR.
            }
        } catch (err) {
            console.error('Error:', err);
            setError(`Failed to check connection status: ${err.message}`);
            setStatus('disconnected');
            setQrCode('');
        }
    }, []);

    const handleReset = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('JWT Token:', token);
            const deviceId = localStorage.getItem('deviceId') || getDeviceIdFromToken(token);
            if (!token) {
                setError('No authentication token found. Please log in again.');
                return;
            }
            const apiUrl = `${process.env.REACT_APP_API_URL}/whatsapp/reset/${instanceId}`;
            await axios.post(apiUrl, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-device-id': deviceId
                }
            });
            setStatus('disconnected');
            setQrCode('');
            setError('Connection reset successfully.');
            // Now explicitly init to fetch a new QR because auto-reinit is disabled
            initializeWhatsApp();
            checkConnectionStatus();
        } catch (err) {
            console.error('Error resetting connection:', err);
            setError(`Failed to reset connection: ${err.message}`);
        }
    };

    useEffect(() => {
        // Only initialize WhatsApp when the component becomes visible
        if (isVisible) {
            initializeWhatsApp();
            const statusInterval = setInterval(checkConnectionStatus, 5000); // 5 seconds
            return () => clearInterval(statusInterval);
        }
    }, [isVisible, checkConnectionStatus]);

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
        // When maximizing, ensure the component is visible
        if (isMinimized) {
            setIsVisible(true);
        }
    };

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
        // When making visible, ensure it's not minimized
        if (!isVisible) {
            setIsMinimized(false);
        }
    };

    function getDeviceIdFromToken(token) {
        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            return decoded.deviceId || '';
        } catch (e) {
            console.error('Failed to decode token for device ID:', e);
            return '';
        }
    }

    // Always show the icon, but only render the full component when visible
    if (!isVisible) {
        return (
            <div className="whatsapp-icon-container" onClick={toggleVisibility}>
                <div className="whatsapp-icon">
                    <i className="fab fa-whatsapp"></i>
                </div>
            </div>
        );
    }

    if (isMinimized) {
        return (
            <div className="whatsapp-minimized" onClick={toggleMinimize}>
                <i className="fab fa-whatsapp"></i>
            </div>
        );
    }

    return (
        <div className="whatsapp-scanner-container">
            <div className="whatsapp-scanner-card">
                <div className="whatsapp-header">
                    <h2>WhatsApp Connection</h2>
                    <div className="headerrr-buttons">
                        <button className="minimize-button" onClick={toggleMinimize}>
                            <i className="fas fa-minus"></i>
                        </button>
                        {/* <button className="close-button" onClick={toggleVisibility}>
                            {/* <i className="fas fa-times"></i> 
                        </button> */}
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                
                {status === 'disconnected' && (
                    <div className="status-message disconnected">
                        <i className="fas fa-times-circle"></i>
                        WhatsApp is disconnected
                    </div>
                )}
                
                {qrCode && (
                    <div className="qr-container">
                        <img src={qrCode} alt="WhatsApp QR Code" className="qr-image" />
                        <p className="qr-instruction">Scan this QR code with WhatsApp on your phone</p>
                    </div>
                )}
                
                {status === 'connected' && (
                    <div className="status-message connected">
                        <i className="fas fa-check-circle"></i>
                        WhatsApp is connected
                    </div>
                )}

                {status === 'reconnecting' && (
                    <div className="status-message reconnecting">
                        <i className="fas fa-sync fa-spin"></i>
                        Connecting to WhatsApp...
                    </div>
                )}
                
                {status !== 'connected' && status !== 'reconnecting' && (
                    <button 
                        className="refresh-button"
                        onClick={handleReset}
                        disabled={loading}
                    >
                        {loading ? "Resetting..." : "Reset Connection"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default WhatsAppScanner;
