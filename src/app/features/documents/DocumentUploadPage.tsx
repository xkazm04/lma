'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUploadZone } from '@/components/documents';

const supportedDocTypes = [
  { type: 'Facility Agreement', desc: 'Primary loan documents' },
  { type: 'Amendment', desc: 'Modifications to terms' },
  { type: 'Consent', desc: 'Lender approvals' },
  { type: 'Assignment', desc: 'Loan transfers' },
  { type: 'Other', desc: 'Side letters, etc.' },
];

export function DocumentUploadPage() {
  const handleUploadComplete = useCallback((files: unknown[]) => {
    // Check for errors in the uploaded files
    const errors = (files as any[]).filter(f => f.error);
    if (errors.length > 0) {
      // In a real app we'd use a toast here
      const errorMsg = errors.length === 1
        ? `Upload failed: ${errors[0].error}`
        : `${errors.length} files failed to upload`;

      console.error(errorMsg);
      // alert(errorMsg); // Using alert for visibility or just sticking to improved logic
    }

    // Process successful files
    const successful = (files as any[]).filter(f => !f.error);
    if (successful.length > 0) {
      console.log('Upload complete:', successful);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <Link href="/documents">
          <Button variant="ghost" size="icon" className="transition-transform hover:scale-110">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Upload Documents</h1>
          <p className="text-zinc-500">Upload loan documents for AI-powered analysis</p>
        </div>
      </div>

      {/* Upload Card */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <CardHeader>
          <CardTitle>Select Files</CardTitle>
          <CardDescription>
            Upload PDF or Word documents (DOCX, DOC). Files will be automatically processed to
            extract structured loan data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploadZone onUploadComplete={handleUploadComplete} />
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card
        className="bg-blue-50 border-blue-200 animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{ animationDelay: '100ms', animationFillMode: 'both' }}
      >
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">What happens after upload?</p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Documents are securely stored and encrypted</li>
                <li>AI extracts key terms: parties, dates, covenants, obligations</li>
                <li>Low-confidence fields are flagged for your review</li>
                <li>Extracted data is linked across all modules</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supported Document Types */}
      <Card
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{ animationDelay: '200ms', animationFillMode: 'both' }}
      >
        <CardHeader>
          <CardTitle className="text-lg">Supported Document Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {supportedDocTypes.map((item, index) => (
              <div
                key={item.type}
                className="p-3 rounded-lg bg-zinc-50 text-center transition-all duration-200 hover:bg-zinc-100 hover:shadow-sm animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                <p className="text-sm font-medium text-zinc-900">{item.type}</p>
                <p className="text-xs text-zinc-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
