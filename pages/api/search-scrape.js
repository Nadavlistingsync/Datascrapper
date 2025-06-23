const { SearchScraper } = require('../../utils/search-scraper');
const { validateSearchQuery } = require('../../utils/validation');
const { logger } = require('../../utils/logger');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, maxResults = 10, searchEngines = ['google', 'bing'] } = req.body;

    // Validate input
    const validation = validateSearchQuery(query, maxResults, searchEngines);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    logger.info('Search scrape request received', { query, maxResults, searchEngines });

    const searchScraper = new SearchScraper();
    const results = await searchScraper.searchAndScrape(query, maxResults, searchEngines);

    logger.info('Search scrape completed successfully', { 
      query, 
      resultsCount: results.scrapedSites.length 
    });

    res.status(200).json({
      success: true,
      data: results
    });

  } catch (error) {
    logger.error('Search scrape error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to perform search and scrape',
      details: error.message
    });
  }
}; 