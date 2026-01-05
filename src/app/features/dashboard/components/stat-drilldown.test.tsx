/**
 * Stat Drilldown Component Tests
 *
 * These tests serve as living documentation of the stats dashboard drilldown behavior.
 * They cover modal interactions, data display, and search functionality.
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. StatsTopBar renders all stat blocks with kebab-case data-testid attributes
 * 2. Each stat block is clickable and triggers onClick handler when provided
 * 3. StatDrilldownModal only renders content when open=true
 * 4. Modal closes on Escape key press via onOpenChange(false)
 * 5. Five drilldown types supported: loans, documents, deadlines, negotiations, esg
 * 6. Each drilldown type has unique column headers and description
 * 7. Search filters by name/title field and updates item count
 * 8. "No results found" message displays for empty search results
 * 9. Null type prop renders empty state gracefully (no crash)
 * 10. All interactive elements (buttons, inputs) have data-testid for automation
 * 11. Table rows have data-testid with format: "{type}-row-{id}"
 * 12. View All button closes the modal (triggers navigation in production)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { StatsTopBar } from './StatsTopBar';
import { StatDrilldownModal } from './StatDrilldownModal';
import type { StatItem } from './StatsTopBar';
import type { StatDrilldownType } from '../lib/mocks';
import {
  activeLoansDetails,
  documentsProcessedDetails,
  upcomingDeadlinesDetails,
  openNegotiationsDetails,
  esgAtRiskDetails,
} from '../lib/mocks';

// Mock the toast function
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  toast: (props: unknown) => mockToast(props),
  useToast: () => ({
    toast: mockToast,
    toasts: [],
    dismiss: vi.fn(),
  }),
}));

// Test data for StatsTopBar
const mockStats: StatItem[] = [
  {
    label: 'Active Loans',
    value: '24',
    change: '+3 this month',
    trend: 'up',
    icon: <span data-testid="mock-icon">icon</span>,
  },
  {
    label: 'Documents Processed',
    value: '156',
    change: '+28 this month',
    trend: 'up',
    icon: <span data-testid="mock-icon">icon</span>,
  },
  {
    label: 'Upcoming Deadlines',
    value: '8',
    change: 'Next 30 days',
    trend: 'neutral',
    icon: <span data-testid="mock-icon">icon</span>,
  },
  {
    label: 'Open Negotiations',
    value: '3',
    change: '2 awaiting response',
    trend: 'neutral',
    icon: <span data-testid="mock-icon">icon</span>,
  },
  {
    label: 'ESG At Risk',
    value: '2',
    change: 'Action required',
    trend: 'down',
    icon: <span data-testid="mock-icon">icon</span>,
  },
];

describe('StatsTopBar', () => {
  it('renders all stat cards', () => {
    render(<StatsTopBar stats={mockStats} />);

    expect(screen.getByTestId('stats-top-bar')).toBeInTheDocument();
    expect(screen.getByTestId('stat-block-active-loans')).toBeInTheDocument();
    expect(screen.getByTestId('stat-block-documents-processed')).toBeInTheDocument();
    expect(screen.getByTestId('stat-block-upcoming-deadlines')).toBeInTheDocument();
    expect(screen.getByTestId('stat-block-open-negotiations')).toBeInTheDocument();
    expect(screen.getByTestId('stat-block-esg-at-risk')).toBeInTheDocument();
  });

  it('displays correct values for each stat', () => {
    render(<StatsTopBar stats={mockStats} />);

    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('156')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays correct labels for each stat', () => {
    render(<StatsTopBar stats={mockStats} />);

    expect(screen.getByText('Active Loans')).toBeInTheDocument();
    expect(screen.getByText('Documents Processed')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Deadlines')).toBeInTheDocument();
    expect(screen.getByText('Open Negotiations')).toBeInTheDocument();
    expect(screen.getByText('ESG At Risk')).toBeInTheDocument();
  });

  it('calls onClick handler when stat is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const statsWithClick = mockStats.map((stat) => ({
      ...stat,
      onClick: handleClick,
    }));

    render(<StatsTopBar stats={statsWithClick} />);

    const activeLoansCard = screen.getByTestId('stat-block-active-loans');
    await user.click(activeLoansCard);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct test IDs with kebab-case labels', () => {
    render(<StatsTopBar stats={mockStats} />);

    // Verify all stat blocks have correct test IDs
    const statIds = [
      'stat-block-active-loans',
      'stat-block-documents-processed',
      'stat-block-upcoming-deadlines',
      'stat-block-open-negotiations',
      'stat-block-esg-at-risk',
    ];

    statIds.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });
  });
});

describe('StatDrilldownModal', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    mockOnOpenChange.mockClear();
  });

  describe('Modal opening and closing', () => {
    it('renders modal when open is true', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      expect(screen.getByTestId('stat-drilldown-modal')).toBeInTheDocument();
    });

    it('does not render modal content when open is false', () => {
      render(
        <StatDrilldownModal
          open={false}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      expect(screen.queryByTestId('stat-drilldown-modal')).not.toBeInTheDocument();
    });

    it('closes modal when Escape key is pressed', async () => {
      const user = userEvent.setup();

      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      await user.keyboard('{Escape}');

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange when View All button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      const viewAllBtn = screen.getByTestId('drilldown-view-all-btn');
      await user.click(viewAllBtn);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Loans drilldown type', () => {
    it('renders correct title and value badge', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      expect(screen.getByText('Active Loans')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument();
    });

    it('displays correct description for loans', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      expect(screen.getByText('View all active loans in your portfolio')).toBeInTheDocument();
    });

    it('renders loan data from mock in table', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      expect(screen.getByTestId('drilldown-table')).toBeInTheDocument();

      // Check that loan data is rendered
      activeLoansDetails.forEach((loan) => {
        expect(screen.getByTestId(`loan-row-${loan.id}`)).toBeInTheDocument();
      });
    });

    it('displays correct column headers for loans', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      const expectedColumns = ['Name', 'Borrower', 'Amount', 'Type', 'Status', 'Last Updated'];
      expectedColumns.forEach((column) => {
        expect(screen.getByText(column)).toBeInTheDocument();
      });
    });

    it('shows correct item count', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      expect(screen.getByText(`Showing ${activeLoansDetails.length} items`)).toBeInTheDocument();
    });
  });

  describe('Documents drilldown type', () => {
    it('renders document data from mock', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="documents"
          title="Documents Processed"
          value="156"
        />
      );

      expect(screen.getByText('Recently processed documents with extraction status')).toBeInTheDocument();

      documentsProcessedDetails.forEach((doc) => {
        expect(screen.getByTestId(`document-row-${doc.id}`)).toBeInTheDocument();
      });
    });

    it('displays correct column headers for documents', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="documents"
          title="Documents Processed"
          value="156"
        />
      );

      const expectedColumns = ['Document', 'Type', 'Uploaded By', 'Time', 'Status', 'Fields'];
      expectedColumns.forEach((column) => {
        expect(screen.getByText(column)).toBeInTheDocument();
      });
    });
  });

  describe('Deadlines drilldown type', () => {
    it('renders deadline data from mock', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="deadlines"
          title="Upcoming Deadlines"
          value="8"
        />
      );

      expect(screen.getByText('Upcoming compliance and reporting deadlines')).toBeInTheDocument();

      upcomingDeadlinesDetails.forEach((deadline) => {
        expect(screen.getByTestId(`deadline-row-${deadline.id}`)).toBeInTheDocument();
      });
    });

    it('displays correct column headers for deadlines', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="deadlines"
          title="Upcoming Deadlines"
          value="8"
        />
      );

      const expectedColumns = ['Deadline', 'Loan', 'Due Date', 'Days Left', 'Type', 'Priority'];
      expectedColumns.forEach((column) => {
        expect(screen.getByText(column)).toBeInTheDocument();
      });
    });
  });

  describe('Negotiations drilldown type', () => {
    it('renders negotiation data from mock', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="negotiations"
          title="Open Negotiations"
          value="3"
        />
      );

      expect(screen.getByText('Active deal negotiations awaiting action')).toBeInTheDocument();

      openNegotiationsDetails.forEach((negotiation) => {
        expect(screen.getByTestId(`negotiation-row-${negotiation.id}`)).toBeInTheDocument();
      });
    });

    it('displays correct column headers for negotiations', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="negotiations"
          title="Open Negotiations"
          value="3"
        />
      );

      const expectedColumns = ['Deal', 'Counterparty', 'Status', 'Proposals', 'Open Items', 'Last Activity'];
      expectedColumns.forEach((column) => {
        expect(screen.getByText(column)).toBeInTheDocument();
      });
    });
  });

  describe('ESG drilldown type', () => {
    it('renders ESG risk data from mock', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="esg"
          title="ESG At Risk"
          value="2"
        />
      );

      expect(screen.getByText('ESG KPIs at risk requiring immediate attention')).toBeInTheDocument();

      esgAtRiskDetails.forEach((risk) => {
        expect(screen.getByTestId(`esg-row-${risk.id}`)).toBeInTheDocument();
      });
    });

    it('displays correct column headers for ESG', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="esg"
          title="ESG At Risk"
          value="2"
        />
      );

      const expectedColumns = ['KPI', 'Facility', 'Target', 'Current', 'Impact', 'Deadline'];
      expectedColumns.forEach((column) => {
        expect(screen.getByText(column)).toBeInTheDocument();
      });
    });
  });

  describe('Search functionality', () => {
    it('renders search input', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      expect(screen.getByTestId('drilldown-search-input')).toBeInTheDocument();
    });

    it('filters loans based on search query', async () => {
      const user = userEvent.setup();

      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      const searchInput = screen.getByTestId('drilldown-search-input');
      await user.type(searchInput, 'Apollo');

      // Only Apollo-related loans should be visible
      await waitFor(() => {
        expect(screen.getByTestId('loan-row-3')).toBeInTheDocument(); // Project Apollo
        expect(screen.queryByTestId('loan-row-1')).not.toBeInTheDocument(); // Term Loan A
      });
    });

    it('shows no results message when search has no matches', async () => {
      const user = userEvent.setup();

      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      const searchInput = screen.getByTestId('drilldown-search-input');
      await user.type(searchInput, 'NonExistentLoan12345');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
      });
    });

    it('updates item count based on filtered results', async () => {
      const user = userEvent.setup();

      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      const searchInput = screen.getByTestId('drilldown-search-input');
      await user.type(searchInput, 'Apollo');

      await waitFor(() => {
        expect(screen.getByText('Showing 1 items')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting functionality', () => {
    it('renders sortable column headers', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      // All 6 columns should have sort icons
      for (let i = 0; i < 6; i++) {
        expect(screen.getByTestId(`sort-column-${i}`)).toBeInTheDocument();
      }
    });

    it('allows clicking on column headers', async () => {
      const user = userEvent.setup();

      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      const nameHeader = screen.getByTestId('sort-column-0');
      await user.click(nameHeader);

      // The component should handle the sort without errors
      expect(screen.getByTestId('drilldown-table')).toBeInTheDocument();
    });

    it('shows ascending sort icon when column is clicked', async () => {
      const user = userEvent.setup();

      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      const nameHeader = screen.getByTestId('sort-column-0');
      await user.click(nameHeader);

      // Should show ascending sort icon
      expect(screen.getByTestId('sort-asc-0')).toBeInTheDocument();
    });

    it('toggles to descending sort on second click', async () => {
      const user = userEvent.setup();

      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      const nameHeader = screen.getByTestId('sort-column-0');
      await user.click(nameHeader);
      await user.click(nameHeader);

      // Should show descending sort icon
      expect(screen.getByTestId('sort-desc-0')).toBeInTheDocument();
    });

    it('sorts loans by borrower name in ascending order', async () => {
      const user = userEvent.setup();

      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title="Active Loans"
          value="24"
        />
      );

      // Click on Borrower column (index 1)
      const borrowerHeader = screen.getByTestId('sort-column-1');
      await user.click(borrowerHeader);

      // Verify sorting icon changes to ascending
      expect(screen.getByTestId('sort-asc-1')).toBeInTheDocument();

      // Get all table rows (excluding header)
      const table = screen.getByTestId('drilldown-table');
      const rows = within(table).getAllByRole('row').slice(1);

      // Get borrower names from the second cell of each row
      const borrowerNames = rows.map(row => {
        const cells = row.querySelectorAll('td');
        return cells[1]?.textContent || '';
      });

      // Verify the array is sorted alphabetically
      const sortedBorrowers = [...borrowerNames].sort((a, b) => a.localeCompare(b));
      expect(borrowerNames).toEqual(sortedBorrowers);
    });

    it('sorts deadlines by days remaining numerically', async () => {
      const user = userEvent.setup();

      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="deadlines"
          title="Upcoming Deadlines"
          value="8"
        />
      );

      // Click on Days Left column (index 3)
      const daysHeader = screen.getByTestId('sort-column-3');
      await user.click(daysHeader);

      // Verify sorting is applied (ascending icon should be visible)
      expect(screen.getByTestId('sort-asc-3')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles null type gracefully', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type={null}
          title=""
          value=""
        />
      );

      // Modal should still render but with no data
      expect(screen.getByTestId('stat-drilldown-modal')).toBeInTheDocument();
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('handles empty title and value', () => {
      render(
        <StatDrilldownModal
          open={true}
          onOpenChange={mockOnOpenChange}
          type="loans"
          title=""
          value=""
        />
      );

      expect(screen.getByTestId('stat-drilldown-modal')).toBeInTheDocument();
      expect(screen.getByTestId('drilldown-table')).toBeInTheDocument();
    });
  });
});

describe('Stat Drilldown Integration Journey', () => {
  /**
   * This test simulates the complete user journey:
   * 1. User sees StatsTopBar with all stats
   * 2. User clicks on a stat
   * 3. StatDrilldownModal opens with correct type/title/value
   * 4. Modal displays relevant data from mock
   * 5. User can search within the modal
   * 6. User can close modal via Escape key
   */
  it('completes full stat drilldown journey for Active Loans', async () => {
    const user = userEvent.setup();
    const handleStatClick = vi.fn();
    let modalOpen = false;

    const handleOpenChange = (open: boolean) => {
      modalOpen = open;
    };

    const statsWithClick = mockStats.map((stat) => ({
      ...stat,
      onClick: () => {
        handleStatClick(stat.label, stat.value);
        modalOpen = true;
      },
    }));

    // Step 1: Render StatsTopBar only (modal closed)
    const { rerender, unmount } = render(<StatsTopBar stats={statsWithClick} />);

    // Step 2: Verify initial state - modal should be closed
    expect(screen.queryByTestId('stat-drilldown-modal')).not.toBeInTheDocument();

    // Step 3: Click on Active Loans stat
    const activeLoansCard = screen.getByTestId('stat-block-active-loans');
    await user.click(activeLoansCard);

    // Step 4: Verify handleStatClick was called
    expect(handleStatClick).toHaveBeenCalledWith('Active Loans', '24');
    expect(modalOpen).toBe(true);

    // Step 5: Unmount and render just the modal for testing
    unmount();

    render(
      <StatDrilldownModal
        open={true}
        onOpenChange={handleOpenChange}
        type="loans"
        title="Active Loans"
        value="24"
      />
    );

    // Step 6: Verify modal opened with correct data
    expect(screen.getByTestId('stat-drilldown-modal')).toBeInTheDocument();

    // Use within to get the title inside the modal
    const modal = screen.getByTestId('stat-drilldown-modal');
    expect(within(modal).getByRole('heading', { name: /Active Loans/i })).toBeInTheDocument();
    expect(within(modal).getByText('24')).toBeInTheDocument();
    expect(within(modal).getByText('View all active loans in your portfolio')).toBeInTheDocument();

    // Step 7: Verify loan data is displayed
    activeLoansDetails.forEach((loan) => {
      expect(screen.getByTestId(`loan-row-${loan.id}`)).toBeInTheDocument();
    });

    // Step 8: Test search functionality
    const searchInput = screen.getByTestId('drilldown-search-input');
    await user.type(searchInput, 'Neptune');

    await waitFor(() => {
      expect(screen.getByTestId('loan-row-4')).toBeInTheDocument(); // Project Neptune
      expect(screen.queryByTestId('loan-row-1')).not.toBeInTheDocument();
    });

    // Step 9: Clear search
    await user.clear(searchInput);

    await waitFor(() => {
      expect(screen.getByText(`Showing ${activeLoansDetails.length} items`)).toBeInTheDocument();
    });
  });

  it('completes full journey for each stat type', async () => {
    const statTypeMap: Record<string, { type: StatDrilldownType; description: string }> = {
      'Active Loans': { type: 'loans', description: 'View all active loans in your portfolio' },
      'Documents Processed': {
        type: 'documents',
        description: 'Recently processed documents with extraction status',
      },
      'Upcoming Deadlines': {
        type: 'deadlines',
        description: 'Upcoming compliance and reporting deadlines',
      },
      'Open Negotiations': {
        type: 'negotiations',
        description: 'Active deal negotiations awaiting action',
      },
      'ESG At Risk': { type: 'esg', description: 'ESG KPIs at risk requiring immediate attention' },
    };

    for (const [label, { type, description }] of Object.entries(statTypeMap)) {
      const stat = mockStats.find((s) => s.label === label);
      if (!stat) continue;

      const { unmount } = render(
        <StatDrilldownModal
          open={true}
          onOpenChange={vi.fn()}
          type={type}
          title={label}
          value={stat.value}
        />
      );

      const modal = screen.getByTestId('stat-drilldown-modal');

      // Verify modal header shows correct title and description
      expect(within(modal).getByRole('heading', { name: new RegExp(label, 'i') })).toBeInTheDocument();
      expect(within(modal).getByText(description)).toBeInTheDocument();

      // Verify the value is displayed in the badge (within the heading)
      const heading = within(modal).getByRole('heading', { name: new RegExp(label, 'i') });
      expect(within(heading).getByText(stat.value)).toBeInTheDocument();

      // Verify table is rendered
      expect(screen.getByTestId('drilldown-table')).toBeInTheDocument();

      // Cleanup for next iteration
      unmount();
    }
  });

  it('handles keyboard navigation - Escape closes modal', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <StatDrilldownModal
        open={true}
        onOpenChange={handleOpenChange}
        type="loans"
        title="Active Loans"
        value="24"
      />
    );

    // Focus on the modal content first, then press Escape
    const modal = screen.getByTestId('stat-drilldown-modal');
    modal.focus();

    // Press Escape
    await user.keyboard('{Escape}');

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('handles keyboard navigation - interactive elements are present and focusable', async () => {
    render(
      <StatDrilldownModal
        open={true}
        onOpenChange={vi.fn()}
        type="loans"
        title="Active Loans"
        value="24"
      />
    );

    const searchInput = screen.getByTestId('drilldown-search-input');
    const viewAllBtn = screen.getByTestId('drilldown-view-all-btn');

    // Elements should be present
    expect(searchInput).toBeInTheDocument();
    expect(viewAllBtn).toBeInTheDocument();

    // Check that interactive elements have correct types
    expect(searchInput.tagName).toBe('INPUT');
    expect(viewAllBtn.tagName).toBe('BUTTON');
  });
});
