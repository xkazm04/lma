'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Copy,
  Check,
  Download,
  FileText,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TranslatedClause, ExportFormat } from '../lib/types';

interface TranslatedClausePreviewProps {
  clause: TranslatedClause | null;
  isLoading?: boolean;
  onExport?: (format: ExportFormat) => void;
  onRegenerate?: () => void;
  onSelectAlternative?: (alternative: string) => void;
}

export function TranslatedClausePreview({
  clause,
  isLoading = false,
  onExport,
  onRegenerate,
  onSelectAlternative,
}: TranslatedClausePreviewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

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

  if (isLoading) {
    return (
      <Card className="h-full" data-testid="translation-loading">
        <CardContent className="flex flex-col items-center justify-center h-full py-12">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600" />
            <Sparkles className="w-6 h-6 text-amber-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="mt-4 text-zinc-600 font-medium">Generating legal clause...</p>
          <p className="text-sm text-zinc-400">AI is crafting professional legal language</p>
        </CardContent>
      </Card>
    );
  }

  if (!clause) {
    return (
      <Card className="h-full" data-testid="translation-empty">
        <CardContent className="flex flex-col items-center justify-center h-full py-12 text-center">
          <FileText className="w-12 h-12 text-zinc-300 mb-4" />
          <p className="text-zinc-500 font-medium">No clause generated yet</p>
          <p className="text-sm text-zinc-400 mt-1">
            Fill in the form and click &quot;Generate Clause&quot; to create legal language
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col" data-testid="translated-clause-preview">
      {/* Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {clause.clauseTitle}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {clause.suggestedSection}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {clause.category}
              </Badge>
              {getConfidenceBadge(clause.confidence)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                data-testid="regenerate-clause-btn"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 overflow-auto p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'raw')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="preview" data-testid="clause-preview-tab">
              Formatted Preview
            </TabsTrigger>
            <TabsTrigger value="raw" data-testid="clause-raw-tab">
              Raw Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-0">
            {/* Clause Text */}
            <div className="prose prose-sm max-w-none p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <p className="whitespace-pre-wrap">{clause.clauseText}</p>
            </div>

            {/* Warnings */}
            {clause.warnings && clause.warnings.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Drafting Notes</p>
                    <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                      {clause.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Precedent Match */}
            {clause.precedentMatch && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-sm font-medium text-indigo-800">
                  Based on precedent: {clause.precedentMatch.sourceDocument}
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                  {Math.round(clause.precedentMatch.matchPercentage * 100)}% match
                </p>
                {clause.precedentMatch.adaptations.length > 0 && (
                  <ul className="mt-2 text-xs text-indigo-700 list-disc list-inside">
                    {clause.precedentMatch.adaptations.map((adaptation, i) => (
                      <li key={i}>{adaptation}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Alternatives */}
            {clause.alternatives && clause.alternatives.length > 0 && (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="w-full justify-between"
                  data-testid="toggle-alternatives-btn"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Alternative Phrasings ({clause.alternatives.length})
                  </span>
                  {showAlternatives ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>

                {showAlternatives && (
                  <div className="mt-2 space-y-2">
                    {clause.alternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white rounded-lg border border-zinc-200 text-sm"
                      >
                        <p className="text-zinc-600">{alt}</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-1 h-auto p-0 text-xs"
                          onClick={() => onSelectAlternative?.(alt)}
                          data-testid={`use-alternative-${i}-btn`}
                        >
                          Use this version
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="raw" className="mt-0">
            <div className="relative">
              <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-lg overflow-x-auto text-sm font-mono">
                {clause.clauseText}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-100"
                onClick={() => copyToClipboard(clause.clauseText, 'raw')}
                data-testid="copy-raw-text-btn"
              >
                {copiedId === 'raw' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Footer Actions */}
      <div className="border-t p-4 flex items-center justify-between bg-zinc-50">
        <p className="text-xs text-zinc-400">
          Generated with AI - Review before use
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(clause.clauseText, 'main')}
            data-testid="copy-clause-btn"
          >
            {copiedId === 'main' ? (
              <>
                <Check className="w-4 h-4 mr-1 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </>
            )}
          </Button>
          {onExport && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onExport('markdown')}
              data-testid="export-clause-btn"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default TranslatedClausePreview;
