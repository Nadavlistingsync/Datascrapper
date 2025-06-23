const { validateInput } = require('../utils/validation');
const { sanitizeText, isValidUrl } = require('../utils/helpers');

describe('LinkedIn Scraper Tests', () => {
  describe('Input Validation', () => {
    test('should validate correct input', () => {
      const input = {
        search_query: 'real estate agents in Miami',
        max_profiles: 10
      };
      
      const result = validateInput(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty search query', () => {
      const input = {
        search_query: '',
        max_profiles: 10
      };
      
      const result = validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject invalid max_profiles', () => {
      const input = {
        search_query: 'test query',
        max_profiles: 150
      };
      
      const result = validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Helper Functions', () => {
    test('should sanitize text correctly', () => {
      const input = '  Test   Text  with   spaces  ';
      const expected = 'Test Text with spaces';
      expect(sanitizeText(input)).toBe(expected);
    });

    test('should validate URLs correctly', () => {
      expect(isValidUrl('https://linkedin.com/in/test')).toBe(true);
      expect(isValidUrl('not-a-url')).toBe(false);
    });

    test('should handle empty text sanitization', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
    });
  });
}); 