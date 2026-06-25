// // src/components/routes/Forms/ListForm/ListForm.js

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate, useLocation } from "react-router-dom";
// import "./ListForm.css";

// const ListForm = () => {
//   const [searchResults, setSearchResults] = useState([]);
//   const [selectedRecords, setSelectedRecords] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [recordsPerPage] = useState(10);
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [teamMembers, setTeamMembers] = useState([]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const query = new URLSearchParams(location.search);
//       const teamName = query.get('team');
//       const searchQuery = query.get('query');
      
//       if (!teamName && !searchQuery) {
//         setSearchResults([]);
//         setLoading(false);
//         return;
//       }

//       const token = localStorage.getItem('token');
//       if (!token) {
//         navigate('/login');
//         return;
//       }

//       const apiUrl = process.env.REACT_APP_API_URL;
//       const endpoint = teamName 
//         ? `${apiUrl}/customers/team?team=${teamName}`
//         : `${apiUrl}/customers/team?query=${searchQuery}`;

//       const response = await axios.get(endpoint, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.data && response.data.data) {
//         setSearchResults(response.data.data);
//         // After getting search results, fetch team members for the QUEUE_NAME
//         if (response.data.data.length > 0) {
//           const queueName = response.data.data[0].QUEUE_NAME;
//           fetchTeamMembers(queueName);
//         }
//       } else {
//         setSearchResults([]);
//       }
//     } catch (error) {
//       console.error('Error fetching search results:', error);
//       if (error.response?.status === 401) {
//         localStorage.removeItem('token');
//         navigate('/login');
//       }
//       setSearchResults([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchTeamMembers = async (queueName) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         navigate('/login');
//         return;
//       }

//       const apiUrl = process.env.REACT_APP_API_URL;
      
//       // First get the team details to get the team ID
//       const teamsResponse = await axios.get(`${apiUrl}/team/players/teams`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       // Try to find team by team name or by QUEUE_NAME in search query
//       let team = null;
//       if (queueName) {
//         team = teamsResponse.data.find(t => t.team_name === queueName);
//       }

//       if (!team) {
//         setTeamMembers([]);
//         return;
//       }

//       // Then get all users and filter by team ID
//       const usersResponse = await axios.get(`${apiUrl}/players/users`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (usersResponse.data && usersResponse.data.data) {
//         const teamUsers = usersResponse.data.data.filter(user => user.team_id === team.id);
//         setTeamMembers(teamUsers);
//       }
//     } catch (error) {
//       console.error('Error fetching team members:', error);
//       if (error.response?.status === 401) {
//         localStorage.removeItem('token');
//         navigate('/login');
//       }
//       setTeamMembers([]);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [location.search, navigate]);

//   const handleEdit = (customer) => {
//     navigate(`/customer/${customer.C_unique_id}`);
//   };

//   const handleSelect = (C_unique_id) => {
//     setSelectedRecords(prev => {
//       if (prev.includes(C_unique_id)) {
//         return prev.filter(id => id !== C_unique_id);
//       }
//       return [...prev, C_unique_id];
//     });
//   };

//   const handleSelectAll = () => {
//     if (selectedRecords.length === searchResults.length) {
//       setSelectedRecords([]);
//     } else {
//       setSelectedRecords(searchResults.map(record => record.C_unique_id));
//     }
//   };

//   const formatDateTime = (dateString) => {
//     if (!dateString) return 'N/A';
//     const date = new Date(dateString);
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     const hours = String(date.getHours()).padStart(2, '0');
//     const minutes = String(date.getMinutes()).padStart(2, '0');
//     const seconds = String(date.getSeconds()).padStart(2, '0');
//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
//   };

//   const getCurrentPageRecords = () => {
//     const indexOfLastRecord = currentPage * recordsPerPage;
//     const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
//     return searchResults.slice(indexOfFirstRecord, indexOfLastRecord);
//   };

//   const paginate = (pageNumber) => setCurrentPage(pageNumber);

//   return (
//     <div className="list-container">
//       <div className="team-members-section" style={{
//         height: '25vh',
//         backgroundColor: '#f5f5f5',
//         padding: '5px',
//         marginBottom: '10px',
//         borderRadius: '8px',
//         boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//       }}>
//         <h3 style={{ marginBottom: '5px', color: '#364C63', fontSize: '16px', fontWeight: 'bold' }}>Company Members</h3>
//         <div style={{
//           display: 'flex',
//           overflowX: 'auto',
//           overflowY: 'hidden',
//           whiteSpace: 'nowrap',
//           padding: '5px',
//           gap: '10px',
//           scrollbarWidth: 'thin',
//           msOverflowStyle: 'none',
//           '&::-webkit-scrollbar': {
//             height: '6px'
//           },
//           '&::-webkit-scrollbar-track': {
//             background: '#f1f1f1',
//             borderRadius: '3px'
//           },
//           '&::-webkit-scrollbar-thumb': {
//             background: '#888',
//             borderRadius: '3px'
//           }
//         }}>
//           {teamMembers.map((member) => (
//             <div key={member.id} style={{
//               backgroundColor: 'white',
//               padding: '8px',
//               borderRadius: '6px',
//               boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
//               minWidth: '200px',
//               maxWidth: '200px',
//               fontSize: '14px',
//               flex: '0 0 auto'
//             }}>
//               <div style={{ fontWeight: 'bold', color: '#EF6F53', marginBottom: '3px' }}>{member.username}</div>
//               <div style={{ marginBottom: '3px' }}><a href={`tel:${member.mobile_num}`} style={{ color: '#364C63', textDecoration: 'none' }}>{member.mobile_num}</a></div>
//               <div style={{ color: '#364C63', marginBottom: '3px' }}>{member.email}</div>
//               {member.designation && (
//                 <div style={{ color: '#364C63', fontStyle: 'italic' }}>{member.designation}</div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//       <h2 className="list_form_headi">Records</h2>
//       {loading ? (
//         <div className="loading">Loading...</div>
//       ) : (
//         <div className="table-container">
//           {searchResults.length > 0 ? (
//             <table className="customers-table">
//               <thead>
//                 <tr>
//                   {/* <th>
//                     <input
//                       type="checkbox"
//                       checked={selectedRecords.length === searchResults.length}
//                       onChange={handleSelectAll}
//                     />
//                   </th> */}
//                   <th>ID</th>
//                   <th>Name</th>
//                   <th>Phone</th>
//                   <th>Email</th>
//                   <th>Designation</th>
//                   <th>Disposition</th>
//                   <th>Agent</th>
//                   <th>Last Activity</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {getCurrentPageRecords().map((customer, index) => (
//                   <tr 
//                     key={customer.C_unique_id}
//                     className={selectedRecords.includes(customer.C_unique_id) ? 'selected-row' : ''}
//                     onClick={() => handleEdit(customer)}
//                   >
//                     <td>{customer.C_unique_id}</td>
//                     <td>{customer.customer_name}</td>
//                     <td><a href={`tel:${customer.phone_no_primary}`}>{customer.phone_no_primary}</a></td>
//                     <td>{customer.email_id}</td>
//                     <td>{customer.designation}</td>
//                     <td>{customer.disposition}</td>
//                     <td>{customer.agent_name}</td>
//                     <td>{formatDateTime(customer.last_updated)}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           ) : (
//             <p>No results found.</p>
//           )}
//         </div>
//       )}

//       {/* Pagination Controls */}
//       {searchResults.length > 0 && (
//         <div className="pagination-container">
//           <div className="pagination">
//             {currentPage > 1 && (
//               <button
//                 onClick={() => paginate(currentPage - 1)}
//                 className="page-number"
//                 aria-label="Previous page"
//               >
//                 Previous
//               </button>
//             )}

//             {[...Array(Math.ceil(searchResults.length / recordsPerPage)).keys()].map((_, idx) => idx + 1)
//               .filter((pageNumber) => {
//                 const totalPages = Math.ceil(searchResults.length / recordsPerPage);
//                 return (
//                   pageNumber === 1 ||
//                   pageNumber === totalPages ||
//                   pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1
//                 );
//               })
//               .map((pageNumber, index, array) => {
//                 const isGap = array[index + 1] !== pageNumber + 1 && pageNumber !== Math.ceil(searchResults.length / recordsPerPage);
//                 return (
//                   <React.Fragment key={pageNumber}>
//                     <button
//                       onClick={() => paginate(pageNumber)}
//                       className={`page-number ${currentPage === pageNumber ? 'active' : ''}`}
//                       aria-label={`Go to page ${pageNumber}`}
//                     >
//                       {pageNumber}
//                     </button>
//                     {isGap && <span className="ellipsis">...</span>}
//                   </React.Fragment>
//                 );
//               })}

//             {currentPage < Math.ceil(searchResults.length / recordsPerPage) && (
//               <button
//                 onClick={() => paginate(currentPage + 1)}
//                 className="page-number"
//                 aria-label="Next page"
//               >
//                 Next
//               </button>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ListForm;
