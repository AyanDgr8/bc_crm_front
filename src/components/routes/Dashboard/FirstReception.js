// src/components/routes/Dashboard/FirstReception.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { buildAgentStatusByExtension } from '../../../utils/agentAvailability';
// import { dialCustomerPhone } from '../../../utils/ucpDialer';
import './FirstReception.css';

const FirstReception = ({ companiesOnly = false }) => {
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
    const [agentStatusByExtension, setAgentStatusByExtension] = useState({});
    const [refreshingDashboard, setRefreshingDashboard] = useState(false);
    const [activity, setActivity] = useState({
        lastWalkIn: null,
        lastCallTransferred: null
    });

    const fetchAgentStatuses = useCallback(async ({ pollNow = false } = {}) => {
        try {
            const token = localStorage.getItem('token');
            if (!token || !businessCenterId) return;

            const headers = { Authorization: `Bearer ${token}` };

            if (pollNow) {
                await axios.post(
                    `${process.env.REACT_APP_API_URL}/agent-stats/poll-now`,
                    { businessCenterId },
                    { headers }
                );
            }

            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/agent-stats/final`,
                {
                    params: {
                        businessCenterId,
                        limit: 300
                    },
                    headers
                }
            );

            let latestTotalCalls = 0;

            (Array.isArray(response.data) ? response.data : []).forEach((report) => {
                latestTotalCalls += Number(report.total_calls || 0);
            });

            setAgentStatusByExtension(buildAgentStatusByExtension(response.data));
            setStats((previousStats) => ({
                ...previousStats,
                totalCallsToday: latestTotalCalls
            }));

            try {
                const todaySummaryResponse = await axios.get(
                    `${process.env.REACT_APP_API_URL}/agent-stats/today-summary`,
                    {
                        params: { businessCenterId },
                        headers
                    }
                );

                setStats((previousStats) => ({
                    ...previousStats,
                    totalCallsToday: Number(todaySummaryResponse.data?.totalCalls || 0)
                }));
            } catch (summaryError) {
                console.error('Error fetching today call summary:', summaryError);
            }
        } catch (error) {
            console.error('Error fetching agent statuses:', error);
        }
    }, [businessCenterId]);

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

    useEffect(() => {
        fetchAgentStatuses();
    }, [fetchAgentStatuses]);

    useEffect(() => {
        if (!businessCenterId) return undefined;

        const nextMidnight = new Date();
        nextMidnight.setDate(nextMidnight.getDate() + 1);
        nextMidnight.setHours(0, 0, 1, 0);

        const timerId = window.setTimeout(() => {
            fetchAgentStatuses();
        }, nextMidnight.getTime() - Date.now());

        return () => window.clearTimeout(timerId);
    }, [businessCenterId, fetchAgentStatuses]);

    const filteredTeams = teams.filter((team) =>
        (team.team_name || '').replace(/_/g, ' ').toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

    const formatTeamName = (teamName = '') => teamName.replace(/_/g, ' ');

    const getAgentStatus = (member) => {
        const extension = String(member.extension || '').trim();
        return agentStatusByExtension[extension] || '';
    };

    // const canCallMember = (member) => Boolean(member.extension) && getAgentStatus(member) === 'available';

    const getAssociateRowClass = (member) => {
        const status = getAgentStatus(member);
        return [
            'reception-associate-row',
            status === 'available' ? 'reception-associate-row--available' : '',
            status === 'not-available' ? 'reception-associate-row--not-available' : ''
        ].filter(Boolean).join(' ');
    };

    const getBusinessId = (team) => team.business_id || team.businessId || team.business_center_id || businessCenterId;

    const handleOpenCompany = (team) => {
        const businessId = getBusinessId(team);
        if (!businessId || !team.team_name) return;
        navigate(`/dashboard/business/${businessId}/team/${encodeURIComponent(team.team_name)}`);
    };

    const isInsideAssociatesList = (event) => (
        Boolean(event.target.closest('.reception-company-associates'))
    );

    const handleCompanyCardClick = (event, team) => {
        if (isInsideAssociatesList(event)) return;
        handleOpenCompany(team);
    };

    const handleCompanyCardKeyDown = (event, team) => {
        if (isInsideAssociatesList(event)) return;

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleOpenCompany(team);
        }
    };

    // const handleTeamExtensionCall = (event, team) => {
    //     event.stopPropagation();
    //     if (!team.team_extension) return;
    //
    //     window.openUcpPopup?.();
    //     dialCustomerPhone(team.team_extension);
    // };

    const handleUpcomingReminders = () => {
        navigate('/dashboard/customers/reminders');
    };

    const handleRefreshDashboard = async () => {
        setRefreshingDashboard(true);
        await fetchAgentStatuses({ pollNow: true });
        setRefreshingDashboard(false);
    };

    // const recordCallTransfer = async (team, member) => {
    //     try {
    //         const token = localStorage.getItem('token');
    //         if (!token) return;
    //
    //         const businessId = getBusinessId(team);
    //         const response = await axios.post(
    //             `${process.env.REACT_APP_API_URL}/dashboard/reception-call-transfer`,
    //             {
    //                 businessCenterId: businessId,
    //                 teamId: team.id,
    //                 teamName: team.team_name,
    //                 memberId: member.id,
    //                 memberName: member.username,
    //                 memberEmail: member.email,
    //                 extension: member.extension
    //             },
    //             {
    //                 headers: { Authorization: `Bearer ${token}` }
    //             }
    //         );
    //
    //         setActivity((previousActivity) => ({
    //             ...previousActivity,
    //             lastCallTransferred: response.data?.transfer || {
    //                 QUEUE_NAME: team.team_name,
    //                 team_name: team.team_name,
    //                 agent_name: member.username,
    //                 designation: member.username,
    //                 date_created: new Date().toISOString()
    //             }
    //         }));
    //     } catch (error) {
    //         console.error('Error recording reception call transfer:', error);
    //     }
    // };

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
        <div className={`first-reception-container ${companiesOnly ? 'first-reception-container--companies' : ''}`}>
            <div className="reception-hero">
                <div>
                    <h1>{companiesOnly ? 'Companies' : businessCenterName}</h1>
                </div>
                <div className="reception-hero-actions">
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search company"
                        aria-label="Search company"
                    />
                    {!companiesOnly && (
                        <button
                            type="button"
                            className="reception-refresh-button"
                            onClick={handleRefreshDashboard}
                            disabled={refreshingDashboard || !businessCenterId}
                        >
                            {refreshingDashboard ? 'Refreshing...' : 'Refresh'}
                        </button>
                    )}
                    <button type="button" onClick={handleUpcomingReminders}>
                        Upcoming Reminders
                    </button>
                </div>
            </div>

            {!companiesOnly && (
                <>
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
                                <span>Company Name</span>
                                <strong>{(activity.lastCallTransferred?.QUEUE_NAME || activity.lastCallTransferred?.team_name || 'N/A').replace(/_/g, ' ')}</strong>
                            </div>
                            <div className="summary-row">
                                <span>Associate Name</span>
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
                                <span>Company Name</span>
                                <strong>{(activity.lastWalkIn?.QUEUE_NAME || activity.lastWalkIn?.team_name || 'N/A').replace(/_/g, ' ')}</strong>
                            </div>
                            <div className="summary-row">
                                <span>Visitor Name</span>
                                <strong>{activity.lastWalkIn?.customer_name || 'N/A'}</strong>
                            </div>
                            <div className="summary-row">
                                <span>Time</span>
                                <strong>{formatActivityTime(activity.lastWalkIn?.date_created)}</strong>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="teams-sectioonn">
                {!companiesOnly && <h2 className="companies-heading">COMPANIES</h2>}
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
                                onClick={(event) => handleCompanyCardClick(event, team)}
                                onKeyDown={(event) => handleCompanyCardKeyDown(event, team)}
                            >
                                <div className="team-card-header company-summary-card">
                                    <div className="team-card-title-row">
                                        <div className="team-card-title-text">
                                            <h2 className="teeamm-name">{formatTeamName(team.team_name)}</h2>
                                            {team.team_extension && (
                                                <span className="team-card-extension">
                                                    Team Ext: {team.team_extension}
                                                </span>
                                            )}
                                        </div>
                                        {/* <button
                                            type="button"
                                            className="team-extension-call-button"
                                            aria-label={`Call ${formatTeamName(team.team_name)} team extension`}
                                            title={team.team_extension ? `Call team extension ${team.team_extension}` : 'No team extension available'}
                                            disabled={!team.team_extension}
                                            onClick={(event) => handleTeamExtensionCall(event, team)}
                                        >
                                            <i className="fas fa-phone"></i>
                                        </button> */}
                                    </div>
                                </div>
                                <div className="reception-company-associates">
                                    {team.members?.length > 0 ? (
                                        team.members.map((member) => {
                                            return (
                                            <div className={getAssociateRowClass(member)} key={member.id}>
                                                <div className="reception-associate-info">
                                                    <span className="reception-associate-name">{member.username}</span>
                                                    <span className="reception-associate-extension">
                                                        Ext: {member.extension || 'N/A'}
                                                    </span>
                                                </div>
                                                {/* <button
                                                    type="button"
                                                    className="reception-call-button"
                                                    aria-label={`Call ${member.username}`}
                                                    title={canCall ? `Call ${member.username}` : `${member.username} is unavailable`}
                                                    disabled={!canCall}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        if (canCall) {
                                                            const dialed = dialCustomerPhone(member.extension);
                                                            if (dialed) {
                                                                recordCallTransfer(team, member);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <i className="fas fa-phone"></i>
                                                </button> */}
                                            </div>
                                            );
                                        })
                                    ) : (
                                        <div className="reception-no-associates">
                                            No associates added
                                        </div>
                                    )}
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
