import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { syncUserToDatabase, getCurrentUser } from "@/lib/syncUser";
import JiraIntegrationButton from "@/components/JiraIntegrationButton";
import RedditIntegrationButton from "@/components/RedditIntegrationButton";
import GoogleIntegrationButton from "@/components/GoogleIntegrationButton";

export default async function DashboardPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  // If not logged in, redirect to login
  if (!user) {
    redirect("/login");
  }

  // Sync user to MongoDB (only creates if doesn't exist)
  let dbUser = null;
  try {
    const { user: syncedUser, isNewUser } = await syncUserToDatabase();
    dbUser = syncedUser;
    if (isNewUser) {
      console.log(`New user registered: ${dbUser?.email}`);
    }
  } catch (error) {
    console.error('Failed to sync user to database:', error);
  }

  // Get current user with integration status
  if (!dbUser) {
    dbUser = await getCurrentUser();
  }

  const isJiraConnected = !!(dbUser?.jiraAuth?.cloudId);
  const isRedditConnected = !!(dbUser?.redditAuth?.tokenExpiry);
  const isGoogleConnected = !!(dbUser?.googleAuth?.tokenExpiry);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user details in top right */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

            {/* User details in top right */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name || 'User'}
                    className="w-10 h-10 rounded-full border-2 border-gray-200"
                  />
                )}
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Welcome back!</h2>
            <p className="text-gray-600">You are successfully authenticated with Auth0.</p>
          </div>

          {/* User info card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-600">{user.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-600">{user.email}</span>
              </div>
              {user.nickname && (
                <div>
                  <span className="font-medium text-gray-700">Nickname:</span>
                  <span className="ml-2 text-gray-600">{user.nickname}</span>
                </div>
              )}
            </div>
          </div>

          {/* Placeholder card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h2>
            <p className="text-gray-600">Your dashboard content goes here.</p>
          </div>
        </div>

        {/* Integrations Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Integrations</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Tools</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Connect your accounts to enable AI agents to access your data.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.34V2.84a.84.84 0 0 0-.84-.84h-9.63zm.008 10.043l-3.45 3.45a2.24 2.24 0 0 0 0 3.18l3.18 3.17a2.24 2.24 0 0 0 3.18 0l3.45-3.45c-.01-2.39-1.95-4.34-4.34-4.35h-2.02z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Jira</h4>
                    <p className="text-sm text-gray-500">
                      {isJiraConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <JiraIntegrationButton isConnected={isJiraConnected} />
              </div>

              {/* Reddit Integration */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Reddit</h4>
                    <p className="text-sm text-gray-500">
                      {isRedditConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <RedditIntegrationButton isConnected={isRedditConnected} />
              </div>

              {/* Google Integration */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border-2 border-gray-200">
                    <svg className="w-8 h-8" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Google</h4>
                    <p className="text-sm text-gray-500">
                      {isGoogleConnected ? 'Connected - Calendar & Gmail' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <GoogleIntegrationButton isConnected={isGoogleConnected} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}