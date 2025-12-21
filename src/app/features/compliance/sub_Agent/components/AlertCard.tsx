'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertOctagon, AlertTriangle, Info, ChevronRight, Bell } from 'lucide-react';
import type { AgentAlert } from '../lib/types';

interface AlertCardProps {
  alert: AgentAlert;
  onAction?: (alert: AgentAlert) => void;
  compact?: boolean;
}

export const AlertCard = memo(function AlertCard({
  alert,
  onAction,
  compact = false,
}: AlertCardProps) {
  const Icon = getAlertIcon(alert.severity);
  const colorClasses = getAlertColors(alert.severity);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border ${colorClasses.border} ${colorClasses.bg}`}
        data-testid={`alert-card-${alert.id}`}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${colorClasses.icon}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${colorClasses.text}`}>
            {alert.title}
          </p>
          <p className="text-xs text-zinc-500 truncate">
            {alert.affected_facilities.join(', ')}
          </p>
        </div>
        {alert.requires_escalation && (
          <Badge variant="destructive" className="text-xs flex-shrink-0">
            Escalate
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card
      className={`border ${colorClasses.border} overflow-hidden`}
      data-testid={`alert-card-${alert.id}`}
    >
      <div className={`px-4 py-2 ${colorClasses.bg} border-b ${colorClasses.border}`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorClasses.icon}`} />
          <span className={`text-sm font-semibold ${colorClasses.text}`}>
            {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)} Alert
          </span>
          {alert.requires_escalation && (
            <Badge variant="destructive" className="text-xs ml-auto">
              Requires Escalation
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h4 className="font-medium text-zinc-900">{alert.title}</h4>
          <p className="text-sm text-zinc-600 mt-1">{alert.description}</p>
        </div>

        {alert.affected_facilities.length > 0 && (
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Affected Facilities</p>
            <div className="flex flex-wrap gap-1">
              {alert.affected_facilities.map((facility, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {facility}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {alert.recommended_actions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Recommended Actions</p>
            <ul className="text-sm text-zinc-600 space-y-1">
              {alert.recommended_actions.slice(0, 3).map((action, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-1 text-zinc-400 flex-shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {onAction && (
          <div className="pt-2">
            <Button
              size="sm"
              variant={alert.requires_escalation ? 'destructive' : 'outline'}
              onClick={() => onAction(alert)}
              className="w-full"
              data-testid={`alert-action-btn-${alert.id}`}
            >
              {alert.requires_escalation ? 'Escalate Now' : 'Take Action'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

function getAlertIcon(severity: AgentAlert['severity']) {
  switch (severity) {
    case 'critical':
      return AlertOctagon;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    default:
      return Bell;
  }
}

function getAlertColors(severity: AgentAlert['severity']) {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: 'text-red-600',
      };
    case 'warning':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: 'text-amber-600',
      };
    case 'info':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: 'text-blue-600',
      };
    default:
      return {
        bg: 'bg-zinc-50',
        border: 'border-zinc-200',
        text: 'text-zinc-700',
        icon: 'text-zinc-600',
      };
  }
}
