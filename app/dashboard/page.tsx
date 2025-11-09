import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { syncUserToDatabase, getCurrentUser } from "@/lib/syncUser";
import JiraIntegrationButton from "@/components/JiraIntegrationButton";
import JiraInfo from "@/components/JiraInfo";

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

  // Check if Jira is connected
  // Note: accessToken and refreshToken have select:false, so we check cloudId instead
  // cloudId is set when Jira is successfully connected
  const isJiraConnected = !!(dbUser?.jiraAuth?.cloudId);

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
                  Connect your Jira account to sync tasks and projects.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
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

                {/* Show Jira info if connected */}
                {isJiraConnected && <JiraInfo />}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}