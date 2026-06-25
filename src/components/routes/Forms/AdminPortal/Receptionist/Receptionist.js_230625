// src/components/routes/Forms/AdminPortal/Receptionist/Receptionist.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Receptionist.css';

const Receptionist = () => {
    const [receptionists, setReceptionists] = useState([]);
    const [businessCenters, setBusinessCenters] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingReceptionist, setEditingReceptionist] = useState(null);
    const [brandLimits, setBrandLimits] = useState(null);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        receptionist_name: '',
        receptionist_phone: '',
        receptionist_email: '',
        business_center_id: '',
        rec_other_detail: ''
    });

    useEffect(() => {
        fetchReceptionists();
        fetchBusinessCenters();
        fetchBrandLimits();
    }, []);

    const fetchBusinessCenters = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/admin');
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/business`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setBusinessCenters(response.data);
        } catch (error) {
            console.error('Error fetching business centers:', error);
            setError('Error fetching business centers');
        }
    };

    const fetchReceptionists = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/admin');
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/receptionist`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setReceptionists(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching receptionists:', error);
            setError('Error fetching receptionists');
            setIsLoading(false);
        }
    };

    const fetchBrandLimits = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/admin');
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/brand/limits`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setBrandLimits(response.data);
        } catch (error) {
            console.error('Error fetching brand limits:', error);
        }
    };

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
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const url = editingReceptionist
                ? `${process.env.REACT_APP_API_URL}/receptionist/${editingReceptionist.id}`
                : `${process.env.REACT_APP_API_URL}/receptionist`;
            const method = editingReceptionist ? 'put' : 'post';

            const response = await axios[method](url, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccess(
                editingReceptionist
                ? 'Receptionist updated successfully!'
                : 'Receptionist created successfully!'
            );
            
            fetchReceptionists();
            resetForm();
            
            setTimeout(() => {
                setError('');
                setSuccess('');
            }, 3000);

        } catch (error) {
            console.error('Error submitting receptionist:', error);
            setError(error.response?.data?.message || 'An error occurred');
            
            setTimeout(() => {
                setError('');
            }, 3000);
        }
    };

    const handleEdit = (receptionist) => {
        setEditingReceptionist(receptionist);
        setFormData({
            receptionist_name: receptionist.receptionist_name,
            receptionist_phone: receptionist.receptionist_phone,
            receptionist_email: receptionist.receptionist_email,
            business_center_id: receptionist.business_center_id,
            rec_other_detail: receptionist.rec_other_detail || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this receptionist?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            await axios.delete(`${process.env.REACT_APP_API_URL}/receptionist/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Receptionist deleted successfully!');
            fetchReceptionists();

            setTimeout(() => {
                setSuccess('');
            }, 3000);

        } catch (error) {
            console.error('Error deleting receptionist:', error);
            setError('Error deleting receptionist');

            setTimeout(() => {
                setError('');
            }, 3000);
        }
    };

    const handleAddNewClick = () => {
        if (receptionists.length >= brandLimits?.receptionist) {
            setError(`You have reached the maximum limit of ${brandLimits.receptionist} receptionists`);
            setTimeout(() => {
                setError('');
            }, 3000);
            return;
        }
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            receptionist_name: '',
            receptionist_phone: '',
            receptionist_email: '',
            business_center_id: '',
            rec_other_detail: ''
        });
        setEditingReceptionist(null);
        setShowForm(false);
    };

    return (
        <div className="receptionist-container">
            <h2>Receptionist Management</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button 
                className="add-receptionist-btn" 
                onClick={handleAddNewClick}
            >
                Add New Receptionist
            </button>

            {showForm && (
                <form onSubmit={handleSubmit} className="receptionist-form">
                    <div className="form-rowww">
                        <div className="form-groupppp">
                            <label htmlFor="receptionist_name">Name:</label>
                            <div className="input-container">
                                <input
                                    type="text"
                                    id="receptionist_name"
                                    name="receptionist_name"
                                    value={formData.receptionist_name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-groupppp">
                            <label htmlFor="business_center_id">Business Center:</label>
                            <div className="input-container">
                                <select
                                    id="business_center_id"
                                    name="business_center_id"
                                    value={formData.business_center_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Business Center</option>
                                    {businessCenters.map(center => (
                                        <option key={center.id} value={center.id}>
                                            {center.business_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-rowww">
                        <div className="form-groupppp">
                            <label htmlFor="receptionist_email">Email:</label>
                            <div className="input-container">
                                <input
                                    type="email"
                                    id="receptionist_email"
                                    name="receptionist_email"
                                    value={formData.receptionist_email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-groupppp">
                            <label htmlFor="receptionist_phone">Phone:</label>
                            <div className="input-container">
                                <input
                                    type="tel"
                                    id="receptionist_phone"
                                    name="receptionist_phone"
                                    value={formData.receptionist_phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-rowww">
                        <div className="form-groupppp full-width">
                            <label htmlFor="rec_other_detail">Other Details:</label>
                            <div className="input-container">
                                <textarea
                                    id="rec_other_detail"
                                    name="rec_other_detail"
                                    value={formData.rec_other_detail}
                                    onChange={handleInputChange}
                                    rows="3"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="forrm-actions">
                        <button type="submit">
                            {editingReceptionist ? 'Update Receptionist' : 'Create Receptionist'}
                        </button>
                        <button type="button" onClick={resetForm}>Cancel</button>
                    </div>
                </form>
            )}

            <div className="receptionists-list">
                <h3 className="receptionist-list-title">Receptionist List</h3>
                <div className="receptionist-cards-container">
                    {receptionists.map(receptionist => (
                        <div key={receptionist.id} className="receptionist-card">
                            <div className="receptionist-info">
                                <div className="receptionist-row receptionist-name-row">
                                    <h3>{receptionist.receptionist_name}</h3>
                                </div>
                                
                                <div className="receptionist-row business-row">
                                    <p><strong>Business Center:</strong> {receptionist.business_name}</p>
                                </div>
                                
                                <div className="receptionist-row contact-row">
                                    <p><strong>Email:</strong> {receptionist.receptionist_email}</p>
                                    <p><strong>Phone:</strong> {receptionist.receptionist_phone}</p>
                                </div>
                                
                                {receptionist.rec_other_detail && (
                                    <div className="receptionist-row other-row">
                                        <p><strong>Other Details:</strong> {receptionist.rec_other_detail}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="receptionist-actions">
                                <button onClick={() => handleEdit(receptionist)}>Edit</button>
                                <button onClick={() => handleDelete(receptionist.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Receptionist;