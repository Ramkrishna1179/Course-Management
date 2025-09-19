const express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const redisService = require('../services/redisService');
const elasticsearchService = require('../services/elasticsearchService');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

const router = express.Router();

router.get('/', cacheMiddleware('courses:list', 'courses'), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, instructor, level, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // build query for active courses only
    const query = { isActive: true };
    
    if (category) query.category = category;
    if (instructor) query.instructor = instructor;
    if (level) query.level = level;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const courses = await Course.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      message: 'Courses retrieved successfully',
      data: {
        courses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCourses: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve courses',
      error: error.message
    });
  }
});

router.get('/:id', cacheMiddleware('courses:single', 'single'), async (req, res) => {
  try {
    const id = req.params.id;
    let query = { isActive: true };
    
    // Check if the ID is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = {
        $or: [
          { _id: id },
          { course_id: id }
        ],
        isActive: true
      };
    } else {
      // If not a valid ObjectId, only search by course_id
      query = {
        course_id: id,
        isActive: true
      };
    }
    
    const course = await Course.findOne(query).select('-__v');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course retrieved successfully',
      data: { course }
    });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course',
      error: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const courseData = req.body;
    
    const course = new Course(courseData);
    await course.save();

    await elasticsearchService.indexCourse(course);
    await clearCache('courses:*');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });

  } catch (error) {
    console.error('Create course error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Course ID already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error.message
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let query = {};
    
    // Check if the ID is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = {
        $or: [
          { _id: id },
          { course_id: id }
        ]
      };
    } else {
      // If not a valid ObjectId, only search by course_id
      query = {
        course_id: id
      };
    }
    
    const course = await Course.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    await elasticsearchService.indexCourse(course);
    await clearCache('courses:*');

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: { course }
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let query = {};
    
    // Check if the ID is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = {
        $or: [
          { _id: id },
          { course_id: id }
        ]
      };
    } else {
      // If not a valid ObjectId, only search by course_id
      query = {
        course_id: id
      };
    }
    
    const course = await Course.findOneAndUpdate(
      query,
      { isActive: false },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    await elasticsearchService.deleteCourse(course._id.toString());
    await clearCache('courses:*');

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error.message
    });
  }
});

router.get('/stats/overview', cacheMiddleware('courses:stats', 'stats'), async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments({ isActive: true });
    const totalStudents = await Course.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$studentsEnrolled' } } }
    ]);

    const categoryStats = await Course.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const levelStats = await Course.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const avgRating = await Course.aggregate([
      { $match: { isActive: true, rating: { $gt: 0 } } },
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);

    res.json({
      success: true,
      message: 'Course statistics retrieved successfully',
      data: {
        totalCourses,
        totalStudents: totalStudents[0]?.total || 0,
        averageRating: avgRating[0]?.average || 0,
        categoryBreakdown: categoryStats,
        levelBreakdown: levelStats
      }
    });

  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course statistics',
      error: error.message
    });
  }
});

module.exports = router;
