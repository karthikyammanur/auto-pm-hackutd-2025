import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import UserService from '@/lib/userService';

/**
 * Jira OAuth 2.0 (3LO) - Authorization Callback
 *
 * This endpoint handles the callback from Atlassian after user authorization.
 * It exchanges the authorization code for access and refresh tokens.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle authorization errors
    if (error) {
      console.error('Jira OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL}/dashboard?jira_error=${error}`
      );
    }

    // Verify authorization code is present
    if (!code) {
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL}/dashboard?jira_error=no_code`
      );
    }

    // Verify state parameter to prevent CSRF attacks
    const storedState = request.cookies.get('jira_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('State mismatch - possible CSRF attack');
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL}/dashboard?jira_error=invalid_state`
      );
    }

    // Get the user's sub from the cookie
    const userSub = request.cookies.get('jira_oauth_user_sub')?.value;
    if (!userSub) {
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL}/dashboard?jira_error=no_user`
      );
    }

    // Exchange authorization code for tokens
    const tokenData = await exchangeCodeForTokens(code);

    // Get the Atlassian cloud ID
    const cloudId = await getCloudId(tokenData.access_token);

    // Calculate token expiry time
    const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

    // Update user's Jira auth in database
    await UserService.updateJiraAuth(userSub, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: tokenExpiry,
      scopes: tokenData.scope.split(' '),
      cloudId: cloudId,
    });

    console.log(`✅ Jira OAuth completed for user: ${userSub}`);

    // Redirect back to dashboard with success message
    const response = NextResponse.redirect(
      `${process.env.APP_BASE_URL}/dashboard?jira_connected=true`
    );

    // Clear the OAuth cookies
    response.cookies.delete('jira_oauth_state');
    response.cookies.delete('jira_oauth_user_sub');

    return response;
  } catch (error) {
    console.error('Error in Jira OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.APP_BASE_URL}/dashboard?jira_error=callback_failed`
    );
  }
}

/**
 * Exchange authorization code for access and refresh tokens
 */
async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}> {
  const response = await fetch('https://auth.atlassian.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.JIRA_CLIENT_ID,
      client_secret: process.env.JIRA_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.JIRA_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Token exchange failed:', errorData);
    throw new Error('Failed to exchange code for tokens');
  }

  return await response.json();
}

/**
 * Get the Atlassian cloud ID for API requests
 */
async function getCloudId(accessToken: string): Promise<string> {
  const response = await fetch(
    'https://api.atlassian.com/oauth/token/accessible-resources',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    console.error('Failed to get accessible resources');
    throw new Error('Failed to get cloud ID');
  }

  const resources = await response.json();

  if (!resources || resources.length === 0) {
    throw new Error('No accessible Jira sites found');
  }

  // Return the first site's cloud ID
  // If user has multiple sites, you might want to let them choose
  return resources[0].id;
}