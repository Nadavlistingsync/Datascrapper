import { EnhancedLeadFinder } from '../../utils/enhanced-lead-finder';
import { validateEnhancedLinkedInInput } from '../../utils/validation';
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

    // Validate input using the new validation function
    const validation = validateEnhancedLinkedInInput(req.body);
    if (!validation.isValid) {
      logger.warn('Invalid input received', { 
        body: req.body, 
        errors: validation.errors 
      });
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: validation.errors 
      });
    }

    const { keywords, location, industry, companySize, maxResults } = validation.data;

    // Build search query from parameters
    let searchQuery = keywords.trim();
    
    if (location && location.trim()) {
      searchQuery += ` ${location.trim()}`;
    }
    
    if (industry && industry.trim()) {
      searchQuery += ` ${industry.trim()}`;
    }
    
    if (companySize && companySize.trim()) {
      searchQuery += ` ${companySize.trim()} employees`;
    }

    logger.info('Starting enhanced LinkedIn scrape', { 
      searchQuery, 
      keywords, 
      location, 
      industry, 
      companySize, 
      maxResults, 
      clientIp 
    });

    // Initialize enhanced lead finder
    const leadFinder = new EnhancedLeadFinder({
      useGoogleAPI: true,
      useBingAPI: true,
      usePlacesAPI: true,
      useYelpAPI: true,
      enrichData: true
    });
    
    // Start searching
    const results = await leadFinder.findLeads(searchQuery, {
      maxResults,
      location: location || '',
      industry: industry || '',
      companySize: companySize || '',
      useAPIs: true,
      enrichData: true
    });

    logger.info('Enhanced LinkedIn scraping completed successfully', { 
      searchQuery,
      totalResults: results.totalResults,
      enrichedLeads: results.enrichedLeads.length
    });

    return res.status(200).json({
      success: true,
      data: results.enrichedLeads.length > 0 ? results.enrichedLeads : results.searchResults,
      metadata: {
        searchQuery,
        keywords,
        location,
        industry,
        companySize,
        maxResults,
        totalResults: results.totalResults,
        enrichedLeads: results.enrichedLeads.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Enhanced LinkedIn scraping error', { 
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