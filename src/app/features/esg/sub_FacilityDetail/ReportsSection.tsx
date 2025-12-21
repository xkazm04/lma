'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Plus } from 'lucide-react';
import type { ESGReport } from '../lib';

interface ReportsSectionProps {
  reports: ESGReport[];
}

export const ReportsSection = memo(function ReportsSection({ reports }: ReportsSectionProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-zinc-900">ESG Reports</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Report
        </Button>
      </div>

      <div className="space-y-2">
        {reports.map((report, index) => (
          <Card
            key={report.id}
            className="transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-right-4"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-zinc-100 transition-transform hover:scale-110">
                    <FileText className="w-4 h-4 text-zinc-600" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 capitalize">{report.report_type} Report</p>
                    <p className="text-sm text-zinc-500">Period ending {formatDate(report.period_end)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={report.status === 'submitted' ? 'default' : 'outline'}>
                    {report.status}
                  </Badge>
                  {report.submitted_at && (
                    <span className="text-sm text-zinc-500">Submitted {formatDate(report.submitted_at)}</span>
                  )}
                  <Button variant="outline" size="sm" className="transition-transform hover:scale-105">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});
