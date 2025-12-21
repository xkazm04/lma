'use client';

import React, { useMemo, useCallback, memo, useState, Suspense } from 'react';
import Link from 'next/link';
import { BarChart3, Upload, History, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ComplianceFiltersBar } from '../components';
import { mockCovenants, useFilterPersistence, FILTER_PRESETS, DEFAULT_AT_RISK_HEADROOM_THRESHOLD } from '../lib';
import type { Covenant, CovenantTestResult } from '../lib/types';
import {
  CovenantCard,
  CovenantStatsBar,
  BulkImportDialog,
  ImportHistoryPanel,
} from './components';
import { addImportHistory } from './lib/import-history';
import type { ValidatedCovenantTest } from './lib/bulk-import-types';

/**
 * Merges imported covenant tests into the existing covenants state.
 * Updates latest_test and adds to test_history for matched covenants.
 */
function mergeImportedTests(
  existingCovenants: Covenant[],
  importedTests: ValidatedCovenantTest[]
): Covenant[] {
  // Build a map for quick lookup of covenants by ID
  const covenantMap = new Map(existingCovenants.map((c) => [c.id, { ...c }]));

  // Process each valid imported test
  for (const test of importedTests) {
    if (!test.validation.isValid || !test.validation.matchedCovenant) {
      continue;
    }

    const covenantId = test.validation.matchedCovenant.id;
    const covenant = covenantMap.get(covenantId);

    if (!covenant) {
      continue;
    }

    // Determine test result based on threshold comparison
    const { thresholdType, currentThreshold } = test.validation.matchedCovenant;
    let testResult: 'pass' | 'fail' = test.testResult || 'pass';
    let headroomPercentage = test.validation.calculatedHeadroom ?? 0;
    let headroomAbsolute = 0;

    if (thresholdType === 'maximum') {
      // For maximum thresholds, value must be <= threshold
      testResult = test.calculatedValue <= currentThreshold ? 'pass' : 'fail';
      headroomPercentage = ((currentThreshold - test.calculatedValue) / currentThreshold) * 100;
      headroomAbsolute = currentThreshold - test.calculatedValue;
    } else {
      // For minimum thresholds, value must be >= threshold
      testResult = test.calculatedValue >= currentThreshold ? 'pass' : 'fail';
      headroomPercentage = ((test.calculatedValue - currentThreshold) / currentThreshold) * 100;
      headroomAbsolute = test.calculatedValue - currentThreshold;
    }

    // Create the new test result
    const newTestResult: CovenantTestResult = {
      test_date: test.testDate,
      calculated_ratio: test.calculatedValue,
      test_result: testResult,
      headroom_percentage: Math.round(headroomPercentage * 10) / 10,
      headroom_absolute: Math.round(headroomAbsolute * 100) / 100,
    };

    // Update the covenant with the new test
    const existingHistory = covenant.test_history || [];

    // Check if this test date already exists (update instead of duplicate)
    const existingTestIndex = existingHistory.findIndex(
      (t) => t.test_date === test.testDate
    );

    if (existingTestIndex >= 0) {
      // Update existing test
      existingHistory[existingTestIndex] = newTestResult;
    } else {
      // Add new test to history
      existingHistory.push(newTestResult);
    }

    // Sort history by date (newest first for latest_test determination)
    existingHistory.sort(
      (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
    );

    // Update covenant with new test data
    covenant.test_history = existingHistory;
    covenant.latest_test = existingHistory[0]; // Most recent test

    // Update covenant status based on test result if the latest test failed
    if (covenant.latest_test.test_result === 'fail' && covenant.status === 'active') {
      // Note: In production, you'd want a more sophisticated status update mechanism
      // that considers waiver status, etc.
    }

    covenantMap.set(covenantId, covenant);
  }

  return Array.from(covenantMap.values());
}

// Covenant-specific presets
const COVENANT_PRESETS = FILTER_PRESETS.map((preset) => {
  // Adjust presets for covenant context
  if (preset.id === 'needs_attention') {
    return {
      ...preset,
      description: 'At risk, failing, or breached covenants',
    };
  }
  return preset;
});

function CovenantsPageContent() {
  const {
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    applyPreset,
    isPresetActive,
    activeFilters,
  } = useFilterPersistence();

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Local state for covenants - initialized from mock data
  // In production, this would be fetched from an API
  const [covenants, setCovenants] = useState<Covenant[]>(() => mockCovenants);

  // Track import success for showing a notification
  const [lastImportResult, setLastImportResult] = useState<{
    count: number;
    timestamp: number;
  } | null>(null);

  const filteredCovenants = useMemo(() => {
    return covenants.filter((covenant) => {
      const matchesSearch =
        filters.search === '' ||
        covenant.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        covenant.facility_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        covenant.borrower_name.toLowerCase().includes(filters.search.toLowerCase());

      let matchesStatus = true;
      if (filters.status !== 'all') {
        if (filters.status === 'passing') {
          matchesStatus = covenant.latest_test.test_result === 'pass' && covenant.status === 'active';
        } else if (filters.status === 'failing') {
          matchesStatus = covenant.latest_test.test_result === 'fail';
        } else if (filters.status === 'at_risk') {
          matchesStatus = covenant.latest_test.headroom_percentage < DEFAULT_AT_RISK_HEADROOM_THRESHOLD && covenant.latest_test.test_result === 'pass';
        } else if (filters.status === 'waived') {
          matchesStatus = covenant.status === 'waived';
        } else if (filters.status === 'needs_attention') {
          // Needs attention = at_risk, failing, or breached
          matchesStatus =
            covenant.latest_test.test_result === 'fail' ||
            covenant.status === 'breached' ||
            (covenant.latest_test.headroom_percentage < DEFAULT_AT_RISK_HEADROOM_THRESHOLD && covenant.latest_test.test_result === 'pass');
        }
      }

      const matchesType = filters.type === 'all' || covenant.covenant_type === filters.type;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [covenants, filters.search, filters.status, filters.type]);

  const handleImportComplete = useCallback((tests: ValidatedCovenantTest[]) => {
    // Add to the import history for audit trail
    addImportHistory('imported_tests.xlsx', tests, 'current.user@example.com');

    // Count valid tests for notification
    const validTestCount = tests.filter((t) => t.validation.isValid).length;

    // Merge imported tests into the covenants state
    // This triggers a re-render with the updated covenant data
    setCovenants((prevCovenants) => mergeImportedTests(prevCovenants, tests));

    // Show success notification
    if (validTestCount > 0) {
      setLastImportResult({
        count: validTestCount,
        timestamp: Date.now(),
      });

      // Auto-dismiss notification after 5 seconds
      setTimeout(() => {
        setLastImportResult((prev) =>
          prev && Date.now() - prev.timestamp >= 4900 ? null : prev
        );
      }, 5000);
    }
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
            <Link href="/compliance" className="hover:text-zinc-900 transition-colors">
              Compliance
            </Link>
            <span>/</span>
            <span className="text-zinc-900">Covenants</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Covenant Tracking</h1>
          <p className="text-zinc-500">Monitor covenant tests and headroom across all facilities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            data-testid="toggle-history-btn"
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? 'Hide History' : 'Import History'}
          </Button>
          <Button onClick={() => setIsImportDialogOpen(true)} data-testid="bulk-import-btn">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
        </div>
      </div>

      {showHistory && (
        <div className="animate-in fade-in slide-in-from-top-2">
          <ImportHistoryPanel />
        </div>
      )}

      {/* Import success notification */}
      {lastImportResult && (
        <div
          className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg animate-in fade-in slide-in-from-top-2"
          data-testid="import-success-notification"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">
              Import completed successfully
            </p>
            <p className="text-sm text-emerald-600">
              {lastImportResult.count} covenant test{lastImportResult.count !== 1 ? 's' : ''} imported and updated.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100"
            onClick={() => setLastImportResult(null)}
            data-testid="dismiss-import-notification-btn"
          >
            Dismiss
          </Button>
        </div>
      )}

      <CovenantStatsBar covenants={covenants} />

      <ComplianceFiltersBar
        searchQuery={filters.search}
        onSearchChange={(value) => setFilter('search', value)}
        statusFilter={filters.status}
        onStatusChange={(value) => setFilter('status', value)}
        typeFilter={filters.type}
        onTypeChange={(value) => setFilter('type', value)}
        covenantStatusMode={true}
        showPresets={true}
        showActiveChips={true}
        presets={COVENANT_PRESETS}
        onApplyPreset={applyPreset}
        isPresetActive={isPresetActive}
        activeFilters={activeFilters}
        onRemoveFilter={clearFilter}
        onClearAll={clearAllFilters}
      />

      {filteredCovenants.length > 0 ? (
        <div className="space-y-4">
          {filteredCovenants.map((covenant, index) => (
            <CovenantCard key={covenant.id} covenant={covenant} index={index} />
          ))}
        </div>
      ) : (
        <Card className="py-12 animate-in fade-in">
          <CardContent className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
            <p className="text-zinc-500">No covenants found matching your filters.</p>
          </CardContent>
        </Card>
      )}

      <BulkImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        existingCovenants={covenants}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}

// Wrap with Suspense boundary for useSearchParams
export const CovenantsPage = memo(function CovenantsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-zinc-200 rounded w-48" />
          <div className="h-24 bg-zinc-200 rounded" />
          <div className="h-16 bg-zinc-200 rounded" />
        </div>
      }
    >
      <CovenantsPageContent />
    </Suspense>
  );
});
