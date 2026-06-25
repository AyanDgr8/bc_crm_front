// src/components/routes/Other/Header/Download/DownloadFile.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import axios from 'axios';
import './DownloadFile.css';

const DownloadFile = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [queueNames, setQueueNames] = useState([]);
    const [selectedQueue, setSelectedQueue] = useState('');
    const navigate = useNavigate();

    // Fetch queue names when component mounts
    useEffect(() => {
        fetchQueueNames();
    }, []);

    const fetchQueueNames = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/admin');
                return;
            }

            const apiUrl = process.env.REACT_APP_API_URL;
            const response = await axios.get(`${apiUrl}/download/queues`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.data) {
                setQueueNames(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching queue names:', error);
            setError('Error fetching queue names. Please try again.');
        }
    };

    // Filter data when search term changes
    useEffect(() => {
        if (!data.length) {
            setFilteredData([]);
            return;
        }

        if (!searchTerm) {
            setFilteredData(data);
            return;
        }

        const searchTermLower = searchTerm.toLowerCase();
        const filtered = data.filter(item => {
            // Helper function to safely check if a value includes the search term
            const safeIncludes = (value, searchTerm) => {
                if (value === null || value === undefined) return false;
                if (value instanceof Date) {
                    return value.toLocaleString().toLowerCase().includes(searchTerm);
                }
                return value.toString().toLowerCase().includes(searchTerm);
            };

            // Search through all fields
            return Object.entries(item).some(([key, value]) => {
                // Skip internal fields
                if (key.startsWith('_')) return false;
                return safeIncludes(value, searchTermLower);
            });
        });

        setFilteredData(filtered);
    }, [searchTerm, data]);

    // Add effect to fetch data when filters change
    useEffect(() => {
        if (isValidDateRange() && selectedQueue) {
            fetchData();
        }
    }, [startDate, endDate, selectedQueue]);

    const isValidDateRange = () => {
        return startDate && endDate && new Date(startDate) <= new Date(endDate);
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatTableValue = (value) => {
        if (value === null || value === undefined) return 'N/A';
        if (value instanceof Date) return formatDateTime(value);
        return value.toString();
    };

    const getColumnOrder = () => [
        'C_unique_id',
        'customer_name',
        'phone_no_primary',
        'phone_no_secondary',
        'email_id',
        'address',
        'country',
        'QUEUE_NAME',
        'designation',
        'disposition',
        'agent_name',
        'comment',
        'date_created',
        'last_updated'
    ];

    const getColumnHeader = (key) => {
        const headers = {
            'C_unique_id': 'ID',
            'customer_name': 'Customer Name',
            'phone_no_primary': 'Phone',
            'phone_no_secondary': 'Alternative Phone',
            'email_id': 'Email',
            'address': 'Address',
            'country': 'Country',
            'QUEUE_NAME': 'Company Name',
            'designation': 'Designation',
            'disposition': 'Disposition',
            'agent_name': 'Agent',
            'comment': 'Comment',
            'date_created': 'Created At',
            'last_updated': 'Last Updated'
        };
        return headers[key] || key;
    };

    const fetchData = async () => {
        if (!isValidDateRange()) {
            setError('Please select a valid date range');
            return;
        }

        if (!selectedQueue) {
            setError('Please select a company name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const apiUrl = process.env.REACT_APP_API_URL;
            const response = await axios.get(`${apiUrl}/download/customers`, {
                params: {
                    startDate,
                    endDate,
                    queueName: selectedQueue
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.data) {
                setData(response.data.data);
                setFilteredData(response.data.data);
            } else {
                setData([]);
                setFilteredData([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Error fetching data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (setter) => (e) => {
        setter(e.target.value);
    };

    const handleQueueChange = (e) => {
        setSelectedQueue(e.target.value);
        setData([]);
        setFilteredData([]);
    };

    const handleDownload = async () => {
        if (!filteredData.length) {
            setError('No data available to download');
            return;
        }

        try {
            // Prepare data for Excel
            const excelData = filteredData.map(row => {
                const formattedRow = {};
                getColumnOrder().forEach(key => {
                    formattedRow[getColumnHeader(key)] = formatTableValue(row[key]);
                });
                return formattedRow;
            });

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Customer Data');

            // Generate filename with date range and queue name
            const filename = `${selectedQueue}_${startDate.split('T')[0]}_to_${endDate.split('T')[0]}.xlsx`;

            // Save file
            XLSX.writeFile(wb, filename);
        } catch (error) {
            console.error('Error downloading file:', error);
            setError('Error downloading file. Please try again.');
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    return (
        <div className="download-page">
            <h2 className="download-heading">Download Customer Data</h2>
            
            <div className="filters-container">
                <div className="date-picker-container">
                    <div className="queue-select-wrapper">
                        <label htmlFor="queue-select">Select Company Name *</label>
                        <select
                            id="queue-select"
                            value={selectedQueue}
                            onChange={handleQueueChange}
                            className="queue-select"
                            required
                        >
                            <option value="">Select a company</option>
                            {queueNames.map((queue, index) => (
                                <option key={index} value={queue.QUEUE_NAME}>
                                    {queue.QUEUE_NAME}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="date-picker-wrapper">
                        <label htmlFor="start-date">Start Date and Time *</label>
                        <input
                            id="start-date"
                            type="datetime-local"
                            value={startDate}
                            onChange={handleDateChange(setStartDate)}
                            className="datetime-input"
                            required
                        />

                        <label htmlFor="end-date">End Date and Time *</label>
                        <input
                            id="end-date"
                            type="datetime-local"
                            value={endDate}
                            onChange={handleDateChange(setEndDate)}
                            className="datetime-input"
                            required
                        />
                    </div>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            
            {loading ? (
                <div className="loading-message">Loading data...</div>
            ) : filteredData.length > 0 ? (
                <>
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search in results..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="search-input"
                        />
                    </div>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {getColumnOrder().map((key) => (
                                        <th key={key}>{getColumnHeader(key)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row, index) => (
                                    <tr key={index}>
                                        {getColumnOrder().map((key) => (
                                            <td key={key}>{formatTableValue(row[key])}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-info">
                        <span>Total Records: {filteredData.length}</span>
                        {searchTerm && <span> (Filtered from {data.length} records)</span>}
                    </div>
                    <button 
                        className="download-btn" 
                        onClick={handleDownload}
                        disabled={loading}
                    >
                        Download as Excel
                    </button>
                </>
            ) : (
                <div className="no-data-message">
                    {selectedQueue ? 
                        (startDate && endDate ? 
                            'No data available for the selected date range.' : 
                            'Please select a date range to view data.'
                        ) : 
                        'Please select a company name to view data.'
                    }
                </div>
            )}
        </div>
    );
};

export default DownloadFile;