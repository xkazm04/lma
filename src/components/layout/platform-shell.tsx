'use client';

import React from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

interface PlatformShellProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export function PlatformShell({ children, user }: PlatformShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header user={user} />
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main
        className={cn(
          'pt-16 transition-all duration-300',
          sidebarCollapsed ? 'pl-16' : 'pl-64'
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
