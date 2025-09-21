const express = require('express');
const { body, validationResult } = require('express-validator');
const geminiService = require('../services/geminiService');

const router = express.Router();

// AI course recommendations endpoint
router.post('/recommendations', [
  body('topics')
    .isArray({ min: 1 })
    .withMessage('At least one topic is required')
    .custom((topics) => {
      if (!topics.every(topic => typeof topic === 'string' && topic.trim().length > 0)) {
        throw new Error('All topics must be non-empty strings');
      }
      return true;
    }),
  body('skillLevel')
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Skill level must be Beginner, Intermediate, or Advanced'),
  body('duration')
    .optional()
    .isString()
    .withMessage('Duration must be a string'),
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  body('interests.*')
    .optional()
    .isString()
    .withMessage('Each interest must be a string')
], async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Extract user preferences
    const { topics, skillLevel, duration = '10-20 hours', interests = [] } = req.body;

    const userPreferences = {
      topics,
      skillLevel,
      duration,
      interests
    };

    // Generate AI recommendations
    const recommendations = await geminiService.generateRecommendations(userPreferences);

    res.json({
      success: true,
      message: 'Course recommendations generated successfully',
      data: {
        userPreferences,
        recommendations: recommendations.recommendations,
        totalRecommendations: recommendations.recommendations.length,
        generatedAt: new Date(),
        note: recommendations.note || 'Generated using Gemini AI'
      }
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message
    });
  }
});

// Sample recommendations endpoint for testing
router.get('/recommendations/sample', async (req, res) => {
  try {
    const samplePreferences = {
      topics: ['Web Development', 'JavaScript'],
      skillLevel: 'Intermediate',
      duration: '20-30 hours',
      interests: ['Frontend Development', 'React']
    };

    const recommendations = await geminiService.generateRecommendations(samplePreferences);

    res.json({
      success: true,
      message: 'Sample recommendations generated',
      data: {
        userPreferences: samplePreferences,
        recommendations: recommendations.recommendations,
        totalRecommendations: recommendations.recommendations.length,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Sample recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sample recommendations',
      error: error.message
    });
  }
});

// Export recommendations router
module.exports = router;
