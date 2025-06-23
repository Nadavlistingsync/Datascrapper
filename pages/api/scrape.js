import { LinkedInScraper } from '../../utils/linkedin-scraper';
import { logger } from '../../utils/logger';
import { rateLimiter } from '../../utils/rate-limiter';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'Xeinst scraper active' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await rateLimiter.consume(clientIp);

    // Parse and log input
    const body = req.body || {};
    const input = body.input;
    console.log('Xeinst scraper input:', input);

    if (!input || typeof input !== 'string' || !input.trim()) {
      console.log('Invalid input received:', body);
      return res.status(400).json({ success: false, error: 'Input is required as a non-empty string.' });
    }

    // Run scraping logic (using LinkedInScraper as an example)
    const scraper = new LinkedInScraper();
    const results = await scraper.scrapeProfiles(input, 10); // Default to 10 results

    console.log('Xeinst scraper output:', results);
    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.log('Xeinst scraper error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
} 