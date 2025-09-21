const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const courseRoutes = require('./routes/courses');
const searchRoutes = require('./routes/search');
const uploadRoutes = require('./routes/upload');
const { initializeServices } = require('./services/startup');

// Load environment variables
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.COURSE_SERVICE_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/course_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  // MongoDB connected successfully
})
.catch(err => {
  // Handle MongoDB connection error
});

// Routes
app.use('/api/courses', courseRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Course Management Service is running', port: PORT });
});

// Health check endpoint for Docker
app.get('/api/courses/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Course Management Service',
    timestamp: new Date().toISOString()
  });
});

// Start server with service initialization
async function startServer() {
  await initializeServices();

  app.listen(PORT, () => {
    // Course Management Service started
  });
}

// Start the server
startServer().catch(() => {
  // Handle server start error
});
