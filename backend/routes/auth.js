const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateSignup, validateLogin } = require('../middleware/validation');

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
};

router.post('/signup', validateSignup, async (req, res) => {
    try {
        const existingUser = await User.findOne({ 
            $or: [
                { username: req.body.username },
                { email: req.body.email }
            ]
        });
        
        if (existingUser) {
            const field = existingUser.username === req.body.username ? 'username' : 'email';
            return res.status(400).json({ 
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
                code: `${field.toUpperCase()}_EXISTS`
            });
        }
        
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        });
        
        await user.save();
        
        const token = generateToken(user._id);
        
        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            message: 'Server error during signup',
            code: 'SERVER_ERROR'
        });
    }
});

router.post('/login', validateLogin, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        
        if (!user || !user.isActive) {
            return res.status(401).json({ 
                message: 'Invalid username or password',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        if (user.isLocked()) {
            return res.status(423).json({ 
                message: 'Account temporarily locked. Try again later.',
                code: 'ACCOUNT_LOCKED'
            });
        }
        
        const isValidPassword = await user.comparePassword(req.body.password);
        
        if (!isValidPassword) {
            await user.incrementFailedAttempts();
            return res.status(401).json({ 
                message: 'Invalid username or password',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        await user.resetFailedAttempts();
        
        const token = generateToken(user._id);
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Server error during login',
            code: 'SERVER_ERROR'
        });
    }
});

router.post('/logout', async (req, res) => {
    res.json({ 
        message: 'Logout successful',
        code: 'LOGOUT_SUCCESS'
    });
});

router.get('/verify', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            isValid: false,
            message: 'No token provided'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.isActive) {
            return res.json({ isValid: false });
        }
        
        res.json({ 
            isValid: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        res.json({ isValid: false });
    }
});

module.exports = router;