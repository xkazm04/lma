'use client';

import React, { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Calendar, FileText, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Covenant, WaiverPriority } from '../../lib';

export interface WaiverRequestData {
  covenant_id: string;
  covenant_name: string;
  covenant_type: string;
  facility_id: string;
  facility_name: string;
  borrower_name: string;
  triggering_test: {
    test_date: string;
    calculated_ratio: number;
    threshold: number;
    headroom_percentage: number;
  };
  priority: WaiverPriority;
  request_reason: string;
  justification: string;
}

interface WaiverRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  covenant: Covenant | null;
  onSubmit?: (data: WaiverRequestData) => void;
}

const PRIORITY_OPTIONS: { value: WaiverPriority; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Non-urgent, can wait for regular review cycle' },
  { value: 'medium', label: 'Medium', description: 'Should be addressed within normal timeline' },
  { value: 'high', label: 'High', description: 'Urgent, requires prompt attention' },
  { value: 'critical', label: 'Critical', description: 'Immediate action required' },
];

function formatThreshold(value: number, type: string): string {
  if (type === 'minimum_liquidity' || type === 'capex' || type === 'net_worth') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return `${value.toFixed(2)}x`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const WaiverRequestModal = memo(function WaiverRequestModal({
  open,
  onOpenChange,
  covenant,
  onSubmit,
}: WaiverRequestModalProps) {
  const [priority, setPriority] = useState<WaiverPriority>('high');
  const [requestReason, setRequestReason] = useState('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!covenant) return null;

  const handleSubmit = async () => {
    if (!requestReason.trim() || !justification.trim()) return;

    setIsSubmitting(true);

    const data: WaiverRequestData = {
      covenant_id: covenant.id,
      covenant_name: covenant.name,
      covenant_type: covenant.covenant_type,
      facility_id: covenant.facility_id,
      facility_name: covenant.facility_name,
      borrower_name: covenant.borrower_name,
      triggering_test: {
        test_date: covenant.latest_test.test_date,
        calculated_ratio: covenant.latest_test.calculated_ratio,
        threshold: covenant.current_threshold,
        headroom_percentage: covenant.latest_test.headroom_percentage,
      },
      priority,
      request_reason: requestReason,
      justification,
    };

    try {
      onSubmit?.(data);
      // Reset form
      setRequestReason('');
      setJustification('');
      setPriority('high');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = requestReason.trim().length > 0 && justification.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="waiver-request-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Request Waiver
          </DialogTitle>
          <DialogDescription>
            Submit a waiver request for the breached covenant. All fields are required.
          </DialogDescription>
        </DialogHeader>

        {/* Pre-filled Covenant Information */}
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="breach-summary">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-red-900 mb-1">Covenant Breach Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-red-600">Covenant</p>
                    <p className="font-medium text-red-900">{covenant.name}</p>
                  </div>
                  <div>
                    <p className="text-red-600">Facility</p>
                    <p className="font-medium text-red-900">{covenant.facility_name}</p>
                  </div>
                  <div>
                    <p className="text-red-600">Borrower</p>
                    <p className="font-medium text-red-900">{covenant.borrower_name}</p>
                  </div>
                  <div>
                    <p className="text-red-600">Covenant Type</p>
                    <p className="font-medium text-red-900 capitalize">
                      {covenant.covenant_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Triggering Test Details */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4" data-testid="triggering-test">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-zinc-600" />
              <h4 className="font-medium text-zinc-900">Triggering Test</h4>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-zinc-500">Test Date</p>
                <p className="font-medium text-zinc-900">
                  {formatDate(covenant.latest_test.test_date)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Threshold</p>
                <p className="font-medium text-zinc-900">
                  {covenant.threshold_type === 'maximum' ? 'Max' : 'Min'}:{' '}
                  {formatThreshold(covenant.current_threshold, covenant.covenant_type)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Actual Value</p>
                <p className="font-medium text-zinc-900">
                  {formatThreshold(covenant.latest_test.calculated_ratio, covenant.covenant_type)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Breach Amount</p>
                <p className="font-medium text-red-600">
                  {covenant.latest_test.headroom_percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Priority Selection */}
          <div data-testid="priority-selection">
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Priority Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all',
                    priority === option.value
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-zinc-200 hover:border-zinc-300'
                  )}
                  data-testid={`priority-${option.value}`}
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        option.value === 'low' && 'bg-zinc-100 text-zinc-700',
                        option.value === 'medium' && 'bg-blue-100 text-blue-700',
                        option.value === 'high' && 'bg-amber-100 text-amber-700',
                        option.value === 'critical' && 'bg-red-100 text-red-700'
                      )}
                    >
                      {option.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Request Reason */}
          <div data-testid="request-reason-section">
            <label htmlFor="request-reason" className="block text-sm font-medium text-zinc-900 mb-2">
              Request Reason <span className="text-red-500">*</span>
            </label>
            <input
              id="request-reason"
              type="text"
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="Brief description of why a waiver is needed..."
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="request-reason-input"
            />
          </div>

          {/* Justification */}
          <div data-testid="justification-section">
            <label htmlFor="justification" className="block text-sm font-medium text-zinc-900 mb-2">
              Detailed Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Provide detailed justification for the waiver request, including any mitigating circumstances, remediation plans, or other relevant information..."
              rows={4}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              data-testid="justification-input"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            data-testid="waiver-request-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            data-testid="waiver-request-submit-btn"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
