// src/components/routes/Forms/AdminPortal/Business/Business.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Business.css';

const Business = () => {
    const [businesses, setBusinesses] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [brandLimits, setBrandLimits] = useState(null);
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
            setError('Error fetching brand limits');
        }
    };

    useEffect(() => {
        fetchBusinesses();
        fetchBrandLimits();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

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
            const brand_name = tokenData.username; // Using username as brand_name since that's what's available

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

            setSuccess(editingBusiness 
                ? 'Business Center updated successfully!'
                : 'Business Center created successfully!'
            );
            
            fetchBusinesses();
            resetForm();
            
            setTimeout(() => {
                setError('');
                setSuccess('');
            }, 3000);

        } catch (error) {
            console.error('Error submitting business:', error);
            setError(error.response?.data?.message || 'An error occurred');
            
            setTimeout(() => {
                setError('');
            }, 3000);
        }
    };

    const handleEdit = (business) => {
        setEditingBusiness(business);
        setFormData({
            business_name: business.business_name,
            business_phone: business.business_phone,
            business_whatsapp: business.business_whatsapp,
            business_email: business.business_email,
            business_password: business.business_password,
            business_person: business.business_person,
            business_address: business.business_address,
            business_country: business.business_country,
            business_tax_id: business.business_tax_id,
            business_reg_no: business.business_reg_no,
            other_detail: business.other_detail,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this business center?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            await axios.delete(`${process.env.REACT_APP_API_URL}/business/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Business Center deleted successfully!');
            fetchBusinesses();
        } catch (error) {
            console.error('Error deleting business:', error);
            setError('Error deleting business');
        }
    };

    const handleCardClick = (business) => {
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

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="business-container">
            <h2>Business Center Management</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button 
                className="add-business-btn"
                onClick={handleAddBusinessClick}
            >
                {showForm ? 'Cancel' : 'Add New Business Center'}
            </button>

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
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-rowww">
                            <div className="form-groupppp">
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
                            </div>
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
                        </div>

                        <div className="form-rowww">
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
                            <div className="form-groupppp">
                                <label htmlFor="business_address">Address:</label>
                                <div className="input-container">
                                    <textarea
                                        id="business_address"
                                        name="business_address"
                                        value={formData.business_address}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-rowww">
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
                        </div>

                        <div className="form-rowww">
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
                            <div className="form-groupppp">
                                <label htmlFor="other_detail">Other Details:</label>
                                <div className="input-container">
                                    <textarea
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

            <div className="businesses-list">
                <h3 className="business-list-title">Business List</h3>
                {businesses.length === 0 && !error && !isLoading && (
                    <div className="no-businesses-message">
                        No business centers found. Create one using the form above.
                    </div>
                )}
                <div className="business-cards-container">
                    {businesses.map(business => (
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
                            </div>
                            <div className="business-actions" onClick={e => e.stopPropagation()}>
                                <button onClick={() => handleEdit(business)}>EDIT</button>
                                <button onClick={() => handleDelete(business.id)}>DELETE</button>
                                <button 
                                    className="receptionist-button"
                                    onClick={() => navigate(`/business/receptionist`)}
                                >
                                    RECEPTIONIST
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Business;