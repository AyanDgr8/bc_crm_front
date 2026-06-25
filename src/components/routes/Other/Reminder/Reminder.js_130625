// src/components/routes/Other/Reminder/Reminder.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { usePopup } from '../../../../context/PopupContext';
import { useNavigate } from 'react-router-dom';
import './Reminder.css';

const Reminder = () => {
    const { addPopupMessage } = usePopup();
    const [reminders, setReminders] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchAllReminders = async () => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL;
            const token = localStorage.getItem('token');

            if (!token) {
                setError('No authentication token found');
                return;
            }

            const response = await axios.get(`${apiUrl}/customers/getAllReminders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Sort reminders by scheduled_at
            const sortedReminders = response.data.sort((a, b) => {
                return new Date(a.scheduled_at) - new Date(b.scheduled_at);
            });

            setReminders(sortedReminders);

        } catch (error) {
            console.error('Error fetching reminders:', error);
            setError('Error fetching reminders: ' + error.message);
        }
    };

    // Handle click on a reminder record
    const handleRecordClick = (customer) => {
        navigate(`/customers/phone/${customer.phone_no_primary}`, { 
            state: { 
                customer: customer,
                fromReminder: true
            } 
        });
    };

    useEffect(() => {
        // Initial fetch
        fetchAllReminders();

        // Set up polling every minute
        const interval = setInterval(fetchAllReminders, 60000);

        return () => clearInterval(interval);
    }, []);

    // Function to determine the status color
    const getStatusColor = (scheduledAt) => {
        const minutesUntil = Math.floor((new Date(scheduledAt) - new Date()) / (1000 * 60));
        if (minutesUntil <= 5) return 'red';
        if (minutesUntil <= 15) return 'orange';
        return 'green';
    };

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div>
            <h2 className='list_reminder_headi'>Upcoming Reminders</h2>
            <div className="reminders-container">
                <div className="reminders-list">
                    {reminders.length === 0 ? (
                        <p>No upcoming reminders</p>
                    ) : (
                        reminders.map((reminder, index) => (
                            <div 
                                key={index} 
                                className={`reminder-item ${getStatusColor(reminder.scheduled_at)}`}
                                onClick={() => handleRecordClick(reminder)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="customer-info">
                                    <p><strong>Name:</strong> {reminder.first_name} {reminder.middle_name || ''} {reminder.last_name}</p>
                                    <p><strong>Phone:</strong> {reminder.phone_no_primary}</p>
                                    <p><strong>Agent:</strong> {reminder.agent_name}</p>
                                    {reminder.team_name && (
                                        <p><strong>Team:</strong> {reminder.team_name}</p>
                                    )}
                                </div>
                                <div className="time-info">
                                    <p><strong>Scheduled At:</strong> {new Date(reminder.scheduled_at).toLocaleString()}</p>
                                    <p><strong>Time Until Call:</strong> {Math.floor((new Date(reminder.scheduled_at) - new Date()) / (1000 * 60))} minutes</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reminder;