'use client';

import React, { memo } from 'react';
import { Zap, Pause, Brain, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AutopilotStatus } from '../lib/mocks';

interface AutopilotStatusBadgeProps {
  status: AutopilotStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const statusConfig: Record<
  AutopilotStatus,
  {
    icon: typeof Zap;
    label: string;
    color: string;
    bgColor: string;
    pulseColor: string;
  }
> = {
  active: {
    icon: Zap,
    label: 'Active',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    pulseColor: 'bg-green-400',
  },
  paused: {
    icon: Pause,
    label: 'Paused',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    pulseColor: 'bg-amber-400',
  },
  learning: {
    icon: Brain,
    label: 'Learning',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    pulseColor: 'bg-blue-400',
  },
  disabled: {
    icon: Power,
    label: 'Disabled',
    color: 'text-zinc-500',
    bgColor: 'bg-zinc-100',
    pulseColor: 'bg-zinc-400',
  },
};

const sizeConfig = {
  sm: {
    badge: 'text-[10px] px-1.5 py-0.5',
    icon: 'w-2.5 h-2.5',
    pulse: 'w-1.5 h-1.5',
  },
  md: {
    badge: 'text-xs px-2 py-0.5',
    icon: 'w-3 h-3',
    pulse: 'w-2 h-2',
  },
  lg: {
    badge: 'text-sm px-2.5 py-1',
    icon: 'w-4 h-4',
    pulse: 'w-2.5 h-2.5',
  },
};

export const AutopilotStatusBadge = memo(function AutopilotStatusBadge({
  status,
  showLabel = true,
  size = 'md',
  animated = true,
}: AutopilotStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeConf = sizeConfig[size];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={cn(
        'flex items-center gap-1.5 font-medium',
        config.bgColor,
        config.color,
        sizeConf.badge
      )}
      data-testid={`autopilot-status-${status}`}
    >
      <div className="relative flex items-center justify-center">
        {animated && status === 'active' && (
          <span
            className={cn(
              'absolute inline-flex rounded-full opacity-75 animate-ping',
              config.pulseColor,
              sizeConf.pulse
            )}
          />
        )}
        <Icon className={cn(sizeConf.icon, 'relative')} />
      </div>
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
});
