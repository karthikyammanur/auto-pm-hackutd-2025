import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import crypto from 'crypto';

/**
 * Jira OAuth 2.0 (3LO) - Authorization Initiation
 *
 * This endpoint initiates the Jira OAuth flow by redirecting the user
 * to Atlassian's authorization page.
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure user is authenticated
    const session = await auth0.getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const state = crypto.randomBytes(32).toString('hex');

    const response = NextResponse.redirect(buildAuthorizationUrl(state));
    response.cookies.set('jira_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    response.cookies.set('jira_oauth_user_sub', session.user.sub, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error initiating Jira OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}

function buildAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    audience: 'api.atlassian.com',
    client_id: process.env.JIRA_CLIENT_ID || '',
    scope: [
      'read:jira-work',
      'write:jira-work',
      'read:jira-user',
      'offline_access',
    ].join(' '),
    redirect_uri: process.env.JIRA_REDIRECT_URI || '',
    state: state,
    response_type: 'code',
    prompt: 'consent',
  });

  return `https://auth.atlassian.com/authorize?${params.toString()}`;
}
