require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Routes
app.use('/api/menu', require('./routes/menuItems'));
app.use('/api/orders', require('./routes/orders'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Gendai Ordering System API' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});