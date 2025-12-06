'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Handshake,
  ClipboardCheck,
  ArrowLeftRight,
  Leaf,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Platform overview',
  },
  {
    name: 'Document Hub',
    href: '/documents',
    icon: FileText,
    description: 'Upload and analyze documents',
  },
  {
    name: 'Deal Room',
    href: '/deals',
    icon: Handshake,
    description: 'Negotiate terms',
    disabled: true,
  },
  {
    name: 'Compliance',
    href: '/compliance',
    icon: ClipboardCheck,
    description: 'Track obligations',
    disabled: true,
  },
  {
    name: 'Trade DD',
    href: '/trading',
    icon: ArrowLeftRight,
    description: 'Due diligence',
    disabled: true,
  },
  {
    name: 'ESG',
    href: '/esg',
    icon: Leaf,
    description: 'Sustainability tracking',
    disabled: true,
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-zinc-200 transition-all duration-300 z-30',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const NavItem = (
                <Link
                  key={item.name}
                  href={item.disabled ? '#' : item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors',
                    isActive
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                    item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-zinc-400">{item.description}</span>
                    </div>
                  )}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-zinc-500">{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return NavItem;
            })}
          </nav>

          {/* Settings & Collapse Button */}
          <div className="p-3 border-t border-zinc-200">
            {!collapsed && (
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </Link>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn(
                'w-full justify-center mt-2',
                collapsed && 'px-0'
              )}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
