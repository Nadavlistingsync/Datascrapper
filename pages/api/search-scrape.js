const { SearchScraper } = require('../../utils/search-scraper');
const { validateSearchQuery } = require('../../utils/validation');
const { logger } = require('../../utils/logger');

module.exports = async (req, res) => {
  console.log('API endpoint reached:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).end(JSON.stringify({ 
      success: false,
      error: 'Method not allowed. Expected POST, got ' + req.method,
      xeinst_compatible: true
    }));
  }

  console.log('Processing POST request');

  try {
    // Validate request body
    if (!req.body) {
      console.log('No request body found');
      return res.status(400).json({
        success: false,
        error: 'Request body is required',
        xeinst_compatible: true
      });
    }

    console.log('Request body:', req.body);

    const { query, maxResults = 10, searchEngines = ['google', 'bing'] } = req.body;

    // Basic validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.log('Invalid query:', query);
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a non-empty string',
        xeinst_compatible: true
      });
    }

    console.log('Query validated:', query);

    // Validate input using validation function
    try {
      const validation = validateSearchQuery(query, maxResults, searchEngines);
      if (!validation.isValid) {
        console.log('Validation failed:', validation.error);
        return res.status(400).json({
          success: false,
          error: validation.error,
          xeinst_compatible: true
        });
      }
    } catch (validationError) {
      console.log('Validation error:', validationError.message);
      logger.error('Validation error', { error: validationError.message });
      return res.status(400).json({
        success: false,
        error: 'Invalid input parameters',
        xeinst_compatible: true
      });
    }

    console.log('Starting search and scrape');
    logger.info('Search scrape request received', { query, maxResults, searchEngines });

    // Initialize scraper
    let searchScraper;
    try {
      searchScraper = new SearchScraper();
      console.log('SearchScraper initialized');
    } catch (scraperError) {
      console.log('Failed to initialize SearchScraper:', scraperError.message);
      logger.error('Failed to initialize SearchScraper', { error: scraperError.message });
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize scraper',
        details: scraperError.message,
        xeinst_compatible: true
      });
    }

    // Perform search and scrape
    let results;
    try {
      console.log('Performing search and scrape');
      results = await searchScraper.searchAndScrape(query, maxResults, searchEngines);
      console.log('Search and scrape completed');
    } catch (scrapeError) {
      console.log('Search and scrape failed:', scrapeError.message);
      logger.error('Search and scrape failed', { error: scrapeError.message, query });
      return res.status(500).json({
        success: false,
        error: 'Failed to perform search and scrape',
        details: scrapeError.message,
        xeinst_compatible: true
      });
    }

    // Validate results
    if (!results || typeof results !== 'object') {
      console.log('Invalid results returned:', results);
      logger.error('Invalid results returned', { results });
      return res.status(500).json({
        success: false,
        error: 'Invalid results returned from scraper',
        xeinst_compatible: true
      });
    }

    console.log('Results validated, returning success');
    logger.info('Search scrape completed successfully', { 
      query, 
      resultsCount: results.scrapedSites ? results.scrapedSites.length : 0
    });

    // Return successful response
    return res.status(200).json({
      success: true,
      data: results,
      xeinst_compatible: true
    });

  } catch (error) {
    console.log('Unexpected error:', error.message);
    logger.error('Unexpected error in search scrape API', { 
      error: error.message, 
      stack: error.stack 
    });
    
    // Ensure we always return valid JSON
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      xeinst_compatible: true
    });
  }
}; 