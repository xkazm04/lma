'use client';

import React, { memo } from 'react';
import { Building2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockFacility, formatCurrency } from '../lib/mock-data';

export const PartiesTab = memo(function PartiesTab() {
  return (
    <div className="space-y-6">
      {/* Borrowers */}
      <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Borrowers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockFacility.borrowers.map((borrower, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 transition-all duration-200 hover:bg-zinc-100"
              >
                <div>
                  <p className="font-medium">{borrower.name}</p>
                  <p className="text-sm text-zinc-500">{borrower.jurisdiction}</p>
                </div>
                <Badge variant="outline">{borrower.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lenders */}
      <Card
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ animationDelay: '100ms', animationFillMode: 'both' }}
      >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lenders ({mockFacility.lenders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockFacility.lenders.map((lender, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 transition-all duration-200 hover:bg-zinc-100"
              >
                <div>
                  <p className="font-medium">{lender.name}</p>
                  <p className="text-sm text-zinc-500">
                    {formatCurrency(lender.commitment_amount)} ({lender.percentage}%)
                  </p>
                </div>
                <div className="w-24">
                  <Progress value={lender.percentage} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agents */}
      <Card
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ animationDelay: '200ms', animationFillMode: 'both' }}
      >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockFacility.agents.map((agent, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 transition-all duration-200 hover:bg-zinc-100"
              >
                <p className="font-medium">{agent.name}</p>
                <Badge variant="secondary">{agent.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
