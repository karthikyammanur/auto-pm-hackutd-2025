import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import UserService from '@/lib/userService';

/**
 * Test endpoint to fetch Jira projects using stored OAuth tokens
 * This demonstrates how to use the Jira API with the stored credentials
 */
export async function GET() {
  try {
    // Get current user session
    const session = await auth0.getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with tokens (tokens have select:false, so we need special method)
    const user = await UserService.getUserWithTokens(session.user.sub);

    if (!user?.jiraAuth?.accessToken || !user?.jiraAuth?.cloudId) {
      return NextResponse.json(
        { error: 'Jira not connected' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (user.isJiraTokenExpired()) {
      return NextResponse.json(
        { error: 'Jira token expired. Please reconnect.' },
        { status: 401 }
      );
    }

    // Fetch Jira projects using the REST API
    const projectsResponse = await fetch(
      `https://api.atlassian.com/ex/jira/${user.jiraAuth.cloudId}/rest/api/3/project`,
      {
        headers: {
          'Authorization': `Bearer ${user.jiraAuth.accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!projectsResponse.ok) {
      const errorText = await projectsResponse.text();
      console.error('Jira API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch Jira projects' },
        { status: projectsResponse.status }
      );
    }

    const projects = await projectsResponse.json();

    // Also fetch current user info from Jira
    const userInfoResponse = await fetch(
      `https://api.atlassian.com/ex/jira/${user.jiraAuth.cloudId}/rest/api/3/myself`,
      {
        headers: {
          'Authorization': `Bearer ${user.jiraAuth.accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    let jiraUser = null;
    if (userInfoResponse.ok) {
      jiraUser = await userInfoResponse.json();
    }

    return NextResponse.json({
      success: true,
      cloudId: user.jiraAuth.cloudId,
      scopes: user.jiraAuth.scopes,
      tokenExpiry: user.jiraAuth.tokenExpiry,
      jiraUser: jiraUser ? {
        accountId: jiraUser.accountId,
        displayName: jiraUser.displayName,
        emailAddress: jiraUser.emailAddress,
      } : null,
      projects: projects.map((project: any) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        projectTypeKey: project.projectTypeKey,
        avatarUrls: project.avatarUrls,
      })),
    });
  } catch (error) {
    console.error('Error fetching Jira data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Jira data' },
      { status: 500 }
    );
  }
}
