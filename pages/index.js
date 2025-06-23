import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [maxProfiles, setMaxProfiles] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setLogs([]);

    addLog('Starting LinkedIn profile scraping...', 'info');
    addLog(`Search query: "${searchQuery}"`, 'info');
    addLog(`Max profiles: ${maxProfiles}`, 'info');

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search_query: searchQuery,
          max_profiles: maxProfiles
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape profiles');
      }

      addLog(`Successfully scraped ${data.data.length} profiles`, 'success');
      setResults(data);

    } catch (err) {
      addLog(`Error: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResults = () => {
    if (!results) return;

    const csvContent = [
      ['Name', 'Title', 'Company', 'Location', 'Profile URL', 'Image URL', 'Extracted At'],
      ...results.data.map(profile => [
        profile.name,
        profile.title,
        profile.company,
        profile.location,
        profile.profileUrl,
        profile.imageUrl,
        profile.extractedAt
      ])
    ].map(row => row.map(field => `"${field || ''}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-profiles-${searchQuery.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>LinkedIn Profile Scraper - B2B Lead Generation</title>
        <meta name="description" content="High-quality LinkedIn profile scraper for B2B lead generation" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LinkedIn Profile Scraper
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate high-quality B2B lead lists from LinkedIn search results. 
            Extract professional profiles based on roles, companies, or industries.
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <input
                type="text"
                id="searchQuery"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., real estate agents in Miami, software engineers at Google"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="maxProfiles" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Profiles (1-100)
              </label>
              <input
                type="number"
                id="maxProfiles"
                value={maxProfiles}
                onChange={(e) => setMaxProfiles(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                min="1"
                max="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Scraping Profiles...
                </div>
              ) : (
                'Start Scraping'
              )}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Scraped Profiles ({results.data.length})
                </h2>
                <button
                  onClick={downloadResults}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Download CSV
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.data.map((profile, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      {profile.imageUrl && (
                        <img
                          src={profile.imageUrl}
                          alt={profile.name}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {profile.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {profile.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {profile.company}
                        </p>
                        {profile.location && (
                          <p className="text-xs text-gray-400 truncate">
                            📍 {profile.location}
                          </p>
                        )}
                      </div>
                    </div>
                    {profile.profileUrl && (
                      <a
                        href={profile.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800"
                      >
                        View Profile →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logs Display */}
        {logs.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Activity Logs</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-gray-400 text-xs">{log.timestamp}</span>
                    <span className={`text-sm ${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-gray-300'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            Built with ❤️ for B2B lead generation | 
            <a href="https://github.com/Nadavlistingsync/Datascrapper" 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-blue-600 hover:text-blue-800 ml-1">
              View on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
} 