'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  Scale,
  CheckCircle2,
  XCircle,
  Edit3,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileSearch,
  Loader2,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Confidence } from '@/components/ui/confidence';
import { cn } from '@/lib/utils';
import type {
  ExtractedCovenantForCompliance,
  CovenantExtractionResult,
} from '@/lib/llm/covenant-extraction';
import {
  getCovenantTypeLabel,
  formatThresholdValue,
  getTestFrequencyLabel,
} from '@/lib/llm/covenant-extraction';

interface CovenantReviewItem {
  extracted: ExtractedCovenantForCompliance;
  status: 'pending' | 'confirmed' | 'modified' | 'rejected';
  modifications?: Partial<ExtractedCovenantForCompliance>;
}

interface CovenantExtractionReviewProps {
  extraction: CovenantExtractionResult | null;
  isLoading: boolean;
  onExtract: () => void;
  onConfirm: (covenants: CovenantReviewItem[], facilityId: string) => void;
  facilities: Array<{ id: string; name: string; borrowerName: string }>;
}

interface CovenantReviewCardProps {
  covenant: ExtractedCovenantForCompliance;
  index: number;
  status: 'pending' | 'confirmed' | 'modified' | 'rejected';
  onStatusChange: (status: 'confirmed' | 'rejected') => void;
  onModify: (modifications: Partial<ExtractedCovenantForCompliance>) => void;
}

const CovenantReviewCard = memo(function CovenantReviewCard({
  covenant,
  index,
  status,
  onStatusChange,
  onModify,
}: CovenantReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedThreshold, setEditedThreshold] = useState(covenant.thresholdValue.toString());
  const [editedFrequency, setEditedFrequency] = useState(covenant.testFrequency);

  const handleSaveEdits = useCallback(() => {
    onModify({
      thresholdValue: parseFloat(editedThreshold),
      testFrequency: editedFrequency,
    });
    setIsEditing(false);
  }, [editedThreshold, editedFrequency, onModify]);

  const statusBadge = useMemo(() => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      case 'modified':
        return (
          <Badge variant="warning" className="gap-1">
            <Edit3 className="w-3 h-3" />
            Modified
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            Pending Review
          </Badge>
        );
    }
  }, [status]);

  return (
    <Card
      className={cn(
        'transition-all animate-in fade-in slide-in-from-bottom-2',
        status === 'confirmed' && 'border-green-200 bg-green-50/30',
        status === 'rejected' && 'border-red-200 bg-red-50/30 opacity-60',
        status === 'modified' && 'border-amber-200 bg-amber-50/30'
      )}
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
      data-testid={`covenant-review-card-${index}`}
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-2 rounded-lg bg-purple-100 shrink-0">
              <Scale className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-zinc-900">{covenant.covenantName}</h3>
                {statusBadge}
                <Confidence value={covenant.confidence} variant="badge" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <div>
                  <p className="text-xs text-zinc-500">Type</p>
                  <p className="text-sm font-medium">{getCovenantTypeLabel(covenant.covenantType)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Threshold</p>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editedThreshold}
                      onChange={(e) => setEditedThreshold(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded"
                      data-testid={`covenant-threshold-input-${index}`}
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {covenant.thresholdType === 'maximum' ? 'Max' : 'Min'}:{' '}
                      {formatThresholdValue(covenant.thresholdValue, covenant.covenantType)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Test Frequency</p>
                  {isEditing ? (
                    <select
                      value={editedFrequency}
                      onChange={(e) => setEditedFrequency(e.target.value as 'monthly' | 'quarterly' | 'annually')}
                      className="w-full px-2 py-1 text-sm border rounded"
                      data-testid={`covenant-frequency-select-${index}`}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium">{getTestFrequencyLabel(covenant.testFrequency)}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Clause Reference</p>
                  <p className="text-sm font-medium">{covenant.clauseReference}</p>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-1">Calculation Methodology</p>
                    <p className="text-sm text-zinc-700 bg-zinc-50 p-2 rounded">
                      {covenant.calculationMethodology}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-1">Numerator</p>
                      <p className="text-sm text-zinc-700 bg-zinc-50 p-2 rounded">
                        {covenant.numeratorDefinition}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-1">Denominator</p>
                      <p className="text-sm text-zinc-700 bg-zinc-50 p-2 rounded">
                        {covenant.denominatorDefinition}
                      </p>
                    </div>
                  </div>
                  {covenant.rawText && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-1">Source Text (Page {covenant.pageNumber})</p>
                      <p className="text-xs text-zinc-600 bg-zinc-50 p-2 rounded italic line-clamp-4">
                        &quot;{covenant.rawText}&quot;
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid={`covenant-expand-btn-${index}`}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-zinc-100">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                data-testid={`covenant-cancel-edit-btn-${index}`}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdits}
                data-testid={`covenant-save-edit-btn-${index}`}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={status === 'rejected'}
                data-testid={`covenant-edit-btn-${index}`}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange('rejected')}
                className={cn(status === 'rejected' && 'bg-red-100')}
                data-testid={`covenant-reject-btn-${index}`}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onStatusChange('confirmed')}
                className={cn(status === 'confirmed' && 'bg-green-600')}
                data-testid={`covenant-confirm-btn-${index}`}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Confirm
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export const CovenantExtractionReview = memo(function CovenantExtractionReview({
  extraction,
  isLoading,
  onExtract,
  onConfirm,
  facilities,
}: CovenantExtractionReviewProps) {
  const [reviewItems, setReviewItems] = useState<CovenantReviewItem[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');

  // Initialize review items when extraction changes
  React.useEffect(() => {
    if (extraction) {
      setReviewItems(
        extraction.extractedCovenants.map((covenant) => ({
          extracted: covenant,
          status: 'pending',
        }))
      );
    }
  }, [extraction]);

  const handleStatusChange = useCallback((index: number, status: 'confirmed' | 'rejected') => {
    setReviewItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, status } : item
      )
    );
  }, []);

  const handleModify = useCallback((index: number, modifications: Partial<ExtractedCovenantForCompliance>) => {
    setReviewItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              status: 'modified',
              modifications,
              extracted: { ...item.extracted, ...modifications },
            }
          : item
      )
    );
  }, []);

  const handleConfirmAll = useCallback(() => {
    setReviewItems((prev) =>
      prev.map((item) =>
        item.status === 'pending' ? { ...item, status: 'confirmed' } : item
      )
    );
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedFacilityId) return;
    onConfirm(reviewItems, selectedFacilityId);
  }, [reviewItems, selectedFacilityId, onConfirm]);

  const stats = useMemo(() => {
    const confirmed = reviewItems.filter((r) => r.status === 'confirmed' || r.status === 'modified').length;
    const rejected = reviewItems.filter((r) => r.status === 'rejected').length;
    const pending = reviewItems.filter((r) => r.status === 'pending').length;
    return { confirmed, rejected, pending, total: reviewItems.length };
  }, [reviewItems]);

  if (!extraction && !isLoading) {
    return (
      <Card className="animate-in fade-in" data-testid="covenant-extraction-empty">
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
            <FileSearch className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">
            Extract Covenants for Compliance Tracking
          </h3>
          <p className="text-zinc-500 mb-6 max-w-md mx-auto">
            Use AI to automatically identify and extract financial covenants from this credit agreement.
            Extracted covenants can be imported directly into the Compliance Tracker module.
          </p>
          <Button onClick={onExtract} size="lg" data-testid="start-covenant-extraction-btn">
            <Scale className="w-5 h-5 mr-2" />
            Extract Covenants
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="animate-in fade-in" data-testid="covenant-extraction-loading">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto text-purple-600 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">
            Analyzing Credit Agreement...
          </h3>
          <p className="text-zinc-500">
            AI is identifying financial covenants, thresholds, and calculation methodologies.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in" data-testid="covenant-extraction-review">
      {/* Header with stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Covenant Extraction Review</CardTitle>
                <p className="text-sm text-zinc-500 mt-1">
                  {extraction?.facilityName} • {extraction?.borrowerName}
                </p>
              </div>
            </div>
            <Confidence
              value={extraction?.overallConfidence ?? 0}
              variant="badge"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-zinc-50 rounded-lg">
              <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
              <p className="text-xs text-zinc-500">Total Found</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              <p className="text-xs text-zinc-500">Confirmed</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-xs text-zinc-500">Rejected</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-xs text-zinc-500">Pending</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-zinc-500 mb-2">
              <span>Review Progress</span>
              <span>{Math.round(((stats.confirmed + stats.rejected) / stats.total) * 100)}%</span>
            </div>
            <Progress
              value={((stats.confirmed + stats.rejected) / stats.total) * 100}
              animate
              className="h-2"
            />
          </div>

          {extraction?.warnings && extraction.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Extraction Warnings</span>
              </div>
              <ul className="text-sm text-amber-600 space-y-1">
                {extraction.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Covenant Cards */}
      <div className="space-y-4">
        {reviewItems.map((item, index) => (
          <CovenantReviewCard
            key={index}
            covenant={item.extracted}
            index={index}
            status={item.status}
            onStatusChange={(status) => handleStatusChange(index, status)}
            onModify={(mods) => handleModify(index, mods)}
          />
        ))}
      </div>

      {/* Action Bar */}
      <Card className="sticky bottom-4 shadow-lg">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label htmlFor="facility-select" className="text-sm font-medium text-zinc-700 block mb-1">
                  Target Compliance Facility
                </label>
                <select
                  id="facility-select"
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="w-64 px-3 py-2 border rounded-md text-sm"
                  data-testid="facility-select"
                >
                  <option value="">Select a facility...</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} - {f.borrowerName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleConfirmAll}
                disabled={stats.pending === 0}
                data-testid="confirm-all-btn"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm All Pending
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedFacilityId || stats.confirmed === 0}
                data-testid="import-covenants-btn"
              >
                Import {stats.confirmed} Covenants
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
