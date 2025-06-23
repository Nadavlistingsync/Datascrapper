const { logger } = require('./logger');

// Delay utility
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random delay utility
function randomDelay(minMs, maxMs) {
  const delayTime = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return delay(delayTime);
}

// Retry utility with exponential backoff
async function retry(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        logger.error('Max retries reached', { 
          maxRetries, 
          error: error.message 
        });
        throw error;
      }
      
      const delayTime = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(`Retry attempt ${attempt} failed, retrying in ${delayTime}ms`, { 
        error: error.message,
        attempt,
        maxRetries 
      });
      
      await delay(delayTime);
    }
  }
  
  throw lastError;
}

// Validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Sanitize text
function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s\-.,&()]/g, '') // Remove special characters except common ones
    .trim();
}

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format date
function formatDate(date) {
  return new Date(date).toISOString();
}

// Check if string contains valid email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Parse LinkedIn profile URL
function parseLinkedInUrl(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('linkedin.com')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2 && pathParts[0] === 'in') {
        return {
          profileId: pathParts[1],
          fullUrl: url,
          isValid: true
        };
      }
    }
    return { isValid: false };
  } catch {
    return { isValid: false };
  }
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

module.exports = {
  delay,
  randomDelay,
  retry,
  isValidUrl,
  sanitizeText,
  extractDomain,
  generateId,
  formatDate,
  isValidEmail,
  parseLinkedInUrl,
  debounce,
  throttle
}; 