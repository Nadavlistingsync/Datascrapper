import { logger } from '../../utils/logger';
import { rateLimiter } from '../../utils/rate-limiter';
import { validateInput, validateEnhancedLinkedInInput, validateUniversalInput } from '../../utils/validation';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
      },
      uptime: Math.round(process.uptime()) + ' seconds',
      environmentVariables: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_REGION: process.env.VERCEL_REGION,
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'Set' : 'Not set',
        BING_API_KEY: process.env.BING_API_KEY ? 'Set' : 'Not set',
        YELP_API_KEY: process.env.YELP_API_KEY ? 'Set' : 'Not set',
        APOLLO_API_KEY: process.env.APOLLO_API_KEY ? 'Set' : 'Not set',
        HUNTER_API_KEY: process.env.HUNTER_API_KEY ? 'Set' : 'Not set'
      },
      rateLimiter: {
        status: 'Available',
        tokens: rateLimiter.tokens || 'N/A'
      },
      validation: {
        basicLinkedIn: 'Available',
        enhancedLinkedIn: 'Available',
        universal: 'Available'
      }
    };

    // Test validation functions if POST request with test data
    if (req.method === 'POST' && req.body) {
      debugInfo.validationTests = {};
      
      // Test basic LinkedIn validation
      try {
        const basicTest = validateInput({ search_query: 'test', max_profiles: 10 });
        debugInfo.validationTests.basicLinkedIn = {
          status: 'Working',
          result: basicTest.isValid
        };
      } catch (error) {
        debugInfo.validationTests.basicLinkedIn = {
          status: 'Error',
          error: error.message
        };
      }

      // Test enhanced LinkedIn validation
      try {
        const enhancedTest = validateEnhancedLinkedInInput({ 
          keywords: 'test', 
          location: 'test', 
          industry: 'test', 
          companySize: '1-10', 
          maxResults: 10 
        });
        debugInfo.validationTests.enhancedLinkedIn = {
          status: 'Working',
          result: enhancedTest.isValid
        };
      } catch (error) {
        debugInfo.validationTests.enhancedLinkedIn = {
          status: 'Error',
          error: error.message
        };
      }

      // Test universal validation
      try {
        const universalTest = validateUniversalInput({ 
          url: 'https://example.com', 
          selectors: {}, 
          extractText: true 
        });
        debugInfo.validationTests.universal = {
          status: 'Working',
          result: universalTest.isValid
        };
      } catch (error) {
        debugInfo.validationTests.universal = {
          status: 'Error',
          error: error.message
        };
      }

      // Test specific validation if provided
      if (req.body.testValidation) {
        debugInfo.specificValidationTest = {};
        
        if (req.body.testType === 'enhancedLinkedIn') {
          const testResult = validateEnhancedLinkedInInput(req.body.testData);
          debugInfo.specificValidationTest = {
            type: 'Enhanced LinkedIn',
            isValid: testResult.isValid,
            errors: testResult.errors,
            data: testResult.data
          };
        } else if (req.body.testType === 'basicLinkedIn') {
          const testResult = validateInput(req.body.testData);
          debugInfo.specificValidationTest = {
            type: 'Basic LinkedIn',
            isValid: testResult.isValid,
            errors: testResult.errors,
            data: testResult.data
          };
        } else if (req.body.testType === 'universal') {
          const testResult = validateUniversalInput(req.body.testData);
          debugInfo.specificValidationTest = {
            type: 'Universal',
            isValid: testResult.isValid,
            errors: testResult.errors,
            data: testResult.data
          };
        }
      }
    }

    logger.info('Debug endpoint accessed', { 
      method: req.method,
      hasBody: !!req.body,
      clientIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    return res.status(200).json({
      success: true,
      debug: debugInfo
    });

  } catch (error) {
    logger.error('Debug endpoint error', { 
      error: error.message, 
      stack: error.stack 
    });

    return res.status(500).json({ 
      success: false,
      error: 'Debug endpoint error',
      message: error.message
    });
  }
} 