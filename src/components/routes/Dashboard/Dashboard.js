// src/components/routes/Dashboard/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, useParams } from 'react-router-dom';
import './Dashboard.css';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import SearchForm from '../Forms/SearchForm/SearchForm';
import CreateForm from '../Forms/CreateForm/CreateForm';
import Reminder from '../Other/Reminder/Reminder';
import Center from '../Forms/AdminPortal/Business/Center';
import UseForm from '../Forms/UseForm/UseForm';
import TeamForm from '../Forms/TeamForm/TeamForm';
import FirstReception from './FirstReception';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userRole, setUserRole] = useState('');
    const [businessId, setBusinessId] = useState('');
    const [teams, setTeams] = useState([]);
    const [showTeams, setShowTeams] = useState(false);
    const [isLoadingTeams, setIsLoadingTeams] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState('');
    
    // New state variables for dashboard header
    const [lastCall, setLastCall] = useState({
        time: '',
        company: '',
        member: '',
        action: 'Transfer'
    });
    const [stats, setStats] = useState({
        activeCompanies: 2,
        subscribedCompanies: 1,
        totalCallsToday: 105,
        totalRecordsToday: 10,
        // walkinVisitors: 2,
        // lastWalkinTime: '6/7/25 2:46',
        // lastVisitorOffice: 'Googly',
        // lastVisitorMember: 'X'
    });

    // Function to fetch last call data
    // const fetchLastCallData = async () => {
    //     try {
    //         const token = localStorage.getItem('token');
    //         const url = `${process.env.REACT_APP_API_URL}/dashboard/last-call`;
    //         console.log('Fetching last call data from:', url);
            
    //         const response = await axios.get(url, {
    //             headers: { 
    //                 'Authorization': `Bearer ${token}`,
    //                 'Content-Type': 'application/json'
    //             }
    //         });
            
    //         if (response.data) {
    //             console.log('Last call response:', response.data);
    //             setLastCall(prevState => ({
    //                 ...prevState,
    //                 time: response.data.timestamp ? new Date(response.data.timestamp).toLocaleString() : '',
    //                 company: response.data.company || '',
    //                 member: response.data.member || ''
    //             }));
    //         }
    //     } catch (error) {
    //         console.error('Error fetching last call data:', error);
    //         if (error.response?.status === 404) {
    //             // Set default values when no last call data exists
    //             setLastCall(prevState => ({
    //                 ...prevState,
    //                 time: '',
    //                 company: 'No recent calls',
    //                 member: ''
    //             }));
    //         }
    //     }
    // };

    // Fetch teams when businessId is available
    const fetchTeams = async () => {
        if (!businessId) {
            console.error('No business center ID available');
            return;
        }
        
        setIsLoadingTeams(true);
        try {
            const token = localStorage.getItem('token');
            const url = `${process.env.REACT_APP_API_URL}/business-center/${businessId}/teams`;
            console.log('Fetching teams from:', url);
            
            const response = await axios.get(url, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Teams response:', response.data);
            
            if (response.data?.teams) {
                const teamsData = response.data.teams;
                console.log('Parsed teams:', teamsData);
                
                if (Array.isArray(teamsData) && teamsData.length > 0) {
                    const sortedTeams = teamsData
                        .filter(team => team && team.team_name)
                        .map(team => ({
                            id: team.id,
                            name: team.team_name,
                            tax_id: team.tax_id,
                            reg_no: team.reg_no,
                            detail: team.team_detail
                        }))
                        .sort((a, b) => a.name.localeCompare(b.name));
                    console.log('Sorted teams:', sortedTeams);
                    setTeams(sortedTeams);
                } else {
                    console.log('No valid teams found in response');
                    setTeams([]);
                }
            } else {
                console.error('Invalid teams data format:', response.data);
                setTeams([]);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
            if (error.response) {
                console.error('Error response:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            setTeams([]);
            if (error.response?.status === 401) {
                navigate('/admin');
            }
        } finally {
            setIsLoadingTeams(false);
        }
    };

    useEffect(() => {
        // Get user role and business ID from token
        const token = localStorage.getItem('token');
        if (token) {
            const tokenData = jwtDecode(token);
            console.log('Token data:', {
                role: tokenData.role,
                business_center_id: tokenData.business_center_id,
                username: tokenData.username
            });
            if (tokenData.role !== 'receptionist') {
                console.warn('User is not a receptionist:', tokenData.role);
            }
            setUserRole(tokenData.role);
            if (!tokenData.business_center_id) {
                console.warn('No business_center_id in token');
            }
            setBusinessId(tokenData.business_center_id || '');
        }
    }, []);

    useEffect(() => {
        if (businessId && userRole === 'receptionist') {
            fetchTeams();
            // Start polling for last call data
            // fetchLastCallData();
            // const pollInterval = setInterval(fetchLastCallData, 30000);
            // return () => clearInterval(pollInterval);
        }
    }, [businessId, userRole]);

    // Navigation handlers
    const handleViewCenter = () => {
        navigate(`/dashboard/business/center/${businessId}`);
    };

    const handleViewTeams = () => {
        navigate(`/dashboard/business/${businessId}/teams`);
    };

    const handleAddRecord = () => {
        navigate('/dashboard/customers/create');
    };

    const handleViewRecords = () => {
        navigate(`/dashboard/business/${businessId}/records`);
    };

    // const handleSearch = () => {
    //     navigate('/dashboard/search');
    // };

    const handleReminders = () => {
        navigate('/dashboard/customers/reminders');
    };

    const handleTeamClick = (teamName) => {
        setSelectedTeam(teamName);
        navigate(`/dashboard/business/${businessId}/team/${teamName}`);
    };

    return (
        <div className="dashboard-container">
            <div className={`dashboard-content ${userRole === 'receptionist' ? 'dashboard-content--full' : ''}`}>
                {userRole !== 'receptionist' && (
                <div className="sidebar">
                    <div className="sidebar-actions">
                        {userRole === 'receptionist' && (
                            <div className="teams-dropdown">
                                <button 
                                    className={`sidebar-button ${showTeams ? 'active' : ''}`}
                                    onClick={() => {
                                        setShowTeams(!showTeams);
                                        if (!showTeams && teams.length === 0) {
                                            fetchTeams(); // Fetch teams when opening if none exist
                                        }
                                    }}
                                >
                                    View Companies {teams.length > 0 && `(${teams.length})`}
                                </button>
                                {showTeams && (
                                    <div className="teamss-list">
                                        {isLoadingTeams ? (
                                            <div className="teams-loading">Loading teams...</div>
                                        ) : teams.length > 0 ? (
                                            teams.map(team => (
                                                <button
                                                    key={team.id || team.name}
                                                    className={`teamm-itemm ${selectedTeam === team.name ? 'selected' : ''}`}
                                                    onClick={() => handleTeamClick(team.name)}
                                                >
                                                    <span className="teeam-namee">{team.name.replace(/_/g, ' ')}</span>
                                                    {team.memberCount && <span className="team-count">({team.memberCount})</span>}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="no-teams">No teams assigned to this business center</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className={`other-actions ${showTeams ? 'show-below-teams' : ''}`}>
                            {/* <button 
                                className="sidebar-button"
                                onClick={handleAddRecord}
                            >
                                Add New Record
                            </button> */}
                            {/* <button 
                                className="sidebar-button"
                                onClick={handleViewRecords}
                            >
                                View Records
                            </button> */}
                            {/* <button 
                                className="sidebar-button"
                                onClick={handleSearch}
                            >
                                Search Records
                            </button> */}
                            <button 
                                className="sidebar-button"
                                onClick={handleReminders}
                            >
                                View Reminders
                            </button>
                        </div>
                    </div>
                </div>
                )}
                <div className="main-contenttt">
                    <Routes>
                        <Route path="first-reception" element={<FirstReception />} />
                        <Route path="business/center/:businessId" element={<Center />} />
                        <Route path="business/:businessId/teams" element={<TeamForm />} />
                        <Route path="business/:businessId/team/:teamName" element={<TeamForm />} />
                        <Route path="business/:businessId/records" element={<UseForm />} />
                        <Route path="customers/create" element={<CreateForm />} />
                        <Route path="customers/reminders" element={<Reminder />} />
                        <Route path="customers/search" element={<SearchForm />} />
                        <Route path="team/:teamName/:phone_no_primary" element={<UseForm />} />
                        <Route path="customer/:id" element={<UseForm />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
