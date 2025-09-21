const { Client } = require('elasticsearch');

// Elasticsearch service for search operations
class ElasticsearchService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.indexName = 'courses';
  }

  // Connect to Elasticsearch server
  async connect() {
    try {
      this.client = new Client({
        host: process.env.ELASTICSEARCH_URL,
        log: 'error'
      });

      await this.client.ping();
      this.isConnected = true;
      console.log('Elasticsearch Client Connected');

      await this.createIndexIfNotExists();
      return true;
    } catch (error) {
      console.error('Elasticsearch connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  // Create Elasticsearch index if it doesn't exist
  async createIndexIfNotExists() {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      
      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                course_id: { type: 'keyword' },
                title: { 
                  type: 'text',
                  analyzer: 'standard',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                description: { 
                  type: 'text',
                  analyzer: 'standard'
                },
                category: { 
                  type: 'keyword',
                  fields: {
                    text: { type: 'text' }
                  }
                },
                instructor: { 
                  type: 'keyword',
                  fields: {
                    text: { type: 'text' }
                  }
                },
                duration: { type: 'keyword' },
                price: { type: 'float' },
                rating: { type: 'float' },
                level: { type: 'keyword' },
                tags: { type: 'keyword' },
                language: { type: 'keyword' },
                studentsEnrolled: { type: 'integer' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' }
              }
            }
          }
        });
        console.log(`Elasticsearch index '${this.indexName}' created`);
      }
    } catch (error) {
      console.error('Error creating Elasticsearch index:', error);
    }
  }

  // Index a course document in Elasticsearch
  async indexCourse(course) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }

      await this.client.index({
        index: this.indexName,
        id: course._id.toString(),
        body: {
          course_id: course.course_id,
          title: course.title,
          description: course.description,
          category: course.category,
          instructor: course.instructor,
          duration: course.duration,
          price: course.price,
          rating: course.rating,
          level: course.level,
          tags: course.tags || [],
          language: course.language,
          studentsEnrolled: course.studentsEnrolled,
          isActive: course.isActive,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt
        }
      });

      return true;
    } catch (error) {
      console.error('Error indexing course:', error);
      return false;
    }
  }

  // Search courses using Elasticsearch
  async searchCourses(query, filters = {}) {
    try {
      if (!this.isConnected || !this.client) {
        return { hits: [], total: 0 };
      }

      // Build Elasticsearch query
      const searchBody = {
        query: {
          bool: {
            must: [],
            filter: []
          }
        },
        sort: [],
        from: filters.from || 0,
        size: filters.size || 10
      };

      // Add text search query
      if (query && query.trim()) {
        searchBody.query.bool.must.push({
          multi_match: {
            query: query,
            fields: ['title^3', 'description^2', 'category^2', 'instructor^2', 'tags'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      } else {
        searchBody.query.bool.must.push({ match_all: {} });
      }

      if (filters.category) {
        searchBody.query.bool.filter.push({
          term: { category: filters.category }
        });
      }

      if (filters.instructor) {
        searchBody.query.bool.filter.push({
          term: { instructor: filters.instructor }
        });
      }

      if (filters.level) {
        searchBody.query.bool.filter.push({
          term: { level: filters.level }
        });
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        const priceRange = {};
        if (filters.minPrice !== undefined) priceRange.gte = filters.minPrice;
        if (filters.maxPrice !== undefined) priceRange.lte = filters.maxPrice;
        searchBody.query.bool.filter.push({
          range: { price: priceRange }
        });
      }

      if (filters.minRating !== undefined) {
        searchBody.query.bool.filter.push({
          range: { rating: { gte: filters.minRating } }
        });
      }

      searchBody.query.bool.filter.push({
        term: { isActive: true }
      });

      if (filters.sortBy) {
        const sortField = filters.sortBy;
        const sortOrder = filters.sortOrder || 'desc';
        searchBody.sort.push({ [sortField]: { order: sortOrder } });
      } else {
        searchBody.sort.push({ rating: { order: 'desc' } });
        searchBody.sort.push({ studentsEnrolled: { order: 'desc' } });
      }

      const response = await this.client.search({
        index: this.indexName,
        body: searchBody
      });

      return {
        hits: response.hits.hits.map(hit => ({
          _id: hit._id,
          _score: hit._score,
          ...hit._source
        })),
        total: response.hits.total.value,
        took: response.took
      };

    } catch (error) {
      console.error('Elasticsearch search error:', error);
      return { hits: [], total: 0, error: error.message };
    }
  }

  async deleteCourse(courseId) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }

      await this.client.delete({
        index: this.indexName,
        id: courseId
      });

      return true;
    } catch (error) {
      console.error('Error deleting course from Elasticsearch:', error);
      return false;
    }
  }

  async bulkIndexCourses(courses) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }

      const body = [];
      courses.forEach(course => {
        body.push({
          index: {
            _index: this.indexName,
            _id: course._id.toString()
          }
        });
        body.push({
          course_id: course.course_id,
          title: course.title,
          description: course.description,
          category: course.category,
          instructor: course.instructor,
          duration: course.duration,
          price: course.price,
          rating: course.rating,
          level: course.level,
          tags: course.tags || [],
          language: course.language,
          studentsEnrolled: course.studentsEnrolled,
          isActive: course.isActive,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt
        });
      });

      await this.client.bulk({ body });
      return true;
    } catch (error) {
      console.error('Error bulk indexing courses:', error);
      return false;
    }
  }
}

// Export Elasticsearch service instance
module.exports = new ElasticsearchService();
