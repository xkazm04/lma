'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EarlyWarningSignal } from '../../lib/types';

interface EarlyWarningSignalsListProps {
  signals: EarlyWarningSignal[];
}

export function EarlyWarningSignalsList({ signals }: EarlyWarningSignalsListProps) {
  return (
    <div className="space-y-4" data-testid="early-warning-signals-list">
      <h2 className="text-lg font-semibold">Early Warning Signals</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {signals.map((signal) => (
          <Card
            key={signal.id}
            className={cn(
              'p-6 border-l-4',
              signal.severity === 'high' && 'border-l-red-500 bg-red-50',
              signal.severity === 'medium' && 'border-l-orange-500 bg-orange-50',
              signal.severity === 'low' && 'border-l-yellow-500 bg-yellow-50'
            )}
            data-testid={`signal-${signal.id}`}
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className={cn(
                  'h-5 w-5 mt-0.5',
                  signal.severity === 'high' && 'text-red-600',
                  signal.severity === 'medium' && 'text-orange-600',
                  signal.severity === 'low' && 'text-yellow-600'
                )} />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{signal.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={signal.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                      {signal.severity} severity
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-sm">{signal.description}</p>

              <div className="bg-white p-3 rounded-lg space-y-2">
                <div className="text-xs"><strong>Interpretation:</strong> {signal.interpretation}</div>
              </div>

              {signal.typical_outcomes.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-1">Typical Outcomes:</div>
                  <ul className="space-y-1">
                    {signal.typical_outcomes.map((outcome, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex gap-2">
                        <span>•</span>
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
