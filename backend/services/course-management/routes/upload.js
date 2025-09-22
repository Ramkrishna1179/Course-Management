const express = require('express');
const multer = require('multer');
const csv = require('csvtojson');
const Course = require('../models/Course');
const elasticsearchService = require('../services/elasticsearchService');
const { clearCache } = require('../middleware/cache');

const router = express.Router();

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// CSV file upload endpoint
router.post('/csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }

    // Parse CSV data
    const csvData = req.file.buffer.toString('utf8');
    const courses = await csv().fromString(csvData);

    // Filter out empty rows
    const filteredCourses = courses.filter(course => {
      return Object.values(course).some(value => 
        value && value.toString().trim() !== ''
      );
    });

    // Process filtered courses

    if (filteredCourses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty or contains no valid data'
      });
    }

    // Validate course data
    const validationResults = validateCoursesData(filteredCourses);
    if (validationResults.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV validation failed',
        errors: validationResults.errors,
        validRows: validationResults.validRows
      });
    }

    const validCourses = validationResults.validRows;
    const results = {
      total: filteredCourses.length,
      valid: validCourses.length,
      invalid: filteredCourses.length - validCourses.length,
      created: 0,
      updated: 0,
      errors: []
    };

    // Process courses in batches for better performance
    const coursesToIndex = [];
    
    for (const courseData of validCourses) {
      try {
        const existingCourse = await Course.findOne({ 
          course_id: courseData.course_id 
        });

        if (existingCourse) {
          Object.assign(existingCourse, courseData);
          await existingCourse.save();
          coursesToIndex.push(existingCourse);
          results.updated++;
        } else {
          const course = new Course(courseData);
          await course.save();
          coursesToIndex.push(course);
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          course_id: courseData.course_id,
          error: error.message
        });
      }
    }

    // Elasticsearch indexing (optional - for enhanced search functionality)
    if (coursesToIndex.length > 0) {
      try {
        // Check if Elasticsearch is actually usable before attempting indexing
        const isUsable = await elasticsearchService.isUsable();
        if (isUsable) {
          await elasticsearchService.bulkIndexCourses(coursesToIndex);
        }
      } catch (error) {
        // Elasticsearch indexing is optional, continue silently
      }
    }

    await clearCache('courses:*');
    await clearCache('search:*');

    // Check Elasticsearch status for response
    const elasticsearchUsable = await elasticsearchService.isUsable();
    
    res.json({
      success: true,
      message: 'CSV upload completed successfully',
      data: {
        ...results,
        elasticsearchStatus: elasticsearchUsable ? 'indexed' : 'not_available',
        note: elasticsearchUsable 
          ? 'Courses indexed to both MongoDB and Elasticsearch for optimal search performance'
          : 'Courses saved to MongoDB (search will use MongoDB queries - Elasticsearch optional for enhanced search)'
      }
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process CSV file',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.get('/template', (req, res) => {
  const template = [
    {
      course_id: 'COURSE001',
      title: 'Introduction to Web Development',
      description: 'Learn the basics of web development including HTML, CSS, and JavaScript',
      category: 'Web Development',
      instructor: 'John Doe',
      duration: '40 hours',
      price: 99.99,
      rating: 4.5,
      studentsEnrolled: 150,
      level: 'Beginner',
      tags: 'HTML,CSS,JavaScript,Web Development',
      language: 'English'
    },
    {
      course_id: 'COURSE002',
      title: 'Advanced React Development',
      description: 'Master React with hooks, context, and advanced patterns',
      category: 'Web Development',
      instructor: 'Jane Smith',
      duration: '60 hours',
      price: 149.99,
      rating: 4.8,
      studentsEnrolled: 89,
      level: 'Advanced',
      tags: 'React,JavaScript,Frontend,Web Development',
      language: 'English'
    }
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="course_template.csv"');
  
  const csvContent = convertToCSV(template);
  res.send(csvContent);
});

function validateCoursesData(courses) {
  const errors = [];
  const validRows = [];

  courses.forEach((course, index) => {
    const rowErrors = [];

    if (!course.course_id || course.course_id.trim() === '') {
      rowErrors.push('course_id is required');
    }

    if (!course.title || course.title.trim() === '') {
      rowErrors.push('title is required');
    }

    if (!course.description || course.description.trim() === '') {
      rowErrors.push('description is required');
    }

    if (!course.category || course.category.trim() === '') {
      rowErrors.push('category is required');
    }

    if (!course.instructor || course.instructor.trim() === '') {
      rowErrors.push('instructor is required');
    }

    if (!course.duration || course.duration.trim() === '') {
      rowErrors.push('duration is required');
    }

    if (!course.price || isNaN(parseFloat(course.price))) {
      rowErrors.push('price must be a valid number');
    }

    if (course.level && !['Beginner', 'Intermediate', 'Advanced'].includes(course.level)) {
      rowErrors.push('level must be Beginner, Intermediate, or Advanced');
    }

    if (course.rating && (isNaN(parseFloat(course.rating)) || parseFloat(course.rating) < 0 || parseFloat(course.rating) > 5)) {
      rowErrors.push('rating must be a number between 0 and 5');
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: index + 1,
        course_id: course.course_id || 'N/A',
        errors: rowErrors
      });
    } else {
      const validCourse = {
        course_id: course.course_id.trim(),
        title: course.title.trim(),
        description: course.description.trim(),
        category: course.category.trim(),
        instructor: course.instructor.trim(),
        duration: course.duration.trim(),
        price: parseFloat(course.price),
        rating: course.rating ? parseFloat(course.rating) : 0,
        studentsEnrolled: course.studentsEnrolled ? parseInt(course.studentsEnrolled) : 0,
        level: course.level || 'Beginner',
        tags: course.tags ? course.tags.split(',').map(tag => tag.trim()) : [],
        language: course.language || 'English',
        isActive: true
      };
      validRows.push(validCourse);
    }
  });

  return { errors, validRows };
}

function convertToCSV(data) {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (Array.isArray(value)) {
        return `"${value.join(',')}"`;
      }
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

module.exports = router;
