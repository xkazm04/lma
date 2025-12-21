/**
 * Dashboard Mock Data - Barrel Export
 *
 * This module provides a unified entry point for all dashboard mock data.
 * Organized into logical modules for better maintainability and navigation.
 *
 * Usage:
 *   import { stats, recentActivity } from '@/app/features/dashboard/lib/mocks';
 *   import { mockBorrowerProfiles } from '@/app/features/dashboard/lib/mocks';
 *   import type { DashboardStat, RiskLevel } from '@/app/features/dashboard/lib/mocks';
 */

// =============================================================================
// Dashboard Core Data
// =============================================================================

export {
  // Types
  type DashboardStat,
  type ActivityItem,
  type DeadlineItem,
  type ModuleItem,
  type LoanDetail,
  type DocumentDetail,
  type DeadlineDetail,
  type NegotiationDetail,
  type ESGRiskDetail,
  type StatDrilldownType,
  type HealthScoreComponent,
  type HealthScoreTrendPoint,
  type IndustryBenchmark,
  type PortfolioHealthData,
  type HealthScoreDrilldownItem,
  // Mock Data
  stats,
  recentActivity,
  upcomingDeadlines,
  modules,
  activeLoansDetails,
  documentsProcessedDetails,
  upcomingDeadlinesDetails,
  openNegotiationsDetails,
  esgAtRiskDetails,
  portfolioHealthData,
  healthScoreDrilldownData,
} from './dashboard-data';

// =============================================================================
// Risk Correlation Types & Utils
// =============================================================================

export {
  // Types
  type RiskCategory,
  type RiskSeverity,
  type CorrelationType,
  type BorrowerRiskProfile,
  type RiskFactor,
  type RiskEvent,
  type RiskCorrelation,
  type SharedRiskFactor,
  type RippleEffect,
  type AffectedBorrower,
  type RelatedCovenant,
  type PortfolioCorrelationMetrics,
  type ConcentrationRisk,
  type SectorExposure,
  type GeographyExposure,
  type CorrelationCluster,
  type CorrelationMatrixData,
  type MatrixHighlight,
  type RiskCorrelationDashboard,
  type RiskCorrelationAlert,
  type CorrelationFilters,
} from './risk-correlation-types';

export {
  // Utility Functions
  calculateCorrelationStrength,
  calculatePortfolioCorrelations,
  calculateRippleEffect,
  calculatePortfolioMetrics,
  generateCorrelationMatrix,
  filterCorrelations,
  formatExposure,
  getCorrelationColor,
  getCorrelationBgColor,
  getSeverityColor,
  getSeverityVariant,
} from './risk-correlation-utils';

// =============================================================================
// Risk Correlation Mock Data
// =============================================================================

export {
  // Mock Data
  mockBorrowerProfiles,
  mockRiskEvents,
  mockUpcomingCovenants,
  mockAlerts,
  mockCorrelations,
  mockPortfolioMetrics,
  mockRippleEffect,
  mockRiskCorrelationDashboard,
  // Helper Functions
  getBorrowerById,
  getCorrelationsForBorrower,
  getEventsForBorrower,
} from './risk-correlation-data';

// =============================================================================
// Collaboration Data
// =============================================================================

export {
  // Types
  type PresenceStatus,
  type ActivityType,
  type TeamMember,
  type LoanActivityEvent,
  type CounterpartyAction,
  type Mention,
  // Mock Data
  teamMembers,
  loanActivityStream,
  counterpartyActions,
  recentMentions,
  // Config Maps
  activityTypeConfig,
  presenceStatusConfig,
  // Helper Functions
  getActiveTeamMembersCount,
  getUnreadMentionsCount,
  getActiveCounterpartyActionsCount,
} from './collaboration-data';

// =============================================================================
// Autopilot Types
// =============================================================================

export {
  // Core Types
  type AutopilotStatus,
  type RiskLevel,
  type InterventionStatus,
  type PredictionConfidence,
  type AutopilotSettings,
  // Prediction Types
  type BreachPrediction,
  type ContributingFactor,
  type LeadingIndicator,
  // Intervention Types
  type InterventionType,
  type Intervention,
  type InterventionActionDetails,
  // Dashboard Types
  type AutopilotDashboardData,
  type AutopilotMetrics,
  type AutopilotAction,
  type AutopilotAlert,
  type PerformanceDataPoint,
  // API Response Types
  type AutopilotStatusResponse,
  type PredictionResponse,
  type InterventionResponse,
  // Action Queue Types
  type ActionQueueStatus,
  type ActionExecutionMode,
  type ActionQueueItem,
  type ConfidenceFactor,
  type ActionExecutionResult,
  type ActionArtifact,
  type ActionQueueDashboardData,
  type ActionQueueMetrics,
  type AutoApprovalThresholds,
  // Action Generation Types
  type GeneratedAction,
  type ActionGenerationRequest,
  type ActionGenerationResponse,
} from './autopilot-types';

// =============================================================================
// Autopilot Mock Data
// =============================================================================

export {
  // Settings & Metrics
  mockAutopilotSettings,
  mockAutopilotMetrics,
  // Predictions & Interventions
  mockBreachPredictions,
  mockInterventions,
  // Activity & Alerts
  mockAutopilotActions,
  mockAutopilotAlerts,
  // Performance
  mockPerformanceHistory,
  // Dashboard Data
  mockAutopilotDashboardData,
  // Action Queue
  mockAutoApprovalThresholds,
  mockActionQueueMetrics,
  mockActionQueueItems,
  mockActionQueueDashboardData,
} from './autopilot-data';
