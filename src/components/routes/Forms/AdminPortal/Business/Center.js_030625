// src/components/routes/Forms/AdminPortal/Business/Center.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Center.css';

const Center = () => {
    const { businessId } = useParams();
    const navigate = useNavigate();
    const [business, setBusiness] = useState(null);
    const [teams, setTeams] = useState([]);
    const [totalTeamsInBrand, setTotalTeamsInBrand] = useState(0);
    const [totalReceptionistsInBrand, setTotalReceptionistsInBrand] = useState(0);
    const [totalAssociatesInBrand, setTotalAssociatesInBrand] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [messageVisible, setMessageVisible] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [showTeamForm, setShowTeamForm] = useState(false);
    const [showReceptionistForm, setShowReceptionistForm] = useState(false);
    const [showAssociateForm, setShowAssociateForm] = useState(false);
    const [brandLimits, setBrandLimits] = useState(null);
    const [associates, setAssociates] = useState([]);
    const [newTeams, setNewTeams] = useState([{
        team_name: '',
        tax_id: '',
        reg_no: '',
        team_phone: '',
        team_email: '',
        team_address: '',
        team_country: '',
        team_prompt: '',
        team_detail: ''
    }]);
    const [newUser, setNewUser] = useState({
        username: '',
        department: '',
        email: '',
        mobile_num: '',
        mobile_num_2: '',
        team_id: '',
        designation: ''
    });
    const [newAssociate, setNewAssociate] = useState({
        username: '',
        department: '',
        email: '',
        mobile_num: '',
        mobile_num_2: '',
        designation: '',
        team_id: ''
    });
    const [editingTeam, setEditingTeam] = useState(null);
    const [role, setRole] = useState(null);

    const fetchBusiness = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/business/${businessId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setBusiness(response.data);
        } catch (error) {
            console.error('Error fetching business:', error);
            setError('Error fetching business details');
        }
    };

    const fetchBrandLimits = async () => {
        try {
            const token = localStorage.getItem('token');
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

    const fetchBrandCounts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/business/${businessId}/counts`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setTotalTeamsInBrand(response.data.totalTeams);
            setTotalReceptionistsInBrand(response.data.totalReceptionists);
            setTotalAssociatesInBrand(response.data.totalAssociates);

            // Update form visibility based on limits
            if (brandLimits) {
                setShowTeamForm(response.data.totalTeams < brandLimits.companies);
                setShowReceptionistForm(response.data.totalReceptionists < brandLimits.receptionist);
                setShowAssociateForm(response.data.totalAssociates < brandLimits.associates);
            }
        } catch (error) {
            console.error('Error fetching counts:', error);
            setError('Error fetching current counts');
        }
    };

    const fetchTeams = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            const role = tokenData.role;
            
            // Use different endpoints based on role
            const endpoint = role === 'receptionist' 
                ? `${process.env.REACT_APP_API_URL}/business-center/${businessId}/teams`
                : `${process.env.REACT_APP_API_URL}/business/${businessId}/teams`;
                
            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setTeams(response.data.teams);
            
            // Disable team creation if brand limit reached
            if (brandLimits && totalTeamsInBrand >= brandLimits.companies) {
                setShowTeamForm(false);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
            setError('Error fetching teams');
        }
    }, [businessId, brandLimits, totalTeamsInBrand]);

    const fetchAssociates = async () => {
        try {
            const token = localStorage.getItem('token');
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            const role = tokenData.role;
            
            // Use different endpoints based on role
            const endpoint = role === 'receptionist'
                ? `${process.env.REACT_APP_API_URL}/business-center/${businessId}/teams`
                : `${process.env.REACT_APP_API_URL}/business/${businessId}/teams`;
                
            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Extract associates from teams data
            const allAssociates = response.data.teams.reduce((acc, team) => {
                if (team.associates) {
                    return [...acc, ...team.associates];
                }
                return acc;
            }, []);
            setAssociates(allAssociates);
        } catch (error) {
            console.error('Error fetching associates:', error);
            setError('Error fetching associates');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!businessId) {
                console.error('No business ID provided');
                setError('No business ID provided');
                return;
            }
            try {
                await fetchBusiness();
                await fetchBrandLimits();
                await fetchBrandCounts();
                await fetchTeams();
                await fetchAssociates();
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [businessId]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            setRole(tokenData.role);
        }
    }, []);

    const handleUserInputChange = (field, value) => {
        setNewUser(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear field error when user starts typing
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleTeamInputChange = (index, field, value) => {
        const updatedTeams = [...newTeams];
        updatedTeams[index] = {
            ...updatedTeams[index],
            [field]: value
        };
        setNewTeams(updatedTeams);
    };

    const handleAssociateInputChange = (field, value) => {
        setNewAssociate(prev => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleCreateUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/business/${businessId}/associate`,
                newUser,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data) {
                setShowAssociateForm(false);
                setNewUser({
                    username: '',
                    department: '',
                    email: '',
                    mobile_num: '',
                    mobile_num_2: '',
                    designation: '',
                    team_id: ''
                });
                setSuccess('Associate created successfully');
                setMessageVisible(true);
                setTimeout(() => setMessageVisible(false), 3000);
                // Refresh counts
                fetchBrandCounts();
            }
        } catch (err) {
            console.error('Error creating associate:', err);
            const errorData = err.response?.data;
            
            if (errorData?.field) {
                setFieldErrors({ [errorData.field]: errorData.error });
                setError(errorData.error);
            } else {
                setError(errorData?.error || 'Failed to create associate');
            }
            setMessageVisible(true);
            setTimeout(() => setMessageVisible(false), 3000);
        }
    };

    const handleCreateTeams = async () => {
        try {
            // Check teams limit before creating
            if (totalTeamsInBrand >= brandLimits.companies) {
                setError(`Cannot create more teams. Brand limit (${brandLimits.companies}) reached.`);
                setMessageVisible(true);
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            // Check if total teams would exceed limit
            if (teams.length + newTeams.length > brandLimits?.companies) {
                setError(`Cannot create more teams. Maximum limit of ${brandLimits.companies} teams would be exceeded.`);
                setMessageVisible(true);
                setTimeout(() => setMessageVisible(false), 3000);
                return;
            }

            // Check if any required fields are empty
            const hasEmptyFields = newTeams.some(team => !team.team_name || !team.tax_id || !team.reg_no);
            if (hasEmptyFields) {
                setError('Please fill in all required fields for teams');
                setMessageVisible(true);
                setTimeout(() => setMessageVisible(false), 3000);
                return;
            }

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/business/${businessId}/teams`,
                { teams: newTeams },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data) {
                setSuccess('Teams created successfully');
                setShowTeamForm(false);
                setNewTeams([{
                    team_name: '',
                    tax_id: '',
                    reg_no: '',
                    team_phone: '',
                    team_email: '',
                    team_address: '',
                    team_country: '',
                    team_prompt: '',
                    team_detail: ''
                }]);
                fetchTeams(); // Refresh teams list
            }
        } catch (error) {
            console.error('Error creating teams:', error);
            const errorMessage = error.response?.data?.message || 'Error creating teams';
            
            if (error.response?.data?.error === 'TEAM_LIMIT_EXCEEDED') {
                const limit = error.response?.data?.limit || brandLimits?.companies;
                setError(`Cannot create more teams. Maximum limit of ${limit} teams has been reached.`);
            } else {
                setError(errorMessage);
            }
        }
        setMessageVisible(true);
        setTimeout(() => setMessageVisible(false), 3000);
    };

    const handleCreateAssociate = async () => {
        try {
            // Validate required fields
            const requiredFields = ['username', 'email', 'mobile_num', 'team_id'];
            const errors = {};
            requiredFields.forEach(field => {
                if (!newAssociate[field]) {
                    errors[field] = `${field.replace('_', ' ')} is required`;
                }
            });

            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                return;
            }

            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/business/${businessId}/associate`,
                newAssociate,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data) {
                setSuccess('Associate created successfully');
                setMessageVisible(true);
                setTimeout(() => setMessageVisible(false), 3000);
                setShowAssociateForm(false);
                setNewAssociate({
                    username: '',
                    department: '',
                    email: '',
                    mobile_num: '',
                    mobile_num_2: '',
                    designation: '',
                    team_id: ''
                });
                fetchAssociates();
            }
        } catch (err) {
            console.error('Error creating associate:', err);
            if (err.response?.data?.message?.includes('Brand limit')) {
                setError('Cannot create more associates. Brand limit reached.');
            } else {
                setError(err.response?.data?.message || 'Error creating associate');
            }
            setMessageVisible(true);
            setTimeout(() => setMessageVisible(false), 3000);
        }
    };

    const handleDeleteTeam = async (e, teamId, teamName) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            await axios.delete(`${process.env.REACT_APP_API_URL}/team/${teamId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccess(`${teamName} deleted successfully`);
            fetchTeams();

            // Auto-clear success message after 3 seconds
            setTimeout(() => {
                setSuccess('');
            }, 3000);

        } catch (error) {
            console.error('Error deleting team:', error);
            setError(error.response?.data?.message || 'Error deleting team');
            
            // Auto-clear error message after 3 seconds
            setTimeout(() => {
                setError('');
            }, 3000);
        }
    };

    const handleAddTeamClick = () => {
        if (!showTeamForm && totalTeamsInBrand >= brandLimits?.companies) {
            setError(`Maximum limit of ${brandLimits.companies} teams has been reached for this brand. Current total: ${totalTeamsInBrand} teams.`);
            setMessageVisible(true);
            setTimeout(() => setMessageVisible(false), 3000);
            return;
        }
        setShowTeamForm(!showTeamForm);
    };

    const handleEdit = (team) => {
        setEditingTeam(team);
        setNewTeams([{
            team_name: team.team_name,
            tax_id: team.tax_id,
            reg_no: team.reg_no,
            team_phone: team.team_phone,
            team_email: team.team_email,
            team_address: team.team_address,
            team_country: team.team_country,
            team_prompt: team.team_prompt,
            team_detail: team.team_detail
        }]);
        setShowTeamForm(true);
    };

    const handleTeamSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const url = editingTeam
                ? `${process.env.REACT_APP_API_URL}/team/${editingTeam.id}`
                : `${process.env.REACT_APP_API_URL}/business/${businessId}/teams`;

            const method = editingTeam ? 'put' : 'post';

            // Format the data according to the backend's expectation
            const data = editingTeam ? newTeams[0] : { teams: newTeams };

            await axios[method](url, data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccess(editingTeam ? 'Company updated successfully' : 'Company created successfully');
            fetchTeams();
            resetTeamForm();
            
            // Auto-clear messages after 3 seconds
            setTimeout(() => {
                setError('');
                setSuccess('');
            }, 3000);

        } catch (error) {
            console.error('Error submitting company:', error);
            setError(error.response?.data?.message || 'An error occurred');
            
            // Auto-clear error message after 3 seconds
            setTimeout(() => {
                setError('');
            }, 3000);
        }
    };

    const resetTeamForm = () => {
        setNewTeams([{
            team_name: '',
            tax_id: '',
            reg_no: '',
            team_phone: '',
            team_email: '',
            team_address: '',
            team_country: '',
            team_prompt: '',
            team_detail: ''
        }]);
        setEditingTeam(null);
        setShowTeamForm(false);
    };

    if (!business) {
        return <div>Loading...</div>;
    }

    return (
        <div className="business-center-container">
            <div className="center-header">
                <h2>{business?.business_name || 'Business Center'}</h2>
                {role !== 'receptionist' && (
                <button 
                    className="add-team-button"
                    onClick={handleAddTeamClick}
                    title={brandLimits && totalTeamsInBrand >= brandLimits.companies ? 
                        `Maximum team limit reached (${brandLimits.companies} teams)` : 
                        'Add Company'}
                >
                    {showTeamForm ? 'Cancel' : 'Add Company'}
                </button>
                )}
            </div>


            {messageVisible && (error || success) && (
                <div className={`message-container ${error ? 'error' : 'success'}`}>
                    {error || success}
                </div>
            )}
            {showTeamForm && (
                <div className="sectionnnnn">
                    <h3 className='create-team-heading'>{editingTeam ? 'Edit Company' : 'Create Company'}</h3>
                    <div className='team-inputsss'>
                        {newTeams.map((team, index) => (
                            <div className="team-inputtt" key={index}>
                                <div className="form-rowww">
                                    <div className="form-groupppp">
                                        <label htmlFor={`team_name_${index}`}>Company Name:</label>
                                        <div className="input-container">
                                            <input
                                                type="text"
                                                id={`team_name_${index}`}
                                                value={team.team_name}
                                                onChange={(e) => handleTeamInputChange(index, 'team_name', e.target.value)}
                                                placeholder="Company Name"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-groupppp">
                                        <label htmlFor={`tax_id_${index}`}>Tax ID:</label>
                                        <div className="input-container">
                                            <input
                                                type="text"
                                                id={`tax_id_${index}`}
                                                value={team.tax_id}
                                                onChange={(e) => handleTeamInputChange(index, 'tax_id', e.target.value)}
                                                placeholder="Tax ID"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-groupppp">
                                        <label htmlFor={`reg_no_${index}`}>Reg No:</label>
                                        <div className="input-container">
                                            <input
                                                type="text"
                                                id={`reg_no_${index}`}
                                                value={team.reg_no}
                                                onChange={(e) => handleTeamInputChange(index, 'reg_no', e.target.value)}
                                                placeholder="Registration Number"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-rowww">
                                    <div className="form-groupppp">
                                        <label htmlFor={`team_phone_${index}`}>Phone:</label>
                                        <div className="input-container">
                                            <input
                                                type="tel"
                                                id={`team_phone_${index}`}
                                                value={team.team_phone}
                                                onChange={(e) => handleTeamInputChange(index, 'team_phone', e.target.value)}
                                                placeholder="Company Phone"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-groupppp">
                                        <label htmlFor={`team_email_${index}`}>Email:</label>
                                        <div className="input-container">
                                            <input
                                                type="email"
                                                id={`team_email_${index}`}
                                                value={team.team_email}
                                                onChange={(e) => handleTeamInputChange(index, 'team_email', e.target.value)}
                                                placeholder="Company Email"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-rowww">
                                    <div className="form-groupppp">
                                        <label htmlFor={`team_address_${index}`}>Address:</label>
                                        <div className="input-container">
                                            <input
                                                type="text"
                                                id={`team_address_${index}`}
                                                value={team.team_address}
                                                onChange={(e) => handleTeamInputChange(index, 'team_address', e.target.value)}
                                                placeholder="Company Address"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-groupppp">
                                        <label htmlFor={`team_country_${index}`}>Country:</label>
                                        <div className="input-container">
                                            <input
                                                type="text"
                                                id={`team_country_${index}`}
                                                value={team.team_country}
                                                onChange={(e) => handleTeamInputChange(index, 'team_country', e.target.value)}
                                                placeholder="Company Country"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-rowww">
                                    <div className="form-groupppp">
                                        <label htmlFor={`team_prompt_${index}`}>Prompt:</label>
                                        <div className="input-container">
                                            <input
                                                type="text"
                                                id={`team_prompt_${index}`}
                                                value={team.team_prompt}
                                                onChange={(e) => handleTeamInputChange(index, 'team_prompt', e.target.value)}
                                                placeholder="Company Prompt"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-rowww">
                                    <div className="form-groupppp">
                                        <label htmlFor={`team_detail_${index}`}>Details:</label>
                                        <div className="input-container">
                                            <textarea
                                                id={`team_detail_${index}`}
                                                value={team.team_detail}
                                                onChange={(e) => handleTeamInputChange(index, 'team_detail', e.target.value)}
                                                placeholder="Company Details"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="form-actionss">
                        <button type="submit" onClick={handleTeamSubmit}>
                            {editingTeam ? 'Update' : 'Create'}
                        </button>
                        <button type="button" onClick={resetTeamForm}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            
            {/* Teams List Section */}
            <div className="teams-list-section">
                <h3>Companies</h3>
                <div className="teams-gridd">
                    {teams.map((team, index) => (
                        <div 
                            key={team.id} 
                            className="team-cardd"
                            onClick={() => navigate(`/business/${businessId}/team/${encodeURIComponent(team.team_name)}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <h4>{team.team_name}</h4>
                            <div className="team-detailss">
                                <p><strong>Email:</strong> {team.team_email}</p>
                                <p><strong>Phone:</strong> {team.team_phone}</p>
                                <p><strong>Country:</strong> {team.team_country}</p>
                            </div>
                            <div className="team-actions">
                                {role !== 'receptionist' && (
                                    <>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(team);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Are you sure you want to delete ${team.team_name}?`)) {
                                                    handleDeleteTeam(e, team.id, team.team_name);
                                                }
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="teams-pagination">
                    <span>Total Company: {teams.length}</span>
                </div>
            </div> 

            {/* Associates List Section */}
            {role !== 'receptionist' && (
                <div className="sectionnnnn ass-section">
                    <div className="section-header">
                        <h3 className="create-team-headingg">Associates</h3>
                        <button 
                            className="add-team-button"
                            onClick={() => {
                                if (brandLimits && associates.length >= brandLimits.associates) {
                                    setError('Cannot create more associates. Brand limit reached.');
                                    setMessageVisible(true);
                                    setTimeout(() => setMessageVisible(false), 3000);
                                    return;
                                }
                                setShowAssociateForm(!showAssociateForm);
                            }}
                            title={brandLimits && associates.length >= brandLimits.associates ? 
                                `Maximum associate limit reached (${brandLimits.associates} associates)` : 
                                'Add new associate'}
                        >
                            {showAssociateForm ? 'Cancel' : 
                                (brandLimits && associates.length >= brandLimits.associates) ? 
                                'Cannot create more associates. Brand limit reached.' : 
                                'Add Associate'}
                        </button>
                    </div>
                    {brandLimits && associates.length >= brandLimits.associates && (
                        <div className="team-limit-warning">
                            Maximum number of associates reached ({brandLimits.associates} associates)
                        </div>
                    )}

                    {showAssociateForm && (
                        <div className="sectionnnnn">
                            <h3 className='create-team-heading'>Create Associate</h3>
                            <div className='team-inputsss'>
                                <div className="team-inputtt">
                                    <div className="form-rowww">
                                        <div className="form-groupppp">
                                            <label htmlFor="username">Username:</label>
                                            <div className="input-container">
                                                <input
                                                    type="text"
                                                    id="username"
                                                    value={newAssociate.username}
                                                    onChange={(e) => handleAssociateInputChange('username', e.target.value)}
                                                    placeholder="Enter name"
                                                    className={fieldErrors.username ? 'error' : ''}
                                                />
                                                {fieldErrors.username && <span className="error-message">{fieldErrors.username}</span>}
                                            </div>
                                        </div>
                                        <div className="form-groupppp">
                                            <label htmlFor="email">Email:</label>
                                            <div className="input-container">
                                                <input
                                                    type="email"
                                                    id="email"
                                                    value={newAssociate.email}
                                                    onChange={(e) => handleAssociateInputChange('email', e.target.value)}
                                                    placeholder="Email"
                                                    className={fieldErrors.email ? 'error' : ''}
                                                />
                                                {fieldErrors.email && <span className="error-message">{fieldErrors.email}</span>}
                                            </div>
                                        </div>
                                        <div className="form-groupppp">
                                            <label htmlFor="mobile_num">Mobile Number:</label>
                                            <div className="input-container">
                                                <input
                                                    type="text"
                                                    id="mobile_num"
                                                    value={newAssociate.mobile_num}
                                                    onChange={(e) => handleAssociateInputChange('mobile_num', e.target.value)}
                                                    placeholder="Mobile Number"
                                                    className={fieldErrors.mobile_num ? 'error' : ''}
                                                />
                                                {fieldErrors.mobile_num && <span className="error-message">{fieldErrors.mobile_num}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-rowww">
                                        <div className="form-groupppp">
                                            <label htmlFor="mobile_num_2">Alternative Mobile:</label>
                                            <div className="input-container">
                                                <input
                                                    type="text"
                                                    id="mobile_num_2"
                                                    value={newAssociate.mobile_num_2}
                                                    onChange={(e) => handleAssociateInputChange('mobile_num_2', e.target.value)}
                                                    placeholder="Alternative Mobile Number"
                                                    className={fieldErrors.mobile_num_2 ? 'error' : ''}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-groupppp">
                                            <label htmlFor="department">Department:</label>
                                            <div className="input-container">
                                                <input
                                                    type="text"
                                                    id="department"
                                                    value={newAssociate.department}
                                                    onChange={(e) => handleAssociateInputChange('department', e.target.value)}
                                                    placeholder="Department"
                                                    className={fieldErrors.department ? 'error' : ''}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-groupppp">
                                            <label htmlFor="designation">Designation:</label>
                                            <div className="input-container">
                                                <input
                                                    type="text"
                                                    id="designation"
                                                    value={newAssociate.designation}
                                                    onChange={(e) => handleAssociateInputChange('designation', e.target.value)}
                                                    placeholder="Designation"
                                                    className={fieldErrors.designation ? 'error' : ''}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-groupppp">
                                            <label htmlFor="team_id">Team:</label>
                                            <div className="input-container">
                                                <select
                                                    id="team_id"
                                                    value={newAssociate.team_id}
                                                    onChange={(e) => handleAssociateInputChange('team_id', e.target.value)}
                                                    className={fieldErrors.team_id ? 'error' : ''}
                                                >
                                                    <option value="">Select Team</option>
                                                    {teams.map(team => (
                                                        <option key={team.id} value={team.id}>{team.team_name}</option>
                                                    ))}
                                                </select>
                                                {fieldErrors.team_id && <span className="error-message">{fieldErrors.team_id}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="button-containerr">
                                <button onClick={handleCreateAssociate} className="create-button">Create Associate</button>
                            </div>
                        </div>
                    )}

                    {/* <div className="associates-grid">
                        {associates.map(associate => (
                            <div key={associate.id} className="associate-card">
                                <h4>{associate.username}</h4>
                                <div className="associate-details">
                                    <p><strong>Email:</strong> {associate.email}</p>
                                    <p><strong>Mobile:</strong> {associate.mobile_num}</p>
                                    <p><strong>Alt Mobile:</strong> {associate.mobile_num_2 || 'N/A'}</p>
                                    <p><strong>Designation:</strong> {associate.designation}</p>
                                    <p><strong>Team:</strong> {teams.find(t => t.id === associate.team_id)?.team_name || 'N/A'}</p>
                                </div>
                            </div>
                        ))}
                    </div> */}
                </div>
            )}
        </div>
    );
};

export default Center;