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
  sanitizeSearchQuery
}; 