// // src/components/routes/Other/Header/Upload/FileUpload.js

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// const FileUpload = () => {
//     const navigate = useNavigate();

//     useEffect(() => {
//         // Check user permissions on mount
//         const checkPermissions = async () => {
//             try {
//                 const token = localStorage.getItem('token');
//                 if (!token) return;

//                 const user = JSON.parse(localStorage.getItem('user') || '{}');
//                 console.log('User from localStorage:', user);


//                 const apiUrl = process.env.REACT_APP_API_URL;
//                 const response = await axios.get(`${apiUrl}/current-user`, {
//                     headers: { 
//                         Authorization: `Bearer ${token}`,
//                         "Content-Type": "application/json",
//                     },
//                 });
                
//                 const userData = response.data;
//                 console.log('API user data:', userData);


//                 // For other roles, check specific permissions
//                 const userPermissions = userData.permissions || [];
//                 console.log('User permissions from API:', userPermissions);
//             } catch (error) {
//                 console.error('Error checking upload permission:', error);
//             }
//         };

//         checkPermissions();
//     }, []);

//     const handleUploadClick = () => {
//         navigate('/upload');
//     };

//     return (
//         <div className="file-upload-section">
//             <img 
//                 src="/uploads/file.svg"
//                 className="file-icon"
//                 alt="file upload icon"
//                 aria-label="Upload file"
//                 onClick={handleUploadClick}
//                 style={{ cursor: 'pointer' }}
//             />
//             <span className="file-upl" onClick={handleUploadClick} style={{ cursor: 'pointer' }}>File Upload</span>
//         </div>
//     );
// };

// export default FileUpload;