const { SearchScraper } = require('../../utils/search-scraper');
const { validateSearchQuery } = require('../../utils/validation');
const { logger } = require('../../utils/logger');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    // Validate request body
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: 'Request body is required'
      });
    }

    const { query, maxResults = 10, searchEngines = ['google', 'bing'] } = req.body;

    // Basic validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a non-empty string'
      });
    }

    // Validate input using validation function
    try {
      const validation = validateSearchQuery(query, maxResults, searchEngines);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }
    } catch (validationError) {
      logger.error('Validation error', { error: validationError.message });
      return res.status(400).json({
        success: false,
        error: 'Invalid input parameters'
      });
    }

    logger.info('Search scrape request received', { query, maxResults, searchEngines });

    // Initialize scraper
    let searchScraper;
    try {
      searchScraper = new SearchScraper();
    } catch (scraperError) {
      logger.error('Failed to initialize SearchScraper', { error: scraperError.message });
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize scraper',
        details: scraperError.message
      });
    }

    // Perform search and scrape
    let results;
    try {
      results = await searchScraper.searchAndScrape(query, maxResults, searchEngines);
    } catch (scrapeError) {
      logger.error('Search and scrape failed', { error: scrapeError.message, query });
      return res.status(500).json({
        success: false,
        error: 'Failed to perform search and scrape',
        details: scrapeError.message
      });
    }

    // Validate results
    if (!results || typeof results !== 'object') {
      logger.error('Invalid results returned', { results });
      return res.status(500).json({
        success: false,
        error: 'Invalid results returned from scraper'
      });
    }

    logger.info('Search scrape completed successfully', { 
      query, 
      resultsCount: results.scrapedSites ? results.scrapedSites.length : 0
    });

    // Return successful response
    return res.status(200).json({
      success: true,
      data: results
    });

  } catch (error) {
    logger.error('Unexpected error in search scrape API', { 
      error: error.message, 
      stack: error.stack 
    });
    
    // Ensure we always return valid JSON
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}; 