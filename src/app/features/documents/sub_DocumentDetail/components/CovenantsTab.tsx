'use client';

import React, { memo } from 'react';
import { Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Confidence } from '@/components/ui/confidence';
import { mockCovenants, formatCurrency } from '../lib/mock-data';

export const CovenantsTab = memo(function CovenantsTab() {
  return (
    <div className="space-y-4">
      {mockCovenants.map((covenant, index) => (
        <Card
          key={covenant.id}
          className="animate-in fade-in slide-in-from-bottom-2 transition-all duration-200 hover:shadow-md"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
        >
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-amber-100 transition-transform hover:scale-110">
                  <Scale className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{covenant.covenant_name}</h3>
                    <Confidence value={covenant.confidence} variant="badge" />
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">
                    {covenant.threshold_type === 'maximum' ? 'Maximum' : 'Minimum'}:{' '}
                    {covenant.covenant_type === 'capex_limit'
                      ? formatCurrency(covenant.threshold_value)
                      : `${covenant.threshold_value}x`}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                    <span>Testing: {covenant.testing_frequency}</span>
                    <span className="text-zinc-300">•</span>
                    <span>{covenant.clause_reference}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {covenant.covenant_type.replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
