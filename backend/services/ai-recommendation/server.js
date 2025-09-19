const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const recommendationRoutes = require('./routes/recommendations');

dotenv.config();

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 3003;

app.use(cors());
app.use(express.json());

app.use('/api', recommendationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'AI Recommendation Service is running', port: PORT });
});

app.listen(PORT, () => {
  console.log(`AI Recommendation Service running on port ${PORT}`);
});
