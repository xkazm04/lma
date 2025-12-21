'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp } from 'lucide-react';
import type { ESGKPI } from '../lib';

interface TargetsSectionProps {
  kpis: ESGKPI[];
}

export const TargetsSection = memo(function TargetsSection({ kpis }: TargetsSectionProps) {
  const achievedTargets = kpis.reduce(
    (sum, kpi) => sum + kpi.targets.filter((t) => t.target_status === 'achieved').length,
    0
  );
  const totalTargets = kpis.reduce((sum, kpi) => sum + kpi.targets.length, 0);
  const achievementRate = totalTargets > 0 ? (achievedTargets / totalTargets) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Target className="w-5 h-5" />
            Target Achievement Overview
          </CardTitle>
          <CardDescription className="text-blue-700">Progress across all KPIs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-3 rounded-full bg-blue-100 w-fit mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-900">{achievedTargets}</p>
              <p className="text-sm text-blue-700">Targets Achieved</p>
            </div>
            <div className="text-center">
              <div className="p-3 rounded-full bg-blue-100 w-fit mx-auto mb-2">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-900">{totalTargets}</p>
              <p className="text-sm text-blue-700">Total Targets</p>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <p className="text-3xl font-bold text-blue-900">{achievementRate.toFixed(0)}%</p>
                <p className="text-sm text-blue-700 mb-2">Achievement Rate</p>
                <Progress
                  value={achievementRate}
                  className="h-3"
                  animate
                  animationDelay={400}
                  data-testid="targets-achievement-progress"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
