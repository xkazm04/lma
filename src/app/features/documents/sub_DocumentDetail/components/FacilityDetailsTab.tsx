'use client';

import React, { memo } from 'react';
import { FileText, Calendar, DollarSign, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { mockFacility, formatCurrency } from '../lib/mock-data';

export const FacilityDetailsTab = memo(function FacilityDetailsTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Information */}
      <Card className="animate-in fade-in slide-in-from-left-4 duration-300">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-500">Facility Name</p>
              <p className="font-medium">{mockFacility.facility_name}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Reference</p>
              <p className="font-medium">{mockFacility.facility_reference}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Facility Type</p>
              <p className="font-medium capitalize">{mockFacility.facility_type}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Governing Law</p>
              <p className="font-medium">{mockFacility.governing_law}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Dates */}
      <Card
        className="animate-in fade-in slide-in-from-right-4 duration-300"
        style={{ animationDelay: '50ms', animationFillMode: 'both' }}
      >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Key Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-500">Execution Date</p>
              <p className="font-medium">{formatDate(mockFacility.execution_date)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Effective Date</p>
              <p className="font-medium">{formatDate(mockFacility.effective_date)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Maturity Date</p>
              <p className="font-medium">{formatDate(mockFacility.maturity_date)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Tenor</p>
              <p className="font-medium">5 years</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Terms */}
      <Card
        className="animate-in fade-in slide-in-from-left-4 duration-300"
        style={{ animationDelay: '100ms', animationFillMode: 'both' }}
      >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Financial Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-500">Total Commitments</p>
              <p className="font-medium text-xl">{formatCurrency(mockFacility.total_commitments)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Currency</p>
              <p className="font-medium">{mockFacility.currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interest Terms */}
      <Card
        className="animate-in fade-in slide-in-from-right-4 duration-300"
        style={{ animationDelay: '150ms', animationFillMode: 'both' }}
      >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Interest Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-500">Rate Type</p>
              <p className="font-medium capitalize">{mockFacility.interest_rate_type}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Base Rate</p>
              <p className="font-medium">{mockFacility.base_rate}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Initial Margin</p>
              <p className="font-medium">{mockFacility.margin_initial}%</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">All-in Rate</p>
              <p className="font-medium">{mockFacility.base_rate} + {mockFacility.margin_initial}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
