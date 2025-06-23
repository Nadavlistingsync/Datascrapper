const Joi = require('joi');
const { logger } = require('./logger');

const scrapeRequestSchema = Joi.object({
  search_query: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Search query must be at least 3 characters long',
      'string.max': 'Search query must be less than 200 characters',
      'any.required': 'Search query is required',
      'string.empty': 'Search query cannot be empty'
    }),
  max_profiles: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Max profiles must be a number',
      'number.integer': 'Max profiles must be an integer',
      'number.min': 'Max profiles must be at least 1',
      'number.max': 'Max profiles cannot exceed 100'
    })
});

const universalScrapeSchema = Joi.object({
  url: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'URL must be a valid URL',
      'any.required': 'URL is required',
      'string.empty': 'URL cannot be empty'
    }),
  selectors: Joi.object().default({}),
  waitForSelector: Joi.string().allow(null, ''),
  scrollToBottom: Joi.boolean().default(false),
  maxScrolls: Joi.number().integer().min(1).max(20).default(5),
  delayBetweenScrolls: Joi.number().integer().min(500).max(10000).default(2000),
  extractText: Joi.boolean().default(true),
  extractLinks: Joi.boolean().default(false),
  extractImages: Joi.boolean().default(false),
  extractTables: Joi.boolean().default(false),
  customScript: Joi.string().allow(null, ''),
  headers: Joi.object().default({}),
  timeout: Joi.number().integer().min(5000).max(120000).default(30000)
});

const enhancedLinkedInSchema = Joi.object({
  keywords: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.min': 'Keywords must be at least 2 characters long',
      'string.max': 'Keywords must be less than 200 characters',
      'any.required': 'Keywords are required',
      'string.empty': 'Keywords cannot be empty'
    }),
  location: Joi.string()
    .max(100)
    .allow('', null)
    .messages({
      'string.max': 'Location must be less than 100 characters'
    }),
  industry: Joi.string()
    .max(100)
    .allow('', null)
    .messages({
      'string.max': 'Industry must be less than 100 characters'
    }),
  companySize: Joi.string()
    .max(50)
    .allow('', null)
    .messages({
      'string.max': 'Company size must be less than 50 characters'
    }),
  maxResults: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Max results must be a number',
      'number.integer': 'Max results must be an integer',
      'number.min': 'Max results must be at least 1',
      'number.max': 'Max results cannot exceed 100'
    })
});

function validateInput(data) {
  try {
    const { error, value } = scrapeRequestSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation failed', { 
        errors, 
        input: data 
      });

      return {
        isValid: false,
        errors,
        data: null
      };
    }

    return {
      isValid: true,
      errors: [],
      data: value
    };

  } catch (validationError) {
    logger.error('Validation error', { 
      error: validationError.message,
      input: data 
    });

    return {
      isValid: false,
      errors: [{
        field: 'validation',
        message: 'Internal validation error'
      }],
      data: null
    };
  }
}

function validateUniversalInput(data) {
  try {
    const { error, value } = universalScrapeSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Universal validation failed', { 
        errors, 
        input: data 
      });

      return {
        isValid: false,
        errors,
        data: null
      };
    }

    return {
      isValid: true,
      errors: [],
      data: value
    };

  } catch (validationError) {
    logger.error('Universal validation error', { 
      error: validationError.message,
      input: data 
    });

    return {
      isValid: false,
      errors: [{
        field: 'validation',
        message: 'Internal validation error'
      }],
      data: null
    };
  }
}

function validateEnhancedLinkedInInput(data) {
  try {
    const { error, value } = enhancedLinkedInSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Enhanced LinkedIn validation failed', { 
        errors, 
        input: data 
      });

      return {
        isValid: false,
        errors,
        data: null
      };
    }

    return {
      isValid: true,
      errors: [],
      data: value
    };

  } catch (validationError) {
    logger.error('Enhanced LinkedIn validation error', { 
      error: validationError.message,
      input: data 
    });

    return {
      isValid: false,
      errors: [{
        field: 'validation',
        message: 'Internal validation error'
      }],
      data: null
    };
  }
}

function sanitizeSearchQuery(query) {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters
  return query
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

function validateSearchQuery(query, maxResults, searchEngines) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return { isValid: false, error: 'Search query is required and must be a non-empty string' };
  }

  if (query.trim().length < 2) {
    return { isValid: false, error: 'Search query must be at least 2 characters long' };
  }

  if (query.trim().length > 500) {
    return { isValid: false, error: 'Search query must be less than 500 characters' };
  }

  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 50) {
    return { isValid: false, error: 'Max results must be an integer between 1 and 50' };
  }

  if (!Array.isArray(searchEngines) || searchEngines.length === 0) {
    return { isValid: false, error: 'Search engines must be a non-empty array' };
  }

  const validEngines = ['google', 'bing', 'duckduckgo'];
  const invalidEngines = searchEngines.filter(engine => !validEngines.includes(engine));
  if (invalidEngines.length > 0) {
    return { isValid: false, error: `Invalid search engines: ${invalidEngines.join(', ')}` };
  }

  return { isValid: true };
}

module.exports = {
  validateInput,
  validateUniversalInput,
  validateEnhancedLinkedInInput,
  sanitizeSearchQuery,
  validateSearchQuery
}; 