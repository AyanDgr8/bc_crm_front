// src/components/routes/Forms/CreateForm/CreateForm.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "./CreateForm.css";

const CreateForm = () => {
  const { phone_no_primary } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_no_primary: phone_no_primary || location.state?.phone_no_primary || '',
    phone_no_secondary: '',
    email_id: '',
    address: '',
    country: '',
    disposition: '',
    designation: '',
    QUEUE_NAME: location.state?.QUEUE_NAME || '',
    comment: '',
    scheduled_at: '',
  });

  const [formSuccess, setFormSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get team from URL query parameter or state
    const params = new URLSearchParams(location.search);
    const teamName = location.state?.QUEUE_NAME || params.get('team');
    if (teamName) {
      setFormData(prev => ({
        ...prev,
        QUEUE_NAME: teamName
      }));
    }
  }, [location.search, location.state]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/admin');
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/current-queue`, {
          headers: { Authorization: `Bearer ${token}` },
        });

      } catch (error) {
        console.error('Error fetching queue info:', error);
        if (error.response?.status === 401) {
          navigate('/admin');
        } else {
          setError('Error loading queue data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Handle input changes
  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    // Prevent QUEUE_NAME from being changed
    if (name === 'QUEUE_NAME') return;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'phone_no_primary') {
      handlePhoneChange(e);
    }
  };

  const handlePhoneChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check if a customer with this phone number exists
    if (name === 'phone_no_primary' && value) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/admin');
          return;
        }

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/customers/check/${value}/${formData.QUEUE_NAME}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.exists) {
          const latestRecord = response.data.existingCustomer;
          setError(response.data.message);
          
          // Auto-fill form with existing data
          setFormData(prev => ({
            ...prev,
            customer_name: latestRecord?.customer_name || prev.customer_name,
            phone_no_primary: value,
            phone_no_secondary: latestRecord?.phone_no_secondary || prev.phone_no_secondary,
            email_id: latestRecord?.email_id || prev.email_id,
            address: latestRecord?.address || prev.address,
            country: latestRecord?.country || prev.country,
            designation: latestRecord?.designation || prev.designation,
            disposition: latestRecord?.disposition || prev.disposition,
            comment: latestRecord?.comment || prev.comment,
            C_unique_id: response.data.suggestedId // Use the suggested new version ID
          }));
        } else {
          setError('');
          // Clear version-related fields but keep the phone number
          setFormData(prev => ({
            ...prev,
            C_unique_id: '',
            phone_no_primary: value
          }));
        }
      } catch (err) {
        console.error('Error checking phone number:', err);
      }
    }
  };

  // // Handle scheduled_at click
  // const handleScheduledAtClick = () => {
  //   console.log('Scheduling a call');
  // };

  // Validate required fields
  const validateRequiredFields = () => {
    const requiredFields = [
      "customer_name", "phone_no_primary", "QUEUE_NAME"
    ];

    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        setError(`Please fill out the "${field.replace(/_/g, ' ').toUpperCase()}" field.`);
        return false;
      }
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFormSuccess(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin');
        return;
      }

      // Get username from token
      let username;
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        username = tokenData.username;
        if (!username) {
          throw new Error('Username not found in token');
        }
      } catch (err) {
        console.error('Error getting username from token:', err);
        setError('Authentication error. Please log in again.');
        return;
      }

      // Add username to form data
      const dataToSend = {
        ...formData
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/customers/create`,
        dataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        try {
          // Send email notification first
          await axios.post(
            `${process.env.REACT_APP_API_URL}/send-customer-email`,
            {
              customerId: response.data.customerId,
              teamId: response.data.customer.team_id
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          // Then try to send WhatsApp notification
          try {
            await axios.post(
              `${process.env.REACT_APP_API_URL}/send-whatsapp`,
              {
                customerId: response.data.customerId,
                teamId: response.data.customer.team_id,
                instanceId: localStorage.getItem('instanceId') || ''
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (whatsappError) {
            console.error('Failed to send WhatsApp notification:', whatsappError);
            if (whatsappError.response?.data?.code === 'WHATSAPP_NOT_READY') {
              setError('Record created successfully, but WhatsApp message could not be sent - WhatsApp is not ready');
            } else if (whatsappError.response?.data?.error?.code === 'ECONNREFUSED') {
              setError('Record created successfully, but WhatsApp message could not be sent - WhatsApp is disconnected');
            } else {
              setError('Record created successfully, but WhatsApp message could not be sent');
            }
          }

          setFormSuccess(true);
          setTimeout(() => {
            navigate(`/dashboard/customers/search?team=${formData.QUEUE_NAME.replace(/\s+/g, '_')}`);
          }, 2000);

        } catch (notificationError) {
          console.error('Failed to send notifications:', notificationError);
          setFormSuccess(true);
          setError('Record created successfully, but notifications could not be sent');
          setTimeout(() => {
            navigate(`/dashboard/customers/search?team=${formData.QUEUE_NAME.replace(/\s+/g, '_')}`);
          }, 2000);
        }
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred while creating the record.');
      }
      setFormSuccess(false);
      console.error('Error creating record:', err);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="create_form_headiii">New Enquiry</h2>
      <div className="create-form-container">
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-section">
            <div className="form-section-title">Basic Information</div>
            <div className="form-row">
              <div className="labell-input ">
                <label>Phone Number<span className="required"> *</span>:</label>
                <input
                  type="tel"
                  name="phone_no_primary"
                  value={formData.phone_no_primary}
                  onChange={handleInputChange}
                  required
                  maxLength={15}
                />
              </div>
              
              <div className="labell-input customer-field">
                <label>Customer Name<span className="required"> *</span>:</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="labell-input">
                <label>Email:</label>
                <input
                  type="email"
                  name="email_id"
                  value={formData.email_id}
                  onChange={handleInputChange}
                />
              </div>
              <div className="labell-input">
                <label>Alternative Number:</label>
                <input
                  type="text"
                  name="phone_no_secondary"
                  value={formData.phone_no_secondary}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Additional Details</div>
            
            {/* First row: Address and Country */}
            <div className="form-row">
              <div className="labell-input">
                <label>Address:</label>
                <input 
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
              <div className="labell-input">
                <label>Country:</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Second row: Designation and Disposition */}
            <div className="form-row">
              <div className="labell-input">
                <label>Designation:</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                />
              </div>
              <div className="labell-input">
                <label>Disposition:</label>
                <select
                  name="disposition"
                  value={formData.disposition}
                  onChange={handleInputChange}
                >
                  <option value="">Select Disposition</option>
                  <option value="call_back">Call Back</option>
                  <option value="schedule_visit">Schedule Visit</option>
                  <option value="office_visit">Office Visit</option>
                  <option value="urgent_required">Urgent Required</option>
                  <option value="interested">Interested</option>
                  <option value="utility_call">Utility Call</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>

            {/* Third row: Comment */}
            <div className="form-row">
              <div className="labell-input">
                <label>Comment:</label>
                <input
                  type="text"
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="Enter any additional comments..."
                />
              </div>

              <div className="labell-input">
                <label>Reminder:</label>
                <input
                  type="datetime-local"
                  name="scheduled_at"
                  value={formData.scheduled_at}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="errorr-messagee">
              <div className="error-content">
                <span className="error-text">{error}</span>
                {/* {formData.C_unique_id && (
                  // <span className="version-info">
                  //   Next version: {formData.C_unique_id}
                  // </span>
                )} */}
              </div>
            </div>
          )}
          {formSuccess && (
            <div className="successs-message">Record created successfully!</div>
          )}

          <div className="buttonn-container">
            <button type="submit" className="submit-buttonn">
              Create Record
            </button>
          </div>
        </form>
      </div>
      
    </div>
  );
};

export default CreateForm;
