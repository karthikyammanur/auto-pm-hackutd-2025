import { NextRequest, NextResponse } from 'next/server';
import UserService from '@/lib/userService';

/**
 * Reddit OAuth 2.0 - Authorization Callback
 *
 * This endpoint handles the callback from Reddit after user authorization.
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
      console.error('Reddit OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL}/dashboard?reddit_error=${error}`
      );
    }

    // Verify authorization code is present
    if (!code) {
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL}/dashboard?reddit_error=no_code`
      );
    }

    // Verify state parameter to prevent CSRF attacks
    const storedState = request.cookies.get('reddit_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('State mismatch - possible CSRF attack');
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL}/dashboard?reddit_error=invalid_state`
      );
    }

    // Get the user's sub from the cookie
    const userSub = request.cookies.get('reddit_oauth_user_sub')?.value;
    if (!userSub) {
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL}/dashboard?reddit_error=no_user`
      );
    }

    // Exchange authorization code for tokens
    const tokenData = await exchangeCodeForTokens(code);

    // Calculate token expiry time
    const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

    // Update user's Reddit auth in database
    await UserService.updateRedditAuth(userSub, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: tokenExpiry,
      scope: tokenData.scope,
    });

    console.log(`✅ Reddit OAuth completed for user: ${userSub}`);

    // Redirect back to dashboard with success message
    const response = NextResponse.redirect(
      `${process.env.APP_BASE_URL}/dashboard?reddit_connected=true`
    );

    // Clear the OAuth cookies
    response.cookies.delete('reddit_oauth_state');
    response.cookies.delete('reddit_oauth_user_sub');

    return response;
  } catch (error) {
    console.error('Error in Reddit OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.APP_BASE_URL}/dashboard?reddit_error=callback_failed`
    );
  }
}

/**
 * Exchange authorization code for access and refresh tokens
 * Reddit requires HTTP Basic Auth with client_id:client_secret
 */
async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}> {
  // Create Basic Auth credentials
  const credentials = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'web:HackUTD2025:v1.0.0 (by /u/your_reddit_username)',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.REDDIT_REDIRECT_URI || '',
    }).toString(),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Token exchange failed:', errorData);
    throw new Error('Failed to exchange code for tokens');
  }

  return await response.json();
}
