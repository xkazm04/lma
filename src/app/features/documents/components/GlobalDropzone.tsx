'use client';

import React, { useCallback, useState, useEffect } from 'react';
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

interface GlobalDropzoneProps {
  onUploadComplete?: (files: UploadFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export function GlobalDropzone({
  onUploadComplete,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
}: GlobalDropzoneProps) {
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const dragCounter = React.useRef(0);

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

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      setShowUploadPanel(true);
    }
  }, [files.length, maxFiles, maxSize]);

  // Global drag event listeners
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDraggingGlobal(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDraggingGlobal(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDraggingGlobal(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [handleFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      if (updated.length === 0) {
        setShowUploadPanel(false);
      }
      return updated;
    });
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

  const clearAll = useCallback(() => {
    setFiles([]);
    setShowUploadPanel(false);
  }, []);

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const hasErrors = files.some((f) => f.status === 'error');
  const isProcessing = files.some((f) => f.status === 'uploading' || f.status === 'processing');

  return (
    <>
      {/* Global drop overlay */}
      {isDraggingGlobal && (
        <div
          className="fixed inset-0 z-50 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          data-testid="global-dropzone-overlay"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Pulsing border effect */}
            <div className="absolute inset-4 border-4 border-dashed border-blue-500 rounded-2xl animate-pulse" />

            {/* Center drop target */}
            <div
              className="bg-white rounded-2xl shadow-2xl p-12 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300"
              data-testid="global-dropzone-target"
            >
              <div className="p-6 rounded-full bg-blue-100 animate-bounce">
                <Upload className="w-12 h-12 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-900">Drop files to upload</p>
                <p className="text-zinc-500 mt-2">
                  PDF, DOC, DOCX up to {formatFileSize(maxSize)} each
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload panel (shown after files are dropped) */}
      {showUploadPanel && files.length > 0 && (
        <div
          className="fixed bottom-6 right-6 z-40 w-96 bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
          data-testid="global-dropzone-panel"
        >
          {/* Panel header */}
          <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-zinc-600" />
              <span className="font-medium text-zinc-900">
                {files.length} file{files.length !== 1 ? 's' : ''} ready
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={clearAll}
              disabled={isProcessing}
              data-testid="global-dropzone-close-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* File list */}
          <div className="max-h-64 overflow-y-auto p-2 space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-2 rounded-lg border border-zinc-100 bg-zinc-50"
                data-testid={`global-dropzone-file-${file.id}`}
              >
                <div className="p-1.5 rounded bg-white border border-zinc-200">
                  <FileText className="w-4 h-4 text-zinc-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {file.file.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {formatFileSize(file.file.size)}
                    </span>
                    {file.status === 'uploading' && (
                      <span className="text-xs text-blue-600">
                        {file.progress}%
                      </span>
                    )}
                    {file.status === 'processing' && (
                      <span className="text-xs text-amber-600">Processing</span>
                    )}
                    {file.status === 'completed' && (
                      <span className="text-xs text-green-600">Done</span>
                    )}
                    {file.error && (
                      <span className="text-xs text-red-600 truncate">{file.error}</span>
                    )}
                  </div>
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-1 mt-1" />
                  )}
                </div>

                <div className="flex items-center">
                  {file.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(file.id)}
                      data-testid={`global-dropzone-remove-${file.id}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                  {file.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  )}
                  {file.status === 'processing' && (
                    <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                  )}
                  {file.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Panel footer */}
          <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={isProcessing}
              data-testid="global-dropzone-clear-btn"
            >
              Clear all
            </Button>
            <Button
              size="sm"
              onClick={uploadAll}
              disabled={pendingCount === 0 || hasErrors || isProcessing}
              data-testid="global-dropzone-upload-btn"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}</>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
