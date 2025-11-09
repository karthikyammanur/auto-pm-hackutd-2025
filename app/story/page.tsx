'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function StoryGeneratorPage() {
  const [epic, setEpic] = useState('');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState('');
  const [error, setError] = useState('');

  const generateStory = async () => {
    if (!epic.trim()) {
      setError('Please enter an epic description');
      return;
    }

    setLoading(true);
    setError('');
    setStory('');

    try {
      const response = await fetch('/api/agents/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ epic }),
      });

      const data = await response.json();

      if (data.success) {
        setStory(data.story);
      } else {
        setError(data.error || 'Failed to generate story');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exampleEpics = [
    'As a university, we want to provide students with an AI-powered FAQ chatbot that can answer common questions about courses, registration, and campus services, so that we can reduce support ticket volume and improve student satisfaction.',
    'As an e-commerce platform, we want to implement a personalized product recommendation engine that suggests items based on browsing history and purchase patterns, so that we can increase average order value and customer engagement.',
    'As a fitness app, we want to add a social sharing feature that allows users to share their workout achievements with friends and compete on leaderboards, so that we can improve user retention and create a community around the app.',
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">User Story Generator</h1>
        <p className="text-gray-600 mb-8">
          Generate comprehensive user stories with acceptance criteria, NFRs, and telemetry plans from epic descriptions
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium mb-2">
                Epic Description
              </label>
              <textarea
                value={epic}
                onChange={(e) => setEpic(e.target.value)}
                placeholder="Enter your epic description (As a..., we want..., so that...)"
                className="w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />

              <button
                onClick={generateStory}
                disabled={loading}
                className="mt-4 w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? 'Generating...' : 'Generate User Story'}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Example Epics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-medium mb-3">Example Epics</h3>
              <div className="space-y-2">
                {exampleEpics.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setEpic(example)}
                    className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* What's Included Guide */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-3">What's Included</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <div>
                    <strong>User Story:</strong> Clear As a..., I want..., so that... format
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <div>
                    <strong>Acceptance Criteria:</strong> 4-6 criteria in Gherkin format (Given, When, Then)
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <div>
                    <strong>Non-Functional Requirements:</strong> Performance, Reliability, and UX requirements
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <div>
                    <strong>Telemetry Plan:</strong> 3 events with properties and questions they answer
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {story ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Generated User Story</h2>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(story);
                      alert('Story copied to clipboard!');
                    }}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                  >
                    Copy Markdown
                  </button>
                </div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mt-6 mb-3 text-gray-900">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold mt-5 mb-2 text-gray-800">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3 text-gray-700 leading-relaxed">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-700 ml-4">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900">{children}</strong>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-blue-600">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {story}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg
                    className="mx-auto h-12 w-12 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p>User story will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
