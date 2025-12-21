'use client';

import React, { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Download,
  Copy,
  CheckCircle,
  XCircle,
  Building2,
  Calendar,
  User,
} from 'lucide-react';
import type { GeneratedDocument } from '../lib/types';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: GeneratedDocument | null;
  onDownload?: () => void;
  onCopy?: () => void;
}

export const DocumentPreviewModal = memo(function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
  onDownload,
  onCopy,
}: DocumentPreviewModalProps) {
  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Generated {formatDocumentType(document.document_type)}
              </DialogTitle>
              <DialogDescription>
                Generated on {new Date(document.generated_at).toLocaleString()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {document.document_type === 'waiver' && (
            <WaiverPreview document={document.document} />
          )}
          {document.document_type === 'certificate' && (
            <CertificatePreview document={document.document} />
          )}
          {document.document_type === 'communication' && (
            <CommunicationPreview document={document.document} />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCopy} data-testid="copy-document-btn">
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button onClick={onDownload} data-testid="download-document-btn">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

function formatDocumentType(type: string): string {
  switch (type) {
    case 'waiver':
      return 'Waiver Request';
    case 'certificate':
      return 'Compliance Certificate';
    case 'communication':
      return 'Borrower Communication';
    default:
      return 'Document';
  }
}

interface WaiverPreviewProps {
  document: Record<string, unknown>;
}

function WaiverPreview({ document }: WaiverPreviewProps) {
  const waiver = document as {
    subject?: string;
    facility_name?: string;
    borrower_name?: string;
    covenant_name?: string;
    waiver_type?: string;
    requested_period?: { start?: string; end?: string };
    justification?: string;
    conditions?: string[];
    content?: string;
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="grid grid-cols-2 gap-4">
        <InfoRow icon={<Building2 />} label="Facility" value={waiver.facility_name} />
        <InfoRow icon={<User />} label="Borrower" value={waiver.borrower_name} />
        <InfoRow icon={<FileText />} label="Covenant" value={waiver.covenant_name} />
        <InfoRow
          icon={<Calendar />}
          label="Waiver Period"
          value={
            waiver.requested_period
              ? `${waiver.requested_period.start} to ${waiver.requested_period.end}`
              : undefined
          }
        />
      </div>

      <Separator />

      {/* Subject */}
      {waiver.subject && (
        <div>
          <p className="text-sm font-medium text-zinc-500 mb-1">Subject</p>
          <p className="text-sm font-semibold">{waiver.subject}</p>
        </div>
      )}

      {/* Justification */}
      {waiver.justification && (
        <div>
          <p className="text-sm font-medium text-zinc-500 mb-1">Justification</p>
          <p className="text-sm text-zinc-700">{waiver.justification}</p>
        </div>
      )}

      {/* Conditions */}
      {waiver.conditions && waiver.conditions.length > 0 && (
        <div>
          <p className="text-sm font-medium text-zinc-500 mb-1">Suggested Conditions</p>
          <ul className="text-sm text-zinc-700 space-y-1">
            {waiver.conditions.map((condition, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                {condition}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full Content */}
      {waiver.content && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-zinc-500 mb-2">Full Waiver Letter</p>
            <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans">
              {waiver.content}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CertificatePreviewProps {
  document: Record<string, unknown>;
}

function CertificatePreview({ document }: CertificatePreviewProps) {
  const cert = document as {
    facility_name?: string;
    borrower_name?: string;
    period?: string;
    certification_date?: string;
    covenant_results?: Array<{
      covenant_name?: string;
      required_threshold?: number;
      actual_value?: number;
      status?: 'pass' | 'fail';
      headroom_percentage?: number;
    }>;
    officer_certification?: string;
    additional_disclosures?: string[];
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="grid grid-cols-2 gap-4">
        <InfoRow icon={<Building2 />} label="Facility" value={cert.facility_name} />
        <InfoRow icon={<User />} label="Borrower" value={cert.borrower_name} />
        <InfoRow icon={<Calendar />} label="Period" value={cert.period} />
        <InfoRow
          icon={<Calendar />}
          label="Certification Date"
          value={cert.certification_date}
        />
      </div>

      <Separator />

      {/* Covenant Results */}
      {cert.covenant_results && cert.covenant_results.length > 0 && (
        <div>
          <p className="text-sm font-medium text-zinc-500 mb-2">Covenant Test Results</p>
          <div className="space-y-2">
            {cert.covenant_results.map((result, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-100"
              >
                <div className="flex items-center gap-3">
                  {result.status === 'pass' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{result.covenant_name}</p>
                    <p className="text-xs text-zinc-500">
                      Required: {result.required_threshold} | Actual: {result.actual_value}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={result.status === 'pass' ? 'default' : 'destructive'}>
                    {result.status?.toUpperCase()}
                  </Badge>
                  {result.headroom_percentage !== undefined && (
                    <p className="text-xs text-zinc-500 mt-1">
                      {result.headroom_percentage}% headroom
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certification Statement */}
      {cert.officer_certification && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-zinc-500 mb-2">
              Officer Certification
            </p>
            <p className="text-sm text-zinc-700 italic">{cert.officer_certification}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CommunicationPreviewProps {
  document: Record<string, unknown>;
}

function CommunicationPreview({ document }: CommunicationPreviewProps) {
  const comm = document as {
    subject?: string;
    content?: string;
    recipients?: string[];
  };

  return (
    <div className="space-y-4">
      {/* Subject */}
      {comm.subject && (
        <div>
          <p className="text-sm font-medium text-zinc-500 mb-1">Subject</p>
          <p className="text-sm font-semibold">{comm.subject}</p>
        </div>
      )}

      {/* Recipients */}
      {comm.recipients && comm.recipients.length > 0 && (
        <div>
          <p className="text-sm font-medium text-zinc-500 mb-1">Recipients</p>
          <div className="flex flex-wrap gap-1">
            {comm.recipients.map((recipient, idx) => (
              <Badge key={idx} variant="outline">
                {recipient}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Content */}
      {comm.content && (
        <Card>
          <CardContent className="p-4">
            <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans">
              {comm.content}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-400">{icon}</span>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
