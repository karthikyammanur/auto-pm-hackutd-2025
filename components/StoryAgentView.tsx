"use client";

import { useState } from "react";
import ReactMarkdown from 'react-markdown';

interface StoryAgentData {
  storyMarkdown: string;
  generatedAt?: string;
}

interface StoryAgentViewProps {
  spaceId: string;
  selectedSolution: string | null;
  storyAgentData: StoryAgentData | null;
  onComplete: () => void;
  isViewingPastStep?: boolean;
}

export default function StoryAgentView({ 
  spaceId, 
  selectedSolution, 
  storyAgentData, 
  onComplete, 
  isViewingPastStep 
}: StoryAgentViewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [data, setData] = useState<StoryAgentData | null>(storyAgentData);
  const [error, setError] = useState<string | null>(null);
  
  console.log('[StoryAgentView] Received selectedSolution:', selectedSolution);

  const handleRunAgent = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch(`/api/spaces/${spaceId}/run-story-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run story agent');
      }

      const result = await response.json();
      setData(result.data);
      onComplete();
    } catch (err) {
      console.error('Error running story agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to run story agent');
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
          You need to select a solution from the Idea Generation step before you can create a user story.
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
        <div className="bg-white rounded-lg p-8 shadow-sm text-center" style={{ border: '1px solid #E5E5E5' }}>
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(155, 107, 122, 0.08)' }}>
            <svg className="w-8 h-8" style={{ color: '#9B6B7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
            Ready to Create User Story
          </h3>
          <p className="text-sm mb-2" style={{ color: '#6B6B6B' }}>
            Generate a comprehensive user story with acceptance criteria, requirements, and telemetry plan.
          </p>
          
          {/* Selected Solution Preview */}
          <div className="mt-6 mb-6 p-4 rounded-lg text-left" style={{ backgroundColor: '#FAFAFA', border: '1px solid #E5E5E5' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#6B6B6B' }}>
              Selected Solution:
            </p>
            <p className="text-sm" style={{ color: '#1A1A1A' }}>
              {selectedSolution}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444' }}>
              <p className="text-sm" style={{ color: '#991B1B' }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleRunAgent}
            disabled={isRunning}
            className="px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isRunning ? '#9CA3AF' : '#9B6B7A',
              color: '#FFFFFF',
            }}
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Story...
              </span>
            ) : (
              'Generate User Story'
            )}
          </button>
        </div>
      </div>
    );
  }

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

        {/* Story Header */}
        <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #E5E5E5' }}>
          <div className="p-6 border-b" style={{ borderColor: '#E5E5E5' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                  User Story
                </h2>
                {data.generatedAt && (
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    Generated {new Date(data.generatedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                Completed
              </div>
            </div>
          </div>

          {/* Markdown Content */}
          <div className="p-6 prose prose-sm max-w-none" style={{
            '--tw-prose-headings': '#1A1A1A',
            '--tw-prose-body': '#1A1A1A',
            '--tw-prose-bold': '#1A1A1A',
            '--tw-prose-links': '#9B6B7A',
          } as any}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mb-4" style={{ color: '#1A1A1A' }}>{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#1A1A1A' }}>{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2" style={{ color: '#1A1A1A' }}>{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm leading-relaxed mb-3" style={{ color: '#1A1A1A' }}>{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 mb-4">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 mb-4">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm" style={{ color: '#1A1A1A' }}>{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold" style={{ color: '#9B6B7A' }}>{children}</strong>
                ),
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: '#F3F4F6', color: '#1A1A1A' }}>{children}</code>
                ),
              }}
            >
              {data.storyMarkdown}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </>
  );
}

