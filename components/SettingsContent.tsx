"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import GoogleIntegrationButton from "./GoogleIntegrationButton";
import JiraIntegrationButton from "./JiraIntegrationButton";
import RedditIntegrationButton from "./RedditIntegrationButton";
import ProfileDropdown from "./ProfileDropdown";
import SettingsNav from "./SettingsNav";
import AutoPMLogo from "./AutoPMLogo";

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Top Navigation Bar */}
      <header className="bg-white border-b sticky top-0 z-40" style={{
        borderColor: 'var(--border)',
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)'
      }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
              <AutoPMLogo size="sm" />
            </Link>
          </div>

          {/* Right section */}
          <ProfileDropdown user={user} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm mb-5 transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Icon icon="solar:alt-arrow-left-linear" width="16" height="16" />
            Back
          </Link>
          <h1 style={{
            color: 'var(--text-primary)',
            fontSize: '2rem',
            fontWeight: '600',
            letterSpacing: '-0.015em',
            marginBottom: '0.5rem'
          }}>
            Settings
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            Connect services and configure your workspace for AI-powered automation
          </p>
        </div>

        {/* Two-Panel Layout */}
        <div className="flex gap-8">
          {/* Left Sidebar Navigation */}
          <aside className="w-64 shrink-0">
            <nav className="sticky top-24">
              <SettingsNav />

              {/* Info Card */}
              <div className="mt-4 p-4 border" style={{
                backgroundColor: 'var(--primary-bg)',
                borderColor: 'var(--primary)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <div className="flex items-start gap-2 mb-2">
                  <Icon icon="solar:info-circle-bold" width="16" height="16" className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{
                      color: 'var(--primary)',
                      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif'
                    }}>
                      Need Help?
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Check out our documentation for detailed guides on setting up integrations
                    </p>
                  </div>
                </div>
              </div>
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Integrations Section */}
            <div id="integrations" className="bg-white p-8 border mb-8" style={{
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div className="mb-8">
                <h2 style={{
                  color: 'var(--text-primary)',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  letterSpacing: '-0.01em',
                  marginBottom: '0.5rem'
                }}>
                  Integrations
                </h2>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  lineHeight: '1.6'
                }}>
                  Connect your tools to unlock AI-powered workflows. Each integration enables specific automation capabilities across your workspace.
                </p>
              </div>

              <div className="space-y-3">
                {/* Google Integration */}
                <div
                  className="p-5 border transition-all duration-200"
                  style={{
                    backgroundColor: isGoogleConnected ? 'var(--success-bg)' : 'var(--background-secondary)',
                    borderColor: isGoogleConnected ? 'var(--success)' : 'var(--border)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-white flex items-center justify-center border shrink-0" style={{
                        borderColor: 'var(--border)',
                        borderRadius: 'var(--radius)'
                      }}>
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 tracking-tight" style={{
                          color: 'var(--text-primary)',
                          fontSize: '1rem'
                        }}>
                          Google Workspace
                        </h3>
                        <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {isGoogleConnected
                            ? 'Your Gmail and Google Calendar are connected. AI agents can now send emails, schedule meetings, and analyze your communication patterns.'
                            : 'Connect your Google account to enable AI agents to send automated emails, schedule meetings, and manage your calendar on your behalf.'}
                        </p>
                        {isGoogleConnected ? (
                          <>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium mb-3" style={{
                              backgroundColor: 'var(--success)',
                              color: 'white',
                              borderRadius: 'var(--radius-full)',
                              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif'
                            }}>
                              <Icon icon="solar:check-circle-bold" width="12" height="12" />
                              Connected
                            </div>
                            <div className="pt-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>What you can do:</p>
                              <ul className="space-y-1.5">
                                <li className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  <Icon icon="solar:check-circle-bold" width="14" height="14" className="shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                                  Send automated email campaigns to stakeholders
                                </li>
                                <li className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  <Icon icon="solar:check-circle-bold" width="14" height="14" className="shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                                  Schedule meetings and sync calendar events
                                </li>
                                <li className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  <Icon icon="solar:check-circle-bold" width="14" height="14" className="shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                                  AI-powered email content generation
                                </li>
                              </ul>
                            </div>
                          </>
                        ) : (
                          <div className="pt-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              Permissions: Send emails, read/write calendar events, manage contacts
                            </p>
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
                  className="p-5 border transition-all duration-200"
                  style={{
                    backgroundColor: isJiraConnected ? 'var(--success-bg)' : 'var(--background-secondary)',
                    borderColor: isJiraConnected ? 'var(--success)' : 'var(--border)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 flex items-center justify-center shrink-0" style={{
                        backgroundColor: '#E8F4FF',
                        borderRadius: 'var(--radius)'
                      }}>
                        <svg className="w-6 h-6" style={{ color: '#0052CC' }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.34V2.84a.84.84 0 0 0-.84-.84h-9.63zm.008 10.043l-3.45 3.45a2.24 2.24 0 0 0 0 3.18l3.18 3.17a2.24 2.24 0 0 0 3.18 0l3.45-3.45c-.01-2.39-1.95-4.34-4.34-4.35h-2.02z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 tracking-tight" style={{
                          color: 'var(--text-primary)',
                          fontSize: '1rem'
                        }}>
                          Jira Software
                        </h3>
                        <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {isJiraConnected
                            ? 'Your Jira workspace is connected. AI agents can create tickets, assign tasks to team members, and manage your project workflow automatically.'
                            : 'Connect Jira to let AI agents automatically create project tickets, assign work to team members, and organize your development workflow based on generated requirements.'}
                        </p>
                        {isJiraConnected ? (
                          <>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium mb-3" style={{
                              backgroundColor: 'var(--success)',
                              color: 'white',
                              borderRadius: 'var(--radius-full)',
                              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif'
                            }}>
                              <Icon icon="solar:check-circle-bold" width="12" height="12" />
                              Connected
                            </div>
                            <div className="pt-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>What you can do:</p>
                              <ul className="space-y-1.5">
                                <li className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  <Icon icon="solar:check-circle-bold" width="14" height="14" className="shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                                  Auto-create tickets from user stories and requirements
                                </li>
                                <li className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  <Icon icon="solar:check-circle-bold" width="14" height="14" className="shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                                  Assign tickets to team members automatically
                                </li>
                                <li className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  <Icon icon="solar:check-circle-bold" width="14" height="14" className="shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                                  Organize sprints with AI-generated priorities
                                </li>
                              </ul>
                            </div>
                          </>
                        ) : (
                          <div className="pt-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              Permissions: Create/edit issues, manage projects, assign users
                            </p>
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
                  className="p-5 border transition-all duration-200"
                  style={{
                    backgroundColor: isRedditConnected ? 'var(--success-bg)' : 'var(--background-secondary)',
                    borderColor: isRedditConnected ? 'var(--success)' : 'var(--border)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 flex items-center justify-center shrink-0" style={{
                        backgroundColor: '#FFF3E6',
                        borderRadius: 'var(--radius)'
                      }}>
                        <svg className="w-6 h-6" style={{ color: '#FF4500' }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 tracking-tight" style={{
                          color: 'var(--text-primary)',
                          fontSize: '1rem'
                        }}>
                          Reddit
                        </h3>
                        <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {isRedditConnected
                            ? 'Your Reddit account is connected. AI agents can now analyze community discussions, gather user feedback, and identify trending topics relevant to your product.'
                            : 'Connect Reddit to enable AI agents to gather community insights, analyze user feedback from relevant subreddits, and identify market trends for your product research.'}
                        </p>
                        {isRedditConnected ? (
                          <>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium mb-3" style={{
                              backgroundColor: 'var(--success)',
                              color: 'white',
                              borderRadius: 'var(--radius-full)',
                              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif'
                            }}>
                              <Icon icon="solar:check-circle-bold" width="12" height="12" />
                              Connected
                            </div>
                            <div className="pt-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>What you can do:</p>
                              <ul className="space-y-1.5">
                                <li className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  <Icon icon="solar:check-circle-bold" width="14" height="14" className="shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                                  Analyze community feedback and sentiment
                                </li>
                                <li className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  <Icon icon="solar:check-circle-bold" width="14" height="14" className="shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                                  Identify trending topics and pain points
                                </li>
                                <li className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  <Icon icon="solar:check-circle-bold" width="14" height="14" className="shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                                  Research competitor mentions and market insights
                                </li>
                              </ul>
                            </div>
                          </>
                        ) : (
                          <div className="pt-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              Permissions: Read posts, access user history, search communities
                            </p>
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
              <div className="mt-6 p-5 border" style={{
                backgroundColor: 'var(--info-bg)',
                borderColor: 'var(--info)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <div className="flex items-start gap-3">
                  <Icon icon="solar:shield-check-bold" width="20" height="20" className="shrink-0 mt-0.5" style={{ color: 'var(--info)' }} />
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{
                      color: 'var(--info)',
                      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif'
                    }}>
                      Security & Privacy
                    </p>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                      All integrations use OAuth 2.0 for secure authentication. Your credentials are never stored on our servers, and you can revoke access at any time. AI agents only access data necessary for their specific tasks.
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Learn more about our security practices in our <a href="#" className="underline">Privacy Policy</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div id="account" className="bg-white p-8 border" style={{
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div className="mb-8">
                <h2 style={{
                  color: 'var(--text-primary)',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  letterSpacing: '-0.01em',
                  marginBottom: '0.5rem'
                }}>
                  Account
                </h2>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  lineHeight: '1.6'
                }}>
                  Manage your account information and authentication settings
                </p>
              </div>

              {/* Profile Information */}
              <div className="space-y-6">
                {/* Profile Picture and Name */}
                <div className="flex items-start gap-6 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.name || 'User'}
                      className="w-20 h-20 shrink-0"
                      style={{
                        borderRadius: 'var(--radius-lg)',
                        border: '2px solid var(--border)'
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <h3 style={{
                      color: 'var(--text-primary)',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      marginBottom: '0.25rem',
                      letterSpacing: '-0.005em'
                    }}>
                      {user.name || user.nickname || 'User'}
                    </h3>
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      marginBottom: '0.75rem'
                    }}>
                      {user.email}
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium" style={{
                      backgroundColor: 'var(--success-bg)',
                      color: 'var(--success)',
                      borderRadius: 'var(--radius-full)',
                      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif'
                    }}>
                      <Icon icon="solar:check-circle-bold" width="12" height="12" />
                      Email Verified
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div>
                  <h4 style={{
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Account Details
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          Email Address
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {user.email}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1" style={{
                        color: 'var(--text-tertiary)',
                        backgroundColor: 'var(--background-secondary)',
                        borderRadius: 'var(--radius)'
                      }}>
                        Primary
                      </span>
                    </div>

                    {user.nickname && (
                      <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                            Username
                          </p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {user.nickname}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          User ID
                        </p>
                        <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                          {user.sub}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          Authentication Provider
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Auth0
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium" style={{
                        backgroundColor: 'var(--primary-bg)',
                        color: 'var(--primary)',
                        borderRadius: 'var(--radius-full)',
                        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif'
                      }}>
                        <Icon icon="solar:lock-password-bold" width="12" height="12" />
                        Secure
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                  <h4 style={{
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Account Actions
                  </h4>
                  <div className="space-y-3">
                    <a
                      href="/auth/logout"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
                      style={{
                        color: 'var(--error)',
                        backgroundColor: 'var(--error-bg)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--error)',
                        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif'
                      }}
                    >
                      <Icon icon="solar:logout-2-bold" width="16" height="16" />
                      Sign Out
                    </a>
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

