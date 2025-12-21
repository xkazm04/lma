'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileSearch,
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  Calendar,
  DollarSign,
  Building2,
  Loader2,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { SimilarDocument } from '@/app/features/documents/lib/types';

interface PrecedentFinderProps {
  documentId: string;
  onDocumentSelect?: (document: SimilarDocument) => void;
}

const SimilarityBadge = memo(function SimilarityBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  let variant: 'success' | 'warning' | 'secondary' = 'secondary';

  if (score >= 0.8) {
    variant = 'success';
  } else if (score >= 0.6) {
    variant = 'warning';
  }

  return (
    <Badge variant={variant} className="font-mono" data-testid="similarity-score-badge">
      {percentage}% match
    </Badge>
  );
});

const DocumentCard = memo(function DocumentCard({
  document,
  index,
  isExpanded,
  onToggle,
  onSelect,
}: {
  document: SimilarDocument;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect?: () => void;
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: document.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-2 transition-all duration-200 hover:shadow-md cursor-pointer"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`similar-document-card-${document.id}`}
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <button
              onClick={onToggle}
              className="p-2 rounded-lg bg-blue-100 transition-transform hover:scale-110"
              data-testid={`toggle-document-details-${document.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-blue-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-blue-600" />
              )}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-zinc-900">{document.filename}</h3>
                <SimilarityBadge score={document.similarityScore} />
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {document.borrowerName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(document.date).toLocaleDateString()}
                </span>
                {document.totalCommitment && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {formatCurrency(document.totalCommitment)}
                  </span>
                )}
              </div>
              {/* Matching Terms Preview */}
              <div className="flex flex-wrap gap-1 mt-2">
                {document.matchingTerms.slice(0, 4).map((term, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {term}
                  </Badge>
                ))}
                {document.matchingTerms.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{document.matchingTerms.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/documents/${document.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-500 hover:text-zinc-900"
                data-testid={`view-document-${document.id}`}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
            {onSelect && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSelect}
                data-testid={`select-document-${document.id}`}
              >
                Use as Precedent
              </Button>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-sm text-zinc-600 mb-3">{document.similaritySummary}</p>

            {/* Similarity Score Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-zinc-700">Matching Terms</h4>
              <div className="flex flex-wrap gap-2">
                {document.matchingTerms.map((term, i) => (
                  <Badge key={i} variant="info" className="text-xs">
                    {term}
                  </Badge>
                ))}
              </div>
            </div>

            {document.dealReference && (
              <div className="mt-3 text-sm text-zinc-500">
                <span className="font-medium">Deal Reference:</span> {document.dealReference}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export const PrecedentFinder = memo(function PrecedentFinder({
  documentId,
  onDocumentSelect,
}: PrecedentFinderProps) {
  const [similarDocuments, setSimilarDocuments] = useState<SimilarDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [minSimilarity, setMinSimilarity] = useState(0.5);

  const fetchSimilarDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/documents/${documentId}/similarity?type=similar&minSimilarity=${minSimilarity}`
      );
      const data = await response.json();

      if (data.success) {
        setSimilarDocuments(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch similar documents');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  }, [documentId, minSimilarity]);

  useEffect(() => {
    fetchSimilarDocuments();
  }, [fetchSimilarDocuments]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDocumentSelect = useCallback(
    (document: SimilarDocument) => {
      if (onDocumentSelect) {
        onDocumentSelect(document);
      }
    },
    [onDocumentSelect]
  );

  // Calculate statistics
  const avgSimilarity =
    similarDocuments.length > 0
      ? similarDocuments.reduce((sum, doc) => sum + doc.similarityScore, 0) / similarDocuments.length
      : 0;

  const highMatches = similarDocuments.filter((d) => d.similarityScore >= 0.8).length;
  const moderateMatches = similarDocuments.filter(
    (d) => d.similarityScore >= 0.6 && d.similarityScore < 0.8
  ).length;

  return (
    <div className="space-y-6" data-testid="precedent-finder">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileSearch className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Similar Documents & Precedents</CardTitle>
                <CardDescription>
                  Find similar agreements in your organization&apos;s repository
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSimilarDocuments}
                disabled={isLoading}
                data-testid="refresh-similar-documents-btn"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics Bar */}
          {!isLoading && similarDocuments.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-zinc-50">
                <div className="text-2xl font-bold text-zinc-900">{similarDocuments.length}</div>
                <div className="text-xs text-zinc-500">Similar Documents</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">{highMatches}</div>
                <div className="text-xs text-zinc-500">High Matches (≥80%)</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50">
                <div className="text-2xl font-bold text-amber-600">{moderateMatches}</div>
                <div className="text-xs text-zinc-500">Moderate (60-80%)</div>
              </div>
            </div>
          )}

          {/* Average Similarity Progress */}
          {!isLoading && similarDocuments.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Average Similarity</span>
                <span className="font-medium">{Math.round(avgSimilarity * 100)}%</span>
              </div>
              <Progress value={avgSimilarity * 100} className="h-2" />
            </div>
          )}

          {/* Filter Controls */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-500">Min Similarity:</span>
            </div>
            <div className="flex gap-2">
              {[0.5, 0.6, 0.7, 0.8].map((threshold) => (
                <Button
                  key={threshold}
                  variant={minSimilarity === threshold ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMinSimilarity(threshold)}
                  data-testid={`filter-similarity-${threshold * 100}`}
                >
                  {Math.round(threshold * 100)}%+
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-zinc-500">Searching for similar documents...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSimilarDocuments}
              className="mt-2"
              data-testid="retry-similar-documents-btn"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Document List */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {similarDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
                <p className="text-zinc-500">No similar documents found</p>
                <p className="text-sm text-zinc-400 mt-1">
                  Try lowering the minimum similarity threshold
                </p>
              </CardContent>
            </Card>
          ) : (
            similarDocuments.map((document, index) => (
              <DocumentCard
                key={document.id}
                document={document}
                index={index}
                isExpanded={expandedIds.has(document.id)}
                onToggle={() => toggleExpanded(document.id)}
                onSelect={() => handleDocumentSelect(document)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
});
