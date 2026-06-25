// src/components/routes/Forms/TeamForm/TeamForm.js

import React, { useState, useEffect } from 'react';
import axios from "axios";
import { useParams, useNavigate } from 'react-router-dom';
import './TeamForm.css';

const TeamForm = () => {
    const { teamName, businessId: routeBusinessId } = useParams();
    const navigate = useNavigate();
    const [teamDetails, setTeamDetails] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingMember, setEditingMember] = useState(null);
    const [role, setRole] = useState(null);
    const [memberFormData, setMemberFormData] = useState({
        username: '',
        designation: '',
        department: '',
        email: '',
        mobile_num: '',
        mobile_num_2: ''
    });
    const [success, setSuccess] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            setRole(tokenData.role);
        }
        const fetchTeamDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/login');
                    return;
                }

                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };

                let userData = JSON.parse(localStorage.getItem('user') || '{}');
                console.log('User data:', userData);
                
                // Determine endpoint based on user role
                let apiEndpoint;
                if (userData.role === 'receptionist') {
                    // For receptionists, use the business-center endpoint
                    const businessCenterId = userData.business_center_id || routeBusinessId;
                    if (!businessCenterId) {
                        throw new Error('Business center ID not found. Please log in again.');
                    }
                    apiEndpoint = `${process.env.REACT_APP_API_URL}/business-center/${businessCenterId}/teams`;
                    console.log('Using business-center endpoint:', apiEndpoint);
                } else {
                    // For other roles (brand_user, admin), use the business endpoint
                    const businessId = routeBusinessId || localStorage.getItem('businessId') || userData.brand_id;
                    if (!businessId || businessId === 'null') {
                        throw new Error('Business/Brand ID not found. Please log in again.');
                    }
                    apiEndpoint = `${process.env.REACT_APP_API_URL}/business/${businessId}/teams`;
                    console.log('Using business endpoint:', apiEndpoint);
                }
                
                console.log('Using API endpoint:', apiEndpoint);
                const response = await axios.get(apiEndpoint, config);
                console.log('API Response:', response.data);

                let teamsData = response.data.teams || [];
                if (!Array.isArray(teamsData)) {
                    console.error('Invalid teams data:', teamsData);
                    throw new Error('Invalid response format from server');
                }

                console.log('Available teams:', teamsData.map(t => t.team_name));

                // Decode the team name from URL
                const decodedTeamName = decodeURIComponent(teamName);
                console.log('Looking for team:', decodedTeamName);

                // Find the specific team (case-insensitive and handle both spaces and underscores)
                const team = teamsData.find(t => {
                    const normalizedTeamName = t.team_name.replace(/_/g, ' ');
                    const normalizedSearchName = decodedTeamName.replace(/_/g, ' ');
                    return normalizedTeamName.toLowerCase() === normalizedSearchName.toLowerCase();
                });
                
                if (!team) {
                    throw new Error(`Team "${decodedTeamName}" not found. Available teams: ${teamsData.map(t => t.team_name.replace(/_/g, ' ')).join(', ')}`);
                }

                setTeamDetails(team);

                // Get team members - always use business endpoint
                const membersEndpoint = `${apiUrl}/business/${team.business_id}/team/${team.id}/members`;
                console.log('Fetching members from:', membersEndpoint);
                
                const membersResponse = await axios.get(membersEndpoint, config);
                console.log('Members response:', membersResponse.data);
                
                // Members data is in response.data.data
                const membersData = membersResponse.data?.data;

                if (membersData && Array.isArray(membersData)) {
                    setTeamMembers(membersData);
                }
                
                setIsLoading(false);
            } catch (err) {
                setError(err.message || 'Failed to load team details');
                setIsLoading(false);
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            }
        };

        if (teamName) {
            fetchTeamDetails();
        }
    }, [teamName, navigate, apiUrl]);

    const handleViewRecords = () => {
        if (teamDetails) {
            navigate(`/customers/search?team=${encodeURIComponent(teamDetails.team_name)}`);
        }
    };

    const handleAddRecord = () => {
        navigate(`/customers/create?team=${encodeURIComponent(teamDetails.team_name)}`);
    };

    const handleMemberEdit = (member) => {
        setEditingMember(member);
        setMemberFormData({
            username: member.username,
            designation: member.designation,
            department: member.department,
            email: member.email,
            mobile_num: member.mobile_num,
            mobile_num_2: member.mobile_num_2 || ''
        });
    };

    const handleMemberUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Basic validation
        if (!memberFormData.username || !memberFormData.email || !memberFormData.mobile_num) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.put(
                `${apiUrl}/team/member/${editingMember.id}`,
                memberFormData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Update the team members list
            setTeamMembers(prevMembers =>
                prevMembers.map(member =>
                    member.id === editingMember.id
                        ? { ...member, ...memberFormData }
                        : member
                )
            );

            setSuccess('Team member updated successfully');
            resetMemberForm();

            // Clear messages after 3 seconds
            setTimeout(() => {
                setSuccess('');
                setError('');
            }, 3000);

        } catch (error) {
            console.error('Error updating team member:', error);
            setError(error.response?.data?.message || 'Error updating team member');
            
            // Clear error after 3 seconds
            setTimeout(() => {
                setError('');
            }, 3000);
        }
    };

    const handleMemberDelete = async (memberId) => {
        if (!window.confirm('Are you sure you want to delete this team member?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            await axios.delete(`${apiUrl}/team/member/${memberId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update the team members list by removing the deleted member
            setTeamMembers(prevMembers => 
                prevMembers.filter(member => member.id !== memberId)
            );

            setSuccess('Team member deleted successfully');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess('');
            }, 3000);

        } catch (error) {
            console.error('Error deleting team member:', error);
            setError(error.response?.data?.message || 'Error deleting team member');
            
            // Clear error message after 3 seconds
            setTimeout(() => {
                setError('');
            }, 3000);
        }
    };

    const resetMemberForm = () => {
        setEditingMember(null);
        setMemberFormData({
            username: '',
            designation: '',
            department: '',
            email: '',
            mobile_num: '',
            mobile_num_2: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setMemberFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (isLoading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!teamDetails) {
        return <div className="error">Team not found</div>;
    }

    return (
        <div className="team-form-container">
            <div className="team-titlee">
                <h1 className="team-name">{teamDetails.team_name}</h1>
                <button className="view-records-btn" onClick={handleViewRecords}>
                    View Records
                </button>
            </div>
            <div>
                <strong>PROMPT</strong>
                <p className="team-prompt">{teamDetails.team_prompt || 'No team prompt available'}</p>
            </div>

            <div className="team-info">
                <div className="info-section">
                    <h2>Company Details</h2>
                    <div className="detail-item">
                        <label>Phone No:</label>
                        <span>{teamDetails.team_phone || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Email:</label>
                        <span>{teamDetails.team_email || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Registration No:</label>
                        <span>{teamDetails.reg_no || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Tax ID:</label>
                        <span>{teamDetails.tax_id || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Address:</label>
                        <span>{teamDetails.team_address || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Country:</label>
                        <span>{teamDetails.team_country || 'N/A'}</span>
                    </div>
                </div>

                <div className="info-section">
                    <h2>Company Description</h2>
                    <p className="team-detail">{teamDetails.team_detail || 'No description available'}</p>
                </div>
            </div>

            <div className="team-memberss">
                <h2>Company Members ({teamMembers.length})</h2>

                {/* Success and Error Messages */}
                {success && <div className="success-message">{success}</div>}
                {error && <div className="error-message">{error}</div>}


            {/* Edit Member Form */}
            {editingMember && (
                <div className="sectionnnnn">
                    <h3 className='create-team-heading'>Edit Associate</h3>
                    <div className='team-inputsss'>
                        <div className="team-inputtt">
                            <div className="form-rowww">
                                <div className="form-groupppp">
                                    <label htmlFor="username">Username:</label>
                                    <div className="input-container">
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={memberFormData.username}
                                            onChange={handleInputChange}
                                            placeholder="Username"
                                            className={error ? 'error' : ''}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-groupppp">
                                    <label htmlFor="email">Email:</label>
                                    <div className="input-container">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={memberFormData.email}
                                            onChange={handleInputChange}
                                            placeholder="Email"
                                            className={error ? 'error' : ''}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-groupppp">
                                    <label htmlFor="mobile_num">Mobile Number:</label>
                                    <div className="input-container">
                                        <input
                                            type="text"
                                            id="mobile_num"
                                            name="mobile_num"
                                            value={memberFormData.mobile_num}
                                            onChange={handleInputChange}
                                            placeholder="Mobile Number"
                                            className={error ? 'error' : ''}
                                            required
                                        />
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
                                            name="mobile_num_2"
                                            value={memberFormData.mobile_num_2}
                                            onChange={handleInputChange}
                                            placeholder="Alternative Mobile Number"
                                        />
                                    </div>
                                </div>
                                <div className="form-groupppp">
                                    <label htmlFor="department">Department:</label>
                                    <div className="input-container">
                                        <input
                                            type="text"
                                            id="department"
                                            name="department"
                                            value={memberFormData.department}
                                            onChange={handleInputChange}
                                            placeholder="Department"
                                            className={error ? 'error' : ''}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-groupppp">
                                    <label htmlFor="designation">Designation:</label>
                                    <div className="input-container">
                                        <input
                                            type="text"
                                            id="designation"
                                            name="designation"
                                            value={memberFormData.designation}
                                            onChange={handleInputChange}
                                            placeholder="Designation"
                                            className={error ? 'error' : ''}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="button-containerrrr">
                        <button onClick={handleMemberUpdate} className="create-buttonn">Update Associate</button>
                        <button onClick={resetMemberForm} className="cancel-buttonn">Cancel</button>
                    </div>
                </div>
            )}
                {/* Members Grid */}
                <div className="members-grid">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="member-card">
                            <h3>{member.username}</h3>
                            <div className="member-details">
                                <p><strong>Department:</strong> {member.department}</p>
                                <p><strong>Designation:</strong> {member.designation}</p>
                                <p><strong>Email:</strong> {member.email}</p>
                                <p><strong>Phone:</strong> <a href={`tel:${member.mobile_num}`}>{member.mobile_num}</a></p>
                            </div>
                            {role !== 'receptionist' && (
                                <div className="member-actions">
                                    <button onClick={() => handleMemberEdit(member)}>Edit</button>
                                    <button onClick={() => handleMemberDelete(member.id)}>Delete</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bottom-actions">
                <button className="add-record-btn" onClick={handleAddRecord}>
                    Add New Record
                </button>
            </div>
        </div>
    );
};

export default TeamForm;