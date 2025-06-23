const { SearchScraper } = require('../../utils/search-scraper');
const { logger } = require('../../utils/logger');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    logger.info('Test search endpoint called');

    // Test with a simple query
    const testQuery = "test business leads";
    const maxResults = 5;
    const searchEngines = ['google'];

    logger.info('Initializing SearchScraper for test');
    const searchScraper = new SearchScraper();

    logger.info('Performing test search');
    const results = await searchScraper.searchAndScrape(testQuery, maxResults, searchEngines);

    logger.info('Test search completed', { 
      query: testQuery,
      resultsCount: results.scrapedSites ? results.scrapedSites.length : 0
    });

    return res.status(200).json({
      success: true,
      message: 'Test search completed successfully',
      data: {
        query: testQuery,
        totalResults: results.totalResults || 0,
        scrapedSites: results.scrapedSites ? results.scrapedSites.length : 0,
        timestamp: results.timestamp
      }
    });

  } catch (error) {
    logger.error('Test search failed', { 
      error: error.message, 
      stack: error.stack 
    });
    
    return res.status(500).json({
      success: false,
      error: 'Test search failed',
      details: error.message
    });
  }
}; 