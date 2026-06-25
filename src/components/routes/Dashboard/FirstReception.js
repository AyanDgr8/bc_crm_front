// src/components/routes/Dashboard/FirstReception.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FirstReception.css';

const FirstReception = () => {
    const [stats, setStats] = useState({
        activeCompanies: 0,
        totalCallsToday: 0,
        totalRecordsToday: 0
    });

    const [lastCall, setLastCall] = useState({
        company: 'Akash Institute',
        member: 'Prashant',
        time: '6th June, 2025 at 11:05am',
        action: 'Call received'
    });

    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
        const fetchTeams = async () => {
            try {
                const token = localStorage.getItem('token');
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                
                if (!userData.business_center_id) {
                    throw new Error('Business center ID not found');
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
                setLoading(false);
            } catch (error) {
                console.error('Error fetching teams:', error);
                setError('Failed to load teams data');
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    return (
        <div>
            <div className="header-boxes">
                <div className="info-box active-companies">
                    <span className="info-labelll">No of Active Companies:</span>
                    <span className="info-valuee">{stats.activeCompanies}</span>
                </div>
                
                <div className="info-boxes-row">
                    <div className="info-box call-details">
                        <div className="info-row">
                            <div className="info-labelll">Last Call received for:</div>
                            <span className="info-valuee">{lastCall.company}</span>
                        </div>
                        <div className="info-row">
                            <div className="info-labelll">Last Call Received for member:</div>
                            <span className="info-valuee">{lastCall.member}</span>
                        </div>
                        <div className="info-row">
                            <div className="info-labelll">Last Call Received at:</div>
                            <span className="info-valuee">{lastCall.time}</span>
                        </div>
                    </div>

                    <div className="info-box stats-details">
                        <div className="info-row">
                            <div className="info-labelll">Total Call Received Today:</div>
                            <span className="info-valuee">{stats.totalCallsToday}</span>
                        </div>
                        <div className="info-row">
                            <div className="info-labelll">Total Records added today:</div>
                            <span className="info-valuee">{stats.totalRecordsToday}</span>
                        </div>
                        <div className="info-row">
                            <div className="info-labelll">Last Action:</div>
                            <span className="info-valuee">{lastCall.action}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teams Section */}
            <div className="teams-sectioonn">
                <h2 className="teamm-heading">Users</h2>
                {loading ? (
                    <div className="loading">Loading teams...</div>
                ) : error ? (
                    <div className="error">{error}</div>
                ) : (
                    <div className="teaaamms-grid">
                        {teams.map((team) => (
                            <div key={team.id} className="teeam-carrd">
                                <h2 className="teeamm-name">{team.team_name.replace(/_/g, ' ')}</h2>
                                {team.members && team.members.length > 0 ? (
                                    <div className="membbers-grid">
                                        {team.members.map((member) => (
                                            <div key={member.id} className="membeer-card">
                                                <h3>{member.username || member.name}</h3>
                                                <div className="membwer-details">
                                                    {/* <p><strong>Department:</strong> {member.department || 'N/A'}</p>
                                                    <p><strong>Designation:</strong> {member.designation || 'N/A'}</p> */}
                                                    <p><strong>Email:</strong> {member.email || 'N/A'}</p>
                                                    <p><strong>Phone:</strong> {member.mobile_num ? 
                                                        <a href={`tel:${member.mobile_num}`}>{member.mobile_num}</a> : 'N/A'
                                                    }</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-members">No team members found</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FirstReception;
