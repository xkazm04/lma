'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AmendmentDraft, AmendmentClause, AmendmentExportFormat } from '../lib/amendment-types';

interface AmendmentDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: AmendmentDraft | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Modal component for previewing and exporting generated amendment drafts
 */
export function AmendmentDraftModal({
  isOpen,
  onClose,
  draft,
  isLoading = false,
  error = null,
}: AmendmentDraftModalProps) {
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'clauses'>('preview');

  const toggleClause = useCallback((clauseId: string) => {
    setExpandedClauses((prev) => {
      const next = new Set(prev);
      if (next.has(clauseId)) {
        next.delete(clauseId);
      } else {
        next.add(clauseId);
      }
      return next;
    });
  }, []);

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleExport = useCallback(
    async (format: AmendmentExportFormat) => {
      if (!draft) return;

      try {
        const encodedDraft = encodeURIComponent(JSON.stringify(draft));
        const response = await fetch(
          `/api/documents/amendment?draft=${encodedDraft}&format=${format}`,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error('Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amendment-${draft.id}.${format === 'markdown' ? 'md' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error('Export error:', err);
      }
    },
    [draft]
  );

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          High Confidence ({Math.round(confidence * 100)}%)
        </Badge>
      );
    } else if (confidence >= 0.7) {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
          Medium Confidence ({Math.round(confidence * 100)}%)
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Low Confidence ({Math.round(confidence * 100)}%)
        </Badge>
      );
    }
  };

  const getChangeTypeBadge = (changeType: 'added' | 'removed' | 'modified') => {
    const styles = {
      added: 'bg-green-100 text-green-800',
      removed: 'bg-red-100 text-red-800',
      modified: 'bg-blue-100 text-blue-800',
    };
    const labels = {
      added: 'Added',
      removed: 'Removed',
      modified: 'Modified',
    };
    return <Badge className={styles[changeType]}>{labels[changeType]}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        data-testid="amendment-draft-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Amendment Draft Generator
            <Sparkles className="w-4 h-4 text-amber-500" />
          </DialogTitle>
          <DialogDescription>
            AI-generated amendment language based on detected document changes
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {isLoading && (
          <div
            className="flex-1 flex flex-col items-center justify-center py-12"
            data-testid="amendment-loading"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
              <Sparkles className="w-6 h-6 text-amber-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="mt-4 text-zinc-600 font-medium">Generating amendment draft...</p>
            <p className="text-sm text-zinc-400">AI is analyzing changes and drafting legal language</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div
            className="flex-1 flex flex-col items-center justify-center py-12"
            data-testid="amendment-error"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-700 font-medium">Failed to generate amendment</p>
            <p className="text-sm text-zinc-500 mt-1">{error}</p>
            <Button variant="outline" className="mt-4" onClick={onClose} data-testid="amendment-error-close-btn">
              Close
            </Button>
          </div>
        )}

        {/* Draft Content */}
        {draft && !isLoading && !error && (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* Summary Header */}
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-900">{draft.title}</h3>
                    <p className="text-sm text-zinc-600 mt-1">
                      Amending: {draft.originalDocument.name} → {draft.amendedDocument.name}
                    </p>
                  </div>
                  {getConfidenceBadge(draft.overallConfidence)}
                </div>
                {draft.summary && (
                  <p className="mt-3 text-sm text-zinc-700 border-t border-blue-200 pt-3">
                    {draft.summary}
                  </p>
                )}
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'clauses')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview" data-testid="amendment-tab-preview">
                    Document Preview
                  </TabsTrigger>
                  <TabsTrigger value="clauses" data-testid="amendment-tab-clauses">
                    Individual Clauses ({draft.clauses.length})
                  </TabsTrigger>
                </TabsList>

                {/* Preview Tab */}
                <TabsContent value="preview" className="mt-4">
                  <div className="prose prose-sm max-w-none bg-white p-6 rounded-lg border border-zinc-200 shadow-inner">
                    {/* Title */}
                    <h2 className="text-center font-bold text-lg mb-6 border-b pb-4">
                      {draft.title}
                    </h2>

                    {/* Effective Date */}
                    <p className="text-center text-sm text-zinc-600 mb-6">
                      Effective as of {draft.effectiveDate}
                    </p>

                    {/* Recitals */}
                    {draft.recitals.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold mb-2">RECITALS</h3>
                        {draft.recitals.map((recital, index) => (
                          <p key={index} className="mb-2">
                            <span className="font-medium">
                              {String.fromCharCode(65 + index)}.
                            </span>{' '}
                            {recital}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Amendment Clauses */}
                    <div className="mb-6">
                      <h3 className="font-semibold mb-4">AMENDMENTS</h3>
                      {draft.clauses.map((clause) => (
                        <div key={clause.id} className="mb-4">
                          <p className="font-medium">
                            Section {clause.sectionNumber}. {clause.title}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{clause.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* General Provisions */}
                    {draft.generalProvisions.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold mb-2">GENERAL PROVISIONS</h3>
                        {draft.generalProvisions.map((provision, index) => (
                          <p key={index} className="mb-2">
                            {index + 1}. {provision}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Signature Block Placeholder */}
                    <div className="border-t pt-6 mt-8">
                      <p className="text-center text-zinc-500 text-sm italic">
                        [Signature pages follow]
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Clauses Tab */}
                <TabsContent value="clauses" className="mt-4 space-y-3">
                  {draft.clauses.map((clause) => (
                    <ClauseCard
                      key={clause.id}
                      clause={clause}
                      isExpanded={expandedClauses.has(clause.id)}
                      onToggle={() => toggleClause(clause.id)}
                      onCopy={() => copyToClipboard(clause.content, clause.id)}
                      isCopied={copiedId === clause.id}
                      getChangeTypeBadge={getChangeTypeBadge}
                      getConfidenceBadge={getConfidenceBadge}
                    />
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer with Export Options */}
            <DialogFooter className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between w-full">
                <p className="text-xs text-zinc-400">
                  Generated at {new Date(draft.generatedAt).toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    data-testid="amendment-close-btn"
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('text')}
                    data-testid="amendment-export-text-btn"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Text
                  </Button>
                  <Button
                    onClick={() => handleExport('markdown')}
                    data-testid="amendment-export-md-btn"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export Draft
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Individual clause card component
 */
interface ClauseCardProps {
  clause: AmendmentClause;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
  isCopied: boolean;
  getChangeTypeBadge: (changeType: 'added' | 'removed' | 'modified') => React.ReactNode;
  getConfidenceBadge: (confidence: number) => React.ReactNode;
}

function ClauseCard({
  clause,
  isExpanded,
  onToggle,
  onCopy,
  isCopied,
  getChangeTypeBadge,
  getConfidenceBadge,
}: ClauseCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isExpanded && 'ring-2 ring-blue-200'
      )}
      data-testid={`amendment-clause-${clause.id}`}
    >
      <CardHeader
        className="cursor-pointer hover:bg-zinc-50 transition-colors py-3"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm font-medium">
              Section {clause.sectionNumber}: {clause.title}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {clause.category}
            </Badge>
            {getChangeTypeBadge(clause.changeType)}
          </div>
          <div className="flex items-center gap-2">
            {getConfidenceBadge(clause.confidence)}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 pb-4">
          {/* Original/New Values */}
          {(clause.originalValue || clause.newValue) && (
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              {clause.originalValue && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs font-medium text-red-700 mb-1">Original Value</p>
                  <p className="text-red-900">{clause.originalValue}</p>
                </div>
              )}
              {clause.newValue && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-medium text-green-700 mb-1">New Value</p>
                  <p className="text-green-900">{clause.newValue}</p>
                </div>
              )}
            </div>
          )}

          {/* Amendment Content */}
          <div className="relative">
            <pre className="text-sm text-zinc-700 whitespace-pre-wrap bg-zinc-50 p-4 rounded-lg border border-zinc-100 font-sans">
              {clause.content}
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              data-testid={`amendment-clause-copy-${clause.id}`}
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Original Clause Reference */}
          {clause.originalClauseReference && (
            <p className="text-xs text-zinc-400 mt-2">
              Reference: {clause.originalClauseReference}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default AmendmentDraftModal;
