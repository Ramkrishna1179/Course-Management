const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.use(authenticateToken);

router.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Admin profile retrieved successfully',
    data: {
      user: req.user
    }
  });
});

router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to admin dashboard',
    data: {
      admin: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        lastLogin: new Date()
      },
      stats: {
        totalUsers: 0,
        activeCourses: 0,
        totalRecommendations: 0
      }
    }
  });
});

router.get('/protected-route', (req, res) => {
  res.json({
    success: true,
    message: 'This is a protected admin-only route',
    data: {
      message: 'Only authenticated admins can access this endpoint',
      admin: req.user.username,
      timestamp: new Date()
    }
  });
});

// Create admin user endpoint (for testing purposes)
router.post('/create-admin', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create admin user
    const adminUser = new User({
      username,
      email,
      password,
      role: 'admin'
    });

    await adminUser.save();

    const token = jwt.sign(
      { 
        id: adminUser._id,
        Email: adminUser.email,
        userName: adminUser.username,
        role: adminUser.role
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        user: adminUser.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during admin creation'
    });
  }
});

module.exports = router;
