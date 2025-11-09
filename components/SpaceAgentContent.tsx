"use client";

import { useState } from "react";
import IdeaAgentView from "./IdeaAgentView";
import StoryAgentView from "./StoryAgentView";

interface AgentStep {
  number: number;
  name: string;
  icon: React.ReactNode;
}

interface Space {
  _id: string;
  name: string;
  problemStatement: string;
  currentStep: number;
  completed: boolean;
  ideaAgent?: any;
  storyAgent?: any;
  createdAt: string;
  updatedAt: string;
}

interface SpaceAgentContentProps {
  space: Space;
  agentSteps: AgentStep[];
  viewStep: number | null;
}

export default function SpaceAgentContent({ space: initialSpace, agentSteps, viewStep }: SpaceAgentContentProps) {
  const [space, setSpace] = useState(initialSpace);
  
  // Determine which step to show - either the viewStep from URL or the current step
  const activeStep = viewStep && viewStep <= space.currentStep ? viewStep : space.currentStep;

  const handleAgentComplete = () => {
    // Refresh the page to get updated space data
    window.location.reload();
  };

  // Render based on active step
  const renderAgentContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <IdeaAgentView
            spaceId={space._id}
            problemStatement={space.problemStatement}
            ideaAgentData={space.ideaAgent || null}
            onComplete={handleAgentComplete}
            isViewingPastStep={viewStep !== null && viewStep < space.currentStep}
          />
        );
      
      case 2:
        const selectedSolution = (space.ideaAgent as any)?.selectedSolution;
        console.log('[SpaceAgentContent] Step 2 - Selected solution from space:', selectedSolution);
        
        return (
          <StoryAgentView
            spaceId={space._id}
            selectedSolution={selectedSolution || null}
            storyAgentData={(space as any).storyAgent || null}
            onComplete={handleAgentComplete}
            isViewingPastStep={viewStep !== null && viewStep < space.currentStep}
          />
        );
      
      default:
        return (
          <div className="bg-white rounded-lg p-8 shadow-sm text-center" style={{ border: '1px solid #E5E5E5' }}>
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(155, 107, 122, 0.08)' }}>
              {agentSteps[space.currentStep - 1].icon && (
                <div style={{ color: '#9B6B7A' }} className="scale-150">
                  {agentSteps[space.currentStep - 1].icon}
                </div>
              )}
            </div>
            <h2 className="text-2xl font-semibold mb-6" style={{ color: '#1A1A1A' }}>
              {agentSteps[space.currentStep - 1].name}
            </h2>

            {/* Coming Soon Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: 'rgba(155, 107, 122, 0.08)', color: '#9B6B7A' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Coming Soon
            </div>

            <p className="text-sm max-w-md mx-auto" style={{ color: '#9CA3AF' }}>
              This agent is currently under development. It will be available soon!
            </p>
          </div>
        );
    }
  };

  return (
    <div>
      {renderAgentContent()}
    </div>
  );
}

