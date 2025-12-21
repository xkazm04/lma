'use client';

import React, { memo } from 'react';
import { Plus, Minus, Edit3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChangeType } from '../lib/types';

interface ChangeIconProps {
  type: ChangeType;
}

export const ChangeIcon = memo(function ChangeIcon({ type }: ChangeIconProps) {
  switch (type) {
    case 'added':
      return <Plus className="w-4 h-4 text-green-600" />;
    case 'removed':
      return <Minus className="w-4 h-4 text-red-600" />;
    case 'modified':
      return <Edit3 className="w-4 h-4 text-blue-600" />;
  }
});

interface ChangeBadgeProps {
  type: ChangeType;
}

const badgeConfig = {
  added: { label: 'Added', variant: 'success' as const },
  removed: { label: 'Removed', variant: 'destructive' as const },
  modified: { label: 'Modified', variant: 'info' as const },
};

export const ChangeBadge = memo(function ChangeBadge({ type }: ChangeBadgeProps) {
  const config = badgeConfig[type];
  return <Badge variant={config.variant}>{config.label}</Badge>;
});
