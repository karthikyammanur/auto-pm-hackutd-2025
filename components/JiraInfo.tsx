"use client";

import { useEffect, useState } from "react";

interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
}

interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  avatarUrls: {
    '48x48': string;
  };
}

interface JiraData {
  success: boolean;
  cloudId: string;
  scopes: string[];
  tokenExpiry: string;
  jiraUser: JiraUser | null;
  projects: JiraProject[];
}

export default function JiraInfo() {
  const [data, setData] = useState<JiraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJiraData() {
      try {
        const response = await fetch('/api/integrations/jira/test');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch Jira data');
        }

        const jiraData = await response.json();
        setData(jiraData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchJiraData();
  }, []);

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-blue-700 text-sm">Loading Jira information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 rounded-lg">
        <p className="text-red-700 text-sm">Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Jira User Info */}
      {data.jiraUser && (
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Connected Jira Account</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p><span className="font-medium">Display Name:</span> {data.jiraUser.displayName}</p>
            <p><span className="font-medium">Email:</span> {data.jiraUser.emailAddress}</p>
            <p><span className="font-medium">Account ID:</span> {data.jiraUser.accountId}</p>
          </div>
        </div>
      )}

      {/* Connection Details */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Connection Details</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <p><span className="font-medium">Cloud ID:</span> <code className="bg-gray-200 px-1 rounded">{data.cloudId}</code></p>
          <p><span className="font-medium">Token Expires:</span> {new Date(data.tokenExpiry).toLocaleString()}</p>
          <p><span className="font-medium">Scopes:</span></p>
          <div className="flex flex-wrap gap-1 mt-1">
            {data.scopes.map((scope) => (
              <span key={scope} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {scope}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="p-4 bg-purple-50 rounded-lg">
        <h4 className="font-semibold text-purple-900 mb-3">
          Jira Projects ({data.projects.length})
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.projects.map((project) => (
            <div key={project.id} className="flex items-center gap-3 p-2 bg-white rounded border border-purple-200">
              {project.avatarUrls?.['48x48'] && (
                <img
                  src={project.avatarUrls['48x48']}
                  alt={project.name}
                  className="w-8 h-8 rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                <p className="text-xs text-gray-500">
                  {project.key} • {project.projectTypeKey}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
