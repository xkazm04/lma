'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, GitCompareArrows } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FacilitySelector,
  FacilityComparisonView,
  mockFacilities,
  type ESGFacility,
} from '@/app/features/esg';

const MIN_FACILITIES = 2;
const MAX_FACILITIES = 4;

export default function ESGFacilityComparePage() {
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);

  const selectedFacilities = useMemo(() => {
    return selectedFacilityIds
      .map((id) => mockFacilities.find((f) => f.id === id))
      .filter((f): f is ESGFacility => f !== undefined);
  }, [selectedFacilityIds]);

  const handleRemoveFacility = (id: string) => {
    setSelectedFacilityIds((prev) => prev.filter((fId) => fId !== id));
  };

  const canCompare = selectedFacilityIds.length >= MIN_FACILITIES;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-3">
          <Link href="/esg/facilities">
            <Button
              variant="ghost"
              size="icon"
              className="transition-transform hover:scale-110"
              data-testid="back-to-facilities-btn"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <GitCompareArrows className="w-6 h-6" />
              Compare Facilities
            </h1>
            <p className="text-zinc-500">
              Select {MIN_FACILITIES}-{MAX_FACILITIES} facilities to compare side by side
            </p>
          </div>
        </div>
      </div>

      {/* Facility Selector */}
      <FacilitySelector
        facilities={mockFacilities}
        selectedIds={selectedFacilityIds}
        onSelectionChange={setSelectedFacilityIds}
        maxSelection={MAX_FACILITIES}
        minSelection={MIN_FACILITIES}
      />

      {/* Comparison View */}
      {canCompare && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 delay-200">
          <FacilityComparisonView
            facilities={selectedFacilities}
            onRemoveFacility={handleRemoveFacility}
          />
        </div>
      )}

      {/* Empty State when not enough facilities selected */}
      {!canCompare && selectedFacilityIds.length > 0 && (
        <div className="text-center py-12 animate-in fade-in duration-300">
          <GitCompareArrows className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500">
            Select {MIN_FACILITIES - selectedFacilityIds.length} more{' '}
            {MIN_FACILITIES - selectedFacilityIds.length === 1 ? 'facility' : 'facilities'} to start
            comparing
          </p>
        </div>
      )}

      {/* Initial Empty State */}
      {selectedFacilityIds.length === 0 && (
        <div className="text-center py-12 animate-in fade-in duration-300">
          <GitCompareArrows className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="font-medium text-zinc-900 mb-2">No facilities selected</h3>
          <p className="text-zinc-500 max-w-md mx-auto">
            Select facilities from the list above to compare their ESG performance, KPIs, targets,
            and margin adjustments side by side.
          </p>
        </div>
      )}
    </div>
  );
}
