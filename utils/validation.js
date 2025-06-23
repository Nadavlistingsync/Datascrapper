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

module.exports = {
  validateInput,
  validateUniversalInput,
  sanitizeSearchQuery
}; 