const redisService = require('../services/redisService');

const cacheMiddleware = (prefix, cacheType = 'default') => {
  return async (req, res, next) => {
    try {
      const cacheKey = redisService.generateCacheKey(prefix, {
        ...req.query,
        ...req.params,
        path: req.path
      });

      const cachedData = await redisService.get(cacheKey);
      
      if (cachedData) {
        // Cache hit - returning cached data
        return res.json({
          success: true,
          message: 'Data retrieved from cache',
          data: cachedData,
          cached: true,
          cacheKey
        });
      }

      // Cache miss - fetching from database
      
      // get expiry time based on cache type (in seconds)
      const getExpiryTime = (type) => {
        switch (type) {
          case 'courses':
            return parseInt(process.env.REDIS_COURSES_EXPIRY) || 1800; // 30 min
          case 'search':
            return parseInt(process.env.REDIS_SEARCH_EXPIRY) || 900;   // 15 min
          case 'single':
            return parseInt(process.env.REDIS_SINGLE_EXPIRY) || 3600;  // 1 hour
          case 'stats':
            return parseInt(process.env.REDIS_STATS_EXPIRY) || 300;    // 5 min
          default:
            return parseInt(process.env.REDIS_DEFAULT_EXPIRY) || 3600; // 1 hour
        }
      };

      const originalSend = res.json;
      res.json = function(data) {
        if (data.success && data.data) {
          const expiryTime = getExpiryTime(cacheType);
          redisService.set(cacheKey, data.data, expiryTime)
            .then(() => {
              // Data successfully cached
            })
            .catch(err => {
              console.error('Error caching data:', err);
            });
        }
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

const clearCache = async (pattern) => {
  try {
    if (!redisService.isConnected) {
      return false;
    }

    const keys = await redisService.client.keys(pattern);
    if (keys.length > 0) {
      await redisService.client.del(keys);
      // Cache cleared successfully
    }
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

module.exports = {
  cacheMiddleware,
  clearCache
};
