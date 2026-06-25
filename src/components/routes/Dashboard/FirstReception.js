// src/components/routes/Dashboard/FirstReception.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './FirstReception.css';

const FirstReception = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        activeCompanies: 0,
        totalCallsToday: 0,
        totalRecordsToday: 0
    });

    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [businessCenterId, setBusinessCenterId] = useState('');
    const [businessCenterName, setBusinessCenterName] = useState('Business Center');
    const [activity, setActivity] = useState({
        lastWalkIn: null,
        lastCallTransferred: null
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/stats/reception`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, []);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/dashboard/reception-activity`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                setActivity({
                    lastWalkIn: response.data?.lastWalkIn || null,
                    lastCallTransferred: response.data?.lastCallTransferred || null
                });
            } catch (error) {
                console.error('Error fetching dashboard activity:', error);
            }
        };

        fetchActivity();
    }, []);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const token = localStorage.getItem('token');
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                const tokenData = token ? JSON.parse(atob(token.split('.')[1])) : {};
                const userData = { ...tokenData, ...storedUser };
                
                if (!userData.business_center_id) {
                    throw new Error('Business center ID not found');
                }
                setBusinessCenterId(userData.business_center_id);
                setBusinessCenterName(
                    userData.business_name ||
                    userData.business_center_name ||
                    userData.center_name ||
                    'Business Center'
                );

                try {
                    const businessResponse = await axios.get(
                        `${process.env.REACT_APP_API_URL}/business/${userData.business_center_id}`,
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );

                    if (businessResponse.data?.business_name) {
                        setBusinessCenterName(businessResponse.data.business_name);
                    }
                } catch (businessError) {
                    console.error('Error fetching business center name:', businessError);
                }

                let apiEndpoint;
                if (userData.role === 'business_admin' || userData.role === 'receptionist') {
                    apiEndpoint = `${process.env.REACT_APP_API_URL}/business/${userData.business_center_id}/teams`;
                } else if (userData.role === 'brand_user') {
                    const businessId = userData.business_id;
                    if (!businessId) {
                        throw new Error('Business ID not found');
                    }
                    apiEndpoint = `${process.env.REACT_APP_API_URL}/business/${businessId}/teams`;
                } else {
                    throw new Error('Invalid user role');
                }

                const response = await axios.get(
                    apiEndpoint,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                const teamsData = response.data.teams || [];
                if (!Array.isArray(teamsData)) {
                    throw new Error('Invalid response format from server');
                }

                // Fetch members for each team
                const teamsWithMembers = await Promise.all(teamsData.map(async (team) => {
                    try {
                        const membersEndpoint = `${process.env.REACT_APP_API_URL}/business/${team.business_id}/team/${team.id}/members`;
                        const membersResponse = await axios.get(membersEndpoint, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        
                        return {
                            ...team,
                            members: membersResponse.data?.data || []
                        };
                    } catch (error) {
                        console.error(`Error fetching members for team ${team.team_name}:`, error);
                        return {
                            ...team,
                            members: []
                        };
                    }
                }));

                setTeams(teamsWithMembers);
                setStats((previousStats) => ({
                    ...previousStats,
                    activeCompanies: response.data.activeCompanies || teamsWithMembers.length
                }));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching teams:', error);
                setError('Failed to load teams data');
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    const filteredTeams = teams.filter((team) =>
        (team.team_name || '').replace(/_/g, ' ').toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

    const formatTeamName = (teamName = '') => teamName.replace(/_/g, ' ');

    const getBusinessId = (team) => team.business_id || team.businessId || team.business_center_id || businessCenterId;

    const handleOpenCompany = (team) => {
        const businessId = getBusinessId(team);
        if (!businessId || !team.team_name) return;
        navigate(`/dashboard/business/${businessId}/team/${encodeURIComponent(team.team_name)}`);
    };

    const handleUpcomingReminders = () => {
        navigate('/dashboard/customers/reminders');
    };

    const formatActivityTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="first-reception-container">
            <div className="reception-hero">
                <div>
                    <h1>{businessCenterName}</h1>
                </div>
                <div className="reception-hero-actions">
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search company"
                        aria-label="Search company"
                    />
                    <button type="button" onClick={handleUpcomingReminders}>
                        Upcoming Reminders
                    </button>
                </div>
            </div>

            <div className="reception-stats-grid reception-stats-grid--four">
                <div className="reception-stat-card accent-blue">
                    <span>Active Companies</span>
                    <strong>{stats.activeCompanies || teams.length}</strong>
                </div>
                <div className="reception-stat-card accent-green">
                    <span>Calls Today</span>
                    <strong>{stats.totalCallsToday}</strong>
                </div>
                <div className="reception-stat-card accent-orange">
                    <span>Records Added Today</span>
                    <strong>{stats.totalRecordsToday}</strong>
                </div>
            </div>

            <div className="reception-summary-grid reception-summary-grid--two">
                <div className="reception-info-panel">
                    <h2>Last Call Transferred</h2>
                    <div className="summary-row">
                        <span>Company</span>
                        <strong>{(activity.lastCallTransferred?.QUEUE_NAME || activity.lastCallTransferred?.team_name || 'N/A').replace(/_/g, ' ')}</strong>
                    </div>
                    <div className="summary-row">
                        <span>Member</span>
                        <strong>{activity.lastCallTransferred?.agent_name || activity.lastCallTransferred?.designation || 'N/A'}</strong>
                    </div>
                    <div className="summary-row">
                        <span>Time</span>
                        <strong>{formatActivityTime(activity.lastCallTransferred?.date_created)}</strong>
                    </div>
                </div>
                <div className="reception-info-panel">
                    <h2>Last Walk In</h2>
                    <div className="summary-row">
                        <span>Company</span>
                        <strong>{(activity.lastWalkIn?.QUEUE_NAME || activity.lastWalkIn?.team_name || 'N/A').replace(/_/g, ' ')}</strong>
                    </div>
                    <div className="summary-row">
                        <span>Visitor</span>
                        <strong>{activity.lastWalkIn?.customer_name || 'N/A'}</strong>
                    </div>
                    <div className="summary-row">
                        <span>Time</span>
                        <strong>{formatActivityTime(activity.lastWalkIn?.date_created)}</strong>
                    </div>
                </div>
            </div>

            <div className="teams-sectioonn">
                <h2 className="companies-heading">Companies</h2>
                {loading ? (
                    <div className="loading">Loading teams...</div>
                ) : error ? (
                    <div className="error">{error}</div>
                ) : filteredTeams.length === 0 ? (
                    <div className="empty-companies">No companies found.</div>
                ) : (
                    <div className="teaaamms-grid">
                        {filteredTeams.map((team) => (
                            <div
                                key={team.id}
                                className="teeam-carrd"
                                role="button"
                                tabIndex={0}
                                onClick={() => handleOpenCompany(team)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        handleOpenCompany(team);
                                    }
                                }}
                            >
                                <div className="team-card-header company-summary-card">
                                    <h2 className="teeamm-name">{formatTeamName(team.team_name)}</h2>
                                    <p>{team.members?.length || 0} associates</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FirstReception;
