"use client";

import Link from "next/link";
import GoogleIntegrationButton from "./GoogleIntegrationButton";
import JiraIntegrationButton from "./JiraIntegrationButton";
import RedditIntegrationButton from "./RedditIntegrationButton";
import ProfileDropdown from "./ProfileDropdown";

interface User {
  name?: string;
  email?: string;
  picture?: string;
  nickname?: string;
  sub?: string;
}

interface SettingsContentProps {
  user: User;
  isJiraConnected: boolean;
  isRedditConnected: boolean;
  isGoogleConnected: boolean;
}

export default function SettingsContent({ 
  user, 
  isJiraConnected, 
  isRedditConnected, 
  isGoogleConnected 
}: SettingsContentProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(155, 107, 122, 0.1)' }}>
                <svg className="w-6 h-6" style={{ color: '#9B6B7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Product Workspace</span>
            </Link>
          </div>

          {/* Right section */}
          <ProfileDropdown user={user} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm mb-4 transition-colors hover:opacity-80"
            style={{ color: '#6B6B6B' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: '#1A1A1A' }}>Settings</h1>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>Manage your profile and integrations</p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Integrations Section - Full Width */}
          <div>
            <div className="bg-white rounded-xl p-8 shadow-sm" style={{ border: '1px solid #E5E5E5' }}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>Integrations</h2>
                <p className="text-sm" style={{ color: '#6B6B6B' }}>
                  Connect your accounts to enable AI agents to access your data and automate workflows
                </p>
              </div>

              <div className="space-y-4">
                {/* Google Integration */}
                <div 
                  className="p-6 rounded-xl border transition-all duration-200"
                  style={{ 
                    backgroundColor: '#FAFAFA',
                    borderColor: isGoogleConnected ? '#10B981' : '#E5E5E5',
                    borderWidth: isGoogleConnected ? '2px' : '1px',
                  }}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border-2 shrink-0" style={{ borderColor: '#E5E5E5' }}>
                        <svg className="w-7 h-7" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1" style={{ color: '#1A1A1A' }}>Google</h3>
                        <p className="text-sm mb-2" style={{ color: '#6B6B6B' }}>
                          {isGoogleConnected ? 'Connected - Gmail & Calendar access enabled' : 'Connect to access Gmail and Google Calendar'}
                        </p>
                        {isGoogleConnected && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                            Connected
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <GoogleIntegrationButton isConnected={isGoogleConnected} />
                    </div>
                  </div>
                </div>

                {/* Jira Integration */}
                <div 
                  className="p-6 rounded-xl border transition-all duration-200"
                  style={{ 
                    backgroundColor: '#FAFAFA',
                    borderColor: isJiraConnected ? '#10B981' : '#E5E5E5',
                    borderWidth: isJiraConnected ? '2px' : '1px',
                  }}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#E8F4FF' }}>
                        <svg className="w-7 h-7" style={{ color: '#0052CC' }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.34V2.84a.84.84 0 0 0-.84-.84h-9.63zm.008 10.043l-3.45 3.45a2.24 2.24 0 0 0 0 3.18l3.18 3.17a2.24 2.24 0 0 0 3.18 0l3.45-3.45c-.01-2.39-1.95-4.34-4.34-4.35h-2.02z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1" style={{ color: '#1A1A1A' }}>Jira</h3>
                        <p className="text-sm mb-2" style={{ color: '#6B6B6B' }}>
                          {isJiraConnected ? 'Connected - Project management integration active' : 'Connect to sync with Jira projects and issues'}
                        </p>
                        {isJiraConnected && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                            Connected
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <JiraIntegrationButton isConnected={isJiraConnected} />
                    </div>
                  </div>
                </div>

                {/* Reddit Integration */}
                <div 
                  className="p-6 rounded-xl border transition-all duration-200"
                  style={{ 
                    backgroundColor: '#FAFAFA',
                    borderColor: isRedditConnected ? '#10B981' : '#E5E5E5',
                    borderWidth: isRedditConnected ? '2px' : '1px',
                  }}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF3E6' }}>
                        <svg className="w-7 h-7" style={{ color: '#FF4500' }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1" style={{ color: '#1A1A1A' }}>Reddit</h3>
                        <p className="text-sm mb-2" style={{ color: '#6B6B6B' }}>
                          {isRedditConnected ? 'Connected - Community insights enabled' : 'Connect to gather insights from Reddit communities'}
                        </p>
                        {isRedditConnected && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                            Connected
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <RedditIntegrationButton isConnected={isRedditConnected} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Integration Info */}
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#DBEAFE', border: '1px solid #3B82F6' }}>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#1E40AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: '#1E3A8A' }}>About Integrations</p>
                    <p className="text-xs" style={{ color: '#1E40AF' }}>
                      Connecting these services allows our AI agents to access relevant data and automate tasks on your behalf. 
                      You can disconnect any integration at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

