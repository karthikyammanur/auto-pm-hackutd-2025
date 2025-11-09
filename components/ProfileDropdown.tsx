"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  name?: string;
  email?: string;
  picture?: string;
  nickname?: string;
  sub?: string;
}

interface ProfileDropdownProps {
  user: User;
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name || 'User'}
            className="w-10 h-10 rounded-full border-2 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ borderColor: '#E5E5E5' }}
          />
        ) : (
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: '#9B6B7A' }}
          >
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 bg-white border shadow-lg rounded-lg p-2"
        style={{ borderColor: '#E5E5E5' }}
      >
        {/* User Info Section */}
        <div className="px-3 py-4 border-b" style={{ borderColor: '#E5E5E5' }}>
          <div className="flex items-center gap-3 mb-3">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name || 'User'}
                className="w-12 h-12 rounded-full border-2"
                style={{ borderColor: '#E5E5E5' }}
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                style={{ backgroundColor: '#9B6B7A' }}
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#1A1A1A' }}>
                {user.name}
              </p>
              <p className="text-xs truncate" style={{ color: '#6B6B6B' }}>
                {user.email}
              </p>
            </div>
          </div>
          
          {/* Additional User Details */}
          {user.nickname && (
            <div className="mb-2">
              <p className="text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Nickname</p>
              <p className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#FAFAFA', color: '#1A1A1A' }}>
                {user.nickname}
              </p>
            </div>
          )}
          {user.sub && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>User ID</p>
              <p className="text-xs px-2 py-1 rounded font-mono break-all" style={{ backgroundColor: '#FAFAFA', color: '#6B6B6B' }}>
                {user.sub}
              </p>
            </div>
          )}
        </div>

        <DropdownMenuSeparator style={{ backgroundColor: '#E5E5E5' }} />

        {/* Settings Link */}
        <Link href="/settings">
          <DropdownMenuItem className="cursor-pointer py-2 px-3 rounded">
            <svg className="w-4 h-4 mr-3" style={{ color: '#6B6B6B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm" style={{ color: '#1A1A1A' }}>Settings</span>
          </DropdownMenuItem>
        </Link>

        {/* Dashboard Link */}
        <Link href="/dashboard">
          <DropdownMenuItem className="cursor-pointer py-2 px-3 rounded">
            <svg className="w-4 h-4 mr-3" style={{ color: '#6B6B6B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-sm" style={{ color: '#1A1A1A' }}>Dashboard</span>
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator style={{ backgroundColor: '#E5E5E5' }} />

        {/* Logout */}
        <a href="/auth/logout">
          <DropdownMenuItem className="cursor-pointer py-2 px-3 rounded">
            <svg className="w-4 h-4 mr-3" style={{ color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: '#EF4444' }}>Sign Out</span>
          </DropdownMenuItem>
        </a>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

