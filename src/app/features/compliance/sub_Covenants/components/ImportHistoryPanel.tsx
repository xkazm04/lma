'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  History,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronRight,
  FileSpreadsheet,
  User,
} from 'lucide-react';
import type { ImportHistoryRecord } from '../lib/bulk-import-types';
import { getImportHistory, formatImportDate } from '../lib/import-history';

interface ImportHistoryPanelProps {
  onViewDetails?: (record: ImportHistoryRecord) => void;
}

export const ImportHistoryPanel = memo(function ImportHistoryPanel({
  onViewDetails,
}: ImportHistoryPanelProps) {
  const history = getImportHistory();

  const getStatusBadge = (status: ImportHistoryRecord['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-amber-100 text-amber-700">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Partial
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
    }
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <History className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
          <p className="text-zinc-500">No import history yet</p>
          <p className="text-sm text-zinc-400">
            Your import history will appear here after you import covenant test data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4" />
          Import History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" data-testid="import-history-list">
          {history.map((record) => (
            <div
              key={record.id}
              className="flex items-center gap-4 p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50 transition-colors"
              data-testid={`import-history-item-${record.id}`}
            >
              <div className="p-2 rounded-lg bg-purple-100">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-zinc-900 truncate">{record.fileName}</p>
                  {getStatusBadge(record.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>{formatImportDate(record.importedAt)}</span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {record.uploadedBy}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-zinc-900">
                  {record.successfulRecords}/{record.totalRecords}
                </p>
                <p className="text-xs text-zinc-500">records imported</p>
              </div>
              {onViewDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(record)}
                  data-testid={`view-history-${record.id}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
