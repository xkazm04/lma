'use client';

import React, { memo } from 'react';
import { FileCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Confidence } from '@/components/ui/confidence';
import { mockObligations } from '../lib/mock-data';

export const ObligationsTab = memo(function ObligationsTab() {
  return (
    <div className="space-y-4">
      {mockObligations.map((obligation, index) => (
        <Card
          key={obligation.id}
          className="animate-in fade-in slide-in-from-bottom-2 transition-all duration-200 hover:shadow-md"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
        >
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-100 transition-transform hover:scale-110">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{obligation.description}</h3>
                    <Confidence value={obligation.confidence} variant="badge" />
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">
                    Due within {obligation.deadline_days} days • To: {obligation.recipient_role}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                    <span className="capitalize">{obligation.frequency}</span>
                    <span className="text-zinc-300">•</span>
                    <span>{obligation.clause_reference}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {obligation.obligation_type.replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
