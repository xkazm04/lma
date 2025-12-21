'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import type { HeadroomDistribution } from '../../lib/types';

interface HeadroomDistributionChartProps {
  distributions: HeadroomDistribution[];
}

export function HeadroomDistributionChart({ distributions }: HeadroomDistributionChartProps) {
  return (
    <div className="space-y-4" data-testid="headroom-distribution-chart">
      <h2 className="text-lg font-semibold">Headroom Distribution Analysis</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {distributions.map((dist, idx) => (
          <Card key={idx} className="p-6" data-testid={`distribution-${dist.covenant_type}-${dist.industry}`}>
            <h3 className="font-semibold mb-4">
              {dist.covenant_type.replace(/_/g, ' ')} - {dist.industry}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mean Headroom</span>
                <span className="font-medium">{dist.mean_headroom.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Median Headroom</span>
                <span className="font-medium">{dist.median_headroom.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">At-Risk %</span>
                <span className="font-medium text-red-600">{dist.at_risk_percentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Breached %</span>
                <span className="font-medium">{dist.breached_percentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sample Size</span>
                <span className="font-medium">{dist.sample_size.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
