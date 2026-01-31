import React, { useState } from 'react';
import './auth.css';

const PasswordInput = ({ id, name, value, onChange, error, placeholder, label, autoComplete }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            <div className="password-input-wrapper">
                <input
                    type={showPassword ? "text" : "password"}
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={error ? 'error' : ''}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                />
                <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    )}
                </button>
            </div>
            {error && <span className="error-message">{error}</span>}
        </div>
    );
};

export default PasswordInput;