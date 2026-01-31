require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menuItems'));
app.use('/api/orders', require('./routes/orders'));

app.get('/', (req, res) => {
    res.json({ message: 'Gendai Ordering System API' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});