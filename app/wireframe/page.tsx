'use client';

import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';

export default function TestWireframePage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const generateWireframe = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setHtml('');

    try {
      const response = await fetch('/api/agents/wireframe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data.success) {
        setHtml(data.html);
      } else {
        setError(data.error || 'Failed to generate wireframe');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportAsImage = async () => {
    try {
      // Create a temporary div to render the HTML content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.width = '1200px'; // Fixed width for consistent screenshots

      // Add the HTML content
      tempDiv.innerHTML = html;
      document.body.appendChild(tempDiv);

      // Wait for styles and images to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capture the element
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: 1200,
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `wireframe-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Input Panel */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold mb-1">Wireframe Generator</h1>
          <p className="text-sm text-gray-600">
            Describe your wireframe idea
          </p>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <label className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., Create a landing page with hero section, features, and pricing..."
            className="w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          />

          <button
            onClick={generateWireframe}
            disabled={loading}
            className="mt-4 w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Wireframe'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Preview/Code */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Toggle and Actions */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === 'preview'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  viewMode === 'code'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Code
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          {html && (
            <div className="flex items-center gap-2">
              {viewMode === 'code' && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(html);
                    alert('HTML copied to clipboard!');
                  }}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Code
                </button>
              )}
              {viewMode === 'preview' && (
                <button
                  onClick={exportAsImage}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export as Image
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          {html ? (
            <>
              {viewMode === 'preview' ? (
                <div className="h-full p-6">
                  <div
                    ref={previewContainerRef}
                    className="h-full border border-gray-300 rounded-lg overflow-auto bg-white shadow-sm"
                  >
                    <iframe
                      srcDoc={`
                        <style>
                          body { margin: 0; }
                          a, button, input[type="submit"], input[type="button"] {
                            pointer-events: none !important;
                            cursor: default !important;
                          }
                        </style>
                        ${html}
                      `}
                      className="w-full h-full"
                      title="Wireframe Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full p-6">
                  <div className="h-full bg-gray-900 rounded-lg overflow-auto shadow-sm">
                    <pre className="p-6 text-gray-100 text-sm">
                      <code>{html}</code>
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="mx-auto h-16 w-16 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-lg font-medium">No wireframe generated yet</p>
                <p className="text-sm mt-1">Enter a description and click Generate</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
