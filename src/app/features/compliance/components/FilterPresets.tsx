'use client';

import React, { memo } from 'react';
import { AlertTriangle, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FilterPreset } from '../lib/useFilterPersistence';

interface FilterPresetsProps {
  presets: FilterPreset[];
  onApplyPreset: (presetId: string) => void;
  isPresetActive: (presetId: string) => boolean;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'alert-triangle': AlertTriangle,
  calendar: Calendar,
  building: Building2,
};

export const FilterPresets = memo(function FilterPresets({
  presets,
  onApplyPreset,
  isPresetActive,
  className,
}: FilterPresetsProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      data-testid="filter-presets"
    >
      <span className="text-sm text-zinc-500 mr-1">Quick filters:</span>
      {presets.map((preset) => {
        const Icon = preset.icon ? iconMap[preset.icon] : null;
        const isActive = isPresetActive(preset.id);

        return (
          <Button
            key={preset.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onApplyPreset(preset.id)}
            className={cn(
              'h-8 text-xs transition-all',
              isActive
                ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                : 'hover:bg-zinc-100 hover:border-zinc-300'
            )}
            title={preset.description}
            data-testid={`preset-${preset.id}`}
          >
            {Icon && <Icon className={cn('w-3.5 h-3.5 mr-1.5', isActive ? 'text-white' : getIconColor(preset.id))} />}
            {preset.label}
          </Button>
        );
      })}
    </div>
  );
});

function getIconColor(presetId: string): string {
  switch (presetId) {
    case 'needs_attention':
      return 'text-amber-500';
    case 'due_this_week':
      return 'text-blue-500';
    case 'my_facilities':
      return 'text-purple-500';
    default:
      return 'text-zinc-500';
  }
}
