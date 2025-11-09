'use client';

import { useState } from 'react';

interface Feature {
  name: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  rice_score?: number;
}

export default function TestRicePage() {
  const [features, setFeatures] = useState<Feature[]>([
    { name: 'AI FAQ chatbot', reach: 8000, impact: 2.0, confidence: 0.6, effort: 20 },
    { name: 'Simplified course registration flow', reach: 12000, impact: 3.0, confidence: 0.8, effort: 30 },
    { name: 'Smart alerts for assignment deadlines', reach: 15000, impact: 2.5, confidence: 0.7, effort: 15 },
  ]);

  const [loading, setLoading] = useState(false);
  const [sortedFeatures, setSortedFeatures] = useState<Feature[]>([]);
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState('');

  const analyzeFeatures = async () => {
    setLoading(true);
    setError('');
    setSortedFeatures([]);
    setAnalysis('');

    try {
      const response = await fetch('/api/agents/rice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features }),
      });

      const data = await response.json();

      if (data.success) {
        setSortedFeatures(data.sortedFeatures);
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Failed to analyze features');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateFeature = (index: number, field: keyof Feature, value: string | number) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFeatures(newFeatures);
  };

  const addFeature = () => {
    setFeatures([
      ...features,
      { name: 'New Feature', reach: 1000, impact: 1.0, confidence: 0.5, effort: 10 },
    ]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">RICE Prioritization Tool</h1>
        <p className="text-gray-600 mb-8">
          Calculate RICE scores to prioritize product features. RICE = (Reach × Impact × Confidence) / Effort
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Features to Prioritize</h2>
                <button
                  onClick={addFeature}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  + Add Feature
                </button>
              </div>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <input
                        type="text"
                        value={feature.name}
                        onChange={(e) => updateFeature(index, 'name', e.target.value)}
                        className="font-medium text-lg border-0 bg-transparent focus:ring-0 p-0 w-full"
                        placeholder="Feature name"
                      />
                      <button
                        onClick={() => removeFeature(index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Reach (users/period)
                        </label>
                        <input
                          type="number"
                          value={feature.reach}
                          onChange={(e) => updateFeature(index, 'reach', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Impact (0.25-3)
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          value={feature.impact}
                          onChange={(e) => updateFeature(index, 'impact', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Confidence (0-1)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          max="1"
                          min="0"
                          value={feature.confidence}
                          onChange={(e) => updateFeature(index, 'confidence', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Effort (person-months)
                        </label>
                        <input
                          type="number"
                          value={feature.effort}
                          onChange={(e) => updateFeature(index, 'effort', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={analyzeFeatures}
                disabled={loading || features.length === 0}
                className="mt-4 w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? 'Analyzing...' : 'Calculate RICE Scores'}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* RICE Score Guide */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-3">RICE Scoring Guide</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <strong>Reach:</strong> Number of people affected per time period (e.g., users per quarter)
                </div>
                <div>
                  <strong>Impact:</strong> How much it helps (3=massive, 2=high, 1=medium, 0.5=low, 0.25=minimal)
                </div>
                <div>
                  <strong>Confidence:</strong> How certain you are (100% = 1.0, 80% = 0.8, 50% = 0.5)
                </div>
                <div>
                  <strong>Effort:</strong> Total person-months or story points required
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <strong>Formula:</strong> RICE = (Reach × Impact × Confidence) / Effort
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {sortedFeatures.length > 0 && (
              <>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Prioritized Features</h2>
                  <div className="space-y-3">
                    {sortedFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          index === 0
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">#{index + 1}</span>
                              <h3 className="font-semibold text-lg">{feature.name}</h3>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {feature.rice_score?.toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500">RICE Score</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-3 text-sm">
                          <div className="bg-white p-2 rounded">
                            <div className="text-xs text-gray-600">Reach</div>
                            <div className="font-semibold">{feature.reach.toLocaleString()}</div>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <div className="text-xs text-gray-600">Impact</div>
                            <div className="font-semibold">{feature.impact}</div>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <div className="text-xs text-gray-600">Confidence</div>
                            <div className="font-semibold">{(feature.confidence * 100).toFixed(0)}%</div>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <div className="text-xs text-gray-600">Effort</div>
                            <div className="font-semibold">{feature.effort}pm</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">AI Analysis</h2>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">{analysis}</div>
                  </div>
                </div>
              </>
            )}

            {!sortedFeatures.length && !loading && (
              <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p>Results will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
