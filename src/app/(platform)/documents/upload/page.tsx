'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUploadZone } from '@/components/documents';

export default function DocumentUploadPage() {
  const handleUploadComplete = (files: unknown[]) => {
    console.log('Upload complete:', files);
    // TODO: Redirect to documents list or show success message
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/documents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Upload Documents</h1>
          <p className="text-zinc-500">Upload loan documents for AI-powered analysis</p>
        </div>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Select Files</CardTitle>
          <CardDescription>
            Upload PDF or Word documents (DOCX, DOC). Files will be automatically processed
            to extract structured loan data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploadZone onUploadComplete={handleUploadComplete} />
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">
                What happens after upload?
              </p>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Supported Document Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { type: 'Facility Agreement', desc: 'Primary loan documents' },
              { type: 'Amendment', desc: 'Modifications to terms' },
              { type: 'Consent', desc: 'Lender approvals' },
              { type: 'Assignment', desc: 'Loan transfers' },
              { type: 'Other', desc: 'Side letters, etc.' },
            ].map((item) => (
              <div key={item.type} className="p-3 rounded-lg bg-zinc-50 text-center">
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
