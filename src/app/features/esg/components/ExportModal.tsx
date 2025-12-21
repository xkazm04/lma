'use client';

import React, { useState, useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText, Calendar, Loader2, Check } from 'lucide-react';
import type { ExportFormat, ExportConfig } from '../lib/export';

interface ExportModalProps {
  title: string;
  description?: string;
  onExport: (format: ExportFormat, config: ExportConfig) => void | Promise<void>;
  facilities?: Array<{ id: string; name: string }>;
  triggerLabel?: string;
  triggerVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

type DatePreset = 'last30' | 'last90' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';
type TemplateStyle = 'standard' | 'executive' | 'detailed';

export function ExportModal({
  title,
  description,
  onExport,
  facilities = [],
  triggerLabel = 'Export Report',
  triggerVariant = 'outline',
}: ExportModalProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [datePreset, setDatePreset] = useState<DatePreset>('last30');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>('standard');

  const dateRange = useMemo(() => {
    const today = new Date();
    switch (datePreset) {
      case 'last30':
        return { start: subDays(today, 30), end: today };
      case 'last90':
        return { start: subDays(today, 90), end: today };
      case 'thisMonth':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'lastMonth': {
        const lastMonth = subMonths(today, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      }
      case 'thisYear':
        return { start: new Date(today.getFullYear(), 0, 1), end: today };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : subDays(today, 30),
          end: customEndDate ? new Date(customEndDate) : today,
        };
      default:
        return { start: subDays(today, 30), end: today };
    }
  }, [datePreset, customStartDate, customEndDate]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const config: ExportConfig = {
        title,
        dateRange,
        selectedFacilities: selectedFacilities.length > 0 ? selectedFacilities : undefined,
        templateStyle,
      };
      await onExport(exportFormat, config);
      setOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleFacility = (id: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const selectAllFacilities = () => {
    setSelectedFacilities(facilities.map((f) => f.id));
  };

  const clearFacilitySelection = () => {
    setSelectedFacilities([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          className="transition-transform hover:scale-105"
          data-testid="export-modal-trigger"
        >
          <Download className="w-4 h-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Export Format</label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setExportFormat('pdf')}
                data-testid="format-pdf-btn"
              >
                <FileText className="w-4 h-4 mr-2 text-red-600" />
                PDF Report
                {exportFormat === 'pdf' && <Check className="w-4 h-4 ml-auto" />}
              </Button>
              <Button
                type="button"
                variant={exportFormat === 'excel' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setExportFormat('excel')}
                data-testid="format-excel-btn"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Excel Data
                {exportFormat === 'excel' && <Check className="w-4 h-4 ml-auto" />}
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Date Range</label>
            <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
              <SelectTrigger data-testid="date-range-select">
                <Calendar className="w-4 h-4 mr-2 text-zinc-500" />
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="last90">Last 90 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="thisYear">Year to Date</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {datePreset === 'custom' && (
              <div className="flex gap-2 mt-2">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="flex-1"
                  data-testid="custom-start-date"
                />
                <span className="text-zinc-500 self-center">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="flex-1"
                  data-testid="custom-end-date"
                />
              </div>
            )}

            <p className="text-xs text-zinc-500">
              {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
            </p>
          </div>

          {/* Template Style (PDF only) */}
          {exportFormat === 'pdf' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Report Style</label>
              <Select
                value={templateStyle}
                onValueChange={(v) => setTemplateStyle(v as TemplateStyle)}
              >
                <SelectTrigger data-testid="template-style-select">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="executive">Executive Summary</SelectItem>
                  <SelectItem value="detailed">Detailed Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Facility Selection (if facilities provided) */}
          {facilities.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700">Facilities</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllFacilities}
                    className="text-xs text-blue-600 hover:underline"
                    data-testid="select-all-facilities"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearFacilitySelection}
                    className="text-xs text-zinc-500 hover:underline"
                    data-testid="clear-facilities"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                {facilities.map((facility) => (
                  <label
                    key={facility.id}
                    className="flex items-center gap-2 p-1 rounded hover:bg-zinc-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFacilities.includes(facility.id)}
                      onChange={() => toggleFacility(facility.id)}
                      className="rounded border-zinc-300"
                      data-testid={`facility-checkbox-${facility.id}`}
                    />
                    <span className="text-sm text-zinc-700">{facility.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-zinc-500">
                {selectedFacilities.length === 0
                  ? 'All facilities will be included'
                  : `${selectedFacilities.length} facility(ies) selected`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="export-cancel-btn">
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} data-testid="export-confirm-btn">
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {exportFormat === 'pdf' ? 'PDF' : 'Excel'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
