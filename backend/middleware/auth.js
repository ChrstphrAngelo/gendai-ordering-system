const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                message: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.isActive) {
            return res.status(401).json({ 
                message: 'Invalid or deactivated account',
                code: 'INVALID_ACCOUNT'
            });
        }
        
        if (user.isLocked()) {
            return res.status(423).json({ 
                message: 'Account temporarily locked due to multiple failed attempts',
                code: 'ACCOUNT_LOCKED'
            });
        }
        
        req.user = {
            userId: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ 
                message: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ 
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        res.status(500).json({ message: 'Authentication failed' });
    }
};

const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Access denied. Admin privileges required.',
            code: 'ADMIN_REQUIRED'
        });
    }
    next();
};

module.exports = { authenticateToken, authorizeAdmin };