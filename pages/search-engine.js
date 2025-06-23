import { useState } from 'react';
import Head from 'next/head';

export default function SearchEngine() {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [searchEngines, setSearchEngines] = useState(['google', 'bing']);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/search-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          maxResults: parseInt(maxResults),
          searchEngines
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to perform search');
      }

      setResults(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSearchEngine = (engine) => {
    setSearchEngines(prev => 
      prev.includes(engine) 
        ? prev.filter(e => e !== engine)
        : [...prev, engine]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Search Engine Scraper - Find and Scrape Websites</title>
        <meta name="description" content="Search across multiple engines and automatically scrape websites" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🔍 Search Engine Scraper
            </h1>
            <p className="text-lg text-gray-600">
              Search across multiple engines and automatically scrape websites that allow it
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Search Query */}
              <div>
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                  What are you looking for?
                </label>
                <input
                  type="text"
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your search query (e.g., 'best restaurants in NYC', 'AI tools for business')"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              {/* Search Engines */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Engines
                </label>
                <div className="flex flex-wrap gap-3">
                  {['google', 'bing', 'duckduckgo'].map((engine) => (
                    <label key={engine} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={searchEngines.includes(engine)}
                        onChange={() => toggleSearchEngine(engine)}
                        disabled={isLoading}
                        className="mr-2"
                      />
                      <span className="capitalize">{engine}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Max Results */}
              <div>
                <label htmlFor="maxResults" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Results
                </label>
                <select
                  id="maxResults"
                  value={maxResults}
                  onChange={(e) => setMaxResults(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5 results</option>
                  <option value={10}>10 results</option>
                  <option value={15}>15 results</option>
                  <option value={20}>20 results</option>
                  <option value={30}>30 results</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching and Scraping...
                  </span>
                ) : (
                  '🔍 Search & Scrape'
                )}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-medium text-blue-900">Query</div>
                    <div className="text-blue-700">{results.query}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="font-medium text-green-900">Sites Found</div>
                    <div className="text-green-700">{results.totalResults}</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="font-medium text-purple-900">Sites Scraped</div>
                    <div className="text-purple-700">{results.scrapedSites.length}</div>
                  </div>
                </div>
              </div>

              {/* Scraped Sites */}
              {results.scrapedSites.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Scraped Websites</h3>
                  <div className="space-y-4">
                    {results.scrapedSites.map((site, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-lg font-medium text-blue-600 hover:text-blue-800">
                            <a href={site.url} target="_blank" rel="noopener noreferrer">
                              {site.title || site.url}
                            </a>
                          </h4>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {site.searchEngine}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{site.url}</p>
                        
                        {site.scrapedData && (
                          <div className="space-y-2">
                            {site.scrapedData.allText && (
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">Content Preview:</div>
                                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                                  {site.scrapedData.allText.substring(0, 300)}...
                                </div>
                              </div>
                            )}
                            
                            {site.scrapedData.allLinks && site.scrapedData.allLinks.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                  Links Found: {site.scrapedData.allLinks.length}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {site.scrapedData.allLinks.slice(0, 5).map((link, i) => (
                                    <div key={i} className="truncate">
                                      • {link.href}
                                    </div>
                                  ))}
                                  {site.scrapedData.allLinks.length > 5 && (
                                    <div className="text-gray-500">... and {site.scrapedData.allLinks.length - 5} more</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Data Download */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Export Results</h3>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(results, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `search-results-${Date.now()}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  📥 Download JSON Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 