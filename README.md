# LinkedIn Profile Scraper - B2B Lead Generation

A high-quality web scraper that extracts public LinkedIn profile data using search parameters for B2B lead generation. Built with Next.js, Puppeteer, and deployed on Vercel.

## 🚀 Features

- **Advanced Scraping**: Uses Puppeteer with stealth techniques to avoid detection
- **Rate Limiting**: Built-in rate limiting to prevent abuse and ensure fair usage
- **Input Validation**: Comprehensive validation with Joi schema
- **Error Handling**: Robust error handling with automatic retries and feedback loops
- **Real-time Logging**: Winston-based logging with performance monitoring
- **Modern UI**: Beautiful, responsive frontend with real-time feedback
- **CSV Export**: Download scraped data in CSV format
- **Health Monitoring**: Built-in health check endpoint
- **Vercel Ready**: Optimized for Vercel deployment

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Vercel account (for deployment)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nadavlistingsync/Datascrapper.git
   cd Datascrapper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NODE_ENV=development
   LOG_LEVEL=info
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel
   ```

3. **Follow the prompts** to connect your GitHub repository

4. **Set environment variables** in Vercel dashboard:
   - `NODE_ENV=production`
   - `LOG_LEVEL=info`

## 📖 Usage

### API Endpoint

**POST** `/api/scrape`

**Request Body:**
```json
{
  "search_query": "real estate agents in Miami",
  "max_profiles": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "John Doe",
      "title": "Real Estate Agent",
      "company": "Miami Real Estate Group",
      "location": "Miami, FL",
      "profileUrl": "https://linkedin.com/in/johndoe",
      "imageUrl": "https://media.licdn.com/...",
      "extractedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "metadata": {
    "search_query": "real estate agents in Miami",
    "max_profiles": 10,
    "profiles_found": 10,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Health Check

**GET** `/api/health`

Returns system health and metrics information.

## 🏗️ Project Structure

```
├── pages/
│   ├── api/
│   │   ├── scrape.js      # Main scraping endpoint
│   │   └── health.js      # Health check endpoint
│   └── index.js           # Frontend interface
├── utils/
│   ├── linkedin-scraper.js # Core scraping logic
│   ├── validation.js      # Input validation
│   ├── logger.js          # Logging and metrics
│   ├── rate-limiter.js    # Rate limiting
│   └── helpers.js         # Utility functions
├── package.json
├── next.config.js
├── vercel.json
└── README.md
```

## 🔧 Configuration

### Rate Limiting
- **General requests**: 10 requests per minute
- **Scraping requests**: 5 requests per 5 minutes
- **Block duration**: 15-30 minutes for violations

### Scraping Limits
- **Max profiles per request**: 100
- **Search query length**: 3-200 characters
- **Timeout**: 30 seconds per page

## 🛡️ Security Features

- **Input Sanitization**: All inputs are sanitized and validated
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **CORS Headers**: Properly configured for cross-origin requests
- **Error Handling**: No sensitive information leaked in errors
- **Request Validation**: Comprehensive validation with Joi

## 📊 Monitoring & Debugging

### Automatic Feedback Loop
The scraper includes built-in monitoring:

- **Performance Tracking**: Automatic timing of operations
- **Error Tracking**: Comprehensive error logging with context
- **Metrics Collection**: Request counts, success rates, response times
- **Health Monitoring**: System health checks and memory usage

### Logs
Logs are automatically generated for:
- Scraping operations
- Error tracking
- Performance metrics
- Rate limiting events
- System health

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for educational and legitimate business purposes only. Please ensure you comply with:

- LinkedIn's Terms of Service
- Applicable data protection laws
- Respect for rate limits and robots.txt
- Ethical scraping practices

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the health endpoint: `/api/health`
- Review logs for debugging information

## 🔄 Updates

The project automatically publishes to GitHub after every edit and pushes changes. The automatic feedback loop ensures continuous monitoring and debugging capabilities.

---

**Built with ❤️ for B2B lead generation** 