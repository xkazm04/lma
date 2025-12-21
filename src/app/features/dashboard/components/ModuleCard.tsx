'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompactCard } from '@/components/ui/compact-card';
import { cn } from '@/lib/utils';
import type { ModuleItem } from '../lib/mocks';

interface ModuleCardProps {
  module: ModuleItem;
  index?: number;
}

export const ModuleCard = memo(function ModuleCard({ module, index = 0 }: ModuleCardProps) {
  return (
    <CompactCard
      padding="sm"
      className={cn(
        'group transition-all duration-300 ease-out hover:shadow-md hover:scale-[1.01]',
        'animate-in fade-in slide-in-from-bottom-4',
        !module.available && 'opacity-60'
      )}
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-lg transition-transform duration-300 group-hover:scale-110 shrink-0',
            module.color
          )}
        >
          <module.icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-zinc-900 text-sm truncate">{module.name}</h3>
            {!module.available && <Badge variant="secondary" className="text-[10px] shrink-0">Coming Soon</Badge>}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{module.description}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-medium text-zinc-600">{module.metric}</span>
            {module.available && (
              <Link href={module.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs group-hover:bg-zinc-100 transition-colors"
                >
                  Open
                  <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </CompactCard>
  );
});
