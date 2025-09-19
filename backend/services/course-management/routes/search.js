const express = require('express');
const { body, validationResult } = require('express-validator');
const elasticsearchService = require('../services/elasticsearchService');
const redisService = require('../services/redisService');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

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

    const searchResults = await elasticsearchService.searchCourses(query, filters);

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
        query,
        filters,
        results: searchResults.hits,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalResults: searchResults.total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          resultsPerPage: parseInt(limit)
        },
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

    const searchResults = await elasticsearchService.searchCourses(query, filters);

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
        query,
        filters,
        results: searchResults.hits,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalResults: searchResults.total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          resultsPerPage: parseInt(limit)
        },
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
