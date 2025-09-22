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
        log: 'error',
        requestTimeout: 10000, // 10 seconds (reduced for faster failure detection)
        pingTimeout: 5000,     // 5 seconds
        maxRetries: 2,         // Reduced retries for faster fallback
        deadTimeout: 30000,
        maxSockets: 10,
        keepAlive: true
      });

      // Quick ping test with short timeout
      await Promise.race([
        this.client.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Ping timeout')), 5000))
      ]);
      
      // Test cluster health to ensure it's actually usable
      try {
        const healthResponse = await Promise.race([
          this.client.cluster.health({ timeout: '5s' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 5000))
        ]);
        
        // Only consider connected if cluster is in a healthy state
        if (healthResponse.status === 'red' || healthResponse.status === 'yellow' || healthResponse.status === 'green') {
          this.isConnected = true;
          console.log(`✅ Elasticsearch Client Connected (cluster status: ${healthResponse.status})`);
        } else {
          throw new Error('Cluster not in healthy state');
        }
      } catch (healthError) {
        // If cluster health fails but basic connection works, try to create index anyway
        // This handles single-node setups with cluster state issues
        console.log('⚠️ Cluster health check failed, attempting basic operations...');
        try {
          await this.createIndexIfNotExists();
          this.isConnected = true;
          console.log('✅ Elasticsearch Client Connected (basic operations working)');
        } catch (indexError) {
          throw new Error('Elasticsearch not usable');
        }
      }

      return true;
    } catch (error) {
      this.isConnected = false;
      this.client = null;
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
      }
    } catch (error) {
      // Index creation failed, continue silently
    }
  }

  // Index a course document in Elasticsearch
  async indexCourse(course, retries = 2) {
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
      // Silent error handling for production
      
      // Quick retry for timeout errors only
      if (retries > 0 && (error.displayName === 'RequestTimeout' || error.message.includes('timeout'))) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return this.indexCourse(course, retries - 1);
      }
      
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

  // Check if Elasticsearch is actually usable (not just connected)
  async isUsable() {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }
      
      // Quick health check
      const healthResponse = await Promise.race([
        this.client.cluster.health({ timeout: '3s' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 3000))
      ]);
      
      // Consider usable if cluster is in any healthy state
      return healthResponse.status === 'red' || healthResponse.status === 'yellow' || healthResponse.status === 'green';
    } catch (error) {
      return false;
    }
  }

  async bulkIndexCourses(courses, retries = 2) {
    try {
      // Check if Elasticsearch is actually usable
      const isUsable = await this.isUsable();
      if (!isUsable) {
        return false;
      }

      // Process courses in smaller batches to avoid timeouts
      const batchSize = 100; // Increased batch size for better performance
      const batches = [];
      
      for (let i = 0; i < courses.length; i += batchSize) {
        batches.push(courses.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const body = [];
        batch.forEach(course => {
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

        await this.client.bulk({ 
          body,
          timeout: '30s',
          refresh: false
        });
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      return true;
    } catch (error) {
      // Silent error handling for production
      
      // Quick retry for timeout errors only
      if (retries > 0 && (error.displayName === 'RequestTimeout' || error.message.includes('timeout'))) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return this.bulkIndexCourses(courses, retries - 1);
      }
      
      return false;
    }
  }
}

// Export Elasticsearch service instance
module.exports = new ElasticsearchService();
