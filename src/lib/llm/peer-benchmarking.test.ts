import { describe, it, expect } from 'vitest';
import {
  calculateKPIPercentileRankings,
  generateFacilityPeerRanking,
} from './esg';
import type { KPICategory, ESGLoanType } from '@/app/features/esg/lib/types';

describe('Peer Benchmarking Functions', () => {
  describe('calculateKPIPercentileRankings', () => {
    const baseFacility = {
      facility_id: 'facility-1',
      facility_name: 'Test Facility',
      borrower_name: 'Test Borrower',
      borrower_industry: 'Manufacturing',
      esg_loan_type: 'sustainability_linked' as ESGLoanType,
    };

    const basePeerGroup = {
      id: 'peer-group-1',
      name: 'Manufacturing Peers',
      member_count: 10,
    };

    it('should calculate correct percentile for higher-is-better KPI', () => {
      const context = {
        facility: baseFacility,
        peer_group: basePeerGroup,
        facility_kpis: [
          {
            kpi_id: 'kpi-1',
            kpi_name: 'Renewable Energy %',
            kpi_category: 'environmental_energy' as KPICategory,
            unit: '%',
            current_value: 75,
            baseline_value: 50,
            target_value: 80,
            improvement_direction: 'increase' as const,
          },
        ],
        peer_kpi_data: [
          {
            kpi_name: 'Renewable Energy %',
            kpi_category: 'environmental_energy' as KPICategory,
            values: [30, 40, 50, 60, 70, 80, 90],
            min: 30,
            max: 90,
            mean: 60,
            median: 60,
            p25: 45,
            p75: 75,
          },
        ],
      };

      const rankings = calculateKPIPercentileRankings(context);

      expect(rankings).toHaveLength(1);
      expect(rankings[0].kpi_name).toBe('Renewable Energy %');
      expect(rankings[0].facility_value).toBe(75);
      // 75 is higher than 4 values (30, 40, 50, 60) and equal to 1 (70 is lower), so ~71st percentile
      expect(rankings[0].percentile).toBeGreaterThan(50);
      expect(rankings[0].positioning).toMatch(/above_average|leader/);
    });

    it('should calculate correct percentile for lower-is-better KPI (emissions)', () => {
      const context = {
        facility: baseFacility,
        peer_group: basePeerGroup,
        facility_kpis: [
          {
            kpi_id: 'kpi-1',
            kpi_name: 'GHG Emissions',
            kpi_category: 'environmental_emissions' as KPICategory,
            unit: 'tCO2e',
            current_value: 100,
            baseline_value: 150,
            target_value: 80,
            improvement_direction: 'decrease' as const,
          },
        ],
        peer_kpi_data: [
          {
            kpi_name: 'GHG Emissions',
            kpi_category: 'environmental_emissions' as KPICategory,
            values: [50, 80, 120, 150, 180, 200],
            min: 50,
            max: 200,
            mean: 130,
            median: 135,
            p25: 80,
            p75: 175,
          },
        ],
      };

      const rankings = calculateKPIPercentileRankings(context);

      expect(rankings).toHaveLength(1);
      expect(rankings[0].kpi_name).toBe('GHG Emissions');
      expect(rankings[0].facility_value).toBe(100);
      // 100 is lower than most peers (120, 150, 180, 200), so should have high percentile
      // With decrease direction, lower is better, so we invert
      expect(rankings[0].percentile).toBeGreaterThan(50);
    });

    it('should return default values when no peer data available', () => {
      const context = {
        facility: baseFacility,
        peer_group: basePeerGroup,
        facility_kpis: [
          {
            kpi_id: 'kpi-1',
            kpi_name: 'Custom KPI',
            kpi_category: 'governance_ethics' as KPICategory,
            unit: 'score',
            current_value: 85,
            baseline_value: 70,
            target_value: 90,
            improvement_direction: 'increase' as const,
          },
        ],
        peer_kpi_data: [], // No peer data
      };

      const rankings = calculateKPIPercentileRankings(context);

      expect(rankings).toHaveLength(1);
      expect(rankings[0].percentile).toBe(50);
      expect(rankings[0].positioning).toBe('average');
      expect(rankings[0].improvement_to_next_quartile).toBe(0);
    });

    it('should identify best in class correctly', () => {
      const context = {
        facility: baseFacility,
        peer_group: basePeerGroup,
        facility_kpis: [
          {
            kpi_id: 'kpi-1',
            kpi_name: 'Safety Score',
            kpi_category: 'social_health_safety' as KPICategory,
            unit: 'score',
            current_value: 95,
            baseline_value: 80,
            target_value: 100,
            improvement_direction: 'increase' as const,
          },
        ],
        peer_kpi_data: [
          {
            kpi_name: 'Safety Score',
            kpi_category: 'social_health_safety' as KPICategory,
            values: [60, 70, 75, 80, 85],
            min: 60,
            max: 85,
            mean: 74,
            median: 75,
            p25: 67.5,
            p75: 82.5,
          },
        ],
      };

      const rankings = calculateKPIPercentileRankings(context);

      expect(rankings[0].best_in_class.value).toBe(85); // Max value since higher is better
      expect(rankings[0].percentile).toBe(100); // Facility has highest value
      expect(rankings[0].positioning).toBe('leader');
    });

    it('should calculate improvement to next quartile correctly', () => {
      const context = {
        facility: baseFacility,
        peer_group: basePeerGroup,
        facility_kpis: [
          {
            kpi_id: 'kpi-1',
            kpi_name: 'Training Hours',
            kpi_category: 'social_workforce' as KPICategory,
            unit: 'hours',
            current_value: 30,
            baseline_value: 20,
            target_value: 50,
            improvement_direction: 'increase' as const,
          },
        ],
        peer_kpi_data: [
          {
            kpi_name: 'Training Hours',
            kpi_category: 'social_workforce' as KPICategory,
            values: [20, 25, 35, 40, 45, 50, 55, 60],
            min: 20,
            max: 60,
            mean: 41.25,
            median: 42.5,
            p25: 30,
            p75: 52.5,
          },
        ],
      };

      const rankings = calculateKPIPercentileRankings(context);

      // Facility at 30 is at ~p25, so improvement needed is to reach median (42.5)
      expect(rankings[0].improvement_to_next_quartile).toBeGreaterThan(0);
      expect(rankings[0].improvement_to_next_quartile).toBeLessThanOrEqual(42.5 - 30);
    });
  });

  describe('generateFacilityPeerRanking', () => {
    it('should calculate overall percentile as average of KPI percentiles', async () => {
      const context = {
        facility: {
          facility_id: 'facility-1',
          facility_name: 'Test Facility',
          borrower_name: 'Test Borrower',
          borrower_industry: 'Technology',
          esg_loan_type: 'sustainability_linked' as ESGLoanType,
        },
        peer_group: {
          id: 'peer-group-1',
          name: 'Tech Peers',
          member_count: 5,
        },
        facility_kpis: [
          {
            kpi_id: 'kpi-1',
            kpi_name: 'Carbon Intensity',
            kpi_category: 'environmental_emissions' as KPICategory,
            unit: 'tCO2e/MWh',
            current_value: 0.3,
            baseline_value: 0.5,
            target_value: 0.2,
            improvement_direction: 'decrease' as const,
          },
          {
            kpi_id: 'kpi-2',
            kpi_name: 'Board Diversity',
            kpi_category: 'governance_board' as KPICategory,
            unit: '%',
            current_value: 45,
            baseline_value: 30,
            target_value: 50,
            improvement_direction: 'increase' as const,
          },
        ],
        peer_kpi_data: [
          {
            kpi_name: 'Carbon Intensity',
            kpi_category: 'environmental_emissions' as KPICategory,
            values: [0.2, 0.35, 0.4, 0.5],
            min: 0.2,
            max: 0.5,
            mean: 0.3625,
            median: 0.375,
            p25: 0.275,
            p75: 0.45,
          },
          {
            kpi_name: 'Board Diversity',
            kpi_category: 'governance_board' as KPICategory,
            values: [25, 35, 40, 50],
            min: 25,
            max: 50,
            mean: 37.5,
            median: 37.5,
            p25: 30,
            p75: 45,
          },
        ],
      };

      const ranking = await generateFacilityPeerRanking(context);

      expect(ranking.facility_id).toBe('facility-1');
      expect(ranking.facility_name).toBe('Test Facility');
      expect(ranking.kpi_rankings).toHaveLength(2);
      expect(ranking.overall_percentile).toBeGreaterThanOrEqual(0);
      expect(ranking.overall_percentile).toBeLessThanOrEqual(100);
      expect(ranking.category_rankings).toHaveLength(2);
      expect(ranking.generated_at).toBeDefined();
    });

    it('should identify strengths and weaknesses correctly', async () => {
      const context = {
        facility: {
          facility_id: 'facility-1',
          facility_name: 'Test Facility',
          borrower_name: 'Test Borrower',
          borrower_industry: 'Manufacturing',
          esg_loan_type: 'green_loan' as ESGLoanType,
        },
        peer_group: {
          id: 'peer-group-1',
          name: 'Manufacturing Peers',
          member_count: 10,
        },
        facility_kpis: [
          {
            kpi_id: 'kpi-1',
            kpi_name: 'Strong KPI',
            kpi_category: 'environmental_energy' as KPICategory,
            unit: '%',
            current_value: 90, // Top performer
            baseline_value: 60,
            target_value: 85,
            improvement_direction: 'increase' as const,
          },
          {
            kpi_id: 'kpi-2',
            kpi_name: 'Weak KPI',
            kpi_category: 'social_workforce' as KPICategory,
            unit: 'score',
            current_value: 30, // Bottom performer
            baseline_value: 40,
            target_value: 70,
            improvement_direction: 'increase' as const,
          },
        ],
        peer_kpi_data: [
          {
            kpi_name: 'Strong KPI',
            kpi_category: 'environmental_energy' as KPICategory,
            values: [50, 55, 60, 65, 70, 75, 80, 85],
            min: 50,
            max: 85,
            mean: 67.5,
            median: 67.5,
            p25: 57.5,
            p75: 77.5,
          },
          {
            kpi_name: 'Weak KPI',
            kpi_category: 'social_workforce' as KPICategory,
            values: [40, 50, 60, 70, 80, 85, 90],
            min: 40,
            max: 90,
            mean: 67.86,
            median: 70,
            p25: 50,
            p75: 85,
          },
        ],
      };

      const ranking = await generateFacilityPeerRanking(context);

      // Should have at least one strength (high percentile KPI)
      expect(ranking.strengths.some(s => s.kpi_name === 'Strong KPI')).toBe(true);

      // Should have at least one weakness (low percentile KPI)
      expect(ranking.weaknesses.some(w => w.kpi_name === 'Weak KPI')).toBe(true);
    });

    it('should group KPIs by category correctly', async () => {
      const context = {
        facility: {
          facility_id: 'facility-1',
          facility_name: 'Test Facility',
          borrower_name: 'Test Borrower',
          borrower_industry: 'Energy',
          esg_loan_type: 'transition_loan' as ESGLoanType,
        },
        peer_group: {
          id: 'peer-group-1',
          name: 'Energy Peers',
          member_count: 8,
        },
        facility_kpis: [
          {
            kpi_id: 'kpi-1',
            kpi_name: 'Emissions Intensity',
            kpi_category: 'environmental_emissions' as KPICategory,
            unit: 'tCO2e',
            current_value: 100,
            baseline_value: 150,
            target_value: 80,
            improvement_direction: 'decrease' as const,
          },
          {
            kpi_id: 'kpi-2',
            kpi_name: 'Methane Leakage',
            kpi_category: 'environmental_emissions' as KPICategory,
            unit: '%',
            current_value: 0.5,
            baseline_value: 1.0,
            target_value: 0.3,
            improvement_direction: 'decrease' as const,
          },
          {
            kpi_id: 'kpi-3',
            kpi_name: 'Worker Safety',
            kpi_category: 'social_health_safety' as KPICategory,
            unit: 'incidents',
            current_value: 2,
            baseline_value: 5,
            target_value: 0,
            improvement_direction: 'decrease' as const,
          },
        ],
        peer_kpi_data: [
          {
            kpi_name: 'Emissions Intensity',
            kpi_category: 'environmental_emissions' as KPICategory,
            values: [80, 100, 120, 140, 160],
            min: 80,
            max: 160,
            mean: 120,
            median: 120,
            p25: 90,
            p75: 150,
          },
          {
            kpi_name: 'Methane Leakage',
            kpi_category: 'environmental_emissions' as KPICategory,
            values: [0.2, 0.4, 0.6, 0.8, 1.0],
            min: 0.2,
            max: 1.0,
            mean: 0.6,
            median: 0.6,
            p25: 0.3,
            p75: 0.9,
          },
          {
            kpi_name: 'Worker Safety',
            kpi_category: 'social_health_safety' as KPICategory,
            values: [0, 1, 3, 5, 8],
            min: 0,
            max: 8,
            mean: 3.4,
            median: 3,
            p25: 0.5,
            p75: 6.5,
          },
        ],
      };

      const ranking = await generateFacilityPeerRanking(context);

      // Should have 2 categories: environmental_emissions and social_health_safety
      expect(ranking.category_rankings.length).toBe(2);

      const emissionsCategory = ranking.category_rankings.find(
        c => c.category === 'environmental_emissions'
      );
      const safetyCategory = ranking.category_rankings.find(
        c => c.category === 'social_health_safety'
      );

      expect(emissionsCategory).toBeDefined();
      expect(emissionsCategory?.kpi_count).toBe(2);

      expect(safetyCategory).toBeDefined();
      expect(safetyCategory?.kpi_count).toBe(1);
    });
  });
});
