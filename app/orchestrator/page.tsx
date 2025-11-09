'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ComprehensiveAnalysis {
  metadata: {
    input_prompt: string;
    generated_at: string;
    sources_used: string[];
  };
  customer_feedback: any;
  okr: any[];
  industry_news: any;
  competitor_insights: any;
}

export default function OrchestratorPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ComprehensiveAnalysis | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'overview' | 'feedback' | 'okr' | 'news' | 'competitors' | 'json'>('overview');
  
  // Q&A chat state
  const [chatHistory, setChatHistory] = useState<{question: string, answer: string}[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  const analyzePrompt = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('/api/agents/orchestrator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();

      if (result.success) {
        setAnalysis(result.data);
        setActiveTab('overview');
      } else {
        setError(result.error || 'Failed to complete analysis');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const examplePrompts = [
    'AI-powered customer support chatbot',
    'Mobile fitness tracking application',
    'SaaS project management platform',
    'E-commerce marketplace for handmade goods',
    'Cloud-based video conferencing tool',
  ];

  const downloadJSON = () => {
    if (!analysis) return;
    const dataStr = JSON.stringify(analysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const askQuestion = async () => {
    if (!currentQuestion.trim() || !analysis) return;

    setIsAnswering(true);
    const question = currentQuestion;
    setCurrentQuestion('');

    try {
      const response = await fetch('/api/agents/orchestrator/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          analysisData: analysis,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setChatHistory([...chatHistory, {
          question,
          answer: result.answer,
        }]);
      } else {
        setChatHistory([...chatHistory, {
          question,
          answer: `Error: ${result.error || 'Failed to get answer'}`,
        }]);
      }
    } catch (err) {
      setChatHistory([...chatHistory, {
        question,
        answer: `Error: ${err instanceof Error ? err.message : 'An error occurred'}`,
      }]);
    } finally {
      setIsAnswering(false);
    }
  };

  const suggestedQuestions = [
    'What are the most critical customer pain points?',
    'How do we compare to our competitors?',
    'Which OKRs align best with this product?',
    'What are the biggest risks we should be aware of?',
    'How can I pitch this to stakeholders?',
  ];

  // Colors for charts
  const COLORS = {
    positive: '#10B981',
    neutral: '#6B7280',
    negative: '#EF4444',
    primary: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'],
  };

  // Helper to check if a string is a URL
  const isURL = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Comprehensive Analysis Orchestrator</h1>
          <p className="text-gray-600">
            Combines OKR, customer feedback, industry news, and competitor insights into structured JSON
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <label className="block text-sm font-medium mb-2">
            Product or Idea to Analyze
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., AI-powered customer support chatbot"
            className="w-full h-24 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />

          <div className="flex gap-2 mt-4">
            <button
              onClick={analyzePrompt}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing (this may take 30-60s)...
                </span>
              ) : (
                'Generate Comprehensive Analysis'
              )}
            </button>
            {analysis && (
              <button
                onClick={downloadJSON}
                className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 font-medium transition-colors"
              >
                Download JSON
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Example Prompts */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Examples:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  disabled={loading}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {analysis && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto">
                {[
                  { id: 'summary', label: 'Summary', icon: '💡' },
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'feedback', label: 'Customer Feedback', icon: '💬' },
                  { id: 'okr', label: 'OKR Alignment', icon: '🎯' },
                  { id: 'news', label: 'Industry News', icon: '📰' },
                  { id: 'competitors', label: 'Competitors', icon: '🏆' },
                  { id: 'json', label: 'Raw JSON', icon: '{ }' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold mb-4">AI Summary Assistant</h2>
                  <p className="text-gray-600 mb-6">
                    Ask questions about your analysis data. The AI will use the comprehensive data to provide insights and recommendations.
                  </p>

                  {/* Chat History */}
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto mb-4">
                    {chatHistory.length === 0 ? (
                      <div className="text-center text-gray-500 mt-20">
                        <p className="text-lg mb-4">No questions asked yet. Try one of the suggestions below!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatHistory.map((msg, i) => (
                          <div key={i} className="space-y-3">
                            <div className="flex justify-end">
                              <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-[80%]">
                                <p className="text-sm">{msg.question}</p>
                              </div>
                            </div>
                            <div className="flex justify-start">
                              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 max-w-[80%]">
                                <div className="text-sm prose prose-sm max-w-none">
                                  <ReactMarkdown>{msg.answer}</ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {isAnswering && (
                          <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                <span className="text-sm text-gray-600">Thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Suggested Questions */}
                  {chatHistory.length === 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Suggested Questions:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.map((question, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentQuestion(question)}
                            disabled={isAnswering}
                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-md transition-colors disabled:opacity-50"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !isAnswering && askQuestion()}
                      placeholder="Ask a question about the analysis..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isAnswering}
                    />
                    <button
                      onClick={askQuestion}
                      disabled={!currentQuestion.trim() || isAnswering}
                      className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {isAnswering ? 'Asking...' : 'Ask'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Analysis Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium">Sources Used</div>
                        <div className="text-2xl font-bold text-blue-900">{analysis.metadata.sources_used.length}</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-600 font-medium">Feedback Count</div>
                        <div className="text-2xl font-bold text-green-900">{analysis.customer_feedback.total_feedback_count}</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-purple-600 font-medium">OKRs Analyzed</div>
                        <div className="text-2xl font-bold text-purple-900">{analysis.okr.length}</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-sm text-orange-600 font-medium">Competitors</div>
                        <div className="text-2xl font-bold text-orange-900">{analysis.competitor_insights.competitor_count}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sentiment Pie Chart */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-4">Sentiment Distribution</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Positive', value: analysis.customer_feedback.sentiment_breakdown.positive },
                              { name: 'Neutral', value: analysis.customer_feedback.sentiment_breakdown.neutral },
                              { name: 'Negative', value: analysis.customer_feedback.sentiment_breakdown.negative },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill={COLORS.positive} />
                            <Cell fill={COLORS.neutral} />
                            <Cell fill={COLORS.negative} />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* OKR Alignment Chart */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-4">OKR Alignment Scores</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={analysis.okr.slice(0, 5)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 1]} />
                          <Tooltip />
                          <Bar dataKey="alignment_score" fill="#8B5CF6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Data Sources with Links */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Data Sources</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.metadata.sources_used.map((source: string, i: number) => (
                        <span key={i} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'feedback' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Customer Feedback Analysis</h2>

                  {/* Theme Mentions Bar Chart */}
                  {analysis.customer_feedback.themes.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-4">Theme Mentions</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analysis.customer_feedback.themes} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="mention_count" fill="#3B82F6">
                            {analysis.customer_feedback.themes.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {analysis.customer_feedback.themes.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Key Themes</h3>
                      <div className="grid gap-3">
                        {analysis.customer_feedback.themes.map((theme: any, i: number) => (
                          <div key={i} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{theme.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
                              </div>
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{theme.mention_count} mentions</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.customer_feedback.top_pain_points.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Top Pain Points</h3>
                      <div className="space-y-2">
                        {analysis.customer_feedback.top_pain_points.map((pain: any, i: number) => (
                          <div key={i} className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                            <div className="flex justify-between items-start">
                              <p className="text-sm">{pain.summary}</p>
                              <span className={`text-xs px-2 py-1 rounded ${
                                pain.severity === 'High' ? 'bg-red-200 text-red-800' :
                                pain.severity === 'Medium' ? 'bg-orange-200 text-orange-800' :
                                'bg-yellow-200 text-yellow-800'
                              }`}>
                                {pain.severity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer Quotes */}
                  {analysis.customer_feedback.sample_quotes.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Sample Customer Quotes</h3>
                      <div className="grid gap-3">
                        {analysis.customer_feedback.sample_quotes.map((quote: any, i: number) => (
                          <div key={i} className={`p-4 rounded-lg border-l-4 ${
                            quote.sentiment === 'positive' ? 'bg-green-50 border-green-500' :
                            quote.sentiment === 'negative' ? 'bg-red-50 border-red-500' :
                            'bg-gray-50 border-gray-500'
                          }`}>
                            <p className="text-sm italic mb-2">&quot;{quote.quote}&quot;</p>
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Segment: {quote.segment}</span>
                              <span className="capitalize">{quote.sentiment}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source URLs */}
                  {analysis.customer_feedback.source_urls && analysis.customer_feedback.source_urls.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Research Sources</h3>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="space-y-2">
                          {analysis.customer_feedback.source_urls.map((url: string, i: number) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span className="truncate">{url}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'okr' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">OKR Alignment Analysis</h2>
                  {analysis.okr.map((item: any, i: number) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{item.title}</h3>
                        <span className={`px-3 py-1 rounded text-sm ${
                          item.alignment === 'High' ? 'bg-green-100 text-green-800' :
                          item.alignment === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          item.alignment === 'Low' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.alignment} Alignment
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.rationale}</p>
                      <div className="flex gap-2">
                        {item.primary_okrs.map((okr: string, j: number) => (
                          <span key={j} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{okr}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'news' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Industry News & Trends</h2>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between">
                      <span>Article Count: <strong>{analysis.industry_news.article_count}</strong></span>
                      <span>Time Window: <strong>{analysis.industry_news.time_window_days} days</strong></span>
                    </div>
                  </div>

                  {/* Topic Trends Line Chart */}
                  {analysis.industry_news.top_topics.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-4">Topic Trends</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analysis.industry_news.top_topics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="topic" tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                          <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="mention_count" fill="#3B82F6" name="Mentions" />
                          <Bar yAxisId="right" dataKey="trend_change_percent" fill="#10B981" name="Trend %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {analysis.industry_news.top_topics.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Top Topics</h3>
                      <div className="space-y-2">
                        {analysis.industry_news.top_topics.map((topic: any, i: number) => (
                          <div key={i} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{topic.topic}</span>
                              <div className="flex gap-3 text-sm">
                                <span className="text-gray-600">{topic.mention_count} mentions</span>
                                <span className={topic.trend_change_percent > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {topic.trend_change_percent > 0 ? '↑' : '↓'} {Math.abs(topic.trend_change_percent).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* News Sources */}
                  {analysis.industry_news.sources_summary.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">News Sources</h3>
                      <div className="grid gap-2">
                        {analysis.industry_news.sources_summary.map((source: any, i: number) => (
                          <div key={i} className="bg-white p-3 rounded-lg flex justify-between items-center">
                            <span className="text-sm font-medium">{source.source}</span>
                            <div className="flex gap-4 text-xs">
                              <span className="text-gray-600">{source.article_count} articles</span>
                              <span className={source.avg_sentiment_score > 0 ? 'text-green-600' : 'text-red-600'}>
                                Sentiment: {source.avg_sentiment_score.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source URLs */}
                  {analysis.industry_news.source_urls && analysis.industry_news.source_urls.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Research Sources</h3>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="space-y-2">
                          {analysis.industry_news.source_urls.map((url: string, i: number) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span className="truncate">{url}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'competitors' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Competitor Insights</h2>

                  {/* Competitor Radar Chart */}
                  {analysis.competitor_insights.competitors.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-4">Competitor Comparison</h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={analysis.competitor_insights.competitors.slice(0, 6).map((comp: any) => ({
                          competitor: comp.competitor_name.substring(0, 15),
                          Growth: comp.growth_rate_percent,
                          Launches: comp.recent_launches_count * 10,
                          Mentions: comp.share_of_mentions_percent,
                          Sentiment: (comp.user_sentiment_score + 1) * 50,
                        }))}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="competitor" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar name="Metrics" dataKey="Growth" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                          <Radar name="Launches" dataKey="Launches" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                          <Radar name="Mentions" dataKey="Mentions" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                          <Radar name="Sentiment" dataKey="Sentiment" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                          <Tooltip />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Market Share Pie Chart */}
                  {analysis.competitor_insights.competitors.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-4">Share of Mentions</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analysis.competitor_insights.competitors.map((comp: any) => ({
                              name: comp.competitor_name,
                              value: comp.share_of_mentions_percent,
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name.substring(0, 15)}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analysis.competitor_insights.competitors.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {analysis.competitor_insights.competitors.map((comp: any, i: number) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{comp.competitor_name}</h3>
                        <span className={`px-3 py-1 rounded text-sm ${
                          comp.impact_level === 'High' ? 'bg-red-100 text-red-800' :
                          comp.impact_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {comp.impact_level} Impact
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{comp.activity_summary}</p>
                      <p className="text-sm text-gray-600 mb-3"><strong>Focus:</strong> {comp.strategic_focus}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="bg-white p-2 rounded">
                          <div className="text-gray-600">Growth</div>
                          <div className="font-semibold">{comp.growth_rate_percent}%</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="text-gray-600">Launches</div>
                          <div className="font-semibold">{comp.recent_launches_count}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="text-gray-600">Mentions</div>
                          <div className="font-semibold">{comp.share_of_mentions_percent}%</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="text-gray-600">Sentiment</div>
                          <div className="font-semibold">{comp.user_sentiment_score.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Trend Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <h3 className="font-semibold mb-2 text-green-900">Rising Competitors</h3>
                      <div className="space-y-1">
                        {analysis.competitor_insights.trend_summary.rising_competitors.map((comp: string, i: number) => (
                          <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                            <span className="text-green-600">↗</span>
                            {comp}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                      <h3 className="font-semibold mb-2 text-red-900">Declining Competitors</h3>
                      <div className="space-y-1">
                        {analysis.competitor_insights.trend_summary.declining_competitors.map((comp: string, i: number) => (
                          <div key={i} className="text-sm text-red-800 flex items-center gap-2">
                            <span className="text-red-600">↘</span>
                            {comp}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Source URLs */}
                  {analysis.competitor_insights.source_urls && analysis.competitor_insights.source_urls.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Research Sources</h3>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="space-y-2">
                          {analysis.competitor_insights.source_urls.map((url: string, i: number) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span className="truncate">{url}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'json' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Raw JSON Data</h2>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
                        alert('JSON copied to clipboard!');
                      }}
                      className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-sm transition-colors"
                    >
                      Copy JSON
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(analysis, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
