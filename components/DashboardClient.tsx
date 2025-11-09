"use client";

import { useState } from "react";
import Link from "next/link";
import CreateSpaceModal from "./CreateSpaceModal";
import ProfileDropdown from "./ProfileDropdown";

interface Space {
  _id: string;
  name: string;
  problemStatement: string;
  createdAt: string;
  currentStep: number;
  completed: boolean;
}

interface DashboardClientProps {
  user: any;
  initialSpaces: Space[];
}

export default function DashboardClient({ user, initialSpaces }: DashboardClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);

  const handleSpaceCreated = (newSpace: Space) => {
    setSpaces([newSpace, ...spaces]);
    setIsCreateModalOpen(false);
  };

  const totalSteps = 6;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(155, 107, 122, 0.1)' }}>
                <svg className="w-6 h-6" style={{ color: '#9B6B7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Product Workspace</span>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            <ProfileDropdown user={user} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: '#1A1A1A' }}>Product Spaces</h1>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>Create and manage your product ideation workflows</p>
        </div>

        {/* Space Grid */}
        {spaces.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(155, 107, 122, 0.08)' }}>
              <svg className="w-8 h-8" style={{ color: '#9B6B7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium mb-2" style={{ color: '#1A1A1A' }}>No spaces yet</h2>
            <p className="text-sm mb-6 max-w-md text-center" style={{ color: '#6B6B6B' }}>
              Create your first product space to get started with AI-powered solution generation
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: '#9B6B7A' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#8A5A69';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#9B6B7A';
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Space
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create Space Card */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white rounded-xl p-6 border-2 border-dashed transition-all duration-200 hover:shadow-md flex flex-col items-center justify-center min-h-[240px] group"
              style={{ borderColor: '#D4D4D4' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#9B6B7A';
                e.currentTarget.style.backgroundColor = 'rgba(155, 107, 122, 0.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#D4D4D4';
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors" style={{ backgroundColor: 'rgba(155, 107, 122, 0.08)' }}>
                <svg className="w-6 h-6" style={{ color: '#9B6B7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-medium mb-1" style={{ color: '#1A1A1A' }}>Create New Space</span>
              <span className="text-sm" style={{ color: '#6B6B6B' }}>Start a new product workflow</span>
            </button>

            {/* Space Cards */}
            {spaces.map((space) => {
              const completedSteps = space.currentStep - 1;
              
              return (
                <Link
                  key={space._id}
                  href={`/space/${space._id}`}
                  className="bg-white rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent"
                  style={{ borderColor: '#E5E5E5' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(155, 107, 122, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-1 line-clamp-1" style={{ color: '#1A1A1A' }}>
                      {space.name}
                    </h3>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                      Created {new Date(space.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: '#6B6B6B' }}>
                    {space.problemStatement}
                  </p>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: '#6B6B6B' }}>Progress</span>
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{completedSteps} of {totalSteps} steps</span>
                    </div>
                    <div className="flex gap-1.5">
                      {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                          key={i}
                          className="h-2 rounded-full flex-1"
                          style={{
                            backgroundColor: i < completedSteps 
                              ? '#9B6B7A' 
                              : i === completedSteps 
                              ? '#F59E0B' 
                              : '#E5E5E5'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {space.completed && (
                    <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                      Completed
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Space Modal */}
      <CreateSpaceModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSpaceCreated={handleSpaceCreated}
      />
    </div>
  );
}

