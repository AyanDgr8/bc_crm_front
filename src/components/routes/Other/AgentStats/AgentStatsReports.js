// src/components/routes/Other/AgentStats/AgentStatsReports.js

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../../../../utils/api';
import { buildAgentStatusByExtension } from '../../../../utils/agentAvailability';
import './AgentStatsReports.css';

const formatSeconds = (value) => {
    const totalSeconds = Number(value || 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
};

const formatDateTime = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const parseStateReport = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        return {};
    }
};

const buildVisibleStates = (report) => {
    const detailedStates = parseStateReport(report.not_available_detailed_report);
    const visibleStates = {};

    Object.entries(detailedStates).forEach(([state, seconds]) => {
        if (Number(seconds || 0) > 0) {
            visibleStates[state] = seconds;
        }
    });

    const fallbackStates = {
        'On Call': report.on_call_time,
        Idle: report.idle_time,
        'Wrap Up': report.wrap_up_time,
        Hold: report.hold_time,
        'Not Available': report.not_available_time
    };

    Object.entries(fallbackStates).forEach(([state, seconds]) => {
        if (Number(seconds || 0) > 0 && visibleStates[state] === undefined) {
            visibleStates[state] = seconds;
        }
    });

    return visibleStates;
};

const AgentStatsReports = () => {
    const [reports, setReports] = useState([]);
    const [extensionFilter, setExtensionFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const tokenData = useMemo(() => {
        if (!token) return null;
        try {
            return jwtDecode(token);
        } catch (error) {
            return null;
        }
    }, [token]);

    const fetchReports = useCallback(async (extensionValue = '') => {
        try {
            setLoading(true);
            setError('');
            const params = { limit: 300 };

            if (extensionValue.trim()) {
                params.extension = extensionValue.trim();
            }

            if (
                tokenData?.business_center_id &&
                ['business_admin', 'receptionist'].includes(tokenData.role)
            ) {
                params.businessCenterId = tokenData.business_center_id;
            }

            const response = await api.get('/agent-stats/final', { params });

            setReports(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            const status = error.response?.status;
            const backendMessage = error.response?.data?.message || error.response?.data?.error;
            setError(
                backendMessage
                    ? `${status ? `${status}: ` : ''}${backendMessage}`
                    : 'Unable to fetch agent stats reports. Please confirm the backend is running and restarted.'
            );
        } finally {
            setLoading(false);
        }
    }, [tokenData?.business_center_id, tokenData?.role]);

    const refreshReports = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const businessCenterId = tokenData?.business_center_id;
            await api.post('/agent-stats/poll-now', businessCenterId ? { businessCenterId } : {});
            await fetchReports(extensionFilter);
        } catch (error) {
            const status = error.response?.status;
            const backendMessage = error.response?.data?.message || error.response?.data?.error;
            setError(
                backendMessage
                    ? `${status ? `${status}: ` : ''}${backendMessage}`
                    : 'Unable to refresh agent stats from the API.'
            );
            setLoading(false);
        }
    }, [extensionFilter, fetchReports, tokenData?.business_center_id]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const latestByExtension = useMemo(() => {
        const latest = new Map();
        reports.forEach((report) => {
            const key = report.extension || report.id;
            if (!latest.has(key)) {
                latest.set(key, report);
            }
        });
        return Array.from(latest.values());
    }, [reports]);

    const statusByExtension = useMemo(() => (
        buildAgentStatusByExtension(reports)
    ), [reports]);

    const totals = useMemo(() => {
        return latestByExtension.reduce((summary, report) => ({
            agents: summary.agents + 1,
            calls: summary.calls + Number(report.total_calls || 0),
            answered: summary.answered + Number(report.answered_calls || 0)
        }), {
            agents: 0,
            calls: 0,
            answered: 0
        });
    }, [latestByExtension]);

    return (
        <div className="agent-report-page">
            <div className="agent-report-toolbar">
                <div className="agent-report-toolbar-title">
                    <h1>Agent Stats Reports</h1>
                </div>

                <button type="button" onClick={refreshReports} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>

                <div className="agent-report-filters">
                    <label>
                        Extension
                        <input
                            value={extensionFilter}
                            onChange={(event) => setExtensionFilter(event.target.value)}
                            placeholder="Search extension"
                        />
                    </label>
                    <button type="button" onClick={() => fetchReports(extensionFilter)}>Apply</button>
                    <button
                        type="button"
                        onClick={() => {
                            setExtensionFilter('');
                            fetchReports('');
                        }}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {error && <div className="agent-report-error">{error}</div>}

            <div className="agent-report-summary">
                <div>
                    <span>Agents</span>
                    <strong>{totals.agents}</strong>
                </div>
                <div>
                    <span>Total Calls</span>
                    <strong>{totals.calls}</strong>
                </div>
                <div>
                    <span>Answered</span>
                    <strong>{totals.answered}</strong>
                </div>
            </div>

            <div className="agent-report-card-grid">
                {latestByExtension.map((report) => {
                    const stateReport = buildVisibleStates(report);
                    const isAvailable = statusByExtension[String(report.extension || '').trim()] === 'available';
                    return (
                        <article
                            className={`agent-report-card ${isAvailable ? 'agent-report-card-available' : ''}`}
                            key={`${report.extension}-${report.fetched_at}`}
                        >
                            <div className="agent-report-card-top">
                                <div>
                                    <h2>{report.registered_agent_name || report.agent_name || 'Unknown Agent'}</h2>
                                    <span>{report.registered_company_name || report.business_name || report.tenant_name}</span>
                                </div>
                                <strong>{report.extension}</strong>
                            </div>
                            <div className="agent-report-metrics">
                                <span>Calls <b>{report.total_calls || 0}</b></span>
                                <span>Idle <b>{formatSeconds(report.idle_time)}</b></span>
                                <span>On Call <b>{formatSeconds(report.on_call_time)}</b></span>
                                {Number(report.not_available_time || 0) > 0 && (
                                    <span>NA <b>{formatSeconds(report.not_available_time)}</b></span>
                                )}
                            </div>
                            <div className="agent-report-states">
                                {Object.keys(stateReport).length > 0 ? (
                                    Object.entries(stateReport).map(([state, seconds]) => (
                                        <span key={state}>{state}: {formatSeconds(seconds)}</span>
                                    ))
                                ) : (
                                    <span>No state breakdown</span>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* <div className="agent-report-table-wrap">
                <table className="agent-report-table">
                    <thead>
                        <tr>
                            <th>Fetched</th>
                            <th>Business Center</th>
                            <th>Extension</th>
                            <th>Agent</th>
                            <th>Total Calls</th>
                            <th>Answered</th>
                            <th>Idle</th>
                            <th>On Call</th>
                            <th>Not Available</th>
                            <th>States</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="10">Loading agent stats...</td>
                            </tr>
                        ) : reports.length === 0 ? (
                            <tr>
                                <td colSpan="10">No agent stats found yet.</td>
                            </tr>
                        ) : (
                            reports.map((report) => {
                                const stateReport = parseStateReport(report.not_available_detailed_report);
                                return (
                                    <tr key={report.id}>
                                        <td>{formatDateTime(report.fetched_at)}</td>
                                        <td>{report.business_name || '-'}</td>
                                        <td>{report.extension}</td>
                                        <td>{report.agent_name || '-'}</td>
                                        <td>{report.total_calls || 0}</td>
                                        <td>{report.answered_calls || 0}</td>
                                        <td>{formatSeconds(report.idle_time)}</td>
                                        <td>{formatSeconds(report.on_call_time)}</td>
                                        <td>{formatSeconds(report.not_available_time)}</td>
                                        <td>
                                            <div className="agent-report-state-cell">
                                                {Object.keys(stateReport).length > 0 ? (
                                                    Object.entries(stateReport).map(([state, seconds]) => (
                                                        <span key={state}>{state}: {formatSeconds(seconds)}</span>
                                                    ))
                                                ) : (
                                                    <span>-</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div> */}
        </div>
    );
};

export default AgentStatsReports;
