// src/components/routes/Other/Popup/Popup.js

import React from 'react';
import { usePopup } from '../../../../context/PopupContext';
import { useNavigate } from 'react-router-dom';
import './Popup.css';

const Popup = () => {
    const { popupMessages, removePopupMessage } = usePopup();
    const navigate = useNavigate();

   
    const handleRecordClick = (customer, index) => {
        // First remove the popup
        removePopupMessage(index);
        
        // Navigate to UseForm without embedding stale customer data.
        // UseForm will fetch the freshest record from the server using the phone number.
        navigate(`/dashboard/team/${customer.QUEUE_NAME || customer.team_name}/${customer.phone_no_primary}`, { 
            state: { 
                customer: customer,
                fromReminder: true
            },
            replace: true // Use replace to prevent back navigation to popup
        });
    };

    const handleClick = (message, index) => {
        if (message.customer) {
            handleRecordClick(message.customer, index);
        } else if (message.onClick) {
            message.onClick();
            removePopupMessage(index);
        }
    };

    if (popupMessages.length === 0) {
        return null;
    }

    return (
        <div className="popup-container">
            {popupMessages.map((message, index) => (
                <div
                    key={index}
                    className={`popup-message ${message.color || message.priority}`}
                    onClick={() => handleClick(message, index)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="popup-topline">
                        <span className="popup-pill">Reminder</span>
                        {message.minutesUntil !== undefined && (
                            <span className="popup-countdown">{message.minutesUntil} min</span>
                        )}
                    </div>
                    <div className="popup-content">
                        <div className="customer-details">
                            <h4>{message.customer?.customer_name || 'Customer Reminder'}</h4>
                            <p><strong>Phone</strong> {message.customer?.phone_no_primary || 'N/A'}</p>
                            {message.customer?.team_name && (
                                <p><strong>Company</strong> {message.customer?.team_name}</p>
                            )}
                        </div>
                        {message.minutesUntil !== undefined && (
                            <div className="time-info">
                                <p><strong>Scheduled</strong> {message.customer?.scheduled_at && new Date(message.customer.scheduled_at).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                    <button 
                        className="close-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            removePopupMessage(index);
                        }}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Popup;
