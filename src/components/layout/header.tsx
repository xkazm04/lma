'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Bell,
} from 'lucide-react';
import { ExploreToggle } from '@/lib/demo-guide';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function Header() {
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

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Explore Mode Toggle */}
          <ExploreToggle />

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
        </div>
      </div>
    </header>
  );
}
