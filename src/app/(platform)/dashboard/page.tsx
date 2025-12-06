'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Handshake,
  ClipboardCheck,
  ArrowLeftRight,
  Leaf,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  Upload,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data for the dashboard
const stats = [
  {
    label: 'Active Loans',
    value: '24',
    change: '+3 this month',
    trend: 'up',
    icon: FileText,
  },
  {
    label: 'Documents Processed',
    value: '156',
    change: '+28 this month',
    trend: 'up',
    icon: Upload,
  },
  {
    label: 'Upcoming Deadlines',
    value: '8',
    change: 'Next 30 days',
    trend: 'neutral',
    icon: Calendar,
  },
  {
    label: 'Open Negotiations',
    value: '3',
    change: '2 awaiting response',
    trend: 'neutral',
    icon: Handshake,
  },
  {
    label: 'ESG At Risk',
    value: '2',
    change: 'Action required',
    trend: 'down',
    icon: AlertTriangle,
  },
];

const recentActivity = [
  {
    id: '1',
    type: 'document_uploaded',
    title: 'Document uploaded',
    description: 'Facility Agreement - Project Apollo.pdf',
    timestamp: '2 minutes ago',
    user: 'Sarah Johnson',
    status: 'success',
  },
  {
    id: '2',
    type: 'extraction_complete',
    title: 'Extraction complete',
    description: 'Term Loan Agreement - XYZ Corp analyzed',
    timestamp: '15 minutes ago',
    user: 'System',
    status: 'success',
  },
  {
    id: '3',
    type: 'compliance_due',
    title: 'Compliance deadline',
    description: 'Q4 Financials due in 5 days - ABC Holdings',
    timestamp: '1 hour ago',
    user: 'System',
    status: 'warning',
  },
  {
    id: '4',
    type: 'term_change',
    title: 'Term negotiation',
    description: 'Margin ratchet updated - Project Neptune',
    timestamp: '3 hours ago',
    user: 'Mike Chen',
    status: 'info',
  },
  {
    id: '5',
    type: 'esg_update',
    title: 'ESG target at risk',
    description: 'Carbon reduction KPI below threshold',
    timestamp: '5 hours ago',
    user: 'System',
    status: 'error',
  },
];

const upcomingDeadlines = [
  {
    id: '1',
    type: 'compliance',
    title: 'Q4 Financial Statements',
    loan: 'ABC Holdings - Term Loan A',
    dueDate: 'Dec 15, 2024',
    daysRemaining: 5,
    priority: 'high',
  },
  {
    id: '2',
    type: 'compliance',
    title: 'Compliance Certificate',
    loan: 'XYZ Corp - Revolving Facility',
    dueDate: 'Dec 20, 2024',
    daysRemaining: 10,
    priority: 'medium',
  },
  {
    id: '3',
    type: 'esg',
    title: 'ESG Performance Report',
    loan: 'Project Neptune',
    dueDate: 'Dec 31, 2024',
    daysRemaining: 21,
    priority: 'medium',
  },
  {
    id: '4',
    type: 'compliance',
    title: 'Budget Submission',
    loan: 'Project Apollo',
    dueDate: 'Jan 15, 2025',
    daysRemaining: 36,
    priority: 'low',
  },
];

const modules = [
  {
    name: 'Document Hub',
    description: 'Upload and analyze loan documents with AI-powered extraction',
    icon: FileText,
    href: '/documents',
    metric: '156 documents',
    color: 'bg-blue-500',
    available: true,
  },
  {
    name: 'Deal Room',
    description: 'Negotiate terms and track deal progress in real-time',
    icon: Handshake,
    href: '/deals',
    metric: '3 active deals',
    color: 'bg-purple-500',
    available: false,
  },
  {
    name: 'Compliance Tracker',
    description: 'Monitor obligations, covenants, and reporting deadlines',
    icon: ClipboardCheck,
    href: '/compliance',
    metric: '8 upcoming',
    color: 'bg-amber-500',
    available: false,
  },
  {
    name: 'Trade Due Diligence',
    description: 'Streamline secondary loan trading with automated DD',
    icon: ArrowLeftRight,
    href: '/trading',
    metric: '2 in progress',
    color: 'bg-green-500',
    available: false,
  },
  {
    name: 'ESG Dashboard',
    description: 'Track sustainability KPIs and margin ratchets',
    icon: Leaf,
    href: '/esg',
    metric: '5 facilities',
    color: 'bg-emerald-500',
    available: false,
  },
];

function StatCard({ stat }: { stat: typeof stats[0] }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="text-3xl font-bold text-zinc-900 mt-1">{stat.value}</p>
            <p className={`text-xs mt-1 flex items-center gap-1 ${
              stat.trend === 'up' ? 'text-green-600' :
              stat.trend === 'down' ? 'text-red-600' :
              'text-zinc-500'
            }`}>
              {stat.trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {stat.change}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-100">
            <stat.icon className="w-5 h-5 text-zinc-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: typeof recentActivity[0] }) {
  const statusColors = {
    success: 'text-green-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  };

  const StatusIcon = activity.status === 'success' ? CheckCircle :
    activity.status === 'warning' ? Clock :
    activity.status === 'error' ? AlertTriangle : Clock;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-100 last:border-0">
      <div className={`mt-0.5 ${statusColors[activity.status as keyof typeof statusColors]}`}>
        <StatusIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900">{activity.title}</p>
        <p className="text-sm text-zinc-500 truncate">{activity.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-zinc-400">{activity.timestamp}</span>
          <span className="text-xs text-zinc-300">•</span>
          <span className="text-xs text-zinc-400">{activity.user}</span>
        </div>
      </div>
    </div>
  );
}

function DeadlineItem({ deadline }: { deadline: typeof upcomingDeadlines[0] }) {
  const priorityColors = {
    high: 'destructive',
    medium: 'warning',
    low: 'secondary',
  } as const;

  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-900">{deadline.title}</p>
          <Badge variant={priorityColors[deadline.priority as keyof typeof priorityColors]}>
            {deadline.daysRemaining}d
          </Badge>
        </div>
        <p className="text-sm text-zinc-500 truncate">{deadline.loan}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-zinc-900">{deadline.dueDate}</p>
        <p className="text-xs text-zinc-400">{deadline.type}</p>
      </div>
    </div>
  );
}

function ModuleCard({ module }: { module: typeof modules[0] }) {
  return (
    <Card className={`group transition-all hover:shadow-md ${!module.available ? 'opacity-60' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${module.color}`}>
            <module.icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900">{module.name}</h3>
              {!module.available && (
                <Badge variant="secondary">Coming Soon</Badge>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-1">{module.description}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm font-medium text-zinc-600">{module.metric}</span>
              {module.available && (
                <Link href={module.href}>
                  <Button variant="ghost" size="sm" className="group-hover:bg-zinc-100">
                    Open
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500">Overview of your loan portfolio and recent activity</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across all modules</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-zinc-100">
              {recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Next 30 days</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-zinc-100">
              {upcomingDeadlines.map((deadline) => (
                <DeadlineItem key={deadline.id} deadline={deadline} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Quick Access */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <ModuleCard key={module.name} module={module} />
          ))}
        </div>
      </div>
    </div>
  );
}
