"use client";

import { useState } from "react";

interface JiraIntegrationButtonProps {
  isConnected: boolean;
}

export default function JiraIntegrationButton({ isConnected }: JiraIntegrationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    setIsLoading(true);
    // Redirect to the authorization endpoint
    window.location.href = '/api/integrations/jira/authorize';
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isConnected || isLoading}
      className={`
        flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
        ${isConnected
          ? 'bg-green-600 text-white cursor-not-allowed opacity-75'
          : 'bg-gray-600 hover:bg-gray-700 text-white shadow-md hover:shadow-lg'
        }
        ${isLoading ? 'opacity-50 cursor-wait' : ''}
      `}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Connecting...</span>
        </>
      ) : isConnected ? (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Jira Connected</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.34V2.84a.84.84 0 0 0-.84-.84h-9.63zm.008 10.043l-3.45 3.45a2.24 2.24 0 0 0 0 3.18l3.18 3.17a2.24 2.24 0 0 0 3.18 0l3.45-3.45c-.01-2.39-1.95-4.34-4.34-4.35h-2.02z"/>
          </svg>
          <span>Connect Jira</span>
        </>
      )}
    </button>
  );
}