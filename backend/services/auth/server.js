const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Load environment variables
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/course_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Auth Service: Connected to MongoDB'))
.catch(err => console.error('Auth Service: MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Auth Service is running', port: PORT });
});

// Start server
app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
