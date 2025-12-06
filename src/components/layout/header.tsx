'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Search,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-200">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">LoanOS</span>
        </Link>

        {/* Global Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="search"
              placeholder="Search loans, documents, terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-50 border-zinc-200 focus:bg-white"
            />
          </div>
        </form>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                  <span className="font-medium text-sm">Document processed</span>
                  <span className="text-xs text-zinc-500">Facility Agreement ABC has been analyzed</span>
                  <span className="text-xs text-zinc-400">2 minutes ago</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                  <span className="font-medium text-sm">Compliance deadline</span>
                  <span className="text-xs text-zinc-500">Q4 financials due in 5 days</span>
                  <span className="text-xs text-zinc-400">1 hour ago</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                  <span className="font-medium text-sm">ESG target at risk</span>
                  <span className="text-xs text-zinc-500">Carbon reduction KPI below threshold</span>
                  <span className="text-xs text-zinc-400">3 hours ago</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm text-blue-600">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-zinc-600" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{user?.name || 'Guest'}</span>
                  <span className="text-xs text-zinc-500">{user?.role || 'Viewer'}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.name || 'Guest User'}</span>
                  <span className="text-xs font-normal text-zinc-500">{user?.email || 'guest@example.com'}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
