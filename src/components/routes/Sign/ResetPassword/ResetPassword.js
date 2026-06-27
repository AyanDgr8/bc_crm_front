// src/components/routes/Sign/ResetPassword/ResetPassword.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ResetPassword.css';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState({
        newPassword: false,
        confirmPassword: false,
    });
    const navigate = useNavigate();
    const { token } = useParams();

    const togglePasswordVisibility = (field) => {
        setVisiblePasswords((current) => ({
            ...current,
            [field]: !current[field],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Password validation
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (!/[A-Z]/.test(newPassword)) {
            setError('Password must contain at least one uppercase letter');
            return;
        }

        if (!/[a-z]/.test(newPassword)) {
            setError('Password must contain at least one lowercase letter');
            return;
        }

        if (!/\d/.test(newPassword)) {
            setError('Password must contain at least one number');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const apiUrl = process.env.REACT_APP_API_URL;
            const response = await axios.post(`${apiUrl}/reset-password/${token}`, { 
                newPassword 
            });
            
            if (response.data.success) {
                setMessage('Password reset successful!');
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError('Failed to reset password. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="reset-password-page">
            <h2>Reset Password</h2>
            <div className="reset-password-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-groupy">
                        <label>New Password</label>
                        <div className="reset-password-field">
                            <input
                                type={visiblePasswords.newPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                disabled={isLoading}
                                minLength="8"
                            />
                            <button
                                type="button"
                                className="reset-password-toggle"
                                onClick={() => togglePasswordVisibility('newPassword')}
                                disabled={isLoading}
                                aria-label={visiblePasswords.newPassword ? "Hide new password" : "Show new password"}
                                title={visiblePasswords.newPassword ? "Hide new password" : "Show new password"}
                            >
                                <i className={`fas fa-eye${visiblePasswords.newPassword ? '-slash' : ''}`}></i>
                            </button>
                        </div>
                    </div>
                    <div className="form-groupy">
                        <label>Confirm Password</label>
                        <div className="reset-password-field">
                            <input
                                type={visiblePasswords.confirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                disabled={isLoading}
                                minLength="8"
                            />
                            <button
                                type="button"
                                className="reset-password-toggle"
                                onClick={() => togglePasswordVisibility('confirmPassword')}
                                disabled={isLoading}
                                aria-label={visiblePasswords.confirmPassword ? "Hide confirm password" : "Show confirm password"}
                                title={visiblePasswords.confirmPassword ? "Hide confirm password" : "Show confirm password"}
                            >
                                <i className={`fas fa-eye${visiblePasswords.confirmPassword ? '-slash' : ''}`}></i>
                            </button>
                        </div>
                    </div>
                    <button className="btn-reset" type="submit" disabled={isLoading}>
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                    
                    {message && <div className="success-messagee">{message}</div>}
                    {error && <div className="error-messagee">{error}</div>}
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
