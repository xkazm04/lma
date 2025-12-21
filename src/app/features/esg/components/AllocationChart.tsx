'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Leaf, Building2, Target } from 'lucide-react';
import { formatCurrency, type AllocationCategory } from '../lib';

interface AllocationChartProps {
  categories: AllocationCategory[];
}

export const AllocationChart = memo(function AllocationChart({ categories }: AllocationChartProps) {
  const getCategoryIcon = (category: string) => {
    if (category.includes('energy') || category.includes('renewable')) {
      return <Leaf className="w-4 h-4 text-green-600" aria-hidden="true" />;
    }
    if (category.includes('housing') || category.includes('healthcare') || category.includes('education')) {
      return <Building2 className="w-4 h-4 text-purple-600" aria-hidden="true" />;
    }
    return <Target className="w-4 h-4 text-blue-600" aria-hidden="true" />;
  };

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4" data-testid="allocation-chart">
      <CardHeader>
        <CardTitle id="allocation-chart-title">Allocation by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" role="list" aria-labelledby="allocation-chart-title">
          {categories.map((category, index) => {
            const utilization = (category.total_allocated / category.eligible_amount) * 100;
            return (
              <div
                key={category.id}
                className="transition-all duration-300 hover:bg-zinc-50 p-3 rounded-lg animate-in fade-in slide-in-from-left-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                style={{ animationDelay: `${index * 100}ms` }}
                role="listitem"
                data-testid={`allocation-category-${category.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-100" aria-hidden="true">{getCategoryIcon(category.eligible_category)}</div>
                    <div>
                      <p className="font-medium text-zinc-900">{category.category_name}</p>
                      <p className="text-sm text-zinc-500">
                        {category.allocation_count} project{category.allocation_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-zinc-900">
                      {formatCurrency(category.total_allocated)} / {formatCurrency(category.eligible_amount)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress
                        value={utilization}
                        className="h-1.5 w-24"
                        animate
                        animationDelay={index * 100 + 200}
                        data-testid={`allocation-progress-${category.id}`}
                        aria-label={`${category.category_name} utilization: ${utilization.toFixed(0)}%`}
                      />
                      <span className="text-xs text-zinc-500" aria-hidden="true">{utilization.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
