// src/components/routes/Other/Reminder/Reminder.js

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { usePopup } from '../../../../context/PopupContext';
import { useNavigate } from 'react-router-dom';
import './Reminder.css';

const Reminder = () => {
    const { addPopupMessage } = usePopup();
    const [reminders, setReminders] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // const fetchAllReminders = async () => {
    //     try {
    //         const token = localStorage.getItem('token');

    //         if (!token) {
    //             setError('No authentication token found');
    //             return;
    //         }

    //         // Add API version to the endpoint
    //         const response = await axios.get(`${process.env.REACT_APP_API_URL}/customers/reminders`, {
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'Content-Type': 'application/json'
    //             }
    //         });

    //         if (response.data && Array.isArray(response.data)) {
    //             // Filter out past reminders and sort by scheduled_at
    //             const now = new Date();
    //             const futureReminders = response.data
    //                 .filter(reminder => new Date(reminder.scheduled_at) > now)
    //                 .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
                
    //             setReminders(futureReminders);
    //             setError(null);
    //         } else {
    //             console.error('Invalid response format:', response.data);
    //             setReminders([]);
    //             setError('No upcoming reminders found');
    //         }
    //     } catch (error) {
    //         console.error('Error fetching reminders:', {
    //             message: error.message,
    //             status: error.response?.status,
    //             statusText: error.response?.statusText,
    //             url: error.config?.url,
    //             method: error.config?.method,
    //             response: error.response?.data
    //         });
            
    //         if (error.response?.status === 401) {
    //             navigate('/admin');
    //         } else if (error.response?.status === 404) {
    //             setError('Reminder service not found. Please check the API endpoint.');
    //         } else {
    //             setError('Failed to fetch reminders. Please try again later.');
    //         }
    //     }
    // };

    // Fallback function to try alternative endpoint
    

    const fetchRemindersFallback = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/customers/reminders`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.data && Array.isArray(response.data)) {
                const now = new Date();
                const futureReminders = response.data
                    .filter(reminder => new Date(reminder.scheduled_at) > now)
                    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

                setReminders(futureReminders);
                setError(null);
            }
        } catch (fallbackError) {
            console.error('Fallback error:', fallbackError);
            setError('Reminder service is currently unavailable. Please try again later.');
        }
    }, []);

    const fetchAllReminders = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found');
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/customers/getAllReminders`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.data && Array.isArray(response.data)) {
                const now = new Date();
                const futureReminders = response.data
                    .filter(reminder => new Date(reminder.scheduled_at) > now)
                    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

                setReminders(futureReminders);
                setError(null);
            } else {
                setReminders([]);
                setError('No upcoming reminders found');
            }
        } catch (error) {
            console.error('Error fetching reminders:', error);

            if (error.response?.status === 401) {
                navigate('/admin');
            } else if (error.code === 'ECONNABORTED') {
                setError('Request timed out. Please check your connection.');
            } else if (error.response?.status === 404) {
                await fetchRemindersFallback(); // Use the fallback
            } else {
                setError('Failed to fetch reminders. Please try again later.');
            }
        }
    }, [navigate, fetchRemindersFallback]);

    useEffect(() => {
        fetchAllReminders(); // Initial fetch
        const interval = setInterval(fetchAllReminders, 60000); // Re-fetch every minute
        return () => clearInterval(interval); // Cleanup
    }, [fetchAllReminders]);

    const formatDateTime = (dateTime) => {
        return new Date(dateTime).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleReminderClick = (reminder) => {
        navigate(`/customers/phone/${reminder.phone_no_primary}`, {
            state: { customer: reminder }
        });
    };

    return (
        <div>
            <h2 className='reminder-head'>Upcoming Reminders</h2>
            <div className="reminder-container">
            {error && <div className="error-message">{error}</div>}
            <div className="reminders-list">
                {reminders && reminders.length > 0 ? (
                    reminders.map((reminder) => (
                        <div 
                            key={reminder.id} 
                            className="reminder-card"
                            onClick={() => handleReminderClick(reminder)}
                        >
                            <div className="reminder-header">
                                <h3>{reminder.customer_name}</h3>
                                <span className="team-badge">
                                    {reminder.QUEUE_NAME.replace(/\s+/g, '_')}
                                </span>
                            </div>
                            <div className="reminder-content">
                                <p className="reminder-comment">{reminder.comment}</p>
                                <div className="reminder-time">
                                    <i className="far fa-clock"></i>
                                    {formatDateTime(reminder.scheduled_at)}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-reminders">
                        No upcoming reminders found
                    </div>
                )}
            </div>

            </div>
        </div>
    );
};

export default Reminder;
