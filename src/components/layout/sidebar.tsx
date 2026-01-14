'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Handshake,
  ClipboardCheck,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Brain,
  Shield,
  Box,
  Calendar,
  TrendingUp,
  Building2,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Platform overview',
  },
  {
    name: '3D Portfolio',
    href: '/portfolio-3d',
    icon: Box,
    description: 'Spatial visualization',
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: FileText,
    description: 'Document intelligence',
    children: [
      { name: 'Document Hub', href: '/documents', icon: FileText },
      { name: 'Risk Detection', href: '/documents/risk-detection', icon: Shield },
      { name: 'Compare', href: '/documents/compare', icon: Layers },
      { name: 'Portfolio', href: '/documents/portfolio', icon: BarChart3 },
    ],
  },
  {
    name: 'Deals',
    href: '/deals',
    icon: Handshake,
    description: 'Negotiate terms',
    children: [
      { name: 'Deal Room', href: '/deals', icon: Handshake },
      { name: 'Deal Intelligence', href: '/deals/intelligence', icon: BarChart3 },
      { name: 'Term Intelligence', href: '/deals/term-intelligence', icon: Brain },
    ],
  },
  {
    name: 'Compliance',
    href: '/compliance',
    icon: ClipboardCheck,
    description: 'Track obligations',
    children: [
      { name: 'Dashboard', href: '/compliance', icon: ClipboardCheck },
      { name: 'Autopilot', href: '/compliance/autopilot', icon: Brain },
      { name: 'Calendar', href: '/compliance/calendar', icon: Calendar },
      { name: 'Covenants', href: '/compliance/covenants', icon: TrendingUp },
      { name: 'Facilities', href: '/compliance/facilities', icon: Building2 },
      { name: 'Benchmarks', href: '/compliance/benchmarks', icon: BarChart3 },
    ],
  },
  {
    name: 'Trading',
    href: '/trading',
    icon: ArrowLeftRight,
    description: 'Due diligence',
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    // Auto-expand the section that contains the current path
    const expanded = new Set<string>();
    navigation.forEach((item) => {
      if (item.children && pathname.startsWith(item.href)) {
        expanded.add(item.name);
      }
    });
    return expanded;
  });

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.children) {
      return item.children.some((child) => pathname === child.href);
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const isChildActive = (child: NavItem): boolean => {
    return pathname === child.href;
  };

  const renderNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.name);
    const isActive = isItemActive(item);

    if (collapsed) {
      // In collapsed mode, show icon only with tooltip
      return (
        <Tooltip key={item.name}>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={cn(
                'flex items-center justify-center p-2.5 rounded-md transition-colors',
                isActive
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              )}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex flex-col gap-1">
            <p className="font-medium">{item.name}</p>
            {item.description && <p className="text-xs text-zinc-500">{item.description}</p>}
            {hasChildren && (
              <div className="mt-1 pt-1 border-t border-zinc-200 space-y-0.5">
                {item.children!.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'block text-xs py-0.5',
                      isChildActive(child) ? 'text-zinc-900 font-medium' : 'text-zinc-500 hover:text-zinc-700'
                    )}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    // Expanded mode
    return (
      <div key={item.name}>
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleExpand(item.name)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                isActive
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left text-sm font-medium">{item.name}</span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
            </button>
            {isExpanded && (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-zinc-200 pl-3">
                {item.children!.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                      isChildActive(child)
                        ? 'bg-zinc-100 text-zinc-900 font-medium'
                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700'
                    )}
                  >
                    <child.icon className="w-4 h-4" />
                    <span>{child.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
              isActive
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{item.name}</span>
              {item.description && (
                <span className="text-xs text-zinc-400">{item.description}</span>
              )}
            </div>
          </Link>
        )}
      </div>
    );
  };

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
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navigation.map(renderNavItem)}
          </nav>

          {/* Collapse Button */}
          <div className="p-3 border-t border-zinc-200">
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
