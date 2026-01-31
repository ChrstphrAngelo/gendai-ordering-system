const { check, validationResult } = require('express-validator');

const sanitizeInput = (value) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/[<>"'%()&+\\]/g, '');
};

const validateSignup = [
    check('username')
        .trim()
        .escape()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    
    check('email')
        .trim()
        .normalizeEmail()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .isLength({ max: 100 }).withMessage('Email too long'),
    
    check('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                errors: errors.array(),
                message: 'Validation failed'
            });
        }
        
        req.body.username = sanitizeInput(req.body.username);
        req.body.email = sanitizeInput(req.body.email);
        next();
    }
];

const validateLogin = [
    check('username')
        .trim()
        .escape()
        .notEmpty().withMessage('Username is required'),
    
    check('password')
        .notEmpty().withMessage('Password is required'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                errors: errors.array(),
                message: 'Validation failed'
            });
        }
        
        req.body.username = sanitizeInput(req.body.username);
        next();
    }
];

const validateToken = [
    check('token')
        .notEmpty().withMessage('Token is required'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                errors: errors.array(),
                message: 'Validation failed'
            });
        }
        next();
    }
];

module.exports = { validateSignup, validateLogin, validateToken };