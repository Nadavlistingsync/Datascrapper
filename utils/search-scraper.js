const puppeteer = require('puppeteer-core');
const { logger } = require('./logger');

class SearchScraper {
  constructor() {
    this.searchEngines = {
      google: {
        url: 'https://www.google.com/search',
        params: { q: '' },
        selectors: {
          titles: 'h3',
          links: 'a[href]',
          snippets: '.VwiC3b'
        }
      },
      bing: {
        url: 'https://www.bing.com/search',
        params: { q: '' },
        selectors: {
          titles: 'h2 a',
          links: 'h2 a[href]',
          snippets: '.b_caption p'
        }
      },
      duckduckgo: {
        url: 'https://duckduckgo.com/',
        params: { q: '' },
        selectors: {
          titles: 'h2 a',
          links: 'h2 a[href]',
          snippets: '.result__snippet'
        }
      }
    };
  }

  async searchAndScrape(query, maxResults = 10, searchEngines = ['google', 'bing']) {
    try {
      logger.info('Starting search and scrape', { query, maxResults, searchEngines });
      
      const results = {
        query,
        timestamp: new Date().toISOString(),
        searchResults: [],
        scrapedSites: [],
        totalResults: 0
      };

      // Step 1: Search across multiple engines
      const searchResults = await this.performSearch(query, maxResults, searchEngines);
      results.searchResults = searchResults;
      results.totalResults = searchResults.length;

      // Step 2: Scrape the found websites
      const scrapedSites = await this.scrapeWebsites(searchResults, maxResults);
      results.scrapedSites = scrapedSites;

      logger.info('Search and scrape completed', { 
        query, 
        searchResults: searchResults.length,
        scrapedSites: scrapedSites.length 
      });

      return results;

    } catch (error) {
      logger.error('Error in search and scrape', { error: error.message, query });
      throw error;
    }
  }

  async performSearch(query, maxResults, searchEngines) {
    const allResults = [];

    for (const engine of searchEngines) {
      try {
        const engineConfig = this.searchEngines[engine];
        if (!engineConfig) continue;

        const searchUrl = this.buildSearchUrl(engineConfig, query);
        logger.info(`Searching ${engine}`, { url: searchUrl });

        const searchData = await this.scrapeWebsite({
          url: searchUrl,
          selectors: engineConfig.selectors,
          extractLinks: true,
          extractText: true,
          timeout: 15000
        });

        if (searchData.success && searchData.data.allLinks) {
          const engineResults = this.parseSearchResults(searchData.data, engine);
          allResults.push(...engineResults);
        }

        await this.delay(2000); // Be respectful to search engines

      } catch (error) {
        logger.error(`Error searching ${engine}`, { error: error.message });
      }
    }

    // Remove duplicates and limit results
    const uniqueResults = this.removeDuplicates(allResults);
    return uniqueResults.slice(0, maxResults);
  }

  async scrapeWebsites(searchResults, maxSites) {
    const scrapedSites = [];
    const sitesToScrape = searchResults.slice(0, maxSites);

    for (const result of sitesToScrape) {
      try {
        if (!result.url || !this.isValidUrl(result.url)) continue;

        logger.info(`Scraping website`, { url: result.url });

        const scrapedData = await this.scrapeWebsite({
          url: result.url,
          extractText: true,
          extractLinks: true,
          extractImages: true,
          extractTables: true,
          timeout: 20000
        });

        if (scrapedData.success) {
          scrapedSites.push({
            url: result.url,
            title: result.title,
            searchEngine: result.searchEngine,
            scrapedData: scrapedData.data,
            timestamp: new Date().toISOString()
          });
        }

        await this.delay(3000); // Be respectful to websites

      } catch (error) {
        logger.error(`Error scraping website`, { url: result.url, error: error.message });
      }
    }

    return scrapedSites;
  }

  async scrapeWebsite({ url, selectors = {}, extractText = false, extractLinks = false, extractImages = false, extractTables = false, timeout = 30000 }) {
    let browser;
    try {
      const executablePath = process.env.CHROME_BIN || '/usr/bin/google-chrome-stable';
      browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      await page.goto(url, { waitUntil: 'networkidle2', timeout });

      const data = {};

      if (extractText) {
        data.allText = await page.evaluate(() => {
          return document.body.innerText || '';
        });
      }

      if (extractLinks) {
        data.allLinks = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href]'));
          return links.map(link => ({
            href: link.href,
            text: link.textContent?.trim() || '',
            title: link.title || ''
          })).filter(link => link.href && !link.href.startsWith('javascript:'));
        });
      }

      if (extractImages) {
        data.allImages = await page.evaluate(() => {
          const images = Array.from(document.querySelectorAll('img'));
          return images.map(img => ({
            src: img.src,
            alt: img.alt || '',
            title: img.title || ''
          })).filter(img => img.src);
        });
      }

      if (extractTables) {
        data.allTables = await page.evaluate(() => {
          const tables = Array.from(document.querySelectorAll('table'));
          return tables.map(table => {
            const rows = Array.from(table.querySelectorAll('tr'));
            return rows.map(row => {
              const cells = Array.from(row.querySelectorAll('td, th'));
              return cells.map(cell => cell.textContent?.trim() || '');
            });
          });
        });
      }

      await browser.close();

      return {
        success: true,
        data
      };
    } catch (error) {
      if (browser) await browser.close();
      logger.error('Error scraping website', { error: error.message, url });
      return { success: false, error: error.message };
    }
  }

  buildSearchUrl(engineConfig, query) {
    const url = new URL(engineConfig.url);
    url.searchParams.set('q', query);
    return url.toString();
  }

  parseSearchResults(data, searchEngine) {
    const results = [];
    
    if (data.allLinks && data.allLinks.length > 0) {
      data.allLinks.forEach((link, index) => {
        if (this.isValidUrl(link.href) && !this.isSearchEngineUrl(link.href)) {
          results.push({
            title: link.text || `Result ${index + 1}`,
            url: link.href,
            searchEngine,
            snippet: data.allText ? this.extractSnippet(data.allText, link.text) : ''
          });
        }
      });
    }

    return results;
  }

  extractSnippet(text, title) {
    if (!title || !text) return '';
    
    const titleIndex = text.indexOf(title);
    if (titleIndex === -1) return text.substring(0, 200) + '...';
    
    const start = Math.max(0, titleIndex - 100);
    const end = Math.min(text.length, titleIndex + 300);
    return text.substring(start, end) + '...';
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  isSearchEngineUrl(url) {
    const searchEngines = ['google.com', 'bing.com', 'duckduckgo.com', 'yahoo.com'];
    return searchEngines.some(engine => url.includes(engine));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  removeDuplicates(results) {
    const seen = new Set();
    return results.filter(result => {
      if (seen.has(result.url)) return false;
      seen.add(result.url);
      return true;
    });
  }
}

export { SearchScraper }; 