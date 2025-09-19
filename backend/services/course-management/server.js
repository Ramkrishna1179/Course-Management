const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const courseRoutes = require('./routes/courses');
const searchRoutes = require('./routes/search');
const uploadRoutes = require('./routes/upload');
const { initializeServices } = require('./services/startup');

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.COURSE_SERVICE_PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/course_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Course Service: Connected to MongoDB'))
.catch(err => console.error('Course Service: MongoDB connection error:', err));

app.use('/api/courses', courseRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);

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

async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    console.log(`Course Management Service running on port ${PORT}`);
  });
}

startServer().catch(console.error);
