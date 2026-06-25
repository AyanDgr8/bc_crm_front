// src/components/routes/Other/Whatsapp/Whatsapp.js

import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./Whatsapp.css";

const getCanonicalInstanceIdFromToken = (token) => {
    if (!token) return '';
    try {
        const decoded = jwtDecode(token);
        const firstName = (decoded.username || decoded.email || 'user').trim().split(/\s+/)[0];
        const normalized = firstName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        return `${normalized || 'user'}_1`;
    } catch (error) {
        console.error('Failed to decode token for WhatsApp instance:', error);
        return '';
    }
};

const WhatsAppScanner = () => {
    const [instanceId, setInstanceId] = useState(() => {
        const canonicalId = getCanonicalInstanceIdFromToken(localStorage.getItem('token'));
        if (canonicalId) localStorage.setItem('instanceId', canonicalId);
        return canonicalId;
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
    const [showMessages, setShowMessages] = useState(false);
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messageStats, setMessageStats] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const canonicalId = getCanonicalInstanceIdFromToken(localStorage.getItem('token'));
        if (canonicalId) {
            localStorage.setItem('instanceId', canonicalId);
            setInstanceId(canonicalId);
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
            
            const currentInstanceId = getCanonicalInstanceIdFromToken(token);
            if (!currentInstanceId) {
                setError('No WhatsApp instance ID found. Please log in again.');
                setStatus('disconnected');
                setQrCode('');
                return;
            }
            localStorage.setItem('instanceId', currentInstanceId);
            setInstanceId(currentInstanceId);
            console.log('Initializing canonical instance ID:', currentInstanceId);
            const initResponse = await axios.get(`${apiUrl}/whatsapp/init/${currentInstanceId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-device-id': deviceId
                }
            });
            
            if (initResponse.data.success) {
                if (initResponse.data.instanceId) {
                    localStorage.setItem('instanceId', initResponse.data.instanceId);
                    setInstanceId(initResponse.data.instanceId);
                }
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
            let currentInstanceId = getCanonicalInstanceIdFromToken(token);
            if (currentInstanceId) {
                localStorage.setItem('instanceId', currentInstanceId);
                setInstanceId(currentInstanceId);
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
            if (response.data.instanceId) {
                localStorage.setItem('instanceId', response.data.instanceId);
                setInstanceId(response.data.instanceId);
            }
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

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const deviceId = localStorage.getItem('deviceId') || getDeviceIdFromToken(token);
            const apiUrl = process.env.REACT_APP_API_URL;
            
            const response = await axios.get(`${apiUrl}/whatsapp/conversations`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-device-id': deviceId
                }
            });
            
            if (response.data.success) {
                setConversations(response.data.conversations);
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }
    };

    const fetchConversationMessages = async (phoneNumber) => {
        try {
            const token = localStorage.getItem('token');
            const deviceId = localStorage.getItem('deviceId') || getDeviceIdFromToken(token);
            const apiUrl = process.env.REACT_APP_API_URL;
            
            const response = await axios.get(`${apiUrl}/whatsapp/conversation/${phoneNumber}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-device-id': deviceId
                }
            });
            
            if (response.data.success) {
                setMessages(response.data.messages);
                setSelectedConversation(phoneNumber);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    // Auto-refresh messages when conversation is selected
    useEffect(() => {
        if (selectedConversation && status === 'connected') {
            const refreshInterval = setInterval(() => {
                fetchConversationMessages(selectedConversation);
            }, 3000); // Refresh every 3 seconds

            return () => clearInterval(refreshInterval);
        }
    }, [selectedConversation, status]);

    // Auto-refresh conversations list when messages view is open
    useEffect(() => {
        if (showMessages && status === 'connected') {
            const refreshInterval = setInterval(() => {
                fetchConversations();
            }, 5000); // Refresh conversations every 5 seconds

            return () => clearInterval(refreshInterval);
        }
    }, [showMessages, status]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessageStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const deviceId = localStorage.getItem('deviceId') || getDeviceIdFromToken(token);
            const apiUrl = process.env.REACT_APP_API_URL;
            
            const response = await axios.get(`${apiUrl}/whatsapp/messages/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-device-id': deviceId
                }
            });
            
            if (response.data.success) {
                setMessageStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching message stats:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;
        
        try {
            setSendingMessage(true);
            const token = localStorage.getItem('token');
            const deviceId = localStorage.getItem('deviceId') || getDeviceIdFromToken(token);
            const apiUrl = process.env.REACT_APP_API_URL;
            
            const response = await axios.post(
                `${apiUrl}/whatsapp/send/${instanceId}`,
                {
                    messages: [{
                        number: selectedConversation,
                        text: newMessage
                    }]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-device-id': deviceId
                    }
                }
            );
            
            if (response.data.success) {
                setNewMessage('');
                await fetchConversationMessages(selectedConversation);
            } else {
                setError('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    const toggleMessages = () => {
        setShowMessages(!showMessages);
        if (!showMessages && status === 'connected') {
            fetchConversations();
            fetchMessageStats();
        }
    };

    const startNewConversation = () => {
        if (!newPhoneNumber.trim()) return;
        
        // Clean phone number (remove spaces, dashes, etc.)
        const cleanNumber = newPhoneNumber.replace(/[^\d+]/g, '');
        setSelectedConversation(cleanNumber);
        setShowNewConversation(false);
        setNewPhoneNumber('');
        setMessages([]);
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
                        {status === 'connected' && (
                            <button className="messages-button" onClick={toggleMessages} title="View Messages">
                                <i className="fas fa-comments"></i>
                            </button>
                        )}
                        <button className="minimize-button" onClick={toggleMinimize}>
                            <i className="fas fa-minus"></i>
                        </button>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                
                {!showMessages && (
                    <>
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
                    </>
                )}

                {showMessages && status === 'connected' && (
                    <div className="messages-container">
                        {messageStats && (
                            <div className="message-stats">
                                <div className="stat-item">
                                    <i className="fas fa-envelope"></i>
                                    <span>{messageStats.total_messages} Total</span>
                                </div>
                                <div className="stat-item">
                                    <i className="fas fa-arrow-down"></i>
                                    <span>{messageStats.incoming_messages} Received</span>
                                </div>
                                <div className="stat-item">
                                    <i className="fas fa-arrow-up"></i>
                                    <span>{messageStats.outgoing_messages} Sent</span>
                                </div>
                            </div>
                        )}

                        <div className="messages-content">
                            {!selectedConversation ? (
                                <div className="conversations-list">
                                    <div className="conversations-header">
                                        <h3>Conversations</h3>
                                        <button 
                                            className="new-message-button"
                                            onClick={() => setShowNewConversation(true)}
                                            title="New Message"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                    </div>
                                    {conversations.length === 0 ? (
                                        <div className="no-conversations">
                                            <i className="fas fa-comments" style={{fontSize: '48px', color: '#ccc', marginBottom: '15px'}}></i>
                                            <p>No conversations yet</p>
                                            <button 
                                                className="start-conversation-button"
                                                onClick={() => setShowNewConversation(true)}
                                            >
                                                <i className="fas fa-plus"></i> Start New Conversation
                                            </button>
                                        </div>
                                    ) : (
                                        conversations.map((conv, index) => (
                                            <div 
                                                key={index} 
                                                className="conversation-item"
                                                onClick={() => fetchConversationMessages(conv.phone_number)}
                                            >
                                                <div className="conversation-avatar">
                                                    <i className="fas fa-user"></i>
                                                </div>
                                                <div className="conversation-details">
                                                    <div className="conversation-name">
                                                        {conv.contact_name || conv.phone_number}
                                                    </div>
                                                    <div className="conversation-phone">{conv.phone_number}</div>
                                                    <div className="conversation-count">
                                                        {conv.message_count} messages
                                                    </div>
                                                </div>
                                                <div className="conversation-time">
                                                    {new Date(conv.last_message_created).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="conversation-view">
                                    <div className="conversation-header">
                                        <button 
                                            className="back-button" 
                                            onClick={() => {
                                                setSelectedConversation(null);
                                                setMessages([]);
                                            }}
                                        >
                                            <i className="fas fa-arrow-left"></i>
                                        </button>
                                        <h3>{selectedConversation}</h3>
                                    </div>
                                    <div className="messages-list">
                                        {messages.map((msg, index) => (
                                            <div 
                                                key={index} 
                                                className={`message-item ${msg.direction}`}
                                            >
                                                <div className="message-bubble">
                                                    {msg.message_type !== 'text_message' && msg.media_url && (
                                                        <div className="message-media">
                                                            {msg.message_type === 'image' && (
                                                                <img src={`${process.env.REACT_APP_API_URL}${msg.media_url}`} alt="Media" />
                                                            )}
                                                            {msg.message_type === 'video' && (
                                                                <video controls src={`${process.env.REACT_APP_API_URL}${msg.media_url}`} />
                                                            )}
                                                            {msg.message_type === 'audio' && (
                                                                <audio controls src={`${process.env.REACT_APP_API_URL}${msg.media_url}`} />
                                                            )}
                                                            {msg.message_type === 'document' && (
                                                                <a href={`${process.env.REACT_APP_API_URL}${msg.media_url}`} target="_blank" rel="noopener noreferrer">
                                                                    <i className="fas fa-file"></i> {msg.media_filename}
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                    {msg.message_content && (
                                                        <div className="message-text">{msg.message_content}</div>
                                                    )}
                                                    <div className="message-time">
                                                        {new Date(msg.created_at).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <div className="message-input-container">
                                        <input
                                            type="text"
                                            className="message-input"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            disabled={sendingMessage}
                                        />
                                        <button 
                                            className="send-button"
                                            onClick={sendMessage}
                                            disabled={sendingMessage || !newMessage.trim()}
                                        >
                                            {sendingMessage ? (
                                                <i className="fas fa-spinner fa-spin"></i>
                                            ) : (
                                                <i className="fas fa-paper-plane"></i>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showNewConversation && (
                    <div className="modal-overlay" onClick={() => setShowNewConversation(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>New Conversation</h3>
                                <button 
                                    className="modal-close"
                                    onClick={() => setShowNewConversation(false)}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="modal-body">
                                <label>Phone Number (with country code)</label>
                                <input
                                    type="text"
                                    className="phone-input"
                                    placeholder="e.g., +971501234567"
                                    value={newPhoneNumber}
                                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && startNewConversation()}
                                    autoFocus
                                />
                                <button 
                                    className="start-chat-button"
                                    onClick={startNewConversation}
                                    disabled={!newPhoneNumber.trim()}
                                >
                                    Start Chat
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppScanner;
