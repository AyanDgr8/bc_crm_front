// // src/components/routes/Other/Whatsapp/Whatsapp.js

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import "./Whatsapp.css";

// const WhatsAppScanner = () => {
//     const [qrCode, setQrCode] = useState('');
//     const [status, setStatus] = useState('disconnected');
//     const [error, setError] = useState('');
//     const [loading, setLoading] = useState(false);
//     const [isMinimized, setIsMinimized] = useState(false);
//     const [lastQrUpdate, setLastQrUpdate] = useState(0);
//     const QR_REFRESH_THRESHOLD = 10000; // 10 seconds

//     const initializeWhatsApp = async () => {
//         try {
//             setError('');
//             setLoading(true);
//             const token = localStorage.getItem('token');
//             const response = await axios.get(`${process.env.REACT_APP_API_URL}/whatsapp/init`, {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             });
            
//             if (response.data.success) {
//                 if (response.data.qrCode) {
//                     setQrCode(response.data.qrCode);
//                     setLastQrUpdate(Date.now());
//                     setStatus('waiting_for_scan');
//                 } else if (response.data.connected || response.data.status === 'connected') {
//                     setStatus('connected');
//                     setQrCode('');
//                 } else {
//                     setStatus(response.data.status || 'disconnected');
//                 }
//             } else {
//                 setError(response.data.message || 'Failed to initialize WhatsApp');
//             }
//         } catch (err) {
//             setError('Failed to initialize WhatsApp connection');
//             console.error('Error:', err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const checkConnectionStatus = async () => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await axios.get(`${process.env.REACT_APP_API_URL}/whatsapp/status`, {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             });
            
//             if (response.data.success) {
//                 setStatus(response.data.status);
                
//                 // Only update QR code if it's been more than threshold since last update
//                 // or if we don't have a QR code yet
//                 if (response.data.qrCode && 
//                     (Date.now() - lastQrUpdate > QR_REFRESH_THRESHOLD || !qrCode)) {
//                     setQrCode(response.data.qrCode);
//                     setLastQrUpdate(Date.now());
//                     setStatus('waiting_for_scan');
//                 } else if (response.data.status === 'connected') {
//                     setQrCode('');
//                 }
//             }
//         } catch (err) {
//             console.error('Error:', err);
//             // Don't set error for status checks to avoid UI clutter
//             if (err.response?.status !== 404) {
//                 setError('Failed to check connection status');
//             }
//         }
//     };

//     const handleReset = async () => {
//         try {
//             setLoading(true);
//             setError('');
//             const token = localStorage.getItem('token');
//             await axios.post(
//                 `${process.env.REACT_APP_API_URL}/whatsapp/reset`,
//                 {},
//                 {
//                     headers: {
//                         Authorization: `Bearer ${token}`
//                     }
//                 }
//             );
//             await initializeWhatsApp();
//         } catch (error) {
//             setError('Failed to reset WhatsApp connection');
//             console.error('Error resetting connection:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         initializeWhatsApp();
//         const statusInterval = setInterval(checkConnectionStatus, 3000);
//         return () => clearInterval(statusInterval);
//     }, []);

//     const toggleMinimize = () => {
//         setIsMinimized(!isMinimized);
//     };

//     if (isMinimized) {
//         return (
//             <div className="whatsapp-minimized" onClick={toggleMinimize}>
//                 <i className="fab fa-whatsapp"></i>
//             </div>
//         );
//     }

//     return (
//         <div className="whatsapp-scanner-container">
//             <div className="whatsapp-scanner-card">
//                 <div className="whatsapp-header">
//                     <h2>WhatsApp Connection</h2>
//                     <button className="minimize-button" onClick={toggleMinimize}>
//                         <i className="fas fa-minus"></i>
//                     </button>
//                 </div>

//                 {error && <div className="error-message">{error}</div>}
                
//                 {status === 'disconnected' && (
//                     <div className="status-message disconnected">
//                         <i className="fas fa-times-circle"></i>
//                         WhatsApp is disconnected
//                     </div>
//                 )}
                
//                 {status === 'waiting_for_scan' && qrCode && (
//                     <div className="qr-container">
//                         <img src={qrCode} alt="WhatsApp QR Code" className="qr-image" />
//                         <p className="qr-instruction">Scan this QR code with WhatsApp on your phone</p>
//                     </div>
//                 )}
                
//                 {status === 'connected' && (
//                     <div className="status-message connected">
//                         <i className="fas fa-check-circle"></i>
//                         WhatsApp is connected
//                     </div>
//                 )}

//                 {status === 'reconnecting' && (
//                     <div className="status-message reconnecting">
//                         <i className="fas fa-sync fa-spin"></i>
//                         Reconnecting to WhatsApp...
//                     </div>
//                 )}
                
//                 {status !== 'connected' && status !== 'reconnecting' && (
//                     <button 
//                         className="refresh-button"
//                         onClick={handleReset}
//                         disabled={loading}
//                     >
//                         {loading ? "Resetting..." : "Reset Connection"}
//                     </button>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default WhatsAppScanner;