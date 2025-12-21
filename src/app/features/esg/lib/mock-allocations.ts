import type { FacilityAllocation } from './types';

export const mockAllocations: FacilityAllocation[] = [
  {
    facility_id: '2',
    facility_name: 'XYZ Holdings Green Loan',
    borrower_name: 'XYZ Holdings Ltd',
    esg_loan_type: 'green_loan',
    commitment_amount: 75000000,
    categories: [
      {
        id: '1',
        category_name: 'Renewable Energy',
        eligible_category: 'renewable_energy',
        eligible_amount: 40000000,
        total_allocated: 35000000,
        allocation_count: 3,
        projects: [
          { id: '1', project_name: 'Solar Farm Phase 1', amount: 15000000, date: '2024-03-15' },
          { id: '2', project_name: 'Wind Turbine Installation', amount: 12000000, date: '2024-05-20' },
          { id: '3', project_name: 'Solar Farm Phase 2', amount: 8000000, date: '2024-08-10' },
        ],
      },
      {
        id: '2',
        category_name: 'Energy Efficiency',
        eligible_category: 'energy_efficiency',
        eligible_amount: 20000000,
        total_allocated: 12000000,
        allocation_count: 2,
        projects: [
          { id: '4', project_name: 'Building Retrofit Program', amount: 7000000, date: '2024-04-01' },
          { id: '5', project_name: 'LED Lighting Upgrade', amount: 5000000, date: '2024-06-15' },
        ],
      },
      {
        id: '3',
        category_name: 'Clean Transportation',
        eligible_category: 'clean_transportation',
        eligible_amount: 15000000,
        total_allocated: 8000000,
        allocation_count: 1,
        projects: [{ id: '6', project_name: 'EV Fleet Acquisition', amount: 8000000, date: '2024-07-01' }],
      },
    ],
    unallocated_amount: 20000000,
    lookback_period_end: '2025-06-30',
  },
  {
    facility_id: '3',
    facility_name: 'Neptune Social Bond',
    borrower_name: 'Neptune Industries',
    esg_loan_type: 'social_loan',
    commitment_amount: 100000000,
    categories: [
      {
        id: '4',
        category_name: 'Affordable Housing',
        eligible_category: 'affordable_housing',
        eligible_amount: 50000000,
        total_allocated: 42000000,
        allocation_count: 4,
        projects: [
          { id: '7', project_name: 'Community Housing Project A', amount: 15000000, date: '2024-02-01' },
          { id: '8', project_name: 'Community Housing Project B', amount: 12000000, date: '2024-04-15' },
          { id: '9', project_name: 'Affordable Apartments', amount: 10000000, date: '2024-06-20' },
          { id: '10', project_name: 'Senior Living Facility', amount: 5000000, date: '2024-09-01' },
        ],
      },
      {
        id: '5',
        category_name: 'Healthcare Access',
        eligible_category: 'healthcare_access',
        eligible_amount: 30000000,
        total_allocated: 18000000,
        allocation_count: 2,
        projects: [
          { id: '11', project_name: 'Rural Clinic Network', amount: 10000000, date: '2024-03-10' },
          { id: '12', project_name: 'Mobile Health Units', amount: 8000000, date: '2024-07-25' },
        ],
      },
      {
        id: '6',
        category_name: 'Education',
        eligible_category: 'education',
        eligible_amount: 20000000,
        total_allocated: 15000000,
        allocation_count: 2,
        projects: [
          { id: '13', project_name: 'STEM Education Program', amount: 8000000, date: '2024-05-01' },
          { id: '14', project_name: 'Vocational Training Center', amount: 7000000, date: '2024-08-15' },
        ],
      },
    ],
    unallocated_amount: 25000000,
    lookback_period_end: '2025-03-31',
  },
];
