'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, RefreshCw, Settings, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DataIntegration } from '../lib/types';
import { getIntegrationStatusColor, getAccountingProviderLabel } from '../lib/types';

interface IntegrationSetupDialogProps {
  integrations: DataIntegration[];
  onClose: () => void;
}

function formatTimeAgo(isoString: string | null): string {
  if (!isoString) return 'Never';
  const minutes = Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'active':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-amber-600" />;
    default:
      return <AlertCircle className="w-4 h-4 text-zinc-400" />;
  }
}

export const IntegrationSetupDialog = memo(function IntegrationSetupDialog({
  integrations,
  onClose,
}: IntegrationSetupDialogProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in"
      onClick={onClose}
      data-testid="integration-dialog-overlay"
    >
      <Card
        className="w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
        data-testid="integration-dialog"
      >
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle>Data Integration Management</CardTitle>
            <p className="text-sm text-zinc-500 mt-1">
              Connect to accounting systems for real-time covenant monitoring
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="shrink-0"
            data-testid="close-dialog-btn"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto pt-6">
          <div className="space-y-4">
            {/* Add New Integration Button */}
            <Button className="w-full" data-testid="add-integration-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add New Integration
            </Button>

            {/* Integration List */}
            <div className="space-y-3">
              {integrations.map((integration, idx) => (
                <Card
                  key={integration.id}
                  className={cn(
                    'transition-all animate-in fade-in slide-in-from-bottom-2',
                    integration.status === 'error' && 'border-red-200 bg-red-50/50'
                  )}
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                  data-testid={`integration-item-${integration.id}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-zinc-900">
                            {getAccountingProviderLabel(integration.provider)}
                          </h3>
                          <Badge
                            className={getIntegrationStatusColor(integration.status)}
                            data-testid={`status-badge-${integration.id}`}
                          >
                            {getStatusIcon(integration.status)}
                            <span className="ml-1 capitalize">{integration.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-600">{integration.facility_name}</p>
                        <p className="text-xs text-zinc-500">{integration.borrower_name}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`sync-btn-${integration.id}`}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`settings-btn-${integration.id}`}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-zinc-500">Sync Frequency</p>
                        <p className="font-medium text-zinc-900 capitalize">
                          {integration.sync_frequency.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Last Sync</p>
                        <p className="font-medium text-zinc-900">
                          {formatTimeAgo(integration.last_sync_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Next Sync</p>
                        <p className="font-medium text-zinc-900">
                          {integration.next_sync_at
                            ? formatTimeAgo(integration.next_sync_at)
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {integration.error_message && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <div className="flex items-start gap-2 text-red-700">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Error</p>
                            <p className="text-xs">{integration.error_message}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                          data-testid={`fix-error-btn-${integration.id}`}
                        >
                          Fix Configuration
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>

        <div className="border-t p-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} data-testid="cancel-btn">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
});
