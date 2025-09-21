const redisService = require('./redisService');
const elasticsearchService = require('./elasticsearchService');

// Initialize all external services
async function initializeServices() {
  console.log('Initializing Course Management Services...');

  // Initialize Redis for caching
  try {
    const redisConnected = await redisService.connect();
    if (redisConnected) {
      console.log('✅ Redis service connected successfully');
    } else {
      console.log('⚠️  Redis service connection failed - caching disabled');
    }
  } catch (error) {
    console.log('⚠️  Redis service connection failed - caching disabled');
  }

  // Initialize Elasticsearch for search
  try {
    const elasticsearchConnected = await elasticsearchService.connect();
    if (elasticsearchConnected) {
      console.log('✅ Elasticsearch service connected successfully');
    } else {
      console.log('⚠️  Elasticsearch service connection failed - search functionality limited');
    }
  } catch (error) {
    console.log('⚠️  Elasticsearch service connection failed - search functionality limited');
  }

  console.log('Course Management Services initialization completed');
}

// Export service initialization function
module.exports = { initializeServices };
