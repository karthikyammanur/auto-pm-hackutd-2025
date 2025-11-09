'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Feature {
  name: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  rice_score?: number;
}

interface RiceAgentData {
  features?: Feature[];
  sortedFeatures?: Feature[];
  analysis?: string;
  generatedAt?: string;
}

interface RiceAgentViewProps {
  spaceId: string;
  selectedSolution: string | null;
  riceAgentData: RiceAgentData | null;
  onComplete: () => void;
  isViewingPastStep?: boolean;
}

export default function RiceAgentView({
  spaceId,
  selectedSolution,
  riceAgentData,
  onComplete,
  isViewingPastStep
}: RiceAgentViewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [data, setData] = useState<RiceAgentData | null>(riceAgentData);
  const [error, setError] = useState<string | null>(null);

  const handleRunAgent = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch(`/api/spaces/${spaceId}/run-rice-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run RICE agent');
      }

      const result = await response.json();
      setData(result.data);
      onComplete();
    } catch (err) {
      console.error('Error running RICE agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to run RICE agent');
    } finally {
      setIsRunning(false);
    }
  };

  // Block user if no solution is selected
  if (!selectedSolution && !data) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm text-center" style={{ border: '1px solid #E5E5E5' }}>
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <svg className="w-8 h-8" style={{ color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
          Solution Required
        </h3>
        <p className="text-sm mb-6" style={{ color: '#6B6B6B' }}>
          You need to select a solution in Step 1 before you can generate RICE analysis.
        </p>
        <a
          href={`/space/${spaceId}?step=1`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200"
          style={{
            backgroundColor: '#9B6B7A',
            color: '#FFFFFF',
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go Back to Idea Generation
        </a>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        {/* Run Agent Card */}
        <div className="bg-white rounded-lg p-8 shadow-sm" style={{ border: '1px solid #E5E5E5' }}>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(155, 107, 122, 0.08)' }}>
              <svg className="w-8 h-8" style={{ color: '#9B6B7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                RICE Priority Analysis
              </h3>
              <p className="text-sm" style={{ color: '#6B6B6B' }}>
                Generate feature breakdown with RICE scoring (Reach, Impact, Confidence, Effort) based on your selected solution.
              </p>
            </div>
          </div>

          {/* Selected Solution Preview */}
          {selectedSolution && (
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#FAFAFA', border: '1px solid #E5E5E5' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#6B6B6B' }}>
                Selected Solution:
              </p>
              <p className="text-sm" style={{ color: '#1A1A1A' }}>
                {selectedSolution}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444' }}>
              <p className="text-sm" style={{ color: '#991B1B' }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleRunAgent}
            disabled={isRunning}
            className="w-full px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: isRunning ? '#9CA3AF' : '#9B6B7A',
              color: '#FFFFFF',
            }}
          >
            {isRunning ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Solution...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate RICE Analysis
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Calculate highest RICE score
  const highestScore = data.sortedFeatures?.[0]?.rice_score || 0;

  return (
    <>
      <div className="space-y-6">
        {/* Viewing Past Step Banner */}
        {isViewingPastStep && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" style={{ color: '#3B82F6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm" style={{ color: '#1E40AF' }}>
              You're viewing a completed step.
            </p>
          </div>
        )}

        {/* RICE Score Card - Prominent Display */}
        <div 
          className="rounded-2xl p-8 shadow-lg text-white text-center"
          style={{
            background: 'linear-gradient(135deg, #9B6B7A 0%, #8A5A69 100%)',
          }}
        >
          <p className="text-base font-medium mb-2" style={{ opacity: 0.9 }}>
            Highest Priority RICE Score
          </p>
          <div className="text-6xl font-bold my-4">
            {highestScore.toFixed(1)}
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            High Priority
          </div>
          {data.sortedFeatures?.[0] && (
            <p className="text-sm mt-4" style={{ opacity: 0.9 }}>
              Top Feature: <span className="font-semibold">{data.sortedFeatures[0].name}</span>
            </p>
          )}
        </div>

        {/* Feature Breakdown Grid */}
        <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #E5E5E5' }}>
          <div className="p-6 border-b" style={{ borderColor: '#E5E5E5' }}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                  Feature Prioritization
                </h2>
                {data.generatedAt && (
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    Generated {new Date(data.generatedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                Analysis Complete
              </div>
            </div>
          </div>

          {/* Features Table */}
          <div className="p-6">
            <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid #E5E5E5' }}>
              <table className="w-full">
                <thead style={{ backgroundColor: '#FAFAFA' }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#6B6B6B' }}>Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#6B6B6B' }}>Feature</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: '#6B6B6B' }}>Reach</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: '#6B6B6B' }}>Impact</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: '#6B6B6B' }}>Confidence</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: '#6B6B6B' }}>Effort</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: '#6B6B6B' }}>RICE Score</th>
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: '#FFFFFF' }}>
                  {data.sortedFeatures?.map((feature, index) => (
                    <tr key={index} className="border-t" style={{ borderColor: '#E5E5E5' }}>
                      <td className="px-4 py-4 text-center">
                        <div 
                          className="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-semibold"
                          style={{
                            backgroundColor: index === 0 ? '#9B6B7A' : 'rgba(155, 107, 122, 0.08)',
                            color: index === 0 ? '#FFFFFF' : '#9B6B7A',
                          }}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                          {feature.name}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-sm" style={{ color: '#6B6B6B' }}>
                          {feature.reach.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(Math.floor(feature.impact))].map((_, i) => (
                            <svg key={i} className="w-4 h-4" style={{ color: '#10B981' }} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-sm" style={{ color: '#6B6B6B' }}>
                          {Math.round(feature.confidence * 100)}%
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-sm" style={{ color: '#6B6B6B' }}>
                          {feature.effort}w
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-base font-semibold" style={{ color: '#1A1A1A' }}>
                          {feature.rice_score?.toFixed(1)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Analysis Section */}
          {data.analysis && (
            <div className="p-6 border-t" style={{ borderColor: '#E5E5E5', backgroundColor: '#FAFAFA' }}>
              <h3 className="text-base font-semibold mb-4" style={{ color: '#1A1A1A' }}>
                RICE Analysis Summary
              </h3>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 className="text-xl font-bold mb-3" style={{ color: '#1A1A1A' }} {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-lg font-semibold mb-3" style={{ color: '#1A1A1A' }} {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-base font-semibold mb-2" style={{ color: '#1A1A1A' }} {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="text-sm leading-relaxed mb-4" style={{ color: '#1A1A1A' }} {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc list-inside mb-4 space-y-2" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="text-sm" style={{ color: '#1A1A1A' }} {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong className="font-semibold" style={{ color: '#9B6B7A' }} {...props} />
                    ),
                    em: ({ node, ...props }) => (
                      <em className="italic" style={{ color: '#6B6B6B' }} {...props} />
                    ),
                    code: ({ node, ...props }) => (
                      <code
                        className="px-1.5 py-0.5 rounded text-xs font-mono"
                        style={{ backgroundColor: '#F5F5F7', color: '#9B6B7A' }}
                        {...props}
                      />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className="border-l-4 pl-4 py-2 my-4 italic"
                        style={{ borderColor: '#9B6B7A', backgroundColor: '#FAFAFA' }}
                        {...props}
                      />
                    ),
                  }}
                >
                  {data.analysis}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

