// src/components/routes/Forms/AdminPortal/Business/Business.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Business.css';

const lookbackOptions = [
    { label: '10 mins', value: 600 },
    { label: '15 mins', value: 900 },
    { label: '20 mins', value: 1200 },
    { label: 'Half hour', value: 1800 },
    { label: '45 minutes', value: 2700 },
    { label: '1 hour', value: 3600 },
    { label: '2 hours', value: 7200 },
    { label: '3 hours', value: 10800 }
];

const Business = () => {
    const [businesses, setBusinesses] = useState([]);
    const [receptionists, setReceptionists] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [brandLimits, setBrandLimits] = useState(null);
    const [isBusinessAdmin, setIsBusinessAdmin] = useState(false);
    const [agentStatsConfigs, setAgentStatsConfigs] = useState([]);
    const [configBusiness, setConfigBusiness] = useState(null);
    const [agentStatsConfigForm, setAgentStatsConfigForm] = useState({
        tenant_name: '',
        base_url: '',
        x_account_id: '',
        lookback_seconds: 3600,
        is_active: true
    });
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        business_name: '',
        business_phone: '',
        business_whatsapp: '',
        business_email: '',
        business_password: '',
        business_person: '',
        business_address: '',
        business_country: '',
        business_tax_id: '',
        business_reg_no: '',
        other_detail: ''
    });

    const fetchBusinesses = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/admin');
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/business`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setBusinesses(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching businesses:', error);
            setError(error.response?.data?.message || 'You do not have access to any business centers');
            setBusinesses([]);
            setIsLoading(false);
        }
    };

    const fetchBrandLimits = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/brand/limits`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setBrandLimits(response.data);
        } catch (error) {
            console.error('Error fetching brand limits:', error);
            // setError('Error fetching brand limits');
        }
    };

    const fetchReceptionists = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/receptionist`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setReceptionists(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching receptionists:', error);
            setReceptionists([]);
        }
    };

    const fetchAgentStatsConfigs = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/agent-stats/configs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAgentStatsConfigs(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching agent stats configs:', error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/admin');
            return;
        }

        // Check if user is business_admin
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const isBusinessAdmin = tokenData.role === 'business_admin';

        // Set the role state
        setIsBusinessAdmin(isBusinessAdmin);

        // Hide add business button for business_admin
        if (isBusinessAdmin) {
            setShowForm(false);
        }

        fetchBusinesses();
        fetchReceptionists();
        fetchBrandLimits();
        fetchAgentStatsConfigs();
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Special handling for phone numbers to only allow numbers and + sign at start
        if (name === 'business_phone' || name === 'business_whatsapp') {
            // Only allow + at the start and numbers
            const sanitizedValue = value.replace(/[^\d+]/g, '');
            // Ensure + only appears at the start
            const finalValue = sanitizedValue.replace(/\+/g, (match, offset) => offset === 0 ? match : '');
            setFormData(prev => ({
                ...prev,
                [name]: finalValue
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Business name: allow letters, numbers, spaces and common symbols (&, -, ., ',', apostrophe)
        const businessNameRegex = /^[A-Za-z0-9\s&.,'’\-]{1,100}$/;
        // Contact person: letters and spaces only
        const personNameRegex = /^[A-Za-z\s]{1,100}$/;

        if (!businessNameRegex.test(formData.business_name)) {
            setError('Business Center name can include letters, numbers, spaces and these symbols: & . , - \'. It must be 1–100 characters long.');
            return;
        }
        if (!personNameRegex.test(formData.business_person)) {
            setError('Contact person name must contain only alphabets and be less than 100 characters');
            return;
        }

        // Validation for phone numbers (numbers only, optional + prefix, max 15 digits)
        const phoneRegex = /^\+?\d{1,15}$/;
        if (!phoneRegex.test(formData.business_phone)) {
            setError('Phone number must contain only numbers (max 15 digits) with an optional + prefix');
            return;
        }
        // if (!phoneRegex.test(formData.business_whatsapp)) {
        //     setError('WhatsApp number must contain only numbers (max 15 digits) with an optional + prefix');
        //     return;
        // }

        // Validation for business_email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(formData.business_email)) {
            setError('Please enter a valid email address');
            return;
        }

        // Validation for business_tax_id and business_reg_no (max 50 chars)
        if (formData.business_tax_id.length > 50) {
            setError('Tax ID must not exceed 50 characters');
            return;
        }
        if (formData.business_reg_no.length > 50) {
            setError('Registration number must not exceed 50 characters');
            return;
        }

        try {
            if (!editingBusiness && businesses.length >= brandLimits?.centers) {
                setError(`Cannot create more business centers. Brand limit (${brandLimits.centers}) reached.`);
                setTimeout(() => setError(''), 3000);
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            // Get brand_id from JWT token
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            const brand_id = tokenData.brand_id;
            const brand_name = tokenData.username;

            const url = editingBusiness
                ? `${process.env.REACT_APP_API_URL}/business/${editingBusiness.id}`
                : `${process.env.REACT_APP_API_URL}/business`;

            const method = editingBusiness ? 'put' : 'post';

            const dataToSend = {
                ...formData,
                brand_id,
                brand_name
            };

            const response = await axios[method](url, dataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccess(editingBusiness ? 'Business updated successfully!' : 'Business created successfully!');
            resetForm();
            fetchBusinesses();
            fetchReceptionists();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error:', error);
            
            // Get the SQL error message from the response
            const sqlError = error.response?.data;
            
            if (sqlError?.code === 'ER_DUP_ENTRY') {
                if (sqlError.sqlMessage.includes('users.email')) {
                    setError('This email address is already registered in the system. Please use a different email address.');
                } else if (sqlError.sqlMessage.includes('users.username')) {
                    setError('This username is already taken. Please use a different name.');
                } else {
                    setError('A duplicate entry was detected. Please check your input.');
                }
            } else {
                setError(error.response?.data?.message || 'An error occurred while creating the business center');
            }
            
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleEdit = (business) => {
        const token = localStorage.getItem('token');
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        
        // Prevent business_admin from editing
        if (tokenData.role === 'business_admin') {
            setError('Business admins cannot edit business center details');
            setTimeout(() => setError(''), 3000);
            return;
        }

        setEditingBusiness(business);
        setFormData({
            business_name: business.business_name,
            business_phone: business.business_phone,
            business_whatsapp: business.business_whatsapp,
            business_email: business.business_email,
            business_password: business.business_password || '',
            business_person: business.business_person,
            business_address: business.business_address,
            business_country: business.business_country,
            business_tax_id: business.business_tax_id,
            business_reg_no: business.business_reg_no,
            other_detail: business.other_detail || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        
        // Prevent business_admin from deleting
        if (tokenData.role === 'business_admin') {
            setError('Business admins cannot delete business centers');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (window.confirm('Are you sure you want to delete this business center?')) {
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL}/business/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Business center deleted successfully');
                setTimeout(() => setSuccess(''), 3000);
                fetchBusinesses();
                fetchReceptionists();
            } catch (error) {
                setError(error.response?.data?.message || 'Error deleting business center');
                setTimeout(() => setError(''), 3000);
            }
        }
    };

    const handleCardClick = (business) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const tokenData = JSON.parse(atob(token.split('.')[1]));
    

        // For other roles, navigate to the center page
        navigate(`/business/center/${business.id}`);
    };

    const resetForm = () => {
        setFormData({
            business_name: '',
            business_phone: '',
            business_whatsapp: '',
            business_email: '',
            business_password: '',
            business_person: '',
            business_address: '',
            business_country: '',
            business_tax_id: '',
            business_reg_no: '',
            other_detail: ''
        });
        setEditingBusiness(null);
        setShowForm(false);
    };

    const handleAddBusinessClick = () => {
        if (businesses.length >= brandLimits?.centers) {
            setError(`Maximum limit of ${brandLimits.centers} business centers has been reached for this brand.`);
            setTimeout(() => setError(''), 3000);
            return;
        }
        setShowForm(true);
    };

    const openAgentStatsConfig = (business) => {
        const existingConfig = agentStatsConfigs.find((config) => (
            String(config.business_center_id) === String(business.id)
        ));
        const existingLookback = Number(existingConfig?.lookback_seconds) || 3600;
        const lookbackSeconds = lookbackOptions.some((option) => option.value === existingLookback)
            ? existingLookback
            : 3600;

        setConfigBusiness(business);
        setAgentStatsConfigForm({
            tenant_name: existingConfig?.tenant_name || '',
            base_url: existingConfig?.base_url || '',
            x_account_id: existingConfig?.x_account_id || '',
            lookback_seconds: lookbackSeconds,
            is_active: existingConfig ? Boolean(existingConfig.is_active) : true
        });
    };

    const handleAgentStatsConfigChange = (field, value) => {
        setAgentStatsConfigForm((current) => ({
            ...current,
            [field]: value
        }));
    };

    const clearAgentStatsConfigValues = () => {
        setAgentStatsConfigForm((current) => ({
            ...current,
            tenant_name: '',
            base_url: '',
            x_account_id: '',
            is_active: false
        }));
    };

    const handleAgentStatsConfigSubmit = async (event) => {
        event.preventDefault();
        if (!configBusiness) return;

        const apiDetailValues = [
            agentStatsConfigForm.tenant_name.trim(),
            agentStatsConfigForm.base_url.trim(),
            agentStatsConfigForm.x_account_id.trim()
        ];
        const hasAnyApiDetail = apiDetailValues.some(Boolean);
        const hasAllApiDetails = apiDetailValues.every(Boolean);

        if (hasAnyApiDetail && !hasAllApiDetails) {
            setError('Please fill Tenant, Base API URL and Report X-Account-Id, or clear all three values.');
            setTimeout(() => setError(''), 4000);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${process.env.REACT_APP_API_URL}/agent-stats/configs`,
                {
                    ...agentStatsConfigForm,
                    business_center_id: configBusiness.id
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setSuccess(hasAnyApiDetail ? 'Agent stats API config saved' : 'Agent stats API config cleared');
            setConfigBusiness(null);
            fetchAgentStatsConfigs();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving agent stats config');
            setTimeout(() => setError(''), 4000);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const getReceptionistsForBusiness = (businessId) => {
        return receptionists.filter((receptionist) => (
            String(receptionist.business_center_id) === String(businessId)
        ));
    };

    return (
        <div className="business-container">
            <div className="business-page-header">
                <div>
                    <span className="business-eyebrow">Management</span>
                    <h2>Business Centers</h2>
                    <p>{businesses.length} center{businesses.length === 1 ? '' : 's'} available</p>
                </div>
                {!showForm && localStorage.getItem('token') && 
                 JSON.parse(atob(localStorage.getItem('token').split('.')[1])).role !== 'business_admin' && (
                    <button 
                        className="add-business-btn"
                        onClick={handleAddBusinessClick}
                    >
                        Add New Business Center
                    </button>
                )}
            </div>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            {isLoading && <div className="loading-message">Loading...</div>}

            {!isLoading && (
                <>
                    {showForm && (
                        <form onSubmit={handleSubmit} className="business-form">
                            <div className="form-sections">
                                <div className="form-rowww">
                                    <div className="form-groupppp">
                                        <label htmlFor="business_name">Center Name:</label>
                                        <div className="input-container">
                                            <input
                                                type="text"
                                                id="business_name"
                                                name="business_name"
                                                value={formData.business_name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-groupppp">
                                        <label htmlFor="business_person">Contact Person:</label>
                                        <div className="input-container">
                                            <input
                                                type="text"
                                                id="business_person"
                                                name="business_person"
                                                value={formData.business_person}
                                                onChange={handleInputChange}
                                                placeholder="Enter Contact Person Name"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-groupppp">
                                        <label htmlFor="business_phone">Phone:</label>
                                        <div className="input-container">
                                            <input
                                                type="tel"
                                                id="business_phone"
                                                name="business_phone"
                                                value={formData.business_phone}
                                                onChange={handleInputChange}
                                                placeholder="Enter Phone Number"
                                                pattern="[\+\d]+"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-rowww">
                                    {/* <div className="form-groupppp">
                                        <label htmlFor="business_whatsapp">WhatsApp:</label>
                                        <div className="input-container">
                                            <input
                                                type="tel"
                                                id="business_whatsapp"
                                                name="business_whatsapp"
                                                value={formData.business_whatsapp}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div> */}

                                    <div className="form-groupppp">
                                        <label htmlFor="business_email">Email:</label>
                                        <div className="input-container">
                                            <input
                                                type="email"
                                                id="business_email"
                                                name="business_email"
                                                value={formData.business_email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-groupppp">
                                        <div className="password-label-group">
                                            <label htmlFor="business_password">App Password:</label>
                                            <div className="info-icon-container">
                                                <i className="fas fa-info-circle info-icon"></i>
                                                <div className="info-tooltip">
                                                    <p>✅ Steps to Generate or View a Google App Password</p>
                                                    <p><strong>App passwords are unique 16-character codes used to sign in to your Google Account from apps that don't support 2-Step Verification.</strong></p>
                                                    <br/>
                                                    <p><strong>1. Ensure 2-Step Verification is Enabled</strong></p>
                                                    <p>Go to: <a href="https://myaccount.google.com/security" target="_blank">https://myaccount.google.com/security</a></p>
                                                    <p>Under "Signing in to Google", make sure 2-Step Verification is turned on.</p>
                                                    <br/>
                                                    <p><strong>2. Generate a New App Password</strong></p>
                                                    <p>Go to: <a href="https://myaccount.google.com/apppasswords" target="_blank">https://myaccount.google.com/apppasswords</a></p>
                                                    <p>Sign in again if prompted.</p>
                                                    <br/>
                                                    <p>Under "Select app", choose: Mail</p>
                                                    <p>Under "Select device", choose: Other (Custom name) and name it (e.g., "My App" or "Business Center")</p>    
                                                    <p>Click Generate.</p>
                                                    <p>Google will show you a 16-character app password like: snwb pexk avoq lnyl</p>
                                                    <br/>
                                                    <p>⚠️ Copy this password immediately. You won't be able to view it again later.</p>
                                                    <p>❌ If you already generated one but didn't save it:</p>
                                                    <p>You cannot retrieve an old app password from Google. You will have to generate a new one using the steps above.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="input-container">
                                            <div className="password-input-container">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    id="business_password"
                                                    name="business_password"
                                                    value={formData.business_password}
                                                    onChange={handleInputChange}
                                                    required={!editingBusiness}
                                                />
                                                <button 
                                                    type="button" 
                                                    className="password-toggle"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-rowww">
                                    <div className="form-groupppp">
                                        <label htmlFor="business_address">Address:</label>
                                        <div className="input-container">
                                            <input
                                                id="business_address"
                                                name="business_address"
                                                value={formData.business_address}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-groupppp">
                                        <label htmlFor="business_country">Country:</label>
                                        <div className="input-container">
                                            <input
                                                type="text"
                                                id="business_country"
                                                name="business_country"
                                                value={formData.business_country}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-rowww">
                                    <div className="form-groupppp">
                                        <label htmlFor="business_tax_id">Tax ID:</label>
                                        <div className="input-container">
                                            <input
                                                type="text"
                                                id="business_tax_id"
                                                name="business_tax_id"
                                                value={formData.business_tax_id}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-groupppp">
                                        <label htmlFor="business_reg_no">Registration No:</label>
                                        <div className="input-container">
                                            <input
                                                type="text"
                                                id="business_reg_no"
                                                name="business_reg_no"
                                                value={formData.business_reg_no}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-rowww">
                                    <div className="form-groupppp">
                                        <label htmlFor="other_detail">Other Details:</label>
                                        <div className="input-container">
                                            <input
                                                id="other_detail"
                                                name="other_detail"
                                                value={formData.other_detail}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="forrm-actions">
                                <button type="submit">
                                    {editingBusiness ? 'Update Business Center' : 'Create Business Center'}
                                </button>
                                <button type="button" onClick={resetForm}>Cancel</button>
                            </div>
                        </form>
                    )}

                    {configBusiness && (
                        <form className="agent-stats-config-form" onSubmit={handleAgentStatsConfigSubmit}>
                            <div className="agent-stats-config-heading">
                                <h3>Agent Stats API Config - {configBusiness.business_name}</h3>
                                <button type="button" onClick={clearAgentStatsConfigValues}>
                                    Clear Values
                                </button>
                            </div>
                            <div className="agent-stats-config-grid">
                                <label>
                                    Tenant
                                    <input
                                        value={agentStatsConfigForm.tenant_name}
                                        onChange={(event) => handleAgentStatsConfigChange('tenant_name', event.target.value)}
                                        placeholder="obc1"
                                    />
                                </label>
                                <label>
                                    Base API URL
                                    <input
                                        value={agentStatsConfigForm.base_url}
                                        onChange={(event) => handleAgentStatsConfigChange('base_url', event.target.value)}
                                        placeholder="https://ucpmed.voicemeetme.com:9443"
                                    />
                                </label>
                                <label>
                                    Report X-Account-Id
                                    <input
                                        value={agentStatsConfigForm.x_account_id}
                                        onChange={(event) => handleAgentStatsConfigChange('x_account_id', event.target.value)}
                                    />
                                </label>
                                <div className="agent-stats-timing-section">
                                    <label>
                                        Lookback Time
                                        <span className="agent-stats-field-note">
                                            How far back each poll fetches data.
                                        </span>
                                        <select
                                            value={agentStatsConfigForm.lookback_seconds}
                                            onChange={(event) => handleAgentStatsConfigChange('lookback_seconds', event.target.value)}
                                        >
                                            {lookbackOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <label className="agent-stats-config-toggle">
                                    <input
                                        type="checkbox"
                                        checked={agentStatsConfigForm.is_active}
                                        onChange={(event) => handleAgentStatsConfigChange('is_active', event.target.checked)}
                                    />
                                    Active polling
                                    <span
                                        className="agent-stats-help"
                                        title="When active, the system automatically fetches this tenant's agent stats every poll interval and stores the raw and final reports."
                                    >
                                        ?
                                    </span>
                                </label>
                            </div>
                            <div className="agent-stats-config-actions">
                                <button type="submit">Save Config</button>
                                <button type="button" onClick={() => setConfigBusiness(null)}>Cancel</button>
                            </div>
                        </form>
                    )}

                    <div className="businesses-list">
                        <h3 className="business-list-title">Business List</h3>
                        {businesses.length === 0 && !error && !isLoading && (
                            <div className="no-businesses-message">
                                No business centers found. Create one using the form above.
                            </div>
                        )}
                        <div className="business-cards-container">
                            {businesses.map(business => (
                                (() => {
                                    const businessReceptionists = getReceptionistsForBusiness(business.id);
                                    const receptionistNames = businessReceptionists
                                        .map((receptionist) => receptionist.receptionist_name)
                                        .filter(Boolean);
                                    const hasAgentStatsConfig = agentStatsConfigs.some((config) => (
                                        String(config.business_center_id) === String(business.id)
                                    ));

                                    return (
                                <div 
                                    key={business.id} 
                                    className="business-card"
                                    onClick={() => handleCardClick(business)}
                                >
                                    <div className="business-info">
                                        <div className='brand-name-heading'>{business.brand_name}</div>
                                        <h3>{business.business_name}</h3>
                                        <p><strong>Contact Person:</strong> {business.business_person}</p>
                                        <p><strong>Phone:</strong> {business.business_phone}</p>
                                        <p><strong>Email:</strong> {business.business_email}</p>
                                        <p><strong>Country:</strong> {business.business_country}</p>
                                        <div className="business-receptionists-summary">
                                            <div>
                                                <strong>Receptionists</strong>
                                                <span>{businessReceptionists.length}</span>
                                            </div>
                                            <p>
                                                {receptionistNames.length > 0
                                                    ? receptionistNames.join(', ')
                                                    : 'No receptionists added yet'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="business-actions" onClick={e => e.stopPropagation()}>
                                        {!isBusinessAdmin && (
                                            <>
                                                <button onClick={() => handleEdit(business)}>EDIT</button>
                                                <button onClick={() => handleDelete(business.id)}>DELETE</button>
                                            </>
                                        )}
                                        <button 
                                            className="receptionist-button"
                                            onClick={() => navigate(`/business/receptionist`)}
                                        >
                                            ADD RECEPTIONIST
                                        </button>
                                        <button
                                            className="agent-config-button"
                                            onClick={() => openAgentStatsConfig(business)}
                                        >
                                            {hasAgentStatsConfig ? 'EDIT API CONFIG' : 'ADD API CONFIG'}
                                        </button>
                                    </div>
                                </div>
                                    );
                                })()
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Business;
