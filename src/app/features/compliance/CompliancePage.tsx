'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, AlertTriangle, Plus, RefreshCw, ArrowRight, CheckCircle, BarChart3, Zap, Activity, Network, ArrowRightLeft, Bot, Brain } from 'lucide-react';
import { ComplianceStatsBar, GroupedDeadlinesList, FacilityAtRiskCard, ActivityCard } from './components';
import { dashboardStats, upcomingItems, facilitiesAtRisk, recentActivity } from './lib';

export const CompliancePage = memo(function CompliancePage() {
  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Compliance Tracker</h1>
          <p className="text-zinc-500">Monitor obligations, covenants, and reporting deadlines</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hover:shadow-sm transition-all">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync from Documents
          </Button>
          <Link href="/compliance/facilities">
            <Button className="hover:shadow-sm transition-all">
              <Plus className="w-4 h-4 mr-2" />
              Add Facility
            </Button>
          </Link>
        </div>
      </div>

      <ComplianceStatsBar stats={dashboardStats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 animate-in fade-in slide-in-from-left-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Next 14 days</CardDescription>
            </div>
            <Link href="/compliance/calendar">
              <Button variant="ghost" size="sm" className="hover:bg-zinc-100 transition-colors">
                View Calendar
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <GroupedDeadlinesList items={upcomingItems} />
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-right-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Facilities at Risk</CardTitle>
              <CardDescription>Require attention</CardDescription>
            </div>
            <Link href="/compliance/facilities?filter=at_risk">
              <Button variant="ghost" size="sm" className="hover:bg-zinc-100 transition-colors">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {facilitiesAtRisk.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {facilitiesAtRisk.map((facility, idx) => (
                  <FacilityAtRiskCard key={facility.facility_id} facility={facility} index={idx} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-zinc-500">All facilities in good standing</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-3">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest compliance updates</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="hover:bg-zinc-100 transition-colors">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentActivity.map((activity, idx) => (
              <ActivityCard key={activity.id} activity={activity} index={idx} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            href: '/compliance/autopilot',
            icon: Brain,
            iconBg: 'bg-gradient-to-br from-purple-100 to-pink-100 group-hover:from-purple-200 group-hover:to-pink-200',
            iconColor: 'text-purple-600',
            title: 'Predictive Autopilot',
            description: 'AI breach prediction 6-12 months ahead',
          },
          {
            href: '/compliance/agent',
            icon: Bot,
            iconBg: 'bg-purple-100 group-hover:bg-purple-200',
            iconColor: 'text-purple-600',
            title: 'Compliance Agent',
            description: 'AI-powered natural language assistant',
          },
          {
            href: '/compliance/live-testing',
            icon: Activity,
            iconBg: 'bg-emerald-100 group-hover:bg-emerald-200',
            iconColor: 'text-emerald-600',
            title: 'Live Testing',
            description: 'Real-time covenant monitoring',
          },
          {
            href: '/compliance/automated-calendar',
            icon: Zap,
            iconBg: 'bg-green-100 group-hover:bg-green-200',
            iconColor: 'text-green-600',
            title: 'Automated Calendar',
            description: 'Smart reminders & calendar sync',
          },
          {
            href: '/compliance/calendar',
            icon: Calendar,
            iconBg: 'bg-blue-100 group-hover:bg-blue-200',
            iconColor: 'text-blue-600',
            title: 'Obligation Calendar',
            description: 'View all deadlines and events',
          },
          {
            href: '/compliance/covenants',
            icon: TrendingUp,
            iconBg: 'bg-purple-100 group-hover:bg-purple-200',
            iconColor: 'text-purple-600',
            title: 'Covenant Tracking',
            description: 'Monitor tests and headroom',
          },
          {
            href: '/compliance/headroom-exchange',
            icon: ArrowRightLeft,
            iconBg: 'bg-orange-100 group-hover:bg-orange-200',
            iconColor: 'text-orange-600',
            title: 'Headroom Exchange',
            description: 'Trade covenant flexibility',
          },
          {
            href: '/compliance/covenant-network',
            icon: Network,
            iconBg: 'bg-rose-100 group-hover:bg-rose-200',
            iconColor: 'text-rose-600',
            title: 'Covenant Network',
            description: 'Cross-facility correlations',
          },
          {
            href: '/compliance/benchmarks',
            icon: BarChart3,
            iconBg: 'bg-indigo-100 group-hover:bg-indigo-200',
            iconColor: 'text-indigo-600',
            title: 'Benchmark Network',
            description: 'Compare to industry standards',
          },
          {
            href: '/compliance/notifications',
            icon: AlertTriangle,
            iconBg: 'bg-amber-100 group-hover:bg-amber-200',
            iconColor: 'text-amber-600',
            title: 'Event Notifications',
            description: 'Analyze and report events',
          },
        ].map((action, idx) => (
          <Link key={action.href} href={action.href}>
            <Card
              className="hover:shadow-md transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg transition-colors ${action.iconBg}`}>
                    <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900">{action.title}</h3>
                    <p className="text-sm text-zinc-500">{action.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
});
