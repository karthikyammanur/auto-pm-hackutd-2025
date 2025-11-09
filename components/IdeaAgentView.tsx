"use client";

import { useState } from "react";
import EditProblemModal from "./EditProblemModal";

interface IdeaAgentData {
    title: string;
    summary: string;
    solutions: string[];
    sources: string[];
    selectedSolution?: string;
    generatedAt?: string;
}

interface IdeaAgentViewProps {
    spaceId: string;
    problemStatement: string;
    ideaAgentData: IdeaAgentData | null;
    onComplete: () => void;
    isViewingPastStep?: boolean;
}

export default function IdeaAgentView({ spaceId, problemStatement, ideaAgentData, onComplete, isViewingPastStep }: IdeaAgentViewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [data, setData] = useState<IdeaAgentData | null>(ideaAgentData);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Initialize selectedSolution from saved data in MongoDB
  const [selectedSolution, setSelectedSolution] = useState<number | null>(() => {
    console.log('[IdeaAgentView] Initializing with ideaAgentData:', ideaAgentData);
    if (ideaAgentData?.selectedSolution && ideaAgentData?.solutions) {
      const index = ideaAgentData.solutions.indexOf(ideaAgentData.selectedSolution);
      console.log('[IdeaAgentView] Found selected solution at index:', index, 'Solution:', ideaAgentData.selectedSolution);
      return index !== -1 ? index : null;
    }
    console.log('[IdeaAgentView] No selected solution found');
    return null;
  });

    const handleRunAgent = async (customProblem?: string) => {
        setIsRunning(true);
        setError(null);

        try {
            // If a custom problem is provided, update the space first
            if (customProblem && customProblem !== problemStatement) {
                const updateResponse = await fetch(`/api/spaces/${spaceId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        problemStatement: customProblem,
                    }),
                });

                if (!updateResponse.ok) {
                    throw new Error('Failed to update problem statement');
                }
            }

            const response = await fetch(`/api/spaces/${spaceId}/run-idea-agent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to run idea agent');
            }

            const result = await response.json();
            setData(result.data);
            setIsEditModalOpen(false);
            onComplete();
        } catch (err) {
            console.error('Error running idea agent:', err);
            setError(err instanceof Error ? err.message : 'Failed to run idea agent');
        } finally {
            setIsRunning(false);
        }
    };

    const handleOpenEditModal = () => {
        setIsEditModalOpen(true);
    };

    const handleSaveFromModal = (newProblem: string) => {
        handleRunAgent(newProblem);
    };

    const handleSelectSolution = async (index: number) => {
        setSelectedSolution(index);
        
        const solutionText = data?.solutions[index];
        console.log('[IdeaAgentView] Selecting solution:', solutionText);

        try {
            // Update the space with selected solution
            const response = await fetch(`/api/spaces/${spaceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'ideaAgent.selectedSolution': solutionText,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save selected solution');
            }
            
            const updatedSpace = await response.json();
            console.log('[IdeaAgentView] Selected solution saved to MongoDB:', updatedSpace.ideaAgent?.selectedSolution);
            
            // Reload the page to refresh the space data so other agents can see the selection
            console.log('[IdeaAgentView] Reloading page to refresh space data...');
            window.location.reload();
        } catch (err) {
            console.error('Error saving selected solution:', err);
        }
    };

    if (!data) {
        return (
            <div>
                {/* Run Agent Card */}
                <div className="bg-white rounded-lg p-8 shadow-sm text-center" style={{ border: '1px solid #E5E5E5' }}>
                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(155, 107, 122, 0.08)' }}>
                        <svg className="w-8 h-8" style={{ color: '#9B6B7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                        Ready to Generate Ideas
                    </h3>
                    <p className="text-sm mb-6" style={{ color: '#6B6B6B' }}>
                        Click the button below to analyze your problem statement and generate innovative solutions backed by research.
                    </p>

                    {error && (
                        <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444' }}>
                            <p className="text-sm" style={{ color: '#991B1B' }}>{error}</p>
                        </div>
                    )}

                    <button
                        onClick={() => handleRunAgent()}
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
                                Analyzing...
                            </span>
                        ) : (
                            'Run Idea Analysis'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Edit Problem Modal */}
            <EditProblemModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                currentProblem={problemStatement}
                onSave={handleSaveFromModal}
                isLoading={isRunning}
            />

            <div className="space-y-6">
                {/* Viewing Past Step Banner */}
                {isViewingPastStep && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                        <svg className="w-5 h-5 shrink-0" style={{ color: '#3B82F6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm" style={{ color: '#1E40AF' }}>
                            You're viewing a completed step. You can still edit and rerun this agent.
                        </p>
                    </div>
                )}

                {/* Analysis Header with Summary */}
                <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #E5E5E5' }}>
                    <div className="p-6 border-b" style={{ borderColor: '#E5E5E5' }}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                                    {data.title}
                                </h2>
                                {data.generatedAt && (
                                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                                        Generated {new Date(data.generatedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleOpenEditModal}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:shadow-sm"
                                    style={{
                                        backgroundColor: 'rgba(155, 107, 122, 0.08)',
                                        color: '#9B6B7A',
                                        border: '1px solid rgba(155, 107, 122, 0.2)',
                                    }}
                                    title="Edit problem statement and rerun"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span className="text-sm font-medium">Edit & Rerun</span>
                                </button>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                                    Completed
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="p-6 border-b" style={{ borderColor: '#E5E5E5', backgroundColor: '#FAFAFA' }}>
                        <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(155, 107, 122, 0.1)' }}>
                                <svg className="w-5 h-5" style={{ color: '#9B6B7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold mb-2" style={{ color: '#6B6B6B' }}>Analysis Summary</h3>
                                <p className="text-sm leading-relaxed" style={{ color: '#1A1A1A' }}>
                                    {data.summary}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Research Sources */}
                    {data.sources && data.sources.length > 0 && (
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-4 h-4" style={{ color: '#6B6B6B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <h3 className="text-sm font-semibold" style={{ color: '#6B6B6B' }}>Research Sources</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {data.sources.map((source, index) => (
                                    <a
                                        key={index}
                                        href={source}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:shadow-sm transition-all"
                                        style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Source {index + 1}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Proposed Solutions */}
                <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #E5E5E5' }}>
                    <div className="p-6 border-b" style={{ borderColor: '#E5E5E5' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(155, 107, 122, 0.1)' }}>
                                <svg className="w-5 h-5" style={{ color: '#9B6B7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>
                                    Proposed Solutions
                                </h3>
                                <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>
                                    Select the solution that best fits your needs
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            {data.solutions.map((solution, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleSelectSolution(index)}
                                    className="flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm"
                                    style={{
                                        backgroundColor: selectedSolution === index ? 'rgba(155, 107, 122, 0.05)' : '#FAFAFA',
                                        border: `1px solid ${selectedSolution === index ? '#9B6B7A' : 'transparent'}`,
                                    }}
                                >
                                    {/* Number Badge */}
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold transition-all"
                                        style={{
                                            backgroundColor: selectedSolution === index ? '#9B6B7A' : '#FFFFFF',
                                            color: selectedSolution === index ? '#FFFFFF' : '#6B6B6B',
                                            border: `1px solid ${selectedSolution === index ? '#9B6B7A' : '#E5E5E5'}`,
                                        }}
                                    >
                                        {index + 1}
                                    </div>

                                    {/* Solution Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm leading-relaxed" style={{ color: '#1A1A1A' }}>
                                            {solution}
                                        </p>
                                        {selectedSolution === index && (
                                            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: '#9B6B7A' }}>
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Selected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

