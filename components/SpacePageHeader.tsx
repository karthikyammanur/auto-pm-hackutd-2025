"use client";

import Link from "next/link";
import ProfileDropdown from "./ProfileDropdown";

interface User {
  name?: string;
  email?: string;
  picture?: string;
  nickname?: string;
  sub?: string;
}

interface Space {
  _id: string;
  name: string;
  currentStep: number;
}

interface SpacePageHeaderProps {
  user: User;
  space: Space;
  totalSteps: number;
}

export default function SpacePageHeader({ user, space, totalSteps }: SpacePageHeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
            style={{ color: '#6B6B6B' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{space.name}</p>
            <p className="text-xs" style={{ color: '#6B6B6B' }}>
              Step {space.currentStep} of {totalSteps}
            </p>
          </div>
          <ProfileDropdown user={user} />
        </div>
      </div>
    </header>
  );
}

