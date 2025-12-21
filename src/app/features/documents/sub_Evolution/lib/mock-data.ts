/**
 * Mock data for Evolution Engine development
 */

import type {
  AmendmentSuggestion,
  MarketConditionsSnapshot,
  CovenantHeadroomAnalysis,
  EvolutionDashboardStats,
  FacilityEvolutionStatus,
} from './types';

export const mockFacilities = [
  {
    id: 'fac-1',
    name: 'Apollo Industries Revolver',
    borrowerName: 'Apollo Industries Inc.',
    borrowerIndustry: 'Manufacturing',
    facilityType: 'Revolving Credit',
    totalCommitment: 250000000,
    maturityDate: '2027-06-30',
    baseRate: 'SOFR',
    currentMargin: 175,
  },
  {
    id: 'fac-2',
    name: 'Meridian Holdings Term Loan B',
    borrowerName: 'Meridian Holdings LLC',
    borrowerIndustry: 'Technology',
    facilityType: 'Term Loan B',
    totalCommitment: 500000000,
    maturityDate: '2028-12-31',
    baseRate: 'SOFR',
    currentMargin: 225,
  },
  {
    id: 'fac-3',
    name: 'Cascade Energy Credit Facility',
    borrowerName: 'Cascade Energy Corp.',
    borrowerIndustry: 'Energy',
    facilityType: 'Revolving Credit',
    totalCommitment: 150000000,
    maturityDate: '2026-03-15',
    baseRate: 'SOFR',
    currentMargin: 200,
  },
];

export const mockFacilityEvolutionStatuses: FacilityEvolutionStatus[] = [
  {
    facilityId: 'fac-1',
    facilityName: 'Apollo Industries Revolver',
    borrowerName: 'Apollo Industries Inc.',
    healthScore: 72,
    healthTrend: 'deteriorating',
    activeSuggestions: [],
    covenantAnalysis: [],
    marketExposure: {
      interestRateSensitivity: 'medium',
      creditSpreadExposure: 'moderate',
      regulatoryRisk: 'low',
    },
    recentChanges: [
      {
        type: 'covenant_test',
        description: 'Q4 2024 covenant test completed - leverage ratio at 4.13x',
        date: '2024-12-31',
        impact: 'negative',
      },
      {
        type: 'market_movement',
        description: 'SOFR increased 25bps since facility inception',
        date: '2024-11-15',
        impact: 'negative',
      },
    ],
    maturity: {
      date: '2027-06-30',
      daysUntil: 927,
      actionRequired: false,
    },
    lastAnalyzedAt: new Date().toISOString(),
  },
  {
    facilityId: 'fac-2',
    facilityName: 'Meridian Holdings Term Loan B',
    borrowerName: 'Meridian Holdings LLC',
    healthScore: 85,
    healthTrend: 'stable',
    activeSuggestions: [],
    covenantAnalysis: [],
    marketExposure: {
      interestRateSensitivity: 'high',
      creditSpreadExposure: 'minimal',
      regulatoryRisk: 'medium',
    },
    recentChanges: [
      {
        type: 'margin_repricing',
        description: 'Margin grid step-down achieved',
        date: '2024-10-01',
        impact: 'positive',
      },
    ],
    maturity: {
      date: '2028-12-31',
      daysUntil: 1476,
      actionRequired: false,
    },
    lastAnalyzedAt: new Date().toISOString(),
  },
  {
    facilityId: 'fac-3',
    facilityName: 'Cascade Energy Credit Facility',
    borrowerName: 'Cascade Energy Corp.',
    healthScore: 58,
    healthTrend: 'deteriorating',
    activeSuggestions: [],
    covenantAnalysis: [],
    marketExposure: {
      interestRateSensitivity: 'high',
      creditSpreadExposure: 'significant',
      regulatoryRisk: 'high',
    },
    recentChanges: [
      {
        type: 'regulatory',
        description: 'New ESG disclosure requirements affecting energy sector',
        date: '2024-12-01',
        impact: 'negative',
      },
      {
        type: 'covenant_breach_risk',
        description: 'Interest coverage approaching minimum threshold',
        date: '2024-12-15',
        impact: 'negative',
      },
    ],
    maturity: {
      date: '2026-03-15',
      daysUntil: 454,
      actionRequired: true,
    },
    lastAnalyzedAt: new Date().toISOString(),
  },
];
