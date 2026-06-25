// src/components/routes/Forms/SearchForm/SearchForm.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./SearchForm.css"; 

const SearchForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [teamName, setTeamName] = useState(''); 
  const [teamMembers, setTeamMembers] = useState([]);
  const [businessId, setBusinessId] = useState(null);

  // Set businessId from current URL path when component mounts
  useEffect(() => {
    // Extract businessId from URL path
    const pathParts = location.pathname.split('/');
    const businessIndex = pathParts.indexOf('business');
    if (businessIndex !== -1 && pathParts[businessIndex + 1]) {
      setBusinessId(pathParts[businessIndex + 1]);
    }
  }, [location.pathname]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(location.search);
      const searchQuery = query.get('query') || query.get('team');
      
      if (!searchQuery) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await axios.get(`${apiUrl}/customers/search?query=${searchQuery}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.data) {
        setSearchResults(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // const fetchTeamMembers = async () => {
  //   try {
  //     const token = localStorage.getItem('token');
  //     if (!token) {
  //       navigate('/login');
  //       return;
  //     }

  //     // Get the team name from the URL query
  //     const query = new URLSearchParams(location.search);
  //     const teamName = query.get('team');
  //     const searchQuery = query.get('query');
      
  //     // If neither team nor search query exists, clear team members
  //     if (!teamName && !searchQuery) {
  //       setTeamMembers([]);
  //       return;
  //     }

  //     const apiUrl = process.env.REACT_APP_API_URL;
      
  //     // First get the team details to get the team ID
  //     const teamsResponse = await axios.get(`${apiUrl}/team/players/teams`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     // Try to find team by team name or by QUEUE_NAME in search query
  //     let team = null;
  //     if (teamName) {
  //       team = teamsResponse.data.find(t => t.team_name === teamName);
  //     } else if (searchQuery) {
  //       team = teamsResponse.data.find(t => t.team_name === searchQuery);
  //     }

  //     if (!team) {
  //       setTeamMembers([]);
  //       return;
  //     }

  //     // Then get all users and filter by team ID
  //     const usersResponse = await axios.get(`${apiUrl}/players/users`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     if (usersResponse.data && usersResponse.data.data) {
  //       const teamUsers = usersResponse.data.data.filter(user => user.team_id === team.id);
  //       setTeamMembers(teamUsers);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching team members:', error);
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       navigate('/login');
  //     }
  //     setTeamMembers([]);
  //   }
  // };

  const handleAddRecord = () => {
    const query = new URLSearchParams(location.search);
    const teamName = query.get('team');
    if (teamName) {
      navigate(`/customers/create?team=${teamName}`);
    }
  };

  const handleHomeClick = () => {
    const query = new URLSearchParams(location.search);
    const currentTeam = query.get('team');
    if (currentTeam) {
      // Use current businessId or fallback to the one from URL
      const pathParts = location.pathname.split('/');
      const businessIndex = pathParts.indexOf('business');
      const currentBusinessId = businessIndex !== -1 ? pathParts[businessIndex + 1] : '2';
      navigate(`/business/${currentBusinessId}/team/${currentTeam}`);
    }
  };

  useEffect(() => {
    fetchData();
    // fetchTeamMembers();
    const query = new URLSearchParams(location.search);
    const team = query.get('team');
    if (team) {
      setTeamName(team);
    }
  }, [location.search, navigate]);

  const handleEdit = (customer) => {
    const query = new URLSearchParams(location.search);
    const teamName = query.get('team') || localStorage.getItem('currentQueue');
    navigate(`/team/${teamName}/${customer.phone_no_primary}`, {
      state: { 
        customer,
        queueName: teamName
      }
    });
  };

  const handleSelect = (C_unique_id) => {
    setSelectedRecords(prev => {
      if (prev.includes(C_unique_id)) {
        return prev.filter(id => id !== C_unique_id);
      }
      return [...prev, C_unique_id];
    });
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === searchResults.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(searchResults.map(record => record.C_unique_id));
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const getCurrentPageRecords = () => {
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    return searchResults.slice(indexOfFirstRecord, indexOfLastRecord);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="list-container">
      <div className="header-containerrr">
          <div className="header-left">
            <img 
              src="/uploads/house-fill.svg"
              className="home-icon"
              alt="home icon"
              aria-label="Home"
              onClick={handleHomeClick}
            />
          </div>
          <div className="header-center">
            <h2 className="list_form_headi">{teamName ? `${teamName.replace(/_/g, ' ')}` : 'Records'}</h2>
          </div>
          <div className="header-right">
            <button className="add-record-btnnn" onClick={handleAddRecord}>
              Add New Record
            </button>
          </div>
      </div>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="table-container">
            {searchResults.length > 0 ? (
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Designation</th>
                    <th>Disposition</th>
                    <th>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentPageRecords().map((customer, index) => (
                    <tr 
                      key={customer.C_unique_id}
                      className={selectedRecords.includes(customer.C_unique_id) ? 'selected-row' : ''}
                      onClick={() => handleEdit(customer)}
                    >
                      <td>{customer.C_unique_id}</td>
                      <td>{customer.customer_name}</td>
                      <td><a href={`tel:${customer.phone_no_primary}`}>{customer.phone_no_primary}</a></td>
                      <td>{customer.email_id}</td>
                      <td>{customer.designation}</td>
                      <td>{customer.disposition}</td>
                      <td>{formatDateTime(customer.last_updated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No results found.</p>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {searchResults.length > 0 && (
          <div className="pagination-container">
            <div className="pagination">
              {currentPage > 1 && (
                <button
                  onClick={() => paginate(currentPage - 1)}
                  className="page-number"
                  aria-label="Previous page"
                >
                  Previous
                </button>
              )}

              {[...Array(Math.ceil(searchResults.length / recordsPerPage)).keys()].map((_, idx) => idx + 1)
                .filter((pageNumber) => {
                  const totalPages = Math.ceil(searchResults.length / recordsPerPage);
                  return (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1
                  );
                })
                .map((pageNumber, index, array) => {
                  const isGap = array[index + 1] !== pageNumber + 1 && pageNumber !== Math.ceil(searchResults.length / recordsPerPage);
                  return (
                    <React.Fragment key={pageNumber}>
                      <button
                        onClick={() => paginate(pageNumber)}
                        className={`page-number ${currentPage === pageNumber ? 'active' : ''}`}
                        aria-label={`Go to page ${pageNumber}`}
                      >
                        {pageNumber}
                      </button>
                      {isGap && <span className="ellipsis">...</span>}
                    </React.Fragment>
                  );
                })}

              {currentPage < Math.ceil(searchResults.length / recordsPerPage) && (
                <button
                  onClick={() => paginate(currentPage + 1)}
                  className="page-number"
                  aria-label="Next page"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
  );
};

export default SearchForm;
