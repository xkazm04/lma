'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  KPICard,
  LoanTypeBadge,
  RatingDisplay,
  KPIsSection,
  TargetsSection,
  ReportsSection,
  ExportButton,
  formatCurrency,
  mockFacilityDetail,
  exportFacilityDetailPDF,
  exportFacilityDetailExcel,
  type ExportFormat,
} from '@/app/features/esg';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ESGFacilityDetailPage() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const filterFromUrl = searchParams.get('filter');

  const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview');
  const [kpiFilter, setKpiFilter] = useState<'all' | 'at_risk'>(filterFromUrl === 'at_risk' ? 'at_risk' : 'all');
  const facility = mockFacilityDetail;

  // Update tab and filter when URL params change
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
    if (filterFromUrl === 'at_risk') {
      setKpiFilter('at_risk');
    }
  }, [tabFromUrl, filterFromUrl]);

  // This would come from route params in real implementation
  // For now we use mock data which has id='1'

  const achievedTargets = facility.kpis.reduce(
    (sum, kpi) => sum + kpi.targets.filter((t) => t.target_status === 'achieved').length,
    0
  );
  const totalTargets = facility.kpis.reduce((sum, kpi) => sum + kpi.targets.length, 0);

  const handleExport = (format: ExportFormat) => {
    const config = { title: `${facility.facility_name} - ESG Report` };
    if (format === 'pdf') {
      exportFacilityDetailPDF(facility, config);
    } else {
      exportFacilityDetailExcel(facility, config);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="facility-detail-page">
      {/* Header */}
      <div className="flex items-start justify-between animate-in slide-in-from-top-4 duration-500">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/esg/facilities">
              <Button variant="ghost" size="icon" className="transition-transform hover:scale-110" data-testid="back-btn">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-zinc-900" data-testid="facility-name">{facility.facility_name}</h1>
                <LoanTypeBadge type={facility.esg_loan_type} />
              </div>
              <p className="text-zinc-500" data-testid="borrower-name">{facility.borrower_name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton onExport={handleExport} label="Export" />
          <Button variant="outline" className="transition-transform hover:scale-105" data-testid="ai-analysis-btn">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Analysis
          </Button>
          <Button className="transition-transform hover:scale-105" data-testid="edit-facility-btn">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <KPICard
          title="Commitment"
          value={formatCurrency(facility.commitment_amount)}
          subtitle={`${formatCurrency(facility.outstanding_amount)} outstanding`}
        />
        <KPICard title="Active KPIs" value={facility.kpis.length} subtitle="Across E, S, G pillars" />
        <KPICard
          title="Target Progress"
          value={`${achievedTargets}/${totalTargets}`}
          icon={
            <div className="w-full">
              <Progress
                value={(achievedTargets / totalTargets) * 100}
                className="h-2"
                animate
                animationDelay={300}
                data-testid="facility-target-progress"
              />
            </div>
          }
        />
        <KPICard
          title="Current Margin"
          value={`${facility.current_margin_bps}bps`}
          subtitle={`${facility.current_margin_bps - facility.base_margin_bps}bps vs base`}
          variant={facility.current_margin_bps < facility.base_margin_bps ? 'success' : 'default'}
        />
        <KPICard
          title="Maturity"
          value={formatDate(facility.maturity_date)}
          subtitle={`Effective: ${formatDate(facility.effective_date)}`}
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="animate-in slide-in-from-bottom-4 duration-500 delay-200"
        aria-label="Facility details navigation"
      >
        <TabsList aria-label="Facility information tabs">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="kpis" data-testid="tab-kpis">KPIs & Targets</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
          <TabsTrigger value="ratings" data-testid="tab-ratings">Ratings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Facility Details */}
            <Card className="animate-in slide-in-from-left-4 duration-500">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-zinc-900 mb-4">Facility Details</h3>
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm text-zinc-500">Framework</dt>
                    <dd className="text-sm font-medium text-zinc-900">{facility.framework_reference}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-zinc-500">Industry</dt>
                    <dd className="text-sm font-medium text-zinc-900">{facility.borrower_industry}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-zinc-500">Sustainability Coordinator</dt>
                    <dd className="text-sm font-medium text-zinc-900">{facility.sustainability_coordinator}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-zinc-500">External Verifier</dt>
                    <dd className="text-sm font-medium text-zinc-900">{facility.external_verifier}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-zinc-500">Max Margin Adjustment</dt>
                    <dd className="text-sm font-medium text-zinc-900">+/- {facility.max_margin_adjustment_bps}bps</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Margin History */}
            <Card className="animate-in slide-in-from-right-4 duration-500">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-zinc-900 mb-4">Margin Adjustment History</h3>
                <div className="space-y-3">
                  {facility.margin_history.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 transition-all hover:bg-zinc-100">
                      <span className="text-sm text-zinc-700">{item.period}</span>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-sm font-medium ${
                            item.adjustment_bps < 0
                              ? 'text-green-600'
                              : item.adjustment_bps > 0
                              ? 'text-red-600'
                              : 'text-zinc-600'
                          }`}
                        >
                          {item.adjustment_bps > 0 ? '+' : ''}
                          {item.adjustment_bps}bps
                        </span>
                        <span className="text-sm text-zinc-500">
                          ({item.cumulative_bps > 0 ? '+' : ''}
                          {item.cumulative_bps}bps cumulative)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <TargetsSection kpis={facility.kpis} />
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6 mt-6">
          <KPIsSection kpis={facility.kpis} filter={kpiFilter} onFilterChange={setKpiFilter} />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6 mt-6">
          <ReportsSection reports={facility.reports} />
        </TabsContent>

        {/* Ratings Tab */}
        <TabsContent value="ratings" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-zinc-900">ESG Ratings</h2>
            <Button className="transition-transform hover:scale-105">Add Rating</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {facility.ratings.map((rating, idx) => (
              <RatingDisplay key={idx} rating={rating} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
