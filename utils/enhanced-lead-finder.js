const { SearchScraper } = require('./search-scraper');
const { logger } = require('./logger');

class EnhancedLeadFinder {
  constructor(config = {}) {
    this.searchScraper = new SearchScraper();
    this.config = {
      useGoogleAPI: config.useGoogleAPI || false,
      useBingAPI: config.useBingAPI || false,
      usePlacesAPI: config.usePlacesAPI || false,
      useYelpAPI: config.useYelpAPI || false,
      useApolloAPI: config.useApolloAPI || false,
      useHunterAPI: config.useHunterAPI || false,
      ...config
    };
    
    // API Keys (should be in environment variables)
    this.apiKeys = {
      google: process.env.GOOGLE_API_KEY,
      bing: process.env.BING_API_KEY,
      yelp: process.env.YELP_API_KEY,
      apollo: process.env.APOLLO_API_KEY,
      hunter: process.env.HUNTER_API_KEY
    };
  }

  async findLeads(query, options = {}) {
    const {
      maxResults = 20,
      location = '',
      industry = '',
      companySize = '',
      useAPIs = true,
      enrichData = true
    } = options;

    try {
      logger.info('Starting enhanced lead search', { query, options });

      const results = {
        query,
        timestamp: new Date().toISOString(),
        searchResults: [],
        enrichedLeads: [],
        totalResults: 0,
        sources: []
      };

      // Step 1: Search for leads using multiple sources
      const searchResults = await this.searchMultipleSources(query, {
        maxResults,
        location,
        industry,
        useAPIs
      });

      results.searchResults = searchResults;
      results.totalResults = searchResults.length;

      // Step 2: Enrich leads with additional data
      if (enrichData) {
        const enrichedLeads = await this.enrichLeads(searchResults);
        results.enrichedLeads = enrichedLeads;
      }

      logger.info('Enhanced lead search completed', {
        query,
        totalResults: results.totalResults,
        enrichedLeads: results.enrichedLeads.length
      });

      return results;

    } catch (error) {
      logger.error('Error in enhanced lead search', { error: error.message, query });
      throw error;
    }
  }

  async searchMultipleSources(query, options) {
    const allResults = [];
    const { maxResults, location, industry, useAPIs } = options;

    // 1. Traditional web scraping (fallback)
    try {
      const scrapedResults = await this.searchScraper.searchAndScrape(query, maxResults, ['google', 'bing']);
      if (scrapedResults.scrapedSites) {
        allResults.push(...scrapedResults.scrapedSites);
        logger.info('Added scraped results', { count: scrapedResults.scrapedSites.length });
      }
    } catch (error) {
      logger.error('Scraping failed, continuing with APIs', { error: error.message });
    }

    // 2. Google Places API (for local businesses)
    if (useAPIs && this.apiKeys.google && location) {
      try {
        const placesResults = await this.searchGooglePlaces(query, location, maxResults);
        allResults.push(...placesResults);
        logger.info('Added Google Places results', { count: placesResults.length });
      } catch (error) {
        logger.error('Google Places API failed', { error: error.message });
      }
    }

    // 3. Yelp API (for local businesses)
    if (useAPIs && this.apiKeys.yelp && location) {
      try {
        const yelpResults = await this.searchYelp(query, location, maxResults);
        allResults.push(...yelpResults);
        logger.info('Added Yelp results', { count: yelpResults.length });
      } catch (error) {
        logger.error('Yelp API failed', { error: error.message });
      }
    }

    // Remove duplicates and limit results
    const uniqueResults = this.removeDuplicates(allResults);
    return uniqueResults.slice(0, maxResults);
  }

  async searchGooglePlaces(query, location, maxResults) {
    if (!this.apiKeys.google) return [];

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&key=${this.apiKeys.google}`
      );

      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        return data.results.slice(0, maxResults).map(place => ({
          title: place.name,
          url: place.website || `https://maps.google.com/?cid=${place.place_id}`,
          searchEngine: 'google_places',
          snippet: place.formatted_address,
          phone: place.formatted_phone_number,
          rating: place.rating,
          reviews: place.user_ratings_total,
          address: place.formatted_address,
          placeId: place.place_id
        }));
      }
    } catch (error) {
      logger.error('Google Places API error', { error: error.message });
    }

    return [];
  }

  async searchYelp(query, location, maxResults) {
    if (!this.apiKeys.yelp) return [];

    try {
      const response = await fetch(
        `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&limit=${maxResults}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKeys.yelp}`
          }
        }
      );

      const data = await response.json();
      
      if (data.businesses) {
        return data.businesses.map(business => ({
          title: business.name,
          url: business.url,
          searchEngine: 'yelp',
          snippet: business.categories?.map(cat => cat.title).join(', '),
          phone: business.phone,
          rating: business.rating,
          reviews: business.review_count,
          address: business.location?.display_address?.join(', '),
          price: business.price
        }));
      }
    } catch (error) {
      logger.error('Yelp API error', { error: error.message });
    }

    return [];
  }

  async enrichLeads(leads) {
    const enrichedLeads = [];

    for (const lead of leads) {
      try {
        const enrichedLead = { ...lead };

        // Find email addresses
        if (this.apiKeys.hunter && lead.url) {
          const domain = this.extractDomain(lead.url);
          if (domain) {
            const emailData = await this.findEmails(domain, lead.title);
            if (emailData) {
              enrichedLead.emails = emailData;
            }
          }
        }

        // Find company data
        if (this.apiKeys.apollo && lead.title) {
          const companyData = await this.findCompanyData(lead.title);
          if (companyData) {
            enrichedLead.companyData = companyData;
          }
        }

        enrichedLeads.push(enrichedLead);

      } catch (error) {
        logger.error('Error enriching lead', { lead: lead.title, error: error.message });
        enrichedLeads.push(lead); // Add original lead if enrichment fails
      }
    }

    return enrichedLeads;
  }

  async findEmails(domain, name) {
    if (!this.apiKeys.hunter) return null;

    try {
      const response = await fetch(
        `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${this.apiKeys.hunter}`
      );

      const data = await response.json();
      
      if (data.data && data.data.emails) {
        return data.data.emails.map(email => ({
          email: email.value,
          confidence: email.confidence,
          type: email.type
        }));
      }
    } catch (error) {
      logger.error('Hunter API error', { error: error.message });
    }

    return null;
  }

  async findCompanyData(companyName) {
    if (!this.apiKeys.apollo) return null;

    try {
      const response = await fetch(
        `https://api.apollo.io/v1/organizations/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': this.apiKeys.apollo
          },
          body: JSON.stringify({
            api_key: this.apiKeys.apollo,
            q_organization_name: companyName
          })
        }
      );

      const data = await response.json();
      
      if (data.organizations && data.organizations.length > 0) {
        const org = data.organizations[0];
        return {
          name: org.name,
          website: org.website_url,
          industry: org.industry,
          size: org.employee_count,
          location: org.city + ', ' + org.state,
          linkedin: org.linkedin_url
        };
      }
    } catch (error) {
      logger.error('Apollo API error', { error: error.message });
    }

    return null;
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return null;
    }
  }

  removeDuplicates(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = result.url || result.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Cost estimation
  estimateCost(leadsCount, options = {}) {
    const costs = {
      scraping: 0, // Free
      googlePlaces: leadsCount * 0.017, // $17 per 1000
      yelp: 0, // Free tier
      hunter: leadsCount * 0.008, // $8 per 1000
      apollo: leadsCount * 0.049, // $49 per 1000
      total: 0
    };

    if (options.useGooglePlaces) costs.total += costs.googlePlaces;
    if (options.useHunter) costs.total += costs.hunter;
    if (options.useApollo) costs.total += costs.apollo;

    return costs;
  }
}

module.exports = { EnhancedLeadFinder }; 