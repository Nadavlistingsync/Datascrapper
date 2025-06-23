import { useState } from 'react';
import Head from 'next/head';

export default function UniversalScraper() {
  const [url, setUrl] = useState('');
  const [selectors, setSelectors] = useState('');
  const [waitForSelector, setWaitForSelector] = useState('');
  const [scrollToBottom, setScrollToBottom] = useState(false);
  const [maxScrolls, setMaxScrolls] = useState(5);
  const [extractText, setExtractText] = useState(true);
  const [extractLinks, setExtractLinks] = useState(false);
  const [extractImages, setExtractImages] = useState(false);
  const [extractTables, setExtractTables] = useState(false);
  const [customScript, setCustomScript] = useState('');
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
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setLogs([]);

    addLog('Starting universal website scraping...', 'info');
    addLog(`URL: ${url}`, 'info');

    try {
      // Parse selectors
      let parsedSelectors = {};
      if (selectors.trim()) {
        try {
          parsedSelectors = JSON.parse(selectors);
        } catch (e) {
          throw new Error('Invalid selectors JSON format');
        }
      }

      const config = {
        url: url.trim(),
        selectors: parsedSelectors,
        waitForSelector: waitForSelector.trim() || null,
        scrollToBottom,
        maxScrolls,
        delayBetweenScrolls: 2000,
        extractText,
        extractLinks,
        extractImages,
        extractTables,
        customScript: customScript.trim() || null,
        headers: {},
        timeout: 30000
      };

      addLog('Configuration prepared', 'info');
      addLog(`Extract text: ${extractText}`, 'info');
      addLog(`Extract links: ${extractLinks}`, 'info');
      addLog(`Extract images: ${extractImages}`, 'info');
      addLog(`Extract tables: ${extractTables}`, 'info');

      const response = await fetch('/api/universal-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape website');
      }

      addLog(`Scraping completed successfully`, 'success');
      addLog(`Method used: ${data.metadata.method}`, 'info');
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
      ['Field', 'Value'],
      ['URL', results.data.url],
      ['Success', results.data.success],
      ['Timestamp', results.data.timestamp],
      ['Method', results.metadata.method],
      ['', ''],
      ['Extracted Data:', ''],
      ...Object.entries(results.data.data || {}).map(([key, value]) => [
        key,
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      ])
    ].map(row => row.map(field => `"${field || ''}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `website-scrape-${new URL(results.data.url).hostname}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (!results) return;

    const jsonContent = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `website-scrape-${new URL(results.data.url).hostname}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <Head>
        <title>Universal Web Scraper - Extract Data from Any Website</title>
        <meta name="description" content="Universal web scraper for extracting data from any website that allows scraping" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Universal Web Scraper
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Extract data from any website that allows scraping. Use CSS selectors, extract text, links, images, and tables with advanced configuration options.
          </p>
        </div>

        {/* Scraping Form */}
        <div className="max-w-4xl mx-auto mb-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Configuration</h3>
                
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL *
                  </label>
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="selectors" className="block text-sm font-medium text-gray-700 mb-2">
                    CSS Selectors (JSON)
                  </label>
                  <textarea
                    id="selectors"
                    value={selectors}
                    onChange={(e) => setSelectors(e.target.value)}
                    placeholder='{"title": "h1", "content": ".article-content", "author": ".author-name"}'
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter CSS selectors as JSON object</p>
                </div>

                <div>
                  <label htmlFor="waitForSelector" className="block text-sm font-medium text-gray-700 mb-2">
                    Wait for Selector
                  </label>
                  <input
                    type="text"
                    id="waitForSelector"
                    value={waitForSelector}
                    onChange={(e) => setWaitForSelector(e.target.value)}
                    placeholder=".content-loaded"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Advanced Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Advanced Configuration</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={scrollToBottom}
                      onChange={(e) => setScrollToBottom(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">Scroll to bottom</span>
                  </label>

                  {scrollToBottom && (
                    <div>
                      <label htmlFor="maxScrolls" className="block text-sm font-medium text-gray-700 mb-2">
                        Max Scrolls
                      </label>
                      <input
                        type="number"
                        id="maxScrolls"
                        value={maxScrolls}
                        onChange={(e) => setMaxScrolls(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                        min="1"
                        max="20"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Extract Options</h4>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={extractText}
                      onChange={(e) => setExtractText(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">All text content</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={extractLinks}
                      onChange={(e) => setExtractLinks(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">All links</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={extractImages}
                      onChange={(e) => setExtractImages(e.target.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">All images</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={extractTables}
                      onChange={(e) => setExtractTables(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">All tables</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Custom Script */}
            <div className="mt-6">
              <label htmlFor="customScript" className="block text-sm font-medium text-gray-700 mb-2">
                Custom JavaScript (Optional)
              </label>
              <textarea
                id="customScript"
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                placeholder="// Custom JavaScript to execute on the page"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 font-mono text-sm"
                disabled={isLoading}
              />
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Scraping Website...
                  </div>
                ) : (
                  'Start Scraping'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
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
                  Scraping Results
                </h2>
                <div className="space-x-2">
                  <button
                    onClick={downloadResults}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={downloadJSON}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Download JSON
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Metadata */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Metadata</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div><strong>URL:</strong> <a href={results.data.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{results.data.url}</a></div>
                    <div><strong>Success:</strong> <span className={results.data.success ? 'text-green-600' : 'text-red-600'}>{results.data.success ? 'Yes' : 'No'}</span></div>
                    <div><strong>Method:</strong> {results.metadata.method}</div>
                    <div><strong>Timestamp:</strong> {new Date(results.data.timestamp).toLocaleString()}</div>
                  </div>
                </div>

                {/* Extracted Data */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Extracted Data</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(results.data.data, null, 2)}
                    </pre>
                  </div>
                </div>
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
            Universal Web Scraper | Built with ❤️ for data extraction | 
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