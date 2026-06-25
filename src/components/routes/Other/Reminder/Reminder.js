// src/components/routes/Other/Reminder/Reminder.js

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Reminder.css';

const sortReminders = (items) => {
    const now = new Date();
    return [...items].sort((a, b) => {
        const aTime = new Date(a.scheduled_at);
        const bTime = new Date(b.scheduled_at);
        const aPast = aTime < now;
        const bPast = bTime < now;

        if (aPast !== bPast) return aPast ? 1 : -1;
        return aTime - bTime;
    });
};

const Reminder = () => {
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
                setReminders(sortReminders(response.data));
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
                setReminders(sortReminders(response.data));
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
        navigate(`/dashboard/team/${reminder.QUEUE_NAME}/${reminder.phone_no_primary}`, {
            state: { customer: reminder }
        });
    };

    const getMinutesUntil = (scheduledAt) => {
        return Math.floor((new Date(scheduledAt) - new Date()) / (1000 * 60));
    };

    const getReminderTone = (scheduledAt) => {
        const minutesUntil = getMinutesUntil(scheduledAt);
        if (minutesUntil < 0) return 'past';
        if (minutesUntil <= 5) return 'urgent';
        if (minutesUntil <= 15) return 'soon';
        return 'later';
    };

    const getCompanyName = (reminder) => reminder.QUEUE_NAME || reminder.team_name || 'Unknown Company';

    const groupedReminders = reminders.reduce((groups, reminder) => {
        const company = getCompanyName(reminder);
        if (!groups[company]) groups[company] = [];
        groups[company].push(reminder);
        return groups;
    }, {});

    const companyGroups = Object.entries(groupedReminders)
        .map(([company, items]) => ({
            company,
            items: sortReminders(items),
            activeItems: sortReminders(items.filter((item) => new Date(item.scheduled_at) >= new Date())),
            pastItems: sortReminders(items.filter((item) => new Date(item.scheduled_at) < new Date())),
            activeCount: items.filter((item) => new Date(item.scheduled_at) >= new Date()).length,
            firstTime: sortReminders(items)[0]?.scheduled_at
        }))
        .sort((a, b) => new Date(a.firstTime) - new Date(b.firstTime));

    return (
        <div>
            <h2 className='reminder-head'>Reminders</h2>
            <div className="reminder-container">
            {error && <div className="error-message">{error}</div>}
            <div className="reminders-list">
                {companyGroups.length > 0 ? (
                    companyGroups.map((group) => (
                        <section className="reminder-company-card" key={group.company}>
                            <div className="reminder-company-header">
                                <h3>{group.company.replace(/_/g, ' ')}</h3>
                                <span>{group.activeCount}</span>
                            </div>
                            <div className="company-reminders">
                                <div className="active-reminders">
                                    {group.activeItems.map((reminder) => (
                                        <div
                                            key={`${reminder.id}-${reminder.scheduled_at}`}
                                            className={`reminder-card ${getReminderTone(reminder.scheduled_at)}`}
                                            onClick={() => handleReminderClick(reminder)}
                                        >
                                            <div className="reminder-header">
                                                <h4>{reminder.customer_name || 'Unnamed Customer'}</h4>
                                                <span>{formatDateTime(reminder.scheduled_at)}</span>
                                            </div>
                                            <p className="reminder-comment">{reminder.comment || 'No comment'}</p>
                                        </div>
                                    ))}
                                </div>
                                {group.pastItems.length > 0 && (
                                    <div className="past-reminders">
                                        {group.pastItems.map((reminder) => (
                                            <div
                                                key={`${reminder.id}-${reminder.scheduled_at}`}
                                                className={`reminder-card ${getReminderTone(reminder.scheduled_at)}`}
                                                onClick={() => handleReminderClick(reminder)}
                                            >
                                                <div className="reminder-header">
                                                    <h4>{reminder.customer_name || 'Unnamed Customer'}</h4>
                                                    <span>{formatDateTime(reminder.scheduled_at)}</span>
                                                </div>
                                                <p className="reminder-comment">{reminder.comment || 'No comment'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    ))
                ) : (
                    <div className="no-reminders">
                        No reminders found
                    </div>
                )}
            </div>

            </div>
        </div>
    );
};

export default Reminder;
