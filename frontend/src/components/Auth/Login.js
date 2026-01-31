import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from './PasswordInput';
import './auth.css';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, error, setError } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setError('');
    }, [setError]);

    const validateForm = () => {
        const errors = {};
        
        if (!credentials.username.trim()) {
            errors.username = 'Username is required';
        }

        if (!credentials.password) {
            errors.password = 'Password is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm() || isSubmitting) return;
        
        setIsSubmitting(true);
        
        try {
            const sanitizedCredentials = {
                username: credentials.username.trim(),
                password: credentials.password
            };
            
            await login(sanitizedCredentials);
            navigate('/admin');
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        
        setError('');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Admin Login</h2>
                
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
                            value={credentials.username}
                            onChange={handleChange}
                            className={formErrors.username ? 'error' : ''}
                            maxLength="30"
                            autoComplete="username"
                        />
                        {formErrors.username && (
                            <span className="error-message">{formErrors.username}</span>
                        )}
                    </div>

                    <PasswordInput
                        id="password"
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                        error={formErrors.password}
                        label="Password"
                        autoComplete="current-password"
                    />

                    <button 
                        type="submit" 
                        className="auth-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Need an account?{' '}
                        <Link to="/signup" className="auth-link">
                            Sign up here
                        </Link>
                    </p>
                    <p className="auth-note">
                        For security reasons, account lockout occurs after 5 failed attempts.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;