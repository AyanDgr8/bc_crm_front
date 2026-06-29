// src/components/routes/Forms/TeamForm/TeamForm.js

import React, { useState, useEffect } from 'react';
import axios from "axios";
import { useParams, useNavigate } from 'react-router-dom';
// import { buildAgentStatusByExtension } from '../../../../utils/agentAvailability';
// import { dialCustomerPhone } from '../../../../utils/ucpDialer';
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
    const [activeTab, setActiveTab] = useState('about');
    // const [agentStatusByExtension, setAgentStatusByExtension] = useState({});
    const [memberFormData, setMemberFormData] = useState({
        username: '',
        designation: '',
        extension: '',
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
                if (userData.role === 'business_admin') {
                    // For business admin, use their assigned business center ID
                    const businessCenterId = userData.business_center_id;
                    if (!businessCenterId) {
                        throw new Error('Business center ID not found. Please log in again.');
                    }
                    apiEndpoint = `${process.env.REACT_APP_API_URL}/business/${businessCenterId}/teams`;
                } else if (userData.role === 'brand_user' || userData.role === 'admin') {
                    // For brand users and admins, use the business ID from route or localStorage
                    const businessId = routeBusinessId || localStorage.getItem('businessId');
                    if (!businessId) {
                        throw new Error('Business ID not found. Please log in again.');
                    }
                    apiEndpoint = `${process.env.REACT_APP_API_URL}/business/${businessId}/teams`;
                } else if (userData.role === 'receptionist') {
                    // For receptionists, use their assigned business center ID
                    const businessCenterId = userData.business_center_id;
                    if (!businessCenterId) {
                        throw new Error('Business center ID not found. Please log in again.');
                    }
                    apiEndpoint = `${process.env.REACT_APP_API_URL}/business/${businessCenterId}/teams`;
                } else {
                    throw new Error('Invalid user role');
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

                // try {
                //     const agentStatsResponse = await axios.get(
                //         `${apiUrl}/agent-stats/final`,
                //         {
                //             params: {
                //                 businessCenterId: team.business_id,
                //                 limit: 300
                //             },
                //             headers: { Authorization: `Bearer ${token}` }
                //         }
                //     );
                //     setAgentStatusByExtension(buildAgentStatusByExtension(agentStatsResponse.data));
                // } catch (statsError) {
                //     console.error('Error fetching agent statuses:', statsError);
                //     setAgentStatusByExtension({});
                // }
                
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
            const path = role === 'receptionist'
                ? `/dashboard/customers/search?team=${teamDetails.team_name.replace(/\s+/g, '_')}`
                : `/customers/search?team=${teamDetails.team_name.replace(/\s+/g, '_')}`;
            navigate(path);
        }
    };

    const handleAddRecord = () => {
        const path = role === 'receptionist'
          ? `/dashboard/customers/create?team=${teamDetails.team_name.replace(/\s+/g, '_')}`
          : `/customers/create?team=${teamDetails.team_name.replace(/\s+/g, '_')}`;
        navigate(path);
    };

    // const getAgentStatus = (member) => {
    //     const extension = String(member.extension || '').trim();
    //     return agentStatusByExtension[extension] || '';
    // };

    // const canCallMember = (member) => Boolean(member.extension) && getAgentStatus(member) === 'available';
    
    const handleMemberUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Basic validation
        if (!memberFormData.username || !memberFormData.email || !memberFormData.mobile_num || !memberFormData.extension) {
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

    const resetMemberForm = () => {
        setEditingMember(null);
        setMemberFormData({
            username: '',
            designation: '',
            extension: '',
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

    const displayTeamName = teamDetails.team_name.replace(/_/g, ' ');
    return (
        <div className="team-form-container">
            <div className="team-titlee team-hero">
                <div className="team-hero-row">
                    <div className="team-title-text">
                        <h1 className="team-name">{displayTeamName}</h1>
                        {teamDetails.team_extension && (
                            <span className="team-extension-label">
                                Team Ext: {teamDetails.team_extension}
                            </span>
                        )}
                    </div>
                    {/* <button
                        type="button"
                        className="team-extension-call-button"
                        aria-label={`Call ${displayTeamName} team extension`}
                        title={teamDetails.team_extension ? `Call team extension ${teamDetails.team_extension}` : 'No team extension available'}
                        disabled={!teamDetails.team_extension}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (teamDetails.team_extension) {
                                window.openUcpPopup?.();
                                dialCustomerPhone(teamDetails.team_extension);
                            }
                        }}
                    >
                        <i className="fas fa-phone"></i>
                    </button> */}
                </div>   
            </div>

            <p className="team-prompt">{teamDetails.team_prompt || 'No team prompt available'}</p>

            <div className="team-tabs" role="tablist" aria-label="Company sections">
                <button
                    type="button"
                    className={activeTab === 'about' ? 'active' : ''}
                    onClick={() => setActiveTab('about')}
                >
                    About
                </button>
                <button
                    type="button"
                    className={activeTab === 'details' ? 'active' : ''}
                    onClick={() => setActiveTab('details')}
                >
                    Details
                </button>
                <button
                    type="button"
                    className={activeTab === 'associates' ? 'active' : ''}
                    onClick={() => setActiveTab('associates')}
                >
                    Associates ({teamMembers.length})
                </button>
            </div>

            <div className="team-tab-panel">
                {activeTab === 'about' && (
                <div className="info-section about-section">
                    <h2>Company Description</h2>
                    <p className="team-detail">{teamDetails.team_detail || 'No description available'}</p>
                </div>
                )}

                {activeTab === 'associates' && (
            <div className="team-memberss">
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
                                    <label htmlFor="extension">Extension:</label>
                                    <div className="input-container">
                                        <input
                                            type="text"
                                            id="extension"
                                            name="extension"
                                            value={memberFormData.extension}
                                            onChange={handleInputChange}
                                            placeholder="Extension *"
                                            className={error ? 'error' : ''}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="form-rowww">
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
                    {teamMembers.length === 0 && (
                        <div className="empty-members">
                            <strong>No associates added yet.</strong>
                            <span>Create associates for this company to start assigning records.</span>
                        </div>
                    )}
                    {teamMembers.map((member) => {
                        return (
                        <div key={member.id} className="member-card">
                            <div className="member-card-header">
                                <div className="member-identity">
                                    <h3>{member.username}</h3>
                                </div>
                                {/* <button
                                    type="button"
                                    className="member-call-button"
                                    aria-label={`Call ${member.username}`}
                                    title={canCall ? `Call ${member.username}` : `${member.username} is unavailable`}
                                    disabled={!canCall}
                                    onClick={() => {
                                        if (canCall) {
                                            dialCustomerPhone(member.extension);
                                        }
                                    }}
                                >
                                    <i className="fas fa-phone"></i>
                                </button> */}
                            </div>
                            <div className="member-details">
                                <p>
                                    <strong>Extension</strong>
                                    <span className="member-detail-value member-extension-value">{member.extension || 'N/A'}</span>
                                </p>
                                <p>
                                    <strong>Email</strong>
                                    {member.email ? (
                                        <a className="member-detail-value" href={`mailto:${member.email}`}>{member.email}</a>
                                    ) : (
                                        <span className="member-detail-value">N/A</span>
                                    )}
                                </p>
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
                )}

                {activeTab === 'details' && (
                <div className="info-section details-section">
                    <h2>Company Details</h2>
                    <div className="detail-item">
                        <span className='info_pair'>
                            <label>Phone No:</label>
                            <span>{teamDetails.team_phone || 'N/A'}</span>
                        </span>
                        <span className='info_pair'>
                            <label>Email:</label>
                            <span>{teamDetails.team_email || 'N/A'}</span>
                        </span>
                    </div>
                    <div className="detail-item">
                        <span className='info_pair'>
                            <label>Registration No:</label>
                            <span>{teamDetails.reg_no || 'N/A'}</span>
                        </span>
                        <span className='info_pair'>
                            <label>Tax ID:</label>
                            <span>{teamDetails.tax_id || 'N/A'}</span>
                        </span>
                    </div>
                    <div className="detail-item">
                        <span className='info_pair'>
                            <label>Address:</label>
                            <span>{teamDetails.team_address || 'N/A'}, {teamDetails.team_country || 'N/A'}</span>
                        </span>
                    </div>
                </div>
                )}
            </div>

            <div className="bottom-actions team-record-actions">
                <button className="view-records-btn" onClick={handleViewRecords}>
                    View Records
                </button>
                <button className="add-record-btn" onClick={handleAddRecord}>
                    Add New Record
                </button>
            </div>
        </div>
    );
};

export default TeamForm;
