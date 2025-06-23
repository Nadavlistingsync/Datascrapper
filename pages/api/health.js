import { logger } from '../../utils/logger';
import { getScrapingMetrics } from '../../utils/logger';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
} 