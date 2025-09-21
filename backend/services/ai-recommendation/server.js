const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const recommendationRoutes = require('./routes/recommendations');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', recommendationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'AI Recommendation Service is running', port: PORT });
});

// Start server
app.listen(PORT, () => {
  console.log(`AI Recommendation Service running on port ${PORT}`);
});
