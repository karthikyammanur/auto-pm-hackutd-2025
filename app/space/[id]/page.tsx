import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Space from "@/models/Space";
import Link from "next/link";
import SpacePageHeader from "@/components/SpacePageHeader";
import SpaceAgentContent from "@/components/SpaceAgentContent";

export default async function SpacePage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }> | { id: string };
  searchParams: Promise<{ step?: string }> | { step?: string };
}) {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await Promise.resolve(params);
  const { id } = resolvedParams;
  
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const viewStep = resolvedSearchParams.step ? parseInt(resolvedSearchParams.step) : null;

  let space: any = null;
  try {
    await connectDB();
    const spaceData = await Space.findOne({
      _id: id,
      userId: user.sub,
    }).lean();

    if (!spaceData) {
      redirect("/dashboard");
    }

    // Serialize the space data
    space = {
      ...spaceData,
      _id: spaceData._id.toString(),
      createdAt: spaceData.createdAt.toISOString(),
      updatedAt: spaceData.updatedAt.toISOString(),
      // Ensure nested objects are properly serialized
      ideaAgent: spaceData.ideaAgent ? {
        title: spaceData.ideaAgent.title,
        summary: spaceData.ideaAgent.summary,
        solutions: spaceData.ideaAgent.solutions || [],
        sources: spaceData.ideaAgent.sources || [],
        selectedSolution: spaceData.ideaAgent.selectedSolution,
        generatedAt: spaceData.ideaAgent.generatedAt?.toISOString(),
      } : undefined,
      storyAgent: spaceData.storyAgent ? {
        ...spaceData.storyAgent,
        generatedAt: spaceData.storyAgent.generatedAt?.toISOString(),
      } : undefined,
      emailAgent: spaceData.emailAgent ? {
        ...spaceData.emailAgent,
        generatedAt: spaceData.emailAgent.generatedAt?.toISOString(),
      } : undefined,
      riceAgent: spaceData.riceAgent ? {
        ...spaceData.riceAgent,
        generatedAt: spaceData.riceAgent.generatedAt?.toISOString(),
      } : undefined,
      okrAgent: spaceData.okrAgent ? {
        ...spaceData.okrAgent,
        generatedAt: spaceData.okrAgent.generatedAt?.toISOString(),
      } : undefined,
    };
    
    console.log('[Space Page] Loaded space from MongoDB:');
    console.log('[Space Page] - ideaAgent exists:', !!spaceData.ideaAgent);
    console.log('[Space Page] - selectedSolution:', spaceData.ideaAgent?.selectedSolution);
    console.log('[Space Page] - solutions count:', spaceData.ideaAgent?.solutions?.length);
  } catch (error) {
    console.error('Failed to fetch space:', error);
    redirect("/dashboard");
  }

  const agentSteps = [
    {
      number: 1,
      name: 'Idea Generation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      number: 2,
      name: 'Story Creation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      number: 3,
      name: 'Email Campaign',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      number: 4,
      name: 'RICE Analysis',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      number: 5,
      name: 'OKR Planning',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      number: 6,
      name: 'Wireframe Design',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      {/* Top Navigation Bar */}
      <SpacePageHeader user={user} space={space} totalSteps={agentSteps.length} />

      {/* Main Content - Two Panel Layout */}
      <div className="flex max-w-[1600px] mx-auto">
        {/* Left Panel - Agent Pipeline */}
        <aside className="w-80 bg-white border-r shrink-0" style={{ borderColor: '#E5E5E5', minHeight: 'calc(100vh - 64px)' }}>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-1" style={{ color: '#6B6B6B' }}>
                Agent Pipeline
              </h2>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                Follow the workflow to build your product
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: '#6B6B6B' }}>Progress</span>
                <span className="text-xs font-semibold" style={{ color: '#9B6B7A' }}>
                  {Math.round(((space.currentStep - 1) / agentSteps.length) * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: '#E5E5E5' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: '#9B6B7A',
                    width: `${((space.currentStep - 1) / agentSteps.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Problem Statement */}
            <div className="mb-6 pb-6" style={{ borderBottom: '1px solid #E5E5E5' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B6B6B' }}>
                Problem Statement
              </h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: '#1A1A1A' }}>
                {space.problemStatement}
              </p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                Created {new Date(space.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Agent Steps */}
            <div className="space-y-2">
              {agentSteps.map((step) => {
                const isCompleted = step.number < space.currentStep;
                const isPending = step.number > space.currentStep;
                const isClickable = isCompleted || step.number === space.currentStep;
                
                // Determine if this is the active viewed step
                const isActiveView = viewStep ? step.number === viewStep : step.number === space.currentStep;

                return (
                  <Link
                    key={step.number}
                    href={isClickable ? `/space/${space._id}?step=${step.number}` : '#'}
                    className={`block w-full text-left px-3 py-2 rounded transition-all ${isClickable ? 'cursor-pointer hover:shadow-sm' : 'cursor-not-allowed'}`}
                    style={{
                      backgroundColor: isActiveView ? 'rgba(155, 107, 122, 0.08)' : isPending ? '#FAFAFA' : '#F9FAFB',
                      border: `1px solid ${isActiveView ? '#9B6B7A' : '#E5E5E5'}`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Step Icon */}
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center shrink-0 transition-all"
                        style={{
                          backgroundColor: isCompleted ? '#10B981' : isActiveView ? '#9B6B7A' : '#F3F4F6',
                          color: isCompleted || isActiveView ? '#FFFFFF' : '#9CA3AF',
                        }}
                      >
                        {isCompleted && !isActiveView ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="scale-75">{step.icon}</div>
                        )}
                      </div>

                      {/* Step Name */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold"
                          style={{
                            color: isPending ? '#9CA3AF' : '#1A1A1A',
                          }}
                        >
                          {step.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Panel - Agent Content */}
        <main className="flex-1 p-4">
          <SpaceAgentContent space={space} agentSteps={agentSteps} viewStep={viewStep} />
        </main>
      </div>
    </div>
  );
}

