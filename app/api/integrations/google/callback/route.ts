import { NextRequest, NextResponse } from 'next/server';
import UserService from '@/lib/userService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL}/dashboard?google_error=${error}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL}/dashboard?google_error=no_code`
      );
    }

    const storedState = request.cookies.get('google_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('State mismatch - possible CSRF attack');
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL}/dashboard?google_error=invalid_state`
      );
    }

    const userSub = request.cookies.get('google_oauth_user_sub')?.value;
    if (!userSub) {
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL}/dashboard?google_error=no_user`
      );
    }

    const tokenData = await exchangeCodeForTokens(code);
    const userInfo = await getGoogleUserInfo(tokenData.access_token);
    const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

    await UserService.updateGoogleAuth(userSub, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: tokenExpiry,
      scopes: tokenData.scope ? tokenData.scope.split(' ') : [],
      email: userInfo.email,
    });

    console.log(`Google OAuth completed for user: ${userSub}`);

    const response = NextResponse.redirect(
      `${process.env.APP_BASE_URL}/dashboard?google_connected=true`
    );

    response.cookies.delete('google_oauth_state');
    response.cookies.delete('google_oauth_user_sub');

    return response;
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.APP_BASE_URL}/dashboard?google_error=callback_failed`
    );
  }
}

async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
      grant_type: 'authorization_code',
    }).toString(),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Token exchange failed:', errorData);
    throw new Error('Failed to exchange code for tokens');
  }

  return await response.json();
}

async function getGoogleUserInfo(accessToken: string): Promise<{
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}> {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    console.error('Failed to get user info from Google');
    throw new Error('Failed to get user info');
  }

  return await response.json();
}