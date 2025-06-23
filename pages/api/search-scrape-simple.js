module.exports = async (req, res) => {
  console.log('Simple API endpoint reached:', req.method, req.url);
  
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
      error: 'Method not allowed. Expected POST, got ' + req.method
    }));
  }

  console.log('Processing POST request');
  console.log('Request body:', req.body);

  try {
    // Validate request body
    if (!req.body) {
      console.log('No request body found');
      return res.status(400).json({
        success: false,
        error: 'Request body is required'
      });
    }

    const { query, maxResults = 10, searchEngines = ['google', 'bing'] } = req.body;

    // Basic validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.log('Invalid query:', query);
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a non-empty string'
      });
    }

    console.log('Query validated:', query);

    // Return mock data for testing
    const mockResults = {
      query,
      timestamp: new Date().toISOString(),
      searchResults: [
        {
          title: 'Test Business 1',
          url: 'https://example1.com',
          searchEngine: 'google',
          snippet: 'This is a test business for lead generation'
        },
        {
          title: 'Test Business 2', 
          url: 'https://example2.com',
          searchEngine: 'bing',
          snippet: 'Another test business for SMMA leads'
        }
      ],
      scrapedSites: [
        {
          url: 'https://example1.com',
          title: 'Test Business 1',
          searchEngine: 'google',
          scrapedData: {
            allText: 'This is sample content from the business website...',
            allLinks: [
              { href: 'https://example1.com/contact', text: 'Contact Us' },
              { href: 'https://example1.com/about', text: 'About Us' }
            ]
          },
          timestamp: new Date().toISOString()
        }
      ],
      totalResults: 2
    };

    console.log('Returning mock results');
    return res.status(200).json({
      success: true,
      data: mockResults
    });

  } catch (error) {
    console.log('Unexpected error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}; 