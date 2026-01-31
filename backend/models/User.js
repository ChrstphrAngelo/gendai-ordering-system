const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters']
    },
    role: {
        type: String,
        enum: ['admin', 'staff'],
        default: 'admin'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isLocked = function() {
    return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incrementFailedAttempts = async function() {
    const now = Date.now();
    const lockTime = 15 * 60 * 1000;
    
    if (this.failedLoginAttempts >= 4) {
        this.lockUntil = new Date(now + lockTime);
    }
    this.failedLoginAttempts += 1;
    await this.save();
};

userSchema.methods.resetFailedAttempts = async function() {
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
    this.lastLogin = new Date();
    await this.save();
};

module.exports = mongoose.model('User', userSchema);