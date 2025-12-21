'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, Database, Clock, Award, Download, TrendingUp, Bell, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NetworkContributionStatus } from '../../lib';

interface NetworkContributionCardProps {
  status: NetworkContributionStatus;
}

function getAccessTierBadge(tier: 'basic' | 'standard' | 'premium') {
  switch (tier) {
    case 'premium':
      return <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white">Premium</Badge>;
    case 'standard':
      return <Badge className="bg-blue-100 text-blue-700">Standard</Badge>;
    case 'basic':
      return <Badge variant="outline">Basic</Badge>;
    default:
      return <Badge variant="outline">{tier}</Badge>;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const NetworkContributionCard = memo(function NetworkContributionCard({
  status,
}: NetworkContributionCardProps) {
  // Calculate contribution progress (example thresholds)
  const facilitiesForNextTier = status.access_tier === 'basic' ? 25 :
                                 status.access_tier === 'standard' ? 50 : 100;
  const progressPercentage = Math.min(100, (status.facilities_contributed / facilitiesForNextTier) * 100);

  return (
    <Card className="animate-in fade-in" data-testid="network-contribution-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Network Contribution
            </CardTitle>
            <CardDescription>Your participation in the benchmark network</CardDescription>
          </div>
          {getAccessTierBadge(status.access_tier)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Institution Info */}
        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
          <Building2 className="w-5 h-5 text-zinc-500" />
          <div>
            <p className="text-sm font-medium text-zinc-900">{status.institution_name}</p>
            <p className="text-xs text-zinc-500">Institution ID: {status.institution_id}</p>
          </div>
        </div>

        {/* Contribution Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Database className="w-5 h-5 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold text-zinc-900">{status.facilities_contributed}</p>
            <p className="text-xs text-zinc-500">Facilities</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <TrendingUp className="w-5 h-5 mx-auto text-purple-600 mb-1" />
            <p className="text-lg font-bold text-zinc-900">{status.covenants_contributed}</p>
            <p className="text-xs text-zinc-500">Covenants</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Clock className="w-5 h-5 mx-auto text-green-600 mb-1" />
            <p className="text-sm font-bold text-zinc-900">{formatDate(status.last_contribution_date)}</p>
            <p className="text-xs text-zinc-500">Last Sync</p>
          </div>
        </div>

        {/* Progress to Next Tier (only show if not premium) */}
        {status.access_tier !== 'premium' && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-zinc-500">Progress to Next Tier</span>
              <span className="font-medium text-zinc-900">{status.facilities_contributed}/{facilitiesForNextTier} facilities</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-zinc-400 mt-1">
              Contribute {facilitiesForNextTier - status.facilities_contributed} more facilities to unlock{' '}
              {status.access_tier === 'basic' ? 'Standard' : 'Premium'} access
            </p>
          </div>
        )}

        {/* Access Benefits */}
        <div>
          <p className="text-sm font-medium text-zinc-900 mb-3">Your Access Benefits</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Database className="w-4 h-4" />
                <span>Benchmark Data Access</span>
              </div>
              <Badge variant="outline" className={cn(
                status.benchmark_access_level === 'detailed' && 'bg-green-50 text-green-700 border-green-200',
                status.benchmark_access_level === 'full' && 'bg-blue-50 text-blue-700 border-blue-200',
                status.benchmark_access_level === 'limited' && 'bg-zinc-50 text-zinc-700 border-zinc-200'
              )}>
                {status.benchmark_access_level.charAt(0).toUpperCase() + status.benchmark_access_level.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <TrendingUp className="w-4 h-4" />
                <span>View Historical Trends</span>
              </div>
              {status.can_view_trends ? (
                <Unlock className="w-4 h-4 text-green-600" />
              ) : (
                <Lock className="w-4 h-4 text-zinc-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Bell className="w-4 h-4" />
                <span>Market Alerts</span>
              </div>
              {status.can_receive_alerts ? (
                <Unlock className="w-4 h-4 text-green-600" />
              ) : (
                <Lock className="w-4 h-4 text-zinc-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </div>
              {status.can_export_data ? (
                <Unlock className="w-4 h-4 text-green-600" />
              ) : (
                <Lock className="w-4 h-4 text-zinc-400" />
              )}
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <p className="text-xs text-zinc-500 leading-relaxed">
            <strong className="text-zinc-700">Privacy Guarantee:</strong> All contributed data is anonymized
            before aggregation. Individual facility details and borrower identities are never shared with other
            network participants.
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
