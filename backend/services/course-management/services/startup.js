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

  // Initialize Elasticsearch for enhanced search 
  try {
    const elasticsearchConnected = await elasticsearchService.connect();
    if (elasticsearchConnected) {
      console.log('✅ Elasticsearch service connected - enhanced search enabled');
    } else {
      console.log('ℹ️  Elasticsearch not available - using MongoDB-only mode (fully functional)');
    }
  } catch (error) {
    console.log('ℹ️  Elasticsearch initialization skipped - application fully functional with MongoDB');
  }

  console.log('Course Management Services initialization completed');
}

// Export service initialization function
module.exports = { initializeServices };
