const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/course_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Auth Service: Connected to MongoDB'))
.catch(err => console.error('Auth Service: MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Auth Service is running', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
