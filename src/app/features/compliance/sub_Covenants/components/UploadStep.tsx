'use client';

import React, { useCallback, useRef, useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { generateSampleTemplate } from '../lib/spreadsheet-parser';

interface UploadStepProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const UploadStep = memo(function UploadStep({
  onFileSelect,
  isProcessing,
}: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && isValidFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isValidFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDownloadTemplate = useCallback(() => {
    const blob = generateSampleTemplate();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'covenant_test_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    return validTypes.includes(file.type) || validExtensions.includes(extension);
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging
            ? 'border-purple-400 bg-purple-50'
            : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        data-testid="file-drop-zone"
      >
        <CardContent className="py-12 text-center">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <p className="text-sm text-zinc-600">Processing file...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Upload className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <p className="text-lg font-medium text-zinc-900 mb-2">
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-zinc-500 mb-4">
                Supports Excel (.xlsx, .xls) and CSV files
              </p>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                data-testid="browse-files-btn"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
        data-testid="file-input"
      />

      {/* Template Download */}
      <Card className="bg-zinc-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white border border-zinc-200">
                <FileSpreadsheet className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  Need a template?
                </p>
                <p className="text-xs text-zinc-500">
                  Download our sample Excel template with the correct format
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              data-testid="download-template-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expected Format */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-zinc-900">Expected Columns</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-zinc-600">Facility Name</span>
            <span className="text-xs text-zinc-400">(recommended)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-zinc-600">Covenant Name</span>
            <span className="text-xs text-zinc-400">(recommended)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-zinc-600">Test Date</span>
            <span className="text-xs text-zinc-400">(required)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-zinc-600">Calculated Value</span>
            <span className="text-xs text-zinc-400">(required)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-300" />
            <span className="text-zinc-600">Test Result</span>
            <span className="text-xs text-zinc-400">(optional)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-300" />
            <span className="text-zinc-600">Notes</span>
            <span className="text-xs text-zinc-400">(optional)</span>
          </div>
        </div>
      </div>
    </div>
  );
});
