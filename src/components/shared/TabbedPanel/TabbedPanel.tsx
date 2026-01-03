'use client';

import React, { memo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export interface TabConfig {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'warning' | 'error' | 'success';
  content: React.ReactNode;
}

interface TabbedPanelProps {
  tabs: TabConfig[];
  defaultTab?: string;
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: 'card' | 'inline';
  maxHeight?: string;
  onTabChange?: (tabId: string) => void;
}

/**
 * TabbedPanel - Reusable tabbed container for consolidating related sections
 *
 * Use this component to combine multiple related sections into a single
 * space-efficient tabbed interface.
 */
export const TabbedPanel = memo(function TabbedPanel({
  tabs,
  defaultTab,
  title,
  description,
  headerAction,
  className,
  contentClassName,
  variant = 'card',
  maxHeight,
  onTabChange,
}: TabbedPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  }, [onTabChange]);

  const getBadgeClasses = (badgeVariant?: string) => {
    switch (badgeVariant) {
      case 'warning':
        return 'bg-amber-100 text-amber-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      case 'success':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-zinc-100 text-zinc-600';
    }
  };

  const content = (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList className="bg-zinc-100">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 data-[state=active]:bg-white"
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.5 text-xs font-medium rounded-full',
                    getBadgeClasses(tab.badgeVariant)
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {headerAction}
      </div>

      <div
        className={cn(
          maxHeight && 'overflow-y-auto',
          contentClassName
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0">
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );

  if (variant === 'inline') {
    return (
      <div className={cn('animate-in fade-in', className)}>
        {(title || description) && (
          <div className="mb-4">
            {title && <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>}
            {description && <p className="text-sm text-zinc-500">{description}</p>}
          </div>
        )}
        {content}
      </div>
    );
  }

  return (
    <Card className={cn('animate-in fade-in', className)}>
      {(title || description) && (
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={!title && !description ? 'pt-6' : ''}>
        {content}
      </CardContent>
    </Card>
  );
});

export default TabbedPanel;
