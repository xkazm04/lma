'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import type {
  DocumentContent,
  DocumentSection,
  DocumentTable,
  CertificationStatement,
  SignatureBlock,
} from '../../lib';
import { getSignerRoleLabel } from '../../lib';

interface DocumentPreviewProps {
  content: DocumentContent;
  className?: string;
  showSignatures?: boolean;
}

export const DocumentPreview = memo(function DocumentPreview({
  content,
  className,
  showSignatures = true,
}: DocumentPreviewProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden',
        className
      )}
      data-testid="document-preview"
    >
      {/* Document Paper */}
      <div className="p-8 md:p-12 min-h-[600px] max-w-[800px] mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-zinc-900 tracking-wide uppercase">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="text-lg text-zinc-600 mt-1">{content.subtitle}</p>
          )}
        </div>

        {/* Document Header Info */}
        {content.header && (
          <div className="mb-8 pb-4 border-b border-zinc-200">
            <PreviewSection section={content.header} isHeader />
          </div>
        )}

        {/* Main Sections */}
        <div className="space-y-6">
          {content.sections.map((section) => (
            <PreviewSection key={section.id} section={section} />
          ))}
        </div>

        {/* Certifications */}
        {content.certifications && content.certifications.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4 uppercase tracking-wide">
              Certifications
            </h3>
            <div className="space-y-4">
              {content.certifications.map((cert, index) => (
                <CertificationItem
                  key={cert.id}
                  certification={cert}
                  index={index + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Signature Blocks */}
        {showSignatures && content.signature_blocks && content.signature_blocks.length > 0 && (
          <div className="mt-12 pt-8 border-t border-zinc-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {content.signature_blocks.map((block) => (
                <SignatureBlockPreview key={block.id} block={block} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {content.footer && content.footer.content && (
          <div className="mt-8 pt-4 border-t border-zinc-200 text-xs text-zinc-500">
            {content.footer.content}
          </div>
        )}
      </div>
    </div>
  );
});

interface PreviewSectionProps {
  section: DocumentSection;
  isHeader?: boolean;
}

const PreviewSection = memo(function PreviewSection({
  section,
  isHeader = false,
}: PreviewSectionProps) {
  return (
    <div className="space-y-3">
      {section.title && !isHeader && (
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">
          {section.title}
        </h3>
      )}

      {section.content && (
        <div className={cn(
          'text-sm leading-relaxed whitespace-pre-wrap',
          isHeader ? 'text-zinc-600' : 'text-zinc-700'
        )}>
          {section.content}
        </div>
      )}

      {section.tables && section.tables.length > 0 && (
        <div className="space-y-4 mt-4">
          {section.tables.map((table) => (
            <PreviewTable key={table.id} table={table} />
          ))}
        </div>
      )}

      {section.subsections && section.subsections.length > 0 && (
        <div className="pl-4 space-y-4 mt-3">
          {section.subsections.map((sub) => (
            <PreviewSection key={sub.id} section={sub} />
          ))}
        </div>
      )}
    </div>
  );
});

interface PreviewTableProps {
  table: DocumentTable;
}

const PreviewTable = memo(function PreviewTable({ table }: PreviewTableProps) {
  return (
    <div className="space-y-2">
      {table.title && (
        <h4 className="text-xs font-medium text-zinc-600">{table.title}</h4>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-zinc-50">
              {table.headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-3 py-2 text-left text-xs font-medium text-zinc-600 border border-zinc-200"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={cn(
                  row.is_highlight && 'bg-amber-50',
                  row.is_total && 'bg-zinc-50 font-medium'
                )}
              >
                {row.cells.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={cn(
                      'px-3 py-2 border border-zinc-200',
                      cell.align === 'right' && 'text-right',
                      cell.align === 'center' && 'text-center',
                      cell.is_bold && 'font-semibold'
                    )}
                  >
                    {cell.format === 'currency' && cell.value}
                    {cell.format === 'percentage' && cell.value}
                    {cell.format === 'number' && cell.value}
                    {(!cell.format || cell.format === 'text') && cell.value}

                    {/* Status indicators */}
                    {cell.value === '✓ Pass' && (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" /> Pass
                      </span>
                    )}
                    {cell.value === '✗ Fail' && (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" /> Fail
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.notes && (
        <p className="text-xs text-zinc-500 italic mt-1">{table.notes}</p>
      )}
    </div>
  );
});

interface CertificationItemProps {
  certification: CertificationStatement;
  index: number;
}

const CertificationItem = memo(function CertificationItem({
  certification,
  index,
}: CertificationItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium text-zinc-600">
        {index}
      </div>
      <div className="flex-1">
        <p className="text-sm text-zinc-700 leading-relaxed">
          {certification.statement}
        </p>
        {certification.is_required && (
          <Badge variant="outline" className="mt-1 text-xs">
            Required
          </Badge>
        )}
      </div>
    </div>
  );
});

interface SignatureBlockPreviewProps {
  block: SignatureBlock;
}

const SignatureBlockPreview = memo(function SignatureBlockPreview({
  block,
}: SignatureBlockPreviewProps) {
  return (
    <div className="space-y-3">
      <div className="border-b border-zinc-900 h-12 flex items-end pb-1">
        <span className="text-sm text-zinc-400 italic">
          {block.placeholder_text}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-900">{block.signer_title}</p>
        <p className="text-xs text-zinc-500">{block.organization}</p>
        <p className="text-xs text-zinc-400">
          Role: {getSignerRoleLabel(block.signer_role)}
        </p>
      </div>
      <div className="flex gap-4 text-xs text-zinc-500">
        <span>Date: _____________</span>
      </div>
    </div>
  );
});
