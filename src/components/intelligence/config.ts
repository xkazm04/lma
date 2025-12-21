'use client';

import {
  Brain,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  FileText,
  Handshake,
  Shield,
  Leaf,
  Zap,
  Target,
  Activity,
  Wallet,
  Newspaper,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  type LucideIcon,
} from 'lucide-react';
import type { Domain, Severity, TrendDirection, SignalType, SignalDirection } from './types';

// ============================================
// Severity Configuration
// ============================================

export interface SeverityConfig {
  borderColor: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
  badgeVariant: 'default' | 'destructive' | 'warning' | 'secondary';
  icon: LucideIcon;
}

export const severityConfig: Record<Severity, SeverityConfig> = {
  critical: {
    borderColor: 'border-l-red-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    iconColor: 'text-red-600',
    badgeVariant: 'destructive',
    icon: AlertCircle,
  },
  high: {
    borderColor: 'border-l-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    iconColor: 'text-orange-600',
    badgeVariant: 'warning',
    icon: AlertTriangle,
  },
  medium: {
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    iconColor: 'text-amber-600',
    badgeVariant: 'warning',
    icon: AlertTriangle,
  },
  low: {
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-600',
    badgeVariant: 'secondary',
    icon: Info,
  },
  info: {
    borderColor: 'border-l-zinc-400',
    bgColor: 'bg-zinc-50',
    textColor: 'text-zinc-600',
    iconColor: 'text-zinc-500',
    badgeVariant: 'secondary',
    icon: Info,
  },
};

// ============================================
// Trend Configuration
// ============================================

export interface TrendConfig {
  icon: LucideIcon;
  color: string;
  label: string;
}

export const trendConfig: Record<TrendDirection, TrendConfig> = {
  improving: {
    icon: TrendingUp,
    color: 'text-green-600',
    label: 'Improving',
  },
  stable: {
    icon: Minus,
    color: 'text-zinc-500',
    label: 'Stable',
  },
  declining: {
    icon: TrendingDown,
    color: 'text-red-600',
    label: 'Declining',
  },
};

// ============================================
// Domain Configuration
// ============================================

export interface DomainAlertType {
  icon: LucideIcon;
  label: string;
  defaultSeverity: Severity;
}

export interface DomainConfig {
  name: string;
  icon: LucideIcon;
  primaryColor: string;
  gradientFrom: string;
  gradientTo: string;
  bgLight: string;
  borderLight: string;
  intelligenceTitle: string;
  predictionLabel: string;
  alertTypes: Record<string, DomainAlertType>;
}

export const domainConfig: Record<Domain, DomainConfig> = {
  documents: {
    name: 'Documents',
    icon: FileText,
    primaryColor: 'indigo',
    gradientFrom: 'from-indigo-600',
    gradientTo: 'to-purple-600',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    intelligenceTitle: 'Document Intelligence',
    predictionLabel: 'Amendment Suggestions',
    alertTypes: {
      market_movement: { icon: TrendingUp, label: 'Market Movement', defaultSeverity: 'medium' },
      covenant_risk: { icon: AlertTriangle, label: 'Covenant Risk', defaultSeverity: 'high' },
      regulatory_change: { icon: Shield, label: 'Regulatory Change', defaultSeverity: 'medium' },
      suggestion_generated: { icon: Zap, label: 'New Suggestion', defaultSeverity: 'info' },
      anomaly_detected: { icon: AlertCircle, label: 'Anomaly Detected', defaultSeverity: 'high' },
    },
  },
  deals: {
    name: 'Deals',
    icon: Handshake,
    primaryColor: 'blue',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-cyan-600',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    intelligenceTitle: 'Deal Intelligence',
    predictionLabel: 'Negotiation Predictions',
    alertTypes: {
      sticking_point: { icon: AlertTriangle, label: 'Sticking Point', defaultSeverity: 'high' },
      market_benchmark: { icon: BarChart3, label: 'Market Benchmark', defaultSeverity: 'info' },
      counterparty_signal: { icon: Activity, label: 'Counterparty Signal', defaultSeverity: 'medium' },
      deadline_approaching: { icon: Clock, label: 'Deadline Approaching', defaultSeverity: 'high' },
      acceleration_risk: { icon: Zap, label: 'Acceleration Risk', defaultSeverity: 'critical' },
    },
  },
  compliance: {
    name: 'Compliance',
    icon: Shield,
    primaryColor: 'purple',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-pink-600',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    intelligenceTitle: 'Compliance Autopilot',
    predictionLabel: 'Breach Predictions',
    alertTypes: {
      breach_imminent: { icon: AlertCircle, label: 'Breach Imminent', defaultSeverity: 'critical' },
      risk_escalation: { icon: TrendingUp, label: 'Risk Escalation', defaultSeverity: 'high' },
      intervention_due: { icon: Clock, label: 'Intervention Due', defaultSeverity: 'high' },
      action_required: { icon: Target, label: 'Action Required', defaultSeverity: 'medium' },
      waiver_needed: { icon: FileText, label: 'Waiver Needed', defaultSeverity: 'high' },
      covenant_test: { icon: CheckCircle, label: 'Covenant Test', defaultSeverity: 'info' },
    },
  },
  esg: {
    name: 'ESG',
    icon: Leaf,
    primaryColor: 'green',
    gradientFrom: 'from-green-600',
    gradientTo: 'to-emerald-600',
    bgLight: 'bg-green-50',
    borderLight: 'border-green-200',
    intelligenceTitle: 'ESG Performance',
    predictionLabel: 'KPI Predictions',
    alertTypes: {
      target_at_risk: { icon: AlertTriangle, label: 'Target at Risk', defaultSeverity: 'high' },
      margin_impact: { icon: TrendingDown, label: 'Margin Impact', defaultSeverity: 'high' },
      verification_due: { icon: Clock, label: 'Verification Due', defaultSeverity: 'medium' },
      kpi_milestone: { icon: Target, label: 'KPI Milestone', defaultSeverity: 'info' },
      improvement_opportunity: { icon: TrendingUp, label: 'Improvement Opportunity', defaultSeverity: 'low' },
    },
  },
};

// ============================================
// Signal Type Configuration
// ============================================

export interface SignalTypeConfig {
  icon: LucideIcon;
  label: string;
  bgPositive: string;
  bgNegative: string;
  bgNeutral: string;
  textPositive: string;
  textNegative: string;
  textNeutral: string;
}

export const signalTypeConfig: Record<SignalType, SignalTypeConfig> = {
  market: {
    icon: Activity,
    label: 'Market Data',
    bgPositive: 'bg-green-100',
    bgNegative: 'bg-red-100',
    bgNeutral: 'bg-zinc-100',
    textPositive: 'text-green-700',
    textNegative: 'text-red-700',
    textNeutral: 'text-zinc-700',
  },
  transaction: {
    icon: Wallet,
    label: 'Transaction Pattern',
    bgPositive: 'bg-green-100',
    bgNegative: 'bg-red-100',
    bgNeutral: 'bg-zinc-100',
    textPositive: 'text-green-700',
    textNegative: 'text-red-700',
    textNeutral: 'text-zinc-700',
  },
  news: {
    icon: Newspaper,
    label: 'News Sentiment',
    bgPositive: 'bg-green-100',
    bgNegative: 'bg-red-100',
    bgNeutral: 'bg-zinc-100',
    textPositive: 'text-green-700',
    textNegative: 'text-red-700',
    textNeutral: 'text-zinc-700',
  },
  benchmark: {
    icon: BarChart3,
    label: 'Benchmark Update',
    bgPositive: 'bg-blue-100',
    bgNegative: 'bg-amber-100',
    bgNeutral: 'bg-zinc-100',
    textPositive: 'text-blue-700',
    textNegative: 'text-amber-700',
    textNeutral: 'text-zinc-700',
  },
  activity: {
    icon: Activity,
    label: 'Activity',
    bgPositive: 'bg-blue-100',
    bgNegative: 'bg-amber-100',
    bgNeutral: 'bg-zinc-100',
    textPositive: 'text-blue-700',
    textNegative: 'text-amber-700',
    textNeutral: 'text-zinc-700',
  },
};

// ============================================
// Signal Direction Configuration
// ============================================

export interface SignalDirectionConfig {
  icon: LucideIcon;
  label: string;
  color: string;
}

export const signalDirectionConfig: Record<SignalDirection, SignalDirectionConfig> = {
  positive: {
    icon: TrendingUp,
    label: 'Positive',
    color: 'text-green-600',
  },
  negative: {
    icon: TrendingDown,
    label: 'Negative',
    color: 'text-red-600',
  },
  neutral: {
    icon: Minus,
    label: 'Neutral',
    color: 'text-zinc-500',
  },
};

// ============================================
// Action Status Configuration
// ============================================

export interface ActionStatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  icon: LucideIcon;
}

export const actionStatusConfig: Record<string, ActionStatusConfig> = {
  pending: {
    label: 'Pending',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: XCircle,
  },
  in_progress: {
    label: 'In Progress',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: Activity,
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: CheckCircle,
  },
  expired: {
    label: 'Expired',
    bgColor: 'bg-zinc-100',
    textColor: 'text-zinc-500',
    icon: Clock,
  },
};

// ============================================
// Helper Functions
// ============================================

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'bg-green-100 text-green-700';
  if (confidence >= 60) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export function getHeadroomColor(headroom: number): string {
  if (headroom >= 30) return 'bg-green-500';
  if (headroom >= 15) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getProgressColor(current: number, target: number): string {
  const ratio = current / target;
  if (ratio >= 0.9) return 'bg-green-500';
  if (ratio >= 0.7) return 'bg-amber-500';
  return 'bg-red-500';
}

export function formatProbability(probability: number): string {
  return `${Math.round(probability)}%`;
}

export function formatConfidence(confidence: number): string {
  if (confidence >= 80) return 'High';
  if (confidence >= 60) return 'Medium';
  return 'Low';
}
