const express = require('express');
const { body, validationResult } = require('express-validator');
const elasticsearchService = require('../services/elasticsearchService');
const redisService = require('../services/redisService');
const { cacheMiddleware } = require('../middleware/cache');
const Course = require('../models/Course');

const router = express.Router();

// Debug endpoint to check database content
router.get('/test-courses', async (req, res) => {
  try {
    // Check what's actually in the database
    const allCourses = await Course.find({}).limit(5);
    const activeCourses = await Course.find({ isActive: true }).limit(5);
    const totalAll = await Course.countDocuments({});
    const totalActive = await Course.countDocuments({ isActive: true });
    
    console.log('All courses count:', totalAll);
    console.log('Active courses count:', totalActive);
    console.log('Sample course:', allCourses[0] || 'No courses found');
    
    res.json({
      success: true,
      message: 'Test courses retrieved',
      data: {
        allCourses,
        activeCourses,
        totalAll,
        totalActive,
        count: allCourses.length
      }
    });
  } catch (error) {
    console.error('Test courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test courses',
      error: error.message
    });
  }
});

// Simple search test endpoint
router.get('/test-search', async (req, res) => {
  try {
    const { level, maxPrice, minPrice, minRating } = req.query;
    
    let query = { isActive: true };
    
    if (level) {
      query.level = level;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.price.$lte = parseFloat(maxPrice);
      }
    }
    
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }
    
    console.log('Test search query:', query);
    
    const courses = await Course.find(query).limit(10);
    const total = await Course.countDocuments(query);
    
    res.json({
      success: true,
      message: 'Test search completed',
      data: {
        courses,
        total,
        query
      }
    });
  } catch (error) {
    console.error('Test search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test search',
      error: error.message
    });
  }
});

// Get filter options for dropdowns
router.get('/filter-options', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).select('category instructor level');
    
    const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];
    const instructors = [...new Set(courses.map(c => c.instructor).filter(Boolean))];
    const levels = [...new Set(courses.map(c => c.level).filter(Boolean))];
    
    res.json({
      success: true,
      message: 'Filter options retrieved',
      data: {
        categories,
        instructors,
        levels
      }
    });
  } catch (error) {
    console.error('Filter options error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get filter options',
      error: error.message
    });
  }
});

// MongoDB fallback search function
const searchCoursesMongoDB = async (query, filters) => {
  try {
    // Build MongoDB query - start with basic query
    const mongoQuery = { isActive: true };
    
    // Text search
    if (query && query.trim()) {
      mongoQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { instructor: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Add filters - be more flexible with matching
    if (filters.category && filters.category !== 'all') {
      mongoQuery.category = filters.category; // Exact match for category
    }
    if (filters.instructor && filters.instructor !== 'all') {
      mongoQuery.instructor = filters.instructor; // Exact match for instructor
    }
    if (filters.level && filters.level !== 'all') {
      mongoQuery.level = filters.level; // Exact match for level
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      mongoQuery.price = {};
      if (filters.minPrice !== undefined && filters.minPrice >= 0) {
        mongoQuery.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
        mongoQuery.price.$lte = filters.maxPrice;
      }
    }
    if (filters.minRating !== undefined) {
      mongoQuery.rating = { $gte: filters.minRating };
    }
    
    // Build sort options
    const sortOptions = {};
    if (filters.sortBy) {
      sortOptions[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.rating = -1;
      sortOptions.studentsEnrolled = -1;
    }
    
    
    // Execute query
    const courses = await Course.find(mongoQuery)
      .sort(sortOptions)
      .skip(filters.from || 0)
      .limit(filters.size || 10)
      .select('-__v');
    
    const total = await Course.countDocuments(mongoQuery);
    
    const hits = courses.map(course => ({
      _id: course._id,
      _score: 1.0, // Default score for MongoDB results
      ...course.toObject()
    }));


    return {
      hits,
      total,
      took: 0 // MongoDB doesn't provide search time
    };
  } catch (error) {
    console.error('MongoDB search error:', error);
    return { hits: [], total: 0, error: error.message };
  }
};

// GET endpoint for simple search with query parameters
router.get('/courses', cacheMiddleware('search:courses', 'search'), async (req, res) => {
  try {
    const { 
      query = '', 
      category, 
      instructor, 
      level, 
      minPrice, 
      maxPrice, 
      minRating,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const filters = {
      category,
      instructor,
      level,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      sortBy,
      sortOrder,
      from: (page - 1) * limit,
      size: parseInt(limit)
    };

    let searchResults;
    
    // Debug logging
    console.log('Elasticsearch connected:', elasticsearchService.isConnected);
    console.log('Search parameters:', { query, filters });
    
    // Force MongoDB fallback for now (since Elasticsearch is not working)
    console.log('Using MongoDB fallback for search');
    searchResults = await searchCoursesMongoDB(query, filters);

    if (searchResults.error) {
      return res.status(500).json({
        success: false,
        message: 'Search service temporarily unavailable',
        error: searchResults.error
      });
    }

    const totalPages = Math.ceil(searchResults.total / limit);

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        courses: searchResults.hits,
        total: searchResults.total,
        page: parseInt(page),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        searchTime: searchResults.took,
        cached: false
      }
    });

  } catch (error) {
    console.error('Search courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search courses',
      error: error.message
    });
  }
});

router.post('/courses', cacheMiddleware('search:courses', 'search'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      query = '', 
      category, 
      instructor, 
      level, 
      minPrice, 
      maxPrice, 
      minRating,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.body;

    const filters = {
      category,
      instructor,
      level,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      sortBy,
      sortOrder,
      from: (page - 1) * limit,
      size: parseInt(limit)
    };

    let searchResults;
    
    // Debug logging
    console.log('Elasticsearch connected:', elasticsearchService.isConnected);
    console.log('Search parameters:', { query, filters });
    
    // Force MongoDB fallback for now (since Elasticsearch is not working)
    console.log('Using MongoDB fallback for search');
    searchResults = await searchCoursesMongoDB(query, filters);

    if (searchResults.error) {
      return res.status(500).json({
        success: false,
        message: 'Search service temporarily unavailable',
        error: searchResults.error
      });
    }

    const totalPages = Math.ceil(searchResults.total / limit);

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        courses: searchResults.hits,
        total: searchResults.total,
        page: parseInt(page),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        searchTime: searchResults.took,
        cached: false
      }
    });

  } catch (error) {
    console.error('Search courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search courses',
      error: error.message
    });
  }
});

router.get('/suggestions', cacheMiddleware('search:suggestions', 'courses'), async (req, res) => {
  try {
    const { q: query, type = 'all' } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        message: 'Query too short for suggestions',
        data: { suggestions: [] }
      });
    }

    const suggestions = await getSearchSuggestions(query, type);

    res.json({
      success: true,
      message: 'Search suggestions retrieved successfully',
      data: { suggestions }
    });

  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions',
      error: error.message
    });
  }
});

router.get('/filters', cacheMiddleware('search:filters', 'single'), async (req, res) => {
  try {
    const filters = await getAvailableFilters();

    res.json({
      success: true,
      message: 'Available filters retrieved successfully',
      data: { filters }
    });

  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available filters',
      error: error.message
    });
  }
});

async function getSearchSuggestions(query, type) {
  try {
    if (!elasticsearchService.isConnected) {
      return [];
    }

    const searchBody = {
      suggest: {
        title_suggest: {
          prefix: query,
          completion: {
            field: 'title.suggest',
            size: 5
          }
        },
        category_suggest: {
          prefix: query,
          completion: {
            field: 'category.suggest',
            size: 5
          }
        },
        instructor_suggest: {
          prefix: query,
          completion: {
            field: 'instructor.suggest',
            size: 5
          }
        }
      }
    };

    const response = await elasticsearchService.client.search({
      index: elasticsearchService.indexName,
      body: searchBody
    });

    const suggestions = [];
    
    if (response.suggest) {
      Object.keys(response.suggest).forEach(key => {
        if (response.suggest[key] && response.suggest[key][0] && response.suggest[key][0].options) {
          response.suggest[key][0].options.forEach(option => {
            suggestions.push({
              text: option.text,
              type: key.replace('_suggest', ''),
              score: option.score
            });
          });
        }
      });
    }

    return suggestions.slice(0, 10);

  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}

async function getAvailableFilters() {
  try {
    if (!elasticsearchService.isConnected) {
      return {
        categories: [],
        instructors: [],
        levels: ['Beginner', 'Intermediate', 'Advanced'],
        priceRanges: [
          { label: 'Free', min: 0, max: 0 },
          { label: 'Under $50', min: 0, max: 50 },
          { label: '$50 - $100', min: 50, max: 100 },
          { label: '$100 - $200', min: 100, max: 200 },
          { label: 'Over $200', min: 200, max: null }
        ]
      };
    }

    const response = await elasticsearchService.client.search({
      index: elasticsearchService.indexName,
      body: {
        size: 0,
        aggs: {
          categories: {
            terms: {
              field: 'category.keyword',
              size: 20
            }
          },
          instructors: {
            terms: {
              field: 'instructor.keyword',
              size: 20
            }
          },
          price_stats: {
            stats: {
              field: 'price'
            }
          }
        }
      }
    });

    const categories = response.aggregations.categories.buckets.map(bucket => ({
      value: bucket.key,
      count: bucket.doc_count
    }));

    const instructors = response.aggregations.instructors.buckets.map(bucket => ({
      value: bucket.key,
      count: bucket.doc_count
    }));

    const priceStats = response.aggregations.price_stats;
    const priceRanges = [
      { label: 'Free', min: 0, max: 0 },
      { label: 'Under $50', min: 0, max: 50 },
      { label: '$50 - $100', min: 50, max: 100 },
      { label: '$100 - $200', min: 100, max: 200 },
      { label: 'Over $200', min: 200, max: null }
    ];

    return {
      categories,
      instructors,
      levels: ['Beginner', 'Intermediate', 'Advanced'],
      priceRanges,
      priceStats: {
        min: priceStats.min,
        max: priceStats.max,
        avg: priceStats.avg
      }
    };

  } catch (error) {
    console.error('Error getting available filters:', error);
    return {
      categories: [],
      instructors: [],
      levels: ['Beginner', 'Intermediate', 'Advanced'],
      priceRanges: []
    };
  }
}

module.exports = router;
