// src/components/routes/Forms/AdminPortal/AdminPortal.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../utils/api';
import './AdminPortal.css';

const AdminPortal = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [newTeams, setNewTeams] = useState([{ team_name: '', tax_id: '', reg_no: '', team_detail: '', team_address: '', team_country: '', team_phone: '', team_email: '' }]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [messageVisible, setMessageVisible] = useState(false);

    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        mobile_num: '',
        mobile_num_2: '',
        designation: '',
        team_id: '',
    });

    const [fieldErrors, setFieldErrors] = useState({
        username: '',
        email: '',
        mobile_num: '',
        mobile_num_2: '',
        designation: '',
        team_id: ''
    });

    const handleTeamClick = (teamName) => {
        navigate(`/team/${teamName}`);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        
        fetchTeams();
        fetchUsers();
    }, [navigate]);

    useEffect(() => {
        if (error || success) {
            setMessageVisible(true);
            const timer = setTimeout(() => {
                setMessageVisible(false);
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    useEffect(() => {
        if (error) {
            if (error.includes('token') || error.includes('unauthorized')) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    }, [error, navigate]);

    const fetchTeams = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/team/players/teams');
            if (response.data && response.data.teams) {
                setTeams(response.data.teams);
            } else {
                setTeams([]); // Set empty array if no teams
            }
        } catch (err) {
            console.error('Error fetching teams:', err);
            const errorMsg = err.response?.data?.message || 'Failed to fetch teams';
            setError(errorMsg);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
            setTeams([]); // Set empty array on error
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/players/users');
            if (response.data) {
                setUsers(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            const errorMsg = err.response?.data?.message || 'Failed to fetch users';
            setError(errorMsg);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setIsLoading(false);
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

    const handleCreateTeams = async () => {
        const validTeams = newTeams.filter(team => team.team_name.trim() !== '');
        if (validTeams.length === 0) {
            setError('Please enter a team name');
            return;
        }
        
        try {
            for (const team of validTeams) {
                await api.post('/team/players/teams', team);
            }
            setError(''); // Clear any existing error
            setSuccess('Team created successfully');
            setNewTeams([{ team_name: '', tax_id: '', reg_no: '', team_detail: '', team_address: '', team_country: '', team_prompt: '', team_phone: '', team_email: '' }]);
            fetchTeams();
        } catch (err) {
            console.error('Error creating team:', err);
            setSuccess(''); // Clear any existing success
            const errorMsg = err.response?.data?.message || 'Failed to create team';
            setError(errorMsg);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    const handleUserInputChange = (field, value) => {
        setNewUser(prev => {

            // For other field changes
            return {
                ...prev,
                [field]: value
            };
        });
    };

    const handleCreateUser = async () => {
        try {
            // Reset all field errors
            setFieldErrors({});
            setError('');
            setSuccess('');

            // Validate required fields
            const requiredFields = ['username', 'email', 'mobile_num', 'team_id', 'designation'];
            const newErrors = {};
            requiredFields.forEach(field => {
                if (!newUser[field]) {
                    newErrors[field] = `${field.replace('_', ' ')} is required`;
                }
            });

            if (Object.keys(newErrors).length > 0) {
                setFieldErrors(newErrors);
                return;
            }

            const response = await api.post('/users/create', newUser);
            
            if (response.data.success) {
                // Clear form and show success message
                setNewUser({
                    username: '',
                    email: '',
                    mobile_num: '',
                    mobile_num_2: '',
                    team_id: '',
                    designation: ''
                });
                setSuccess('User created successfully');
                fetchUsers(); // Refresh the users list
            }
        } catch (err) {
            console.error('Error creating user:', err);
            const errorData = err.response?.data;
            
            if (errorData?.field) {
                // Set error for the specific field that caused the duplicate error
                setFieldErrors({ [errorData.field]: errorData.error });
                setError(errorData.error); // Also show the error message at the top
            } else {
                setError(errorData?.error || 'Failed to create user');
            }
        }
    };

    return (
        <div className="admin-portal-container">
            <div className="admin-portal">


            {/* <div className="sectionnn">
                    <h3 className='create-user-heading'>Create Associate</h3>
                    <div className="user-formm">
                        <div className="user-inputs">
                        
                            <input
                                type="text"
                                value={newUser.username}
                                onChange={(e) => handleUserInputChange('username', e.target.value)}
                                placeholder="Username"
                                className={fieldErrors.username ? 'error-field' : ''}
                            />
                            <input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => handleUserInputChange('email', e.target.value)}
                                placeholder="Email"
                                className={fieldErrors.email ? 'error-field' : ''}
                            />
                            <input
                                type="text"
                                value={newUser.mobile_num}
                                onChange={(e) => handleUserInputChange('mobile_num', e.target.value)}
                                placeholder="Mobile Number"
                                className={fieldErrors.mobile_num ? 'error-field' : ''}
                            />
                            <input
                                type="text"
                                value={newUser.mobile_num_2}
                                onChange={(e) => handleUserInputChange('mobile_num_2', e.target.value)}
                                placeholder="Alter Mobile Number"
                                className={fieldErrors.mobile_num_2 ? 'error-field' : ''}
                            />
                            <input
                                type="text"
                                value={newUser.designation}
                                onChange={(e) => handleUserInputChange('designation', e.target.value)}
                                placeholder="Designation"
                                className={fieldErrors.designation ? 'error-field' : ''}
                            />
                            <select
                                value={newUser.team_id}
                                onChange={(e) => handleUserInputChange('team_id', e.target.value)}
                                className={fieldErrors.team_id ? 'error-field' : ''}
                            >
                                <option value="">Select Team</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.team_name}</option>
                                ))}
                            </select>
                            {fieldErrors.team_id && <div className="error-messaage">{fieldErrors.team_id}</div>}
                        </div>

                        <button onClick={handleCreateUser} className="create-button">Create Associate</button>
                    </div>

                </div> */}

                {/* <div className="sectionnn">
                    <h3 className='create-team-heading'>Create Company</h3>
                    <div className='team-inputsss'>
                        {newTeams.map((team, index) => (
                            <div key={index} className="team-inputt">
                                <div className="team-row">
                                    <input
                                        type="text"
                                        value={team.team_name}
                                        onChange={(e) => handleTeamInputChange(index, 'team_name', e.target.value)}
                                        placeholder="Enter Company name"
                                        className="team-name-input"
                                    />
                                    <input
                                        type="text"
                                        value={team.tax_id}
                                        onChange={(e) => handleTeamInputChange(index, 'tax_id', e.target.value)}
                                        placeholder="Tax ID"
                                        className="tax-id-input"
                                    />
                                    <input
                                        type="text"
                                        value={team.reg_no}
                                        onChange={(e) => handleTeamInputChange(index, 'reg_no', e.target.value)}
                                        placeholder="Registration Number"
                                        className="reg-no-input"
                                    />
                                </div>
                                <div className="team-row">
                                    <input
                                        type="text"
                                        value={team.team_phone}
                                        onChange={(e) => handleTeamInputChange(index, 'team_phone', e.target.value)}
                                        placeholder="Company Phone"
                                        className="team-phone-input"
                                    />
                                    <input
                                        type="text"
                                        value={team.team_email}
                                        onChange={(e) => handleTeamInputChange(index, 'team_email', e.target.value)}
                                        placeholder="Company Email"
                                        className="team-email-input"
                                    />
                                </div>
                                <div className="team-row">
                                    <input
                                        type="text"
                                        value={team.team_address}
                                        onChange={(e) => handleTeamInputChange(index, 'team_address', e.target.value)}
                                        placeholder="Company Address"
                                        className="team-address-input"
                                    />
                                    <input
                                        type="text"
                                        value={team.team_country}
                                        onChange={(e) => handleTeamInputChange(index, 'team_country', e.target.value)}
                                        placeholder="Company Country"
                                        className="team-country-input"
                                    />
                                </div>
                                <div className="team-row">
                                    <input
                                        type="text"
                                        value={team.team_prompt}
                                        onChange={(e) => handleTeamInputChange(index, 'team_prompt', e.target.value)}
                                        placeholder="Company Prompt"
                                        className="team-prompt-input"
                                    />
                                </div>
                                <div className="team-row">
                                    <input
                                        type="text"
                                        value={team.team_detail}
                                        onChange={(e) => handleTeamInputChange(index, 'team_detail', e.target.value)}
                                        placeholder="Company Details"
                                        className="team-detail-input"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {messageVisible && (error || success) && (
                        <div className={`message-container ${error ? 'error' : 'success'}`}>
                            {error || success}
                        </div>
                    )}
                    
                    <div className="team-button-container">
                        <button onClick={handleCreateTeams} className="create-button">Create Team</button>
                    </div>
                </div> */}
                
                <div className="section">
                    <h3 className='existing-user-heading'>All Associates</h3>
                    <div className="users-list">
                        {/* Group users by team */}
                        {teams.map(team => {
                            // Filter users for this team
                            const teamUsers = users.filter(user => 
                                user.team_id === team.id
                            );

                            // Only show team section if there are users
                            if (teamUsers.length === 0) return null;

                            return (
                                <div 
                                    key={team.id} 
                                    className="team-section"
                                    onClick={() => handleTeamClick(team.team_name)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <h4 className="team-name">{team.team_name}</h4>
                                    <div className="user-row header">
                                        <div className="user-col">Name</div>
                                        <div className="user-col">Email</div>
                                        <div className="user-col">Mobile Number</div>
                                        <div className="user-col">Alter Number</div>
                                        <div className="user-col">Designation</div>
                                    </div>
                                    {teamUsers.map(user => (
                                        <div className="user-row" key={user.id}>
                                            <div className="user-col">{user.username}</div>
                                            <div className="user-col">{user.email}</div>
                                            <div className="user-col">{user.mobile_num}</div>
                                            <div className="user-col">{user.mobile_num_2}</div>
                                            <div className="user-col">{user.designation}</div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}

                    </div>
                </div>
            </div>

            
        </div>
    );
};

export default AdminPortal;
