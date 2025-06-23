const puppeteer = require('puppeteer-core');
const axios = require('axios');
const cheerio = require('cheerio');
const UserAgent = require('user-agents');
const { logger } = require('./logger');
const { delay, randomDelay, isValidUrl } = require('./helpers');

class UniversalScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.userAgent = new UserAgent({ deviceCategory: 'desktop' });
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing universal scraper browser...');
      
      const executablePath = process.env.CHROME_BIN || 
                           (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' :
                            process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' :
                            '/usr/bin/google-chrome-stable');
      
      this.browser = await puppeteer.launch({
        headless: 'new',
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--window-size=1920,1080',
          '--single-process',
          '--disable-extensions',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.page = await this.browser.newPage();
      
      await this.page.setUserAgent(this.userAgent.toString());
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });

      this.isInitialized = true;
      logger.info('Universal scraper browser initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize universal scraper browser', { error: error.message });
      this.isInitialized = true;
      return;
    }
  }

  async scrapeWebsite(config) {
    const {
      url,
      selectors = {},
      waitForSelector = null,
      scrollToBottom = false,
      maxScrolls = 5,
      delayBetweenScrolls = 2000,
      extractText = true,
      extractLinks = false,
      extractImages = false,
      extractTables = false,
      customScript = null,
      headers = {},
      timeout = 30000
    } = config;

    try {
      await this.initialize();
      
      if (!isValidUrl(url)) {
        throw new Error('Invalid URL provided');
      }

      logger.info('Starting website scraping', { url, selectors });

      // Try Puppeteer first
      if (this.browser) {
        return await this.scrapeWithPuppeteer(config);
      } else {
        // Fallback to axios + cheerio
        return await this.scrapeWithAxios(config);
      }

    } catch (error) {
      logger.error('Error during website scraping', { 
        error: error.message, 
        url 
      });
      
      // Return error data
      return {
        success: false,
        error: error.message,
        url,
        timestamp: new Date().toISOString()
      };
    } finally {
      await this.cleanup();
    }
  }

  async scrapeWithPuppeteer(config) {
    const {
      url,
      selectors = {},
      waitForSelector = null,
      scrollToBottom = false,
      maxScrolls = 5,
      delayBetweenScrolls = 2000,
      extractText = true,
      extractLinks = false,
      extractImages = false,
      extractTables = false,
      customScript = null,
      headers = {},
      timeout = 30000
    } = config;

    try {
      // Set custom headers
      if (Object.keys(headers).length > 0) {
        await this.page.setExtraHTTPHeaders(headers);
      }

      await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout 
      });

      // Wait for specific selector if provided
      if (waitForSelector) {
        await this.page.waitForSelector(waitForSelector, { timeout: 10000 });
        await delay(2000);
      }

      // Scroll to bottom if requested
      if (scrollToBottom) {
        await this.scrollToBottom(maxScrolls, delayBetweenScrolls);
      }

      // Execute custom script if provided
      if (customScript) {
        await this.page.evaluate(customScript);
      }

      // Extract data based on selectors
      const extractedData = await this.page.evaluate((sel, extractText, extractLinks, extractImages, extractTables) => {
        const result = {};

        // Extract data based on selectors
        Object.keys(sel).forEach(key => {
          const selector = sel[key];
          const elements = document.querySelectorAll(selector);
          
          if (elements.length === 1) {
            result[key] = elements[0].textContent.trim();
          } else if (elements.length > 1) {
            result[key] = Array.from(elements).map(el => el.textContent.trim());
          } else {
            result[key] = null;
          }
        });

        // Extract all text if requested
        if (extractText) {
          result.allText = document.body.innerText.trim();
        }

        // Extract all links if requested
        if (extractLinks) {
          const links = document.querySelectorAll('a[href]');
          result.allLinks = Array.from(links).map(link => ({
            text: link.textContent.trim(),
            href: link.href,
            title: link.title || ''
          }));
        }

        // Extract all images if requested
        if (extractImages) {
          const images = document.querySelectorAll('img[src]');
          result.allImages = Array.from(images).map(img => ({
            src: img.src,
            alt: img.alt || '',
            title: img.title || '',
            width: img.width,
            height: img.height
          }));
        }

        // Extract all tables if requested
        if (extractTables) {
          const tables = document.querySelectorAll('table');
          result.allTables = Array.from(tables).map((table, index) => {
            const rows = table.querySelectorAll('tr');
            const tableData = Array.from(rows).map(row => {
              const cells = row.querySelectorAll('td, th');
              return Array.from(cells).map(cell => cell.textContent.trim());
            });
            return {
              tableIndex: index,
              data: tableData
            };
          });
        }

        return result;
      }, selectors, extractText, extractLinks, extractImages, extractTables);

      logger.info('Website scraping completed successfully', { url });

      return {
        success: true,
        url,
        data: extractedData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error in Puppeteer scraping', { error: error.message, url });
      throw error;
    }
  }

  async scrapeWithAxios(config) {
    const {
      url,
      selectors = {},
      extractText = true,
      extractLinks = false,
      extractImages = false,
      extractTables = false,
      headers = {},
      timeout = 30000
    } = config;

    try {
      logger.info('Using axios fallback for scraping', { url });

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent.toString(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          ...headers
        },
        timeout
      });

      const $ = cheerio.load(response.data);
      const result = {};

      // Extract data based on selectors
      Object.keys(selectors).forEach(key => {
        const selector = selectors[key];
        const elements = $(selector);
        
        if (elements.length === 1) {
          result[key] = elements.text().trim();
        } else if (elements.length > 1) {
          result[key] = elements.map((i, el) => $(el).text().trim()).get();
        } else {
          result[key] = null;
        }
      });

      // Extract all text if requested
      if (extractText) {
        result.allText = $('body').text().trim();
      }

      // Extract all links if requested
      if (extractLinks) {
        result.allLinks = $('a[href]').map((i, el) => ({
          text: $(el).text().trim(),
          href: $(el).attr('href'),
          title: $(el).attr('title') || ''
        })).get();
      }

      // Extract all images if requested
      if (extractImages) {
        result.allImages = $('img[src]').map((i, el) => ({
          src: $(el).attr('src'),
          alt: $(el).attr('alt') || '',
          title: $(el).attr('title') || '',
          width: $(el).attr('width'),
          height: $(el).attr('height')
        })).get();
      }

      // Extract all tables if requested
      if (extractTables) {
        result.allTables = $('table').map((tableIndex, table) => {
          const tableData = $(table).find('tr').map((rowIndex, row) => {
            return $(row).find('td, th').map((cellIndex, cell) => {
              return $(cell).text().trim();
            }).get();
          }).get();
          
          return {
            tableIndex,
            data: tableData
          };
        }).get();
      }

      logger.info('Axios scraping completed successfully', { url });

      return {
        success: true,
        url,
        data: result,
        method: 'axios',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error in axios scraping', { error: error.message, url });
      throw error;
    }
  }

  async scrollToBottom(maxScrolls, delayBetweenScrolls) {
    try {
      for (let i = 0; i < maxScrolls; i++) {
        await this.page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await delay(delayBetweenScrolls);
      }
      logger.info('Scrolled to bottom', { maxScrolls });
    } catch (error) {
      logger.error('Error scrolling to bottom', { error: error.message });
    }
  }

  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        this.isInitialized = false;
        logger.info('Universal scraper cleanup completed');
      }
    } catch (error) {
      logger.error('Error during cleanup', { error: error.message });
    }
  }
}

export { UniversalScraper }; 