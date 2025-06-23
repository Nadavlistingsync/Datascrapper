import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from './logger';

// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => {
    // Use IP address as key
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           'unknown';
  },
  points: 10, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60 * 15, // Block for 15 minutes if limit exceeded
});

// Additional rate limiter for scraping operations
const scrapingRateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           'unknown';
  },
  points: 5, // Number of scraping requests
  duration: 60 * 5, // Per 5 minutes
  blockDuration: 60 * 30, // Block for 30 minutes if limit exceeded
});

export async function consumeRateLimit(req) {
  try {
    const clientIp = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    'unknown';

    await rateLimiter.consume(clientIp);
    
    logger.info('Rate limit consumed', { clientIp });
    
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    logger.warn('Rate limit exceeded', { 
      clientIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      remainingTime: secs 
    });
    
    throw new Error(`Rate limit exceeded. Try again in ${secs} seconds.`);
  }
}

export async function consumeScrapingRateLimit(req) {
  try {
    const clientIp = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    'unknown';

    await scrapingRateLimiter.consume(clientIp);
    
    logger.info('Scraping rate limit consumed', { clientIp });
    
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    logger.warn('Scraping rate limit exceeded', { 
      clientIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      remainingTime: secs 
    });
    
    throw new Error(`Scraping rate limit exceeded. Try again in ${secs} seconds.`);
  }
}

export { rateLimiter, scrapingRateLimiter }; 