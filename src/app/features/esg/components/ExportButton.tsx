'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ExportFormat } from '../lib/export';

export interface ExportButtonProps {
  onExport: (format: ExportFormat) => void | Promise<void>;
  label?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function ExportButton({
  onExport,
  label = 'Export',
  disabled = false,
  variant = 'outline',
  size = 'default',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setExportFormat(format);
    try {
      await onExport(format);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting}
          className="transition-transform hover:scale-105"
          data-testid="export-btn"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {label}
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="cursor-pointer"
          data-testid="export-pdf-option"
        >
          <FileText className="w-4 h-4 mr-2 text-red-600" />
          <span>Export as PDF</span>
          {isExporting && exportFormat === 'pdf' && (
            <Loader2 className="w-4 h-4 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting}
          className="cursor-pointer"
          data-testid="export-excel-option"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
          <span>Export as Excel</span>
          {isExporting && exportFormat === 'excel' && (
            <Loader2 className="w-4 h-4 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
