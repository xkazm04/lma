'use client';

import React, { memo, useState, useMemo } from 'react';
import { Search, ArrowUpDown, FileText, Clock, AlertTriangle, Handshake, Leaf } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  StatDrilldownType,
  LoanDetail,
  DocumentDetail,
  DeadlineDetail,
  NegotiationDetail,
  ESGRiskDetail,
} from '../lib/mocks';
import {
  activeLoansDetails,
  documentsProcessedDetails,
  upcomingDeadlinesDetails,
  openNegotiationsDetails,
  esgAtRiskDetails,
} from '../lib/mocks';

interface StatDrilldownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: StatDrilldownType | null;
  title: string;
  value: string;
}

type SortDirection = 'asc' | 'desc';

const drilldownConfig: Record<StatDrilldownType, {
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  columns: string[];
}> = {
  loans: {
    icon: FileText,
    description: 'View all active loans in your portfolio',
    columns: ['Name', 'Borrower', 'Amount', 'Type', 'Status', 'Last Updated'],
  },
  documents: {
    icon: FileText,
    description: 'Recently processed documents with extraction status',
    columns: ['Document', 'Type', 'Uploaded By', 'Time', 'Status', 'Fields'],
  },
  deadlines: {
    icon: Clock,
    description: 'Upcoming compliance and reporting deadlines',
    columns: ['Deadline', 'Loan', 'Due Date', 'Days Left', 'Type', 'Priority'],
  },
  negotiations: {
    icon: Handshake,
    description: 'Active deal negotiations awaiting action',
    columns: ['Deal', 'Counterparty', 'Status', 'Proposals', 'Open Items', 'Last Activity'],
  },
  esg: {
    icon: AlertTriangle,
    description: 'ESG KPIs at risk requiring immediate attention',
    columns: ['KPI', 'Facility', 'Target', 'Current', 'Impact', 'Deadline'],
  },
};

function LoanRow({ loan }: { loan: LoanDetail }) {
  return (
    <tr
      className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer"
      data-testid={`loan-row-${loan.id}`}
    >
      <td className="py-3 px-4">
        <span className="font-medium text-zinc-900">{loan.name}</span>
      </td>
      <td className="py-3 px-4 text-zinc-600">{loan.borrower}</td>
      <td className="py-3 px-4 text-zinc-600">{loan.amount}</td>
      <td className="py-3 px-4">
        <Badge variant="secondary">{loan.type}</Badge>
      </td>
      <td className="py-3 px-4">
        <Badge variant={loan.status === 'active' ? 'success' : loan.status === 'pending' ? 'warning' : 'secondary'}>
          {loan.status}
        </Badge>
      </td>
      <td className="py-3 px-4 text-zinc-500 text-sm">{loan.lastUpdated}</td>
    </tr>
  );
}

function DocumentRow({ doc }: { doc: DocumentDetail }) {
  return (
    <tr
      className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer"
      data-testid={`document-row-${doc.id}`}
    >
      <td className="py-3 px-4">
        <span className="font-medium text-zinc-900 truncate max-w-[200px] block">{doc.name}</span>
      </td>
      <td className="py-3 px-4">
        <Badge variant="secondary">{doc.type}</Badge>
      </td>
      <td className="py-3 px-4 text-zinc-600">{doc.uploadedBy}</td>
      <td className="py-3 px-4 text-zinc-500 text-sm">{doc.uploadedAt}</td>
      <td className="py-3 px-4">
        <Badge variant={doc.status === 'processed' ? 'success' : doc.status === 'pending' ? 'warning' : 'destructive'}>
          {doc.status}
        </Badge>
      </td>
      <td className="py-3 px-4 text-zinc-600">{doc.extractedFields}</td>
    </tr>
  );
}

function DeadlineRow({ deadline }: { deadline: DeadlineDetail }) {
  return (
    <tr
      className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer"
      data-testid={`deadline-row-${deadline.id}`}
    >
      <td className="py-3 px-4">
        <span className="font-medium text-zinc-900">{deadline.title}</span>
      </td>
      <td className="py-3 px-4 text-zinc-600 text-sm">{deadline.loan}</td>
      <td className="py-3 px-4 text-zinc-600">{deadline.dueDate}</td>
      <td className="py-3 px-4">
        <span className={cn(
          'font-medium',
          deadline.daysRemaining <= 7 ? 'text-red-600' : deadline.daysRemaining <= 14 ? 'text-amber-600' : 'text-zinc-600'
        )}>
          {deadline.daysRemaining} days
        </span>
      </td>
      <td className="py-3 px-4">
        <Badge variant="secondary">{deadline.type}</Badge>
      </td>
      <td className="py-3 px-4">
        <Badge variant={deadline.priority === 'high' ? 'destructive' : deadline.priority === 'medium' ? 'warning' : 'secondary'}>
          {deadline.priority}
        </Badge>
      </td>
    </tr>
  );
}

function NegotiationRow({ negotiation }: { negotiation: NegotiationDetail }) {
  return (
    <tr
      className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer"
      data-testid={`negotiation-row-${negotiation.id}`}
    >
      <td className="py-3 px-4">
        <span className="font-medium text-zinc-900">{negotiation.deal}</span>
      </td>
      <td className="py-3 px-4 text-zinc-600">{negotiation.counterparty}</td>
      <td className="py-3 px-4">
        <Badge variant={negotiation.status === 'awaiting_response' ? 'warning' : negotiation.status === 'in_progress' ? 'info' : 'success'}>
          {negotiation.status.replace('_', ' ')}
        </Badge>
      </td>
      <td className="py-3 px-4 text-zinc-600">{negotiation.proposalsCount}</td>
      <td className="py-3 px-4">
        <span className={cn(
          'font-medium',
          negotiation.openItems > 3 ? 'text-amber-600' : 'text-zinc-600'
        )}>
          {negotiation.openItems}
        </span>
      </td>
      <td className="py-3 px-4 text-zinc-500 text-sm">{negotiation.lastActivity}</td>
    </tr>
  );
}

function ESGRiskRow({ risk }: { risk: ESGRiskDetail }) {
  return (
    <tr
      className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer"
      data-testid={`esg-row-${risk.id}`}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-red-500" />
          <span className="font-medium text-zinc-900">{risk.kpi}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-zinc-600">{risk.facility}</td>
      <td className="py-3 px-4 text-zinc-600">{risk.target}</td>
      <td className="py-3 px-4">
        <span className="font-medium text-red-600">{risk.current}</span>
      </td>
      <td className="py-3 px-4">
        <Badge variant="destructive">{risk.impact}</Badge>
      </td>
      <td className="py-3 px-4 text-zinc-500">{risk.deadline}</td>
    </tr>
  );
}

export const StatDrilldownModal = memo(function StatDrilldownModal({
  open,
  onOpenChange,
  type,
  title,
  value,
}: StatDrilldownModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const config = type ? drilldownConfig[type] : null;
  const IconComponent = config?.icon || FileText;

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  const filteredData = useMemo(() => {
    if (!type) return [];

    const query = searchQuery.toLowerCase();

    switch (type) {
      case 'loans':
        return activeLoansDetails.filter(loan =>
          loan.name.toLowerCase().includes(query) ||
          loan.borrower.toLowerCase().includes(query) ||
          loan.type.toLowerCase().includes(query)
        );
      case 'documents':
        return documentsProcessedDetails.filter(doc =>
          doc.name.toLowerCase().includes(query) ||
          doc.type.toLowerCase().includes(query) ||
          doc.uploadedBy.toLowerCase().includes(query)
        );
      case 'deadlines':
        return upcomingDeadlinesDetails.filter(deadline =>
          deadline.title.toLowerCase().includes(query) ||
          deadline.loan.toLowerCase().includes(query) ||
          deadline.type.toLowerCase().includes(query)
        );
      case 'negotiations':
        return openNegotiationsDetails.filter(negotiation =>
          negotiation.deal.toLowerCase().includes(query) ||
          negotiation.counterparty.toLowerCase().includes(query)
        );
      case 'esg':
        return esgAtRiskDetails.filter(risk =>
          risk.kpi.toLowerCase().includes(query) ||
          risk.facility.toLowerCase().includes(query)
        );
      default:
        return [];
    }
  }, [type, searchQuery]);

  const renderTable = () => {
    if (!type || !config) return null;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="drilldown-table">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {config.columns.map((column, index) => (
                <th
                  key={column}
                  className="py-3 px-4 text-left font-medium text-zinc-600 cursor-pointer hover:bg-zinc-100 transition-colors"
                  onClick={() => handleSort(index)}
                  data-testid={`sort-column-${index}`}
                >
                  <div className="flex items-center gap-1">
                    {column}
                    <ArrowUpDown className={cn(
                      'w-3 h-3',
                      sortColumn === index ? 'text-zinc-900' : 'text-zinc-400'
                    )} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {type === 'loans' && (filteredData as LoanDetail[]).map(loan => (
              <LoanRow key={loan.id} loan={loan} />
            ))}
            {type === 'documents' && (filteredData as DocumentDetail[]).map(doc => (
              <DocumentRow key={doc.id} doc={doc} />
            ))}
            {type === 'deadlines' && (filteredData as DeadlineDetail[]).map(deadline => (
              <DeadlineRow key={deadline.id} deadline={deadline} />
            ))}
            {type === 'negotiations' && (filteredData as NegotiationDetail[]).map(negotiation => (
              <NegotiationRow key={negotiation.id} negotiation={negotiation} />
            ))}
            {type === 'esg' && (filteredData as ESGRiskDetail[]).map(risk => (
              <ESGRiskRow key={risk.id} risk={risk} />
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
        data-testid="stat-drilldown-modal"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-100">
              <IconComponent className="w-5 h-5 text-zinc-600" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                {title}
                <Badge variant="secondary" className="ml-2">{value}</Badge>
              </DialogTitle>
              <DialogDescription>
                {config?.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search and filters */}
        <div className="flex items-center gap-4 py-4 border-b border-zinc-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              data-testid="drilldown-search-input"
            />
          </div>
          <Button variant="outline" size="sm" data-testid="drilldown-filter-btn">
            Filter
          </Button>
          <Button variant="outline" size="sm" data-testid="drilldown-export-btn">
            Export
          </Button>
        </div>

        {/* Table content */}
        <div className="flex-1 overflow-y-auto">
          {filteredData.length > 0 ? (
            renderTable()
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Search className="w-8 h-8 mb-2" />
              <p>No results found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 text-sm text-zinc-500">
          <span>Showing {filteredData.length} items</span>
          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            data-testid="drilldown-view-all-btn"
          >
            View All in Module
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
