const winston = require('winston');

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'linkedin-scraper',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Create a stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Performance monitoring
const performanceLogs = new Map();

function startPerformanceTimer(operation) {
  const startTime = Date.now();
  performanceLogs.set(operation, startTime);
  logger.info(`Performance timer started`, { operation });
}

function endPerformanceTimer(operation) {
  const startTime = performanceLogs.get(operation);
  if (startTime) {
    const duration = Date.now() - startTime;
    logger.info(`Performance timer ended`, { 
      operation, 
      duration: `${duration}ms` 
    });
    performanceLogs.delete(operation);
    return duration;
  }
  return null;
}

// Error tracking with automatic feedback
function trackError(error, context = {}) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString()
  };

  logger.error('Error tracked', errorInfo);

  // In production, you could send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to external error tracking service
    // sendToErrorTrackingService(errorInfo);
  }

  return errorInfo;
}

// Scraping metrics
const scrapingMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalProfilesExtracted: 0,
  averageResponseTime: 0
};

function updateScrapingMetrics(type, count = 1, responseTime = 0) {
  switch (type) {
    case 'request':
      scrapingMetrics.totalRequests += count;
      break;
    case 'success':
      scrapingMetrics.successfulRequests += count;
      break;
    case 'failure':
      scrapingMetrics.failedRequests += count;
      break;
    case 'profiles':
      scrapingMetrics.totalProfilesExtracted += count;
      break;
    case 'responseTime':
      const currentAvg = scrapingMetrics.averageResponseTime;
      const totalRequests = scrapingMetrics.totalRequests;
      scrapingMetrics.averageResponseTime = 
        ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;
      break;
  }

  logger.info('Metrics updated', { 
    type, 
    count, 
    metrics: scrapingMetrics 
  });
}

function getScrapingMetrics() {
  return { ...scrapingMetrics };
}

module.exports = {
  logger,
  startPerformanceTimer,
  endPerformanceTimer,
  trackError,
  updateScrapingMetrics,
  getScrapingMetrics
}; 