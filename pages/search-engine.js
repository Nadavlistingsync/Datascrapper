import { useState } from 'react';
import Head from 'next/head';

export default function SearchEngine() {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(20);
  const [searchEngines, setSearchEngines] = useState(['google', 'bing']);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const exampleQueries = [
    "find me 100 leads for my SMMA company",
    "find business owners in New York who need marketing help",
    "find restaurants in Los Angeles that need social media management",
    "find real estate agents in Miami who need lead generation",
    "find local businesses in Chicago that need website design",
    "find dentists in Austin who need digital marketing",
    "find fitness trainers in Denver who need online presence",
    "find lawyers in Seattle who need SEO services"
  ];

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

  const handleExampleClick = (example) => {
    setQuery(example);
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
        <title>AI Lead Finder - Find Business Leads Automatically</title>
        <meta name="description" content="Find business leads automatically with AI-powered search and scraping" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🤖 AI Lead Finder
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Tell me what leads you need, and I'll find them automatically
            </p>
            <p className="text-sm text-gray-500">
              Works for SMMA, real estate, local businesses, and more
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Search Query */}
              <div>
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                  What leads do you need?
                </label>
                <input
                  type="text"
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., find me 100 leads for my SMMA company"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  disabled={isLoading}
                />
              </div>

              {/* Example Queries */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Try these examples:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {exampleQueries.map((example, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleExampleClick(example)}
                      className="text-left p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    >
                      💡 {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Engines */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Sources
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
                  Number of Leads to Find
                </label>
                <select
                  id="maxResults"
                  value={maxResults}
                  onChange={(e) => setMaxResults(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>10 leads</option>
                  <option value={20}>20 leads</option>
                  <option value={50}>50 leads</option>
                  <option value={100}>100 leads</option>
                  <option value={200}>200 leads</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Finding your leads...
                  </span>
                ) : (
                  '🚀 Find My Leads'
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Lead Search Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-medium text-blue-900">Your Request</div>
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
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="font-medium text-orange-900">Total Data</div>
                    <div className="text-orange-700">{results.scrapedSites.reduce((acc, site) => acc + (site.scrapedData?.allLinks?.length || 0), 0)} links</div>
                  </div>
                </div>
              </div>

              {/* Scraped Sites */}
              {results.scrapedSites.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Potential Lead Sources</h3>
                  <div className="space-y-4">
                    {results.scrapedSites.map((site, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-lg font-medium text-blue-600 hover:text-blue-800">
                            <a href={site.url} target="_blank" rel="noopener noreferrer">
                              {site.title || site.url}
                            </a>
                          </h4>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Source: {site.searchEngine}
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
                                  Potential Contact Links: {site.scrapedData.allLinks.length}
                                </div>
                                <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                                  {site.scrapedData.allLinks.slice(0, 8).map((link, i) => (
                                    <div key={i} className="truncate">
                                      • {link.href}
                                    </div>
                                  ))}
                                  {site.scrapedData.allLinks.length > 8 && (
                                    <div className="text-gray-500">... and {site.scrapedData.allLinks.length - 8} more</div>
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

              {/* Export Results */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📥 Export Your Leads</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(results, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `leads-${Date.now()}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📄 Download Full Data (JSON)
                  </button>
                  <button
                    onClick={() => {
                      const csvContent = [
                        ['Website', 'Title', 'URL', 'Search Engine', 'Links Found'],
                        ...results.scrapedSites.map(site => [
                          site.url,
                          site.title || 'No title',
                          site.url,
                          site.searchEngine,
                          site.scrapedData?.allLinks?.length || 0
                        ])
                      ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
                      
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `leads-summary-${Date.now()}.csv`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📊 Download Summary (CSV)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 