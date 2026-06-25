// src/components/routes/Forms/LastChange/LastChanges.js

import React, { useState, useEffect } from "react";
import axios from "axios"; // Import axios for making API requests
import "./LastChange.css";

const LastChanges = ({ customerId, phone_no_primary }) => {
  const [changes, setChanges] = useState([]);

  useEffect(() => {
    const fetchChangeHistory = async () => {
      if (!customerId) {
        console.log('Waiting for customer ID...');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL;
        console.log('Fetching changes for customer:', customerId);
        
        const response = await axios.get(
          `${apiUrl}/customers/log-change/${customerId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data?.changeHistory) {
          console.log('Found changes:', response.data.changeHistory.length);
          setChanges(response.data.changeHistory);
        } else if (response.data?.changes) {
          console.log('Found changes from update:', response.data.changes.length);
          setChanges(response.data.changes);
        } else {
          console.log('No changes found in response');
          setChanges([]);
        }
      } catch (error) {
        console.error("Error fetching change history:", error);
        if (error.response?.status === 403) {
          console.error("Authorization error:", error.response.data);
        }
        setChanges([]);
      }
    };

    fetchChangeHistory();
  }, [customerId]); // Fetch history whenever customerId changes
  
  // Field name mapping
  const fieldLabels = {
    'first_name': 'First Name',
    'middle_name': 'Middle Name',
    'last_name': 'Last Name',
    'phone_no_primary': 'Phone',
    'phone_no_secondary': 'Alternate Phone',
    'whatsapp_num': 'Whatsapp',
    'email_id': 'Email',
    'date_of_birth': 'Date of Birth',
    'gender': 'Gender',
    'address': 'Address',
    'country': 'Country',
    'company_name': 'Company Name',
    'designation': 'Designation',
    'website': 'Website',
    'other_location': 'Other Location',
    'contact_type': 'Contact Type',
    'source': 'Source',
    'disposition': 'Disposition',
    'QUEUE_NAME': 'Queue Name',
    'agent_name': 'Assigned Agent',
    'comment': 'Comment',
    'scheduled_at': 'Call Scheduler'
  };

  return (
    <div className="last-changes-container">
        <div className="last-headi">Update History</div>
        {changes.length > 0 ? (
            changes.map((change, index) => (
            <p className="changes-content" key={index}>
              <strong>{change.changed_by}</strong> updated <strong>{fieldLabels[change.field] || change.field},</strong>{" "}
              from <em>{change.old_value || "N/A"}</em>{" "}
              <strong>to</strong> <em>{change.new_value || "N/A"}</em> {" "}
              <strong>at</strong> {new Date(change.changed_at).toLocaleString('en-GB', { 
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' 
              })} {" "}
            </p>
            ))
        ) : (
            <p>No changes detected.</p>
        )}
    </div> 
  );
};

export default LastChanges;
