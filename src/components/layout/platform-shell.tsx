'use client';

import React from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';
import { DemoPopup, ExplorePanel, useDemoGuideStore } from '@/lib/demo-guide';
import { CommandPalette } from '@/components/ui/command-palette';

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
  const isExploreMode = useDemoGuideStore((state) => state.isExploreMode);
  const activeModule = useDemoGuideStore((state) => state.activeModule);

  // Calculate if explore panel is visible (needs both explore mode and active module)
  const isExplorePanelVisible = isExploreMode && activeModule !== null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'pl-16' : 'pl-64',
          // Dynamic top padding based on explore panel visibility
          isExplorePanelVisible ? 'pt-[420px]' : 'pt-16'
        )}
      >
        <div className="p-6">{children}</div>
      </main>

      {/* Demo Guide Components */}
      <DemoPopup />
      <ExplorePanel />

      {/* Command Palette (⌘K) */}
      <CommandPalette />
    </div>
  );
}
