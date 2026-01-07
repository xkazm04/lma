'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, ArrowRight, CheckCircle, Calendar, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { DemoCard } from '@/lib/demo-guide';
import { CompactGrid } from '@/components/ui/compact-grid';
import { ComplianceStatsBar, GroupedDeadlinesList, FacilityAtRiskCard, ActivityCard } from './components';
import { CovenantTrendSparkline } from '../deals/components/CovenantTrendSparkline';
import { dashboardStats, upcomingItems, facilitiesAtRisk, recentActivity, keyCovenantTrends } from './lib';

export const CompliancePage = memo(function CompliancePage() {
  return (
    <PageContainer>
      <div className="space-y-3">
        {/* Header */}
        <PageHeader
          title="Compliance Tracker"
          subtitle="Monitor obligations, covenants, and deadlines"
          compact
          actions={
            <Link href="/compliance/facilities">
              <Button size="sm" className="h-8 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Facility
              </Button>
            </Link>
          }
        />

        {/* Stats Bar */}
        <ComplianceStatsBar stats={dashboardStats} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Upcoming Deadlines - Explorable Section */}
          <DemoCard sectionId="compliance-deadlines" className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between py-2.5 px-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-50">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                    <CardDescription className="text-[10px]">Next 14 days</CardDescription>
                  </div>
                </div>
                <Link href="/compliance/calendar">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-zinc-500 hover:text-zinc-900">
                    View Calendar
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-3 px-3 pb-3">
                <GroupedDeadlinesList items={upcomingItems} />
              </CardContent>
            </Card>
          </DemoCard>

          {/* Facilities at Risk - Explorable Section */}
          <DemoCard sectionId="compliance-facilities">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between py-2.5 px-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-50">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Facilities at Risk</CardTitle>
                    <CardDescription className="text-[10px]">Require attention</CardDescription>
                  </div>
                </div>
                <Link href="/compliance/facilities?filter=at_risk">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-zinc-500 hover:text-zinc-900">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-2 px-2 pb-2">
                {facilitiesAtRisk.length > 0 ? (
                  <div className="divide-y divide-zinc-100">
                    {facilitiesAtRisk.map((facility, idx) => (
                      <FacilityAtRiskCard key={facility.facility_id} facility={facility} index={idx} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
                    <p className="text-xs text-zinc-500">All facilities in good standing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </DemoCard>
        </div>

        {/* Key Covenant Trends */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2.5 px-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-indigo-50">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Key Covenant Trends</CardTitle>
                <CardDescription className="text-[10px]">Critical metrics to watch</CardDescription>
              </div>
            </div>
            <Link href="/compliance/covenants">
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-zinc-500 hover:text-zinc-900">
                View All Covenants
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-3 px-3 pb-3">
            <CompactGrid columns={3} gap="sm">
              {keyCovenantTrends.map((trend) => (
                <CovenantTrendSparkline
                  key={trend.title}
                  title={trend.title}
                  data={trend.data}
                  currentValue={trend.currentValue}
                  threshold={trend.threshold}
                  thresholdType={trend.thresholdType}
                  height={60}
                  className="shadow-none border-zinc-100"
                />
              ))}
            </CompactGrid>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2.5 px-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-zinc-100">
                <Clock className="w-3.5 h-3.5 text-zinc-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <CardDescription className="text-[10px]">Latest compliance updates</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-zinc-500 hover:text-zinc-900">
              View All
            </Button>
          </CardHeader>
          <CardContent className="pt-3 px-3 pb-3">
            <CompactGrid columns={4} gap="sm">
              {recentActivity.map((activity, idx) => (
                <ActivityCard key={activity.id} activity={activity} index={idx} />
              ))}
            </CompactGrid>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
});
