import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from './PasswordInput';
import './auth.css';

const Signup = () => {
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { signup, error, setError } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setError('');
    }, [setError]);

    const validateForm = () => {
        const errors = {};
        const emailRegex = /^\S+@\S+\.\S+$/;
        const usernameRegex = /^[a-zA-Z0-9_]+$/;

        if (!userData.username.trim()) {
            errors.username = 'Username is required';
        } else if (userData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        } else if (!usernameRegex.test(userData.username)) {
            errors.username = 'Username can only contain letters, numbers, and underscores';
        }

        if (!userData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(userData.email)) {
            errors.email = 'Please enter a valid email';
        }

        if (!userData.password) {
            errors.password = 'Password is required';
        } else if (userData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(userData.password)) {
            errors.password = 'Password must contain uppercase, lowercase, number and special character';
        }

        if (userData.password !== userData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[@$!%*?&]/.test(password)) strength++;
        return strength;
    };

    const handlePasswordChange = (password) => {
        setPasswordStrength(calculatePasswordStrength(password));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm() || isSubmitting) return;
        
        setIsSubmitting(true);
        
        try {
            const sanitizedData = {
                username: userData.username.trim(),
                email: userData.email.trim().toLowerCase(),
                password: userData.password
            };
            
            await signup(sanitizedData);
            navigate('/admin');
        } catch (error) {
            console.error('Signup error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (name === 'password') {
            handlePasswordChange(value);
        }
        
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        
        setError('');
    };

    const getStrengthColor = () => {
        const colors = ['#ff4444', '#ffbb33', '#00C851', '#5cb85c', '#4CAF50'];
        return colors[passwordStrength - 1] || '#ff4444';
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Create Admin Account</h2>
                
                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={userData.username}
                            onChange={handleChange}
                            className={formErrors.username ? 'error' : ''}
                            maxLength="30"
                            autoComplete="username"
                        />
                        {formErrors.username && (
                            <span className="error-message">{formErrors.username}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={userData.email}
                            onChange={handleChange}
                            className={formErrors.email ? 'error' : ''}
                            autoComplete="email"
                        />
                        {formErrors.email && (
                            <span className="error-message">{formErrors.email}</span>
                        )}
                    </div>

                    <PasswordInput
                        id="password"
                        name="password"
                        value={userData.password}
                        onChange={handleChange}
                        error={formErrors.password}
                        label="Password"
                        autoComplete="new-password"
                    />
                    
                    {userData.password && (
                        <div className="password-strength">
                            <div className="strength-meter">
                                <div 
                                    className="strength-fill"
                                    style={{
                                        width: `${passwordStrength * 20}%`,
                                        backgroundColor: getStrengthColor()
                                    }}
                                ></div>
                            </div>
                            <div className="strength-labels">
                                <span>Weak</span>
                                <span>Medium</span>
                                <span>Strong</span>
                            </div>
                        </div>
                    )}

                    <PasswordInput
                        id="confirmPassword"
                        name="confirmPassword"
                        value={userData.confirmPassword}
                        onChange={handleChange}
                        error={formErrors.confirmPassword}
                        label="Confirm Password"
                        autoComplete="new-password"
                    />

                    <button 
                        type="submit" 
                        className="auth-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">
                            Login here
                        </Link>
                    </p>
                    <p className="auth-note">
                        Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;