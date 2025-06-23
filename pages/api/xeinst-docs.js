export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const docs = {
    openapi: '3.0.0',
    info: {
      title: 'Data Scrapper for xeinst',
      version: '1.0.0',
      description: 'API for universal and LinkedIn scraping, xeinst compatible.'
    },
    paths: {
      '/api/search-scrape': {
        post: {
          summary: 'Universal search and scrape',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                    maxResults: { type: 'integer', default: 10 },
                    searchEngines: { type: 'array', items: { type: 'string' }, default: ['google', 'bing'] }
                  },
                  required: ['query']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Scrape results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'object' },
                      xeinst_compatible: { type: 'boolean', example: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/enhanced-linkedin-scrape': {
        post: {
          summary: 'Enhanced LinkedIn scraping',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    keywords: { type: 'string' },
                    location: { type: 'string' },
                    industry: { type: 'string' },
                    companySize: { type: 'string' },
                    maxResults: { type: 'integer', default: 10 }
                  },
                  required: ['keywords']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'LinkedIn scrape results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array' },
                      xeinst_compatible: { type: 'boolean', example: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  res.status(200).json(docs);
} 