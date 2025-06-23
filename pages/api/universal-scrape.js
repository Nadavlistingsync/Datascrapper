import { UniversalScraper } from '../../utils/universal-scraper';
import { validateUniversalInput } from '../../utils/validation';
import { logger } from '../../utils/logger';
import { rateLimiter } from '../../utils/rate-limiter';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await rateLimiter.consume(clientIp);

    // Validate input
    const validation = validateUniversalInput(req.body);
    if (!validation.isValid) {
      logger.warn('Invalid universal scraping input received', { body: req.body, errors: validation.errors });
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: validation.errors 
      });
    }

    const config = validation.data;

    logger.info('Starting universal website scraping', { 
      url: config.url,
      clientIp 
    });

    // Initialize scraper
    const scraper = new UniversalScraper();
    
    // Start scraping
    const results = await scraper.scrapeWebsite(config);

    logger.info('Universal scraping completed', { 
      url: config.url,
      success: results.success 
    });

    return res.status(200).json({
      success: true,
      data: results,
      metadata: {
        url: config.url,
        timestamp: new Date().toISOString(),
        method: results.method || 'puppeteer'
      }
    });

  } catch (error) {
    logger.error('Universal scraping error', { 
      error: error.message, 
      stack: error.stack,
      body: req.body 
    });

    if (error.message.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
} 