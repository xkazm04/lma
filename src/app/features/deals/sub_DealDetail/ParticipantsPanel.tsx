'use client';

import React, { memo } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DealParticipant } from '../lib/types';

interface ParticipantsPanelProps {
  participants: DealParticipant[];
}

export const ParticipantsPanel = memo(function ParticipantsPanel({
  participants,
}: ParticipantsPanelProps) {
  return (
    <Card
      className="animate-in fade-in slide-in-from-right-4 duration-500 delay-100"
      data-testid="participants-panel"
      role="region"
      aria-label="Deal participants"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Participants</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="transition-transform hover:scale-105"
            data-testid="invite-participant-btn"
            aria-label="Invite new participant to deal"
          >
            <Plus className="w-3 h-3 mr-1" aria-hidden="true" />
            Invite
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {participants.map((participant, index) => (
            <div key={participant.id} className="flex items-center justify-between" data-testid={`participant-card-${index}`}>
              <div>
                <p className="text-sm font-medium text-zinc-900" data-testid={`participant-name-${index}`}>{participant.party_name}</p>
                <p className="text-xs text-zinc-500" data-testid={`participant-role-${index}`}>{participant.party_role}</p>
              </div>
              <Badge
                variant="outline"
                className={
                  participant.party_type === 'borrower_side'
                    ? 'border-blue-200 text-blue-700'
                    : participant.party_type === 'lender_side'
                      ? 'border-green-200 text-green-700'
                      : 'border-zinc-200 text-zinc-600'
                }
                data-testid={`participant-badge-${index}`}
              >
                {participant.deal_role.replace('_', ' ')}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
