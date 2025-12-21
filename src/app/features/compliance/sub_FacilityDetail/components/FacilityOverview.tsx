'use client';

import React, { memo } from 'react';
import { DollarSign, Calendar, Building2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FacilityDetail } from '../../lib/types';

import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { getStatusBadge } from '@/lib/utils/statusHelpers';

interface FacilityOverviewProps {
  facility: FacilityDetail;
}

export const FacilityOverview = memo(function FacilityOverview({ facility }: FacilityOverviewProps) {
  const statusBadge = getStatusBadge(facility.status);

  const cards = [
    {
      icon: DollarSign,
      label: 'Total Commitment',
      value: formatCurrency(facility.commitment_amount),
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: Calendar,
      label: 'Maturity Date',
      value: formatDate(facility.maturity_date),
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: Building2,
      label: 'Agent',
      value: facility.agent_bank || 'N/A',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      icon: FileText,
      label: 'Facility Type',
      value: facility.facility_type.replace(/_/g, ' '),
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      extra: <Badge variant={statusBadge.variant} className="ml-2">{statusBadge.label}</Badge>,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card
          key={card.label}
          className={cn(
            'transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md',
            'animate-in fade-in slide-in-from-bottom-4'
          )}
          style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className={cn('p-2 rounded-lg', card.iconBg)}>
                <card.icon className={cn('w-5 h-5', card.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-500">{card.label}</p>
                <div className="flex items-center">
                  <p className="font-semibold text-zinc-900 truncate">{card.value}</p>
                  {card.extra}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
