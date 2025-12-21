'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Activity,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import type { AgentStatus } from '../lib/types';

interface AgentStatusPanelProps {
  status: AgentStatus | null;
  isLoading: boolean;
}

export const AgentStatusPanel = memo(function AgentStatusPanel({
  status,
  isLoading,
}: AgentStatusPanelProps) {
  if (isLoading) {
    return (
      <Card data-testid="agent-status-loading">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card data-testid="agent-status-error">
        <CardContent className="p-6 text-center text-zinc-500">
          Unable to load agent status
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="agent-status-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            Compliance Agent
          </CardTitle>
          <Badge
            variant={status.status === 'active' ? 'default' : 'secondary'}
            className="capitalize"
          >
            <Activity className="w-3 h-3 mr-1" />
            {status.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Building2 className="w-4 h-4 text-blue-600" />}
            label="Facilities"
            value={status.summary.total_facilities}
            subValue={
              status.summary.facilities_at_risk > 0
                ? `${status.summary.facilities_at_risk} at risk`
                : undefined
            }
            subValueColor="text-amber-600"
          />
          <StatCard
            icon={<Clock className="w-4 h-4 text-orange-600" />}
            label="Pending Actions"
            value={status.summary.pending_actions}
          />
          <StatCard
            icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
            label="Critical Alerts"
            value={status.summary.critical_alerts}
            valueColor={status.summary.critical_alerts > 0 ? 'text-red-600' : undefined}
          />
          <StatCard
            icon={<CheckCircle className="w-4 h-4 text-amber-600" />}
            label="Warnings"
            value={status.summary.warning_alerts}
            valueColor={status.summary.warning_alerts > 0 ? 'text-amber-600' : undefined}
          />
        </div>

        {/* Agent Capabilities */}
        <div className="pt-2 border-t border-zinc-100">
          <p className="text-xs font-medium text-zinc-500 mb-2">Agent Capabilities</p>
          <div className="flex flex-wrap gap-1">
            {[
              'Natural Language Queries',
              'Waiver Generation',
              'Certificate Generation',
              'Risk Monitoring',
              'Anomaly Detection',
              'Borrower Communication',
            ].map((cap, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {cap}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subValue?: string;
  valueColor?: string;
  subValueColor?: string;
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  valueColor,
  subValueColor,
}: StatCardProps) {
  return (
    <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium text-zinc-500">{label}</span>
      </div>
      <div className={`text-xl font-bold ${valueColor || 'text-zinc-900'}`}>{value}</div>
      {subValue && (
        <div className={`text-xs ${subValueColor || 'text-zinc-500'}`}>{subValue}</div>
      )}
    </div>
  );
}
