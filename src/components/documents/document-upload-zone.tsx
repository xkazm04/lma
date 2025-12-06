'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatFileSize } from '@/lib/utils';

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface DocumentUploadZoneProps {
  onUploadComplete?: (files: UploadFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export function DocumentUploadZone({
  onUploadComplete,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
}: DocumentUploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    const acceptedMimes = Object.keys(ACCEPTED_TYPES);
    if (!acceptedMimes.includes(file.type)) {
      return 'Invalid file type. Please upload PDF or Word documents.';
    }
    if (file.size > maxSize) {
      return `File too large. Maximum size is ${formatFileSize(maxSize)}.`;
    }
    return null;
  };

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: UploadFile[] = Array.from(fileList).slice(0, maxFiles - files.length).map((file) => {
      const error = validateFile(file);
      return {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        status: error ? 'error' : 'pending',
        progress: 0,
        error: error || undefined,
      };
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }, [files.length, maxFiles, maxSize]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const simulateUpload = useCallback(async (fileId: string) => {
    // Update to uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: 'uploading' as const, progress: 0 } : f
      )
    );

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 100));
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: i } : f))
      );
    }

    // Update to processing
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: 'processing' as const } : f
      )
    );

    // Simulate processing
    await new Promise((r) => setTimeout(r, 2000));

    // Update to completed
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: 'completed' as const } : f
      )
    );
  }, []);

  const uploadAll = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    for (const file of pendingFiles) {
      await simulateUpload(file.id);
    }
    onUploadComplete?.(files);
  }, [files, simulateUpload, onUploadComplete]);

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const hasErrors = files.some((f) => f.status === 'error');

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-zinc-300 hover:border-zinc-400'
        )}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={handleInputChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-zinc-100">
              <Upload className="w-8 h-8 text-zinc-500" />
            </div>
            <div>
              <p className="text-lg font-medium text-zinc-900">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                PDF, DOC, DOCX up to {formatFileSize(maxSize)} each
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 bg-white"
            >
              <div className="p-2 rounded-lg bg-zinc-100">
                <FileText className="w-5 h-5 text-zinc-600" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {file.file.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500">
                    {formatFileSize(file.file.size)}
                  </span>
                  {file.status === 'uploading' && (
                    <>
                      <span className="text-xs text-zinc-300">•</span>
                      <span className="text-xs text-blue-600">
                        Uploading {file.progress}%
                      </span>
                    </>
                  )}
                  {file.status === 'processing' && (
                    <>
                      <span className="text-xs text-zinc-300">•</span>
                      <span className="text-xs text-amber-600">Processing...</span>
                    </>
                  )}
                  {file.status === 'completed' && (
                    <>
                      <span className="text-xs text-zinc-300">•</span>
                      <span className="text-xs text-green-600">Completed</span>
                    </>
                  )}
                  {file.error && (
                    <span className="text-xs text-red-600">{file.error}</span>
                  )}
                </div>
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="h-1 mt-2" />
                )}
              </div>

              <div className="flex items-center gap-2">
                {file.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
                {file.status === 'uploading' && (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                )}
                {file.status === 'processing' && (
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                )}
                {file.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setFiles([])}
            disabled={files.some((f) => f.status === 'uploading' || f.status === 'processing')}
          >
            Clear all
          </Button>
          <Button
            onClick={uploadAll}
            disabled={
              pendingCount === 0 ||
              hasErrors ||
              files.some((f) => f.status === 'uploading' || f.status === 'processing')
            }
          >
            Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
}
