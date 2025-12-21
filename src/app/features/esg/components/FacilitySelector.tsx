'use client';

import React, { memo, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X, CheckCircle2 } from 'lucide-react';
import { LoanTypeBadge } from './LoanTypeBadge';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, type ESGFacility } from '../lib';

interface FacilitySelectorProps {
  facilities: ESGFacility[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxSelection?: number;
  minSelection?: number;
}

export const FacilitySelector = memo(function FacilitySelector({
  facilities,
  selectedIds,
  onSelectionChange,
  maxSelection = 4,
  minSelection = 2,
}: FacilitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFacilities = useMemo(() => {
    if (!searchQuery) return facilities;
    const query = searchQuery.toLowerCase();
    return facilities.filter(
      (f) =>
        f.facility_name.toLowerCase().includes(query) ||
        f.borrower_name.toLowerCase().includes(query) ||
        f.borrower_industry.toLowerCase().includes(query)
    );
  }, [facilities, searchQuery]);

  const handleToggle = (facilityId: string) => {
    if (selectedIds.includes(facilityId)) {
      onSelectionChange(selectedIds.filter((id) => id !== facilityId));
    } else if (selectedIds.length < maxSelection) {
      onSelectionChange([...selectedIds, facilityId]);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const isAtMaxSelection = selectedIds.length >= maxSelection;

  return (
    <Card className="animate-in fade-in duration-300">
      <CardContent className="pt-6 space-y-4">
        {/* Header with selection count and clear button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-zinc-900">Select Facilities to Compare</h3>
            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
              {selectedIds.length} / {maxSelection} selected
            </Badge>
          </div>
          {selectedIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-zinc-500 hover:text-zinc-700"
              data-testid="clear-selection-btn"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search facilities by name, borrower, or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="facility-search-input"
          />
        </div>

        {/* Selection hint */}
        {selectedIds.length < minSelection && (
          <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
            Please select at least {minSelection} facilities to compare
          </p>
        )}
        {isAtMaxSelection && (
          <p className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
            Maximum of {maxSelection} facilities reached. Deselect one to choose another.
          </p>
        )}

        {/* Facility List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {filteredFacilities.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No facilities match your search
            </div>
          ) : (
            filteredFacilities.map((facility) => {
              const isSelected = selectedIds.includes(facility.id);
              const isDisabled = !isSelected && isAtMaxSelection;

              return (
                <div
                  key={facility.id}
                  onClick={() => !isDisabled && handleToggle(facility.id)}
                  className={`
                    p-4 rounded-lg border transition-all cursor-pointer
                    ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                        : isDisabled
                        ? 'bg-zinc-50 border-zinc-200 opacity-50 cursor-not-allowed'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm'
                    }
                  `}
                  data-testid={`facility-option-${facility.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => handleToggle(facility.id)}
                        data-testid={`facility-checkbox-${facility.id}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-zinc-900 truncate">
                              {facility.facility_name}
                            </span>
                            <LoanTypeBadge type={facility.esg_loan_type} />
                          </div>
                          <p className="text-sm text-zinc-500">{facility.borrower_name}</p>
                        </div>
                        <StatusBadge status={facility.overall_performance_status} showIcon={false} />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                        <span>{facility.borrower_industry}</span>
                        <span>•</span>
                        <span>{formatCurrency(facility.commitment_amount)}</span>
                        <span>•</span>
                        <span>{facility.kpi_count} KPIs</span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
});
