'use client';

import React, { memo, useEffect, useState, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioOption } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { NewDealFormData, ImportedFacilityData } from '../lib/types';

interface FacilityListItem {
  id: string;
  name: string;
  reference: string | null;
  documentId: string;
  documentName: string;
  executionDate: string | null;
  maturityDate: string | null;
  totalCommitments: number | null;
  currency: string | null;
  confidence: number | null;
  createdAt: string;
  covenantCount: number;
  obligationCount: number;
  esgCount: number;
}

interface StepImportSourceProps {
  formData: NewDealFormData;
  onUpdate: (field: string, value: unknown) => void;
}

export const StepImportSource = memo(function StepImportSource({
  formData,
  onUpdate,
}: StepImportSourceProps) {
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch list of facilities when import source is set to 'facility'
  useEffect(() => {
    if (formData.import_source === 'facility' && facilities.length === 0) {
      fetchFacilities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.import_source, facilities.length]);

  // Fetch facility details when a facility is selected
  useEffect(() => {
    if (
      formData.import_source === 'facility' &&
      formData.selected_facility &&
      !formData.imported_facility_data
    ) {
      fetchFacilityDetails(formData.selected_facility);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.selected_facility, formData.import_source, formData.imported_facility_data]);

  const fetchFacilities = useCallback(async () => {
    setIsLoadingFacilities(true);
    setError(null);

    try {
      const response = await fetch('/api/deals/import-facility');
      const result = await response.json();

      if (result.success) {
        setFacilities(result.data || []);
      } else {
        setError(result.error?.message || 'Failed to load facilities');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsLoadingFacilities(false);
    }
  }, []);

  const fetchFacilityDetails = useCallback(async (facilityId: string) => {
    setIsLoadingDetails(true);
    setError(null);

    try {
      const response = await fetch(`/api/deals/import-facility?facilityId=${facilityId}`);
      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        const importedData: ImportedFacilityData = {
          facilityId: data.facilityId,
          facilityName: data.facilityName,
          documentId: data.documentId,
          documentName: data.documentName,
          facilityTerms: data.formattedTerms.facilityTerms,
          covenantTerms: data.formattedTerms.covenantTerms,
          obligationTerms: data.formattedTerms.obligationTerms,
          esgTerms: data.formattedTerms.esgTerms,
        };
        onUpdate('imported_facility_data', importedData);
      } else {
        setError(result.error?.message || 'Failed to load facility details');
      }
    } catch {
      setError('Failed to fetch facility details');
    } finally {
      setIsLoadingDetails(false);
    }
  }, [onUpdate]);

  const handleImportSourceChange = useCallback((value: string) => {
    onUpdate('import_source', value);
    // Clear selected facility and imported data when changing source
    if (value !== 'facility') {
      onUpdate('selected_facility', '');
      onUpdate('imported_facility_data', null);
    }
  }, [onUpdate]);

  const handleFacilitySelect = useCallback((value: string) => {
    onUpdate('selected_facility', value);
    onUpdate('imported_facility_data', null); // Clear previous data to trigger new fetch
  }, [onUpdate]);

  const selectedFacilityInfo = facilities.find(f => f.id === formData.selected_facility);
  const importedData = formData.imported_facility_data;

  // Calculate counts based on import options
  const getSelectedTermsCount = () => {
    if (!importedData) return 0;
    let count = importedData.facilityTerms.length;
    if (formData.import_covenants) count += importedData.covenantTerms.length;
    if (formData.import_obligations) count += importedData.obligationTerms.length;
    if (formData.import_esg) count += importedData.esgTerms.length;
    return count;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="step-import-source">
      <div>
        <Label className="text-base font-medium">Import Terms From</Label>
        <p className="text-sm text-zinc-500 mb-4">Start with existing terms or create from scratch</p>

        <RadioGroup
          value={formData.import_source}
          onValueChange={handleImportSourceChange}
          className="space-y-3"
          data-testid="import-source-radio-group"
        >
          <RadioOption
            value="none"
            title="Start from Scratch"
            description="Create a blank deal and add terms manually"
            data-testid="import-source-none-option"
          />

          <RadioOption
            value="facility"
            title="Import from Existing Facility"
            description="Copy terms from a previously analyzed facility agreement"
            data-testid="import-source-facility-option"
          />

          <RadioOption
            value="template"
            title="Use Template"
            description="Start with a standard term sheet template (Coming soon)"
            disabled
            data-testid="import-source-template-option"
          />
        </RadioGroup>
      </div>

      {formData.import_source === 'facility' && (
        <div className="space-y-4 pt-4 border-t animate-in fade-in duration-300" data-testid="facility-import-options">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm" data-testid="import-error-message">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <Label htmlFor="facility">Select Facility</Label>
            {isLoadingFacilities ? (
              <div className="space-y-2 mt-1">
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Select
                value={formData.selected_facility}
                onValueChange={handleFacilitySelect}
              >
                <SelectTrigger className="mt-1" data-testid="facility-select">
                  <SelectValue placeholder="Choose a facility to import from" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.length === 0 ? (
                    <div className="p-4 text-sm text-zinc-500 text-center">
                      No facilities available. Upload and process a document first.
                    </div>
                  ) : (
                    facilities.map((fac) => (
                      <SelectItem key={fac.id} value={fac.id} data-testid={`facility-option-${fac.id}`}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-zinc-400" />
                          <span>{fac.name}</span>
                          {fac.confidence && fac.confidence > 0.8 && (
                            <Badge variant="secondary" className="text-xs">High confidence</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected facility details */}
          {selectedFacilityInfo && (
            <div className="rounded-lg border bg-zinc-50 p-4 space-y-3" data-testid="selected-facility-info">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-zinc-900">{selectedFacilityInfo.name}</h4>
                  <p className="text-sm text-zinc-500">{selectedFacilityInfo.documentName}</p>
                </div>
                {isLoadingDetails && (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Amount</span>
                  <p className="font-medium">
                    {selectedFacilityInfo.totalCommitments
                      ? `${selectedFacilityInfo.currency || 'USD'} ${selectedFacilityInfo.totalCommitments.toLocaleString()}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Maturity</span>
                  <p className="font-medium">
                    {selectedFacilityInfo.maturityDate
                      ? new Date(selectedFacilityInfo.maturityDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Confidence</span>
                  <p className="font-medium">
                    {selectedFacilityInfo.confidence
                      ? `${Math.round(selectedFacilityInfo.confidence * 100)}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Available data summary */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Badge variant="outline" className="text-xs">
                  {selectedFacilityInfo.covenantCount} Covenants
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {selectedFacilityInfo.obligationCount} Obligations
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {selectedFacilityInfo.esgCount} ESG Provisions
                </Badge>
              </div>
            </div>
          )}

          {/* Import options checkboxes */}
          <div>
            <Label className="text-sm font-medium">Import Options</Label>
            <p className="text-xs text-zinc-500 mb-2">Select which terms to import from the facility</p>
            <div className="space-y-2 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.import_covenants}
                  onChange={(e) => onUpdate('import_covenants', e.target.checked)}
                  className="rounded"
                  data-testid="import-covenants-checkbox"
                />
                <span className="text-sm">Financial Covenants</span>
                {importedData && (
                  <span className="text-xs text-zinc-400">({importedData.covenantTerms.length} terms)</span>
                )}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.import_obligations}
                  onChange={(e) => onUpdate('import_obligations', e.target.checked)}
                  className="rounded"
                  data-testid="import-obligations-checkbox"
                />
                <span className="text-sm">Reporting Obligations</span>
                {importedData && (
                  <span className="text-xs text-zinc-400">({importedData.obligationTerms.length} terms)</span>
                )}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.import_esg}
                  onChange={(e) => onUpdate('import_esg', e.target.checked)}
                  className="rounded"
                  data-testid="import-esg-checkbox"
                />
                <span className="text-sm">ESG Provisions</span>
                {importedData && (
                  <span className="text-xs text-zinc-400">({importedData.esgTerms.length} terms)</span>
                )}
              </label>
            </div>
          </div>

          {/* Import summary */}
          {importedData && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4" data-testid="import-summary">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Ready to import {getSelectedTermsCount()} terms</span>
              </div>
              <div className="mt-2 text-sm text-emerald-600">
                <p>Facility terms: {importedData.facilityTerms.length}</p>
                {formData.import_covenants && importedData.covenantTerms.length > 0 && (
                  <p>Covenant terms: {importedData.covenantTerms.length}</p>
                )}
                {formData.import_obligations && importedData.obligationTerms.length > 0 && (
                  <p>Obligation terms: {importedData.obligationTerms.length}</p>
                )}
                {formData.import_esg && importedData.esgTerms.length > 0 && (
                  <p>ESG terms: {importedData.esgTerms.length}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
