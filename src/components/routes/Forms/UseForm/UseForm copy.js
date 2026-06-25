// src/components/routes/Forms/UseForm/UseForm.js

import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import "./UseForm.css";
import LastChanges from "../LastChange/LastChange";
import EditIcon from '@mui/icons-material/Edit';  // Import edit icon
import { jwtDecode } from 'jwt-decode'; // Import as named export

const UseForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { phone_no_primary } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasDeletePermission, setHasDeletePermission] = useState(false);
    const [error, setError] = useState(null); 
    const [customer, setCustomer] = useState(null);
    const [availableAgents, setAvailableAgents] = useState([]); 
    const [editingInfo, setEditingInfo] = useState(false);
    const alertShownRef = useRef(false); // Use a ref to track if the alert has been shown

    const [formData, setFormData] = useState({
        customer_name: '',
        phone_no_primary: '',
        phone_no_secondary: '',
        email_id: '',
        address: '',
        country: '',
        designation: '',
        disposition: '',
        C_unique_id: '',
        agent_name: '',
        comment: '',
        scheduled_at: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        whatsapp_num: '',
        date_of_birth: '',
        company_name: '',
        website: '',
        other_location: '',
        contact_type: '',
        source: '',
        QUEUE_NAME: '',
        gender: ''
    });

    const [updatedData, setUpdatedData] = useState(formData);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        // Special handling for phone numbers
        if (name.includes('phone')) {
            // Allow + only at the start and numbers
            processedValue = value.replace(/[^0-9+]/g, '');
            if (processedValue.includes('+') && !processedValue.startsWith('+')) {
                processedValue = processedValue.replace('+', '');
            }
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
        setUpdatedData(prev => ({ ...prev, [name]: processedValue }));
    };

    const validateRequiredFields = () => {
        const requiredFields = ['customer_name', 'email_id', 'phone_no_primary'];
        const missingFields = requiredFields.filter(field => {
            const value = formData[field];
            return !value || (typeof value === 'string' && !value.trim());
        });
        
        if (missingFields.length > 0) {
            setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return false;
        }
        return true;
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            // Format as YYYY-MM-DDThh:mm
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    const formatPhoneForDisplay = (phone) => {
        if (!phone) return '';
        // If number starts with 00, replace with +
        if (phone.startsWith('00')) {
            return '+' + phone.substring(2);
        }
        return phone;
    };

    const formatPhoneForStorage = (phone) => {
        if (!phone) return '';
        // If number starts with +, replace with 00
        if (phone.startsWith('+')) {
            return '00' + phone.substring(1);
        }
        return phone;
    };

    const handleScheduledAtClick = (e) => {
        // Remove readonly temporarily to allow picker to show
        e.target.readOnly = false;
        e.target.showPicker();
        // Add an event listener to make it readonly again after selection
        e.target.addEventListener('blur', function onBlur() {
            e.target.readOnly = true;
            e.target.removeEventListener('blur', onBlur);
        });
    };

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL;

            // Get user data
            const userResponse = await axios.get(`${apiUrl}/current-user`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setUser(userResponse.data);
            
            // Get permissions from API response
            const permissions = userResponse.data.permissions || [];
            console.log('Latest user permissions from API:', permissions);
            
            // Check for delete permission
            const hasDeletePerm = Array.isArray(permissions) && permissions.includes('delete_customer');
            console.log('Has delete permission:', hasDeletePerm);
            setHasDeletePermission(hasDeletePerm);

                // Then get the available agents based on user's role
                try {
                    const agentsResponse = await axios.get(`${apiUrl}/players/teams`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    setAvailableAgents(agentsResponse.data);
        } catch (error) {
                    console.error('Error fetching available agents:', error);
                    setError('Failed to fetch available agents');
                }

            } catch (error) {
                console.error('Error in fetchUser:', error);
            setError('Failed to fetch user data');
            setLoading(false);
        }
    };

    const fetchCustomerData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/admin');
                return;
            }

            // Get phone number and team name from URL
            const pathParts = location.pathname.split('/');
            const teamName = pathParts[2];
            const phoneNumber = pathParts[3];
            
            if (!phoneNumber || !teamName) {
                setError('Phone number or team name not found');
                setLoading(false);
                return;
            }

            // First try to get customer data from location state
            const locationState = location.state;
            if (locationState?.customer) {
                setCustomer(locationState.customer);
                setFormData(prev => ({
                    ...prev,
                    ...locationState.customer,
                    QUEUE_NAME: locationState.queueName || prev.QUEUE_NAME
                }));
                setLoading(false);
                return;
            }

            // If no state data, fetch from API using the team-specific endpoint
            const apiUrl = process.env.REACT_APP_API_URL;
            try {
                const response = await axios.get(`${apiUrl}/team/${teamName}/${phoneNumber}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data?.exists && response.data?.customer) {
                    const customerData = response.data.customer;
                    setCustomer(customerData);
                    setFormData(prev => ({
                        ...prev,
                        ...customerData,
                        QUEUE_NAME: teamName
                    }));
                } else {
                    // If customer data is not found, redirect to create form
                    navigate(`/customers/create?team=${teamName}`, {
                        state: {
                            phone_no_primary: phoneNumber,
                            QUEUE_NAME: teamName
                        }
                    });
                    return;
                }
            } catch (error) {
                // If customer not found (404) or other error, redirect to create form
                if (error.response?.status === 404) {
                    navigate(`/customers/create?team=${teamName}`, {
                        state: {
                            phone_no_primary: phoneNumber,
                            QUEUE_NAME: teamName
                        }
                    });
                    return;
                }
                throw error; // Re-throw other errors to be caught by outer catch block
            }
            
        } catch (error) {
            console.error('Error fetching customer data:', error);
            // For any other errors, redirect to create form as well
            const teamName = location.pathname.split('/')[2];
            const phoneNumber = location.pathname.split('/')[3];
            navigate(`/customers/create?team=${teamName}`, {
                state: {
                    phone_no_primary: phoneNumber,
                    QUEUE_NAME: teamName
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/admin');
                return;
            }

            try {
                // Verify token is valid
                const decodedToken = jwtDecode(token);
                if (!decodedToken || !decodedToken.exp || Date.now() >= decodedToken.exp * 1000) {
                    localStorage.removeItem('token');
                    navigate('/admin');
                    return;
                }
                setUser(decodedToken);
                setHasDeletePermission(decodedToken.role === 'admin');
            } catch (e) {
                console.error('Invalid token:', e);
                localStorage.removeItem('token');
                navigate('/admin');
                return;
            }

            // Get team name from URL params first, then fallback to other sources
            const teamName = location.pathname.split('/')[2]; // Assuming URL pattern: /team/{teamName}/{phone}

            if (!teamName) {
                setError('Team name not found');
                setLoading(false);
                return;
            }

            // Store the team name in state and localStorage
            setFormData(prev => ({ ...prev, QUEUE_NAME: teamName }));
            localStorage.setItem('currentQueue', teamName);

            await fetchCustomerData();

        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.message || 'Error fetching data');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [navigate, phone_no_primary, location.state]);

    useEffect(() => {
        if (customer) {
            // Format phone numbers for display when loading data
            const displayData = { ...customer };
            Object.keys(displayData).forEach(key => {
                if (key.includes('phone') && displayData[key]) {
                    displayData[key] = formatPhoneForDisplay(displayData[key]);
                }
            });
            setFormData(displayData);
        }
    }, [customer]);

    const handleDelete = async () => {
        if (!hasDeletePermission) {
            alert("You do not have permission to delete customers.");
            return;
        }
        const confirmDelete = window.confirm("Are you sure you want to delete this customer?");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL;

            await axios.delete(`${apiUrl}/customers/${customer.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            alert("Customer deleted successfully.");
            navigate(`/customers/phone/${customer.phone_no_primary}`);
        } catch (error) {
            if (error.response && error.response.status === 403) {
                alert("You do not have permission to delete customers.");
                // Refresh user data to get latest permissions
                const fetchUser = async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const apiUrl = process.env.REACT_APP_API_URL;

                        // First get the current user's data
                        const userResponse = await axios.get(`${apiUrl}/current-user`, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        setUser(userResponse.data);
                        
                        // Get permissions from API response only
                        const permissions = userResponse.data.permissions || [];
                        console.log('Latest user permissions from API:', permissions);
                        
                        // Check if delete_customer permission exists in the array
                        const hasDeletePerm = Array.isArray(permissions) && permissions.includes('delete_customer');
                        console.log('Has delete permission:', hasDeletePerm);
                        setHasDeletePermission(hasDeletePerm);

                        // Then get the available agents based on user's role
                        try {
                            const agentsResponse = await axios.get(`${apiUrl}/players/teams`, {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            setAvailableAgents(agentsResponse.data);
                        } catch (error) {
                            console.error('Error fetching available agents:', error);
                            setError('Failed to fetch available agents');
                        }

                    } catch (error) {
                        console.error('Error in fetchUser:', error);
                        setError('Failed to fetch user data');
                        setLoading(false);
                    }
                };
                await fetchUser();
            } else {
                console.error("Error deleting customer:", error);
                alert("Failed to delete customer. Please try again.");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // First validate required fields
        const requiredFields = {
            'customer_name': 'Customer Name',
            'phone_no_primary': 'Primary Phone Number',
            'email_id': 'Email'
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([field]) => !formData[field] || !formData[field].trim())
            .map(([_, label]) => label);

        if (missingFields.length > 0) {
            alert(`Please fill in the following mandatory details:\n• ${missingFields.join('\n• ')}`);
            return;
        }

        // Check if any fields have actually changed
        const changedFields = {};
        Object.keys(formData).forEach(key => {
            if (formData[key] !== customer[key]) {
                changedFields[key] = formData[key];
            }
        });

        // If no fields changed, return early without making API call
        if (Object.keys(changedFields).length === 0) {
            navigate(`/team/${formData.QUEUE_NAME}`);
            return;
        }

        // Validate phone number length (excluding + if present)
        const phoneLength = formData.phone_no_primary.replace('+', '').length;
        if (phoneLength < 8) {
            alert('Primary phone number must be at least 8 digits');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL;
            
            // Update customer data - only send changed fields
            const response = await axios.put(
                `${apiUrl}/customers/${customer.id}`, 
                changedFields,
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setCustomer(formData);
            setFormData(formData);
            
            // Get the team name from either the URL params, form data, or localStorage
            const teamName = formData.QUEUE_NAME || location.state?.queueName || localStorage.getItem('currentQueue');
            
            // Navigate to the team page
            if (teamName) {
                navigate(`/team/${teamName}`);
            } else {
                console.warn('No team name found for navigation');
                navigate('/customers/search'); // Fallback to search page if no team name
            }
        } catch (error) {
            console.error('Update error:', error);
            const backendErrors = error.response?.data?.errors;
            if (backendErrors) {
                alert(`Update failed: ${backendErrors.join('\n')}`);
            } else {
                alert('Failed to update customer. Please try again.');
            }
        }
    };
    
    if (loading) return <div>Loading customer data...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <div className="header-containerrr">
                <h2 className="list_form_headiii">EDIT RECORD</h2>
            </div>
            <div className="use-last-container">
                <div className="use-form-container">
                    <div className="customer-info-header">
                        <div className="customer-info-section">
                            <div className="customer-name">
                                {formData.customer_name || `${formData.first_name || ''} ${formData.middle_name || ''} ${formData.last_name || ''}`}
                            </div>
                            <div className="customer-phone">
                                {formatPhoneForDisplay(formData.phone_no_primary)}
                            </div>
                        </div>
                        <EditIcon 
                            className={`edit-icon ${editingInfo ? 'active' : ''}`}
                            onClick={() => {
                                setEditingInfo(!editingInfo);
                                if (!editingInfo) {
                                    setTimeout(() => document.querySelector('input[name="customer_name"]')?.focus(), 100);
                                }
                            }} 
                        />
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-fields-grid">
                            {[
                                ...(editingInfo ? [
                                    { 
                                        label: "Customer Name", name: "customer_name", required: true
                                    },
                                    { 
                                        label: "Phone", name: "phone_no_primary", required: true,
                                        type: "tel", maxLength: "15",
                                        pattern: "^\\+?[0-9]{8,14}$"
                                    }
                                ] : []),
                                { 
                                    label: "Alternate Phone", name: "phone_no_secondary", 
                                    type: "tel", maxLength: "15",
                                    pattern: "^\\+?[0-9]{8,14}$"
                                },
                                { 
                                    label: "Email", name: "email_id", required: true 
                                },
                                { 
                                    label: "Address", name: "address"
                                },
                                { 
                                    label: "Country", name: "country"
                                },
                                { 
                                    label: "Designation", name: "designation"
                                },
                                { 
                                    label: "Queue Name", name: "QUEUE_NAME"
                                }
                            ].map(({ label, name, type = "text", disabled, maxLength, required, pattern }) => (
                                <div key={name} className="label-inputt">
                                    <label>{label}{required && <span className="required"> *</span>}:</label>
                                    <input
                                        type={type}
                                        name={name}
                                        value={formData[name] || ''}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        maxLength={maxLength}
                                        pattern={pattern}
                                    />
                                </div>
                            ))}

                            {/* Agent Name Field */}
                            <div className="label-inputt">
                                <label>Agent Name:</label>
                                <input
                                    type="text"
                                    name="agent_name"
                                    value={formData.agent_name || ''}
                                    disabled
                                    className="agent-input"
                                />
                            </div>

                            {/* Disposition Dropdown */}
                            <div className="label-inputt">
                                <label>Disposition:</label>
                                <select 
                                    name="disposition" 
                                    value={formData.disposition || ''} 
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

                            {/* Schedule Call */}
                            <div className="label-inputt">
                                <label>Schedule Call:</label>
                                <input
                                    type="datetime-local"
                                    name="scheduled_at"
                                    value={formData.scheduled_at || ''}
                                    onChange={handleInputChange}
                                    onKeyDown={(e) => e.preventDefault()}
                                    onClick={handleScheduledAtClick}
                                    style={{ cursor: 'pointer' }}
                                    className="sche_input"
                                />
                            </div>
                        </div>

                        {/* Comment Section - Full Width */}
                        <div className="label-inputt comment">
                            <label>Comment:</label>
                            <div className="textarea-container">
                                <textarea
                                    name="comment"
                                    value={formData.comment || ''}
                                    onChange={handleInputChange}
                                    rows="6"
                                    placeholder="Enter any additional comment"
                                    className="comet"
                                />
                            </div>
                        </div>

                        <button className="sbt-use-btn" type="submit">Update</button>
                    </form>
                    {hasDeletePermission && (  
                        <button 
                            onClick={handleDelete} 
                            className="add-field-btnnn"
                            aria-label="Delete customer"
                        >
                            Delete Record
                        </button>
                    )}
                </div>

                <div>
                    {/* Pass customerId to LastChanges */}
                    <LastChanges 
                        customerId={customer?.id || ''} 
                        phone_no_primary={formData?.phone_no_primary || ''}
                    />
                </div>
            </div>

        </div>
    );
};

export default UseForm;