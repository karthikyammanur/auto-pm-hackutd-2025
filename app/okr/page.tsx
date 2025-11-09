'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function OKRAnalysisPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [chatHistory, setChatHistory] = useState<{ question: string; answer: string }[]>([]);

  const analyzeQuestion = async (questionToAsk?: string) => {
    const currentQuestion = questionToAsk || question;

    if (!currentQuestion.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError('');
    setAnswer('');

    try {
      const response = await fetch('/api/agents/okr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: currentQuestion }),
      });

      const data = await response.json();

      if (data.success) {
        setAnswer(data.answer);
        setChatHistory([...chatHistory, { question: currentQuestion, answer: data.answer }]);
        setQuestion(''); // Clear input after successful query
      } else {
        setError(data.error || 'Failed to analyze question');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSummary = async () => {
    setLoading(true);
    setError('');
    setAnswer('');

    try {
      const response = await fetch('/api/agents/okr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'summary' }),
      });

      const data = await response.json();

      if (data.success) {
        setAnswer(data.answer);
        setChatHistory([...chatHistory, { question: 'Document Summary', answer: data.answer }]);
      } else {
        setError(data.error || 'Failed to generate summary');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exampleQuestions = [
    'What are the main objectives for Q1 2025?',
    'What are the key results for the Engineering department?',
    'What is the target for customer acquisition?',
    'Which teams or departments are mentioned in the document?',
    'What are the success metrics for product development?',
    'What is the timeline for achieving these OKRs?',
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">OKR Document Analysis</h1>
          <p className="text-gray-600">
            Ask questions about the NextWave Technologies Q1 2025 OKR document using AI-powered RAG
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Question Input */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Ask a Question</h2>

              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    analyzeQuestion();
                  }
                }}
                placeholder="What are the Engineering objectives?"
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => analyzeQuestion()}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors text-sm"
                >
                  {loading ? 'Analyzing...' : 'Ask Question'}
                </button>
                <button
                  onClick={getSummary}
                  disabled={loading}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors text-sm"
                  title="Get full document summary"
                >
                  Summary
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Example Questions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-medium mb-3 text-sm">Example Questions</h3>
              <div className="space-y-2">
                {exampleQuestions.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuestion(example);
                      analyzeQuestion(example);
                    }}
                    disabled={loading}
                    className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <strong>RAG-Powered:</strong> This agent uses Retrieval Augmented Generation to find relevant information from the OKR document and provide accurate, context-aware answers.
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Answer Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {answer ? 'Answer' : chatHistory.length > 0 ? 'Previous Conversations' : 'Results'}
                </h2>
                {answer && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(answer);
                      alert('Answer copied to clipboard!');
                    }}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                  >
                    Copy
                  </button>
                )}
              </div>

              {/* Current Answer */}
              {answer ? (
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
                    {answer}
                  </ReactMarkdown>
                </div>
              ) : chatHistory.length > 0 ? (
                // Chat History
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {chatHistory.map((chat, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="bg-blue-50 rounded-lg p-3 mb-2">
                        <p className="text-sm font-medium text-blue-900">Q: {chat.question}</p>
                      </div>
                      <div className="pl-3">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{chat.answer}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Empty State
                <div className="h-96 flex items-center justify-center text-gray-400">
                  <div className="text-center">
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
                    <p className="text-lg font-medium">No questions asked yet</p>
                    <p className="text-sm mt-1">Ask a question or try an example</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
