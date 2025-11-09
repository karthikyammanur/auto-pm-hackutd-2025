import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const state = crypto.randomBytes(32).toString('hex');

    const response = NextResponse.redirect(buildAuthorizationUrl(state));

    response.cookies.set('reddit_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    response.cookies.set('reddit_oauth_user_sub', session.user.sub, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error initiating Reddit OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}

function buildAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.REDDIT_CLIENT_ID || '',
    response_type: 'code',
    state: state,
    redirect_uri: process.env.REDDIT_REDIRECT_URI || '',
    duration: 'permanent',
    scope: [
      'identity',
      'read',
      'mysubreddits',
      'history',
      'subscribe',
    ].join(' '),
  });

  return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
}
