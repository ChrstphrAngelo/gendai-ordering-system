import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    api.interceptors.request.use(config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    const signup = async (userData) => {
        try {
            setError('');
            const response = await api.post('/auth/signup', userData);
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                setUser(response.data.user);
            }
            
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Signup failed';
            setError(message);
            throw error;
        }
    };

    const login = async (credentials) => {
        try {
            setError('');
            const response = await api.post('/auth/login', credentials);
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                setUser(response.data.user);
            }
            
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            setError(message);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            setError('');
        }
    };

    const verifyToken = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setLoading(false);
            return false;
        }

        try {
            const response = await api.get('/auth/verify');
            if (response.data.isValid) {
                setUser(response.data.user);
                return true;
            }
        } catch (error) {
            console.error('Token verification failed:', error);
        }

        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return false;
    };

    useEffect(() => {
        verifyToken().then(() => setLoading(false));
    }, []);

    const value = {
        user,
        loading,
        error,
        signup,
        login,
        logout,
        verifyToken,
        setError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};