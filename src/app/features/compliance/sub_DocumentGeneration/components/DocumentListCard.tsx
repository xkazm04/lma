'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Eye,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DocumentListItem, DocumentStatus } from '../../lib';
import {
  getDocumentStatusColor,
  getDocumentStatusLabel,
  getTemplateTypeLabel,
} from '../../lib';

interface DocumentListCardProps {
  document: DocumentListItem;
  onView: (documentId: string) => void;
  onSendReminder?: (documentId: string) => void;
  onDownload?: (documentId: string) => void;
}

export const DocumentListCard = memo(function DocumentListCard({
  document,
  onView,
  onSendReminder,
  onDownload,
}: DocumentListCardProps) {
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpiringSoon = document.expires_at && !['completed', 'rejected'].includes(document.status) && (() => {
    const expiresAt = new Date(document.expires_at);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  })();

  const isExpired = document.expires_at && !['completed', 'rejected'].includes(document.status) && (() => {
    return new Date(document.expires_at) < new Date();
  })();

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'pending_signature':
      case 'pending_review':
      case 'partially_signed':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'rejected':
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md cursor-pointer',
        isExpired && 'border-red-200 bg-red-50/30',
        isExpiringSoon && 'border-amber-200 bg-amber-50/30'
      )}
      onClick={() => onView(document.id)}
      data-testid={`document-card-${document.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
              {getStatusIcon(document.status)}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-sm text-zinc-900 truncate">
                  {document.name}
                </h4>
                <Badge className={cn('text-xs', getDocumentStatusColor(document.status))}>
                  {getDocumentStatusLabel(document.status)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                <span>{getTemplateTypeLabel(document.template_type)}</span>
                <span>•</span>
                <span>v{document.version}</span>
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                <span>Generated {formatDate(document.generated_at)}</span>

                {document.status === 'pending_signature' && document.total_signatures > 0 && (
                  <span className="text-blue-600">
                    {document.total_signatures - document.pending_signatures}/{document.total_signatures} signed
                  </span>
                )}

                {isExpiringSoon && document.expires_at && (
                  <span className="text-amber-600 font-medium">
                    Expires {formatDate(document.expires_at)}
                  </span>
                )}

                {isExpired && (
                  <span className="text-red-600 font-medium">
                    Expired
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {document.status === 'pending_signature' && onSendReminder && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendReminder(document.id);
                }}
                title="Send reminder"
                data-testid={`send-reminder-${document.id}`}
              >
                <Send className="w-4 h-4" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`document-actions-${document.id}`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onView(document.id)}
                  data-testid={`view-document-${document.id}`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>

                {onDownload && (
                  <DropdownMenuItem
                    onClick={() => onDownload(document.id)}
                    data-testid={`download-document-${document.id}`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                )}

                {document.status === 'pending_signature' && onSendReminder && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onSendReminder(document.id)}
                      data-testid={`menu-send-reminder-${document.id}`}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Reminder
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
