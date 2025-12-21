'use client';

import React, { memo } from 'react';
import { Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { NewDealFormData } from '../lib/types';

interface StepParticipantsProps {
  formData: NewDealFormData;
  onUpdate: (field: string, value: unknown) => void;
  onAddParticipant: () => void;
  onRemoveParticipant: (index: number) => void;
  onUpdateParticipant: (index: number, field: string, value: string) => void;
}

export const StepParticipants = memo(function StepParticipants({
  formData,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateParticipant,
}: StepParticipantsProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="step-participants">
      <div>
        <Label className="text-base font-medium">Deal Participants</Label>
        <p className="text-sm text-zinc-500 mb-4">
          Add the parties who will be part of this negotiation
        </p>
      </div>

      <div className="space-y-4" data-testid="participants-list">
        {formData.participants.map((participant, index) => (
          <Card key={index} className="bg-zinc-50 animate-in slide-in-from-bottom-4 duration-300" data-testid={`new-deal-participant-card-${index}`}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-medium text-zinc-600">Participant {index + 1}</span>
                {formData.participants.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveParticipant(index)}
                    className="text-red-600 hover:text-red-700"
                    data-testid={`remove-participant-btn-${index}`}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Party Name *</Label>
                  <Input
                    placeholder="e.g., ABC Capital"
                    value={participant.party_name}
                    onChange={(e) => onUpdateParticipant(index, 'party_name', e.target.value)}
                    className="mt-1"
                    data-testid={`participant-party-name-input-${index}`}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="contact@example.com"
                    value={participant.email}
                    onChange={(e) => onUpdateParticipant(index, 'email', e.target.value)}
                    className="mt-1"
                    data-testid={`participant-email-input-${index}`}
                  />
                </div>

                <div>
                  <Label>Party Type</Label>
                  <Select
                    value={participant.party_type}
                    onValueChange={(value) => onUpdateParticipant(index, 'party_type', value)}
                  >
                    <SelectTrigger className="mt-1" data-testid={`participant-party-type-select-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="borrower_side" data-testid={`party-type-borrower-${index}`}>Borrower Side</SelectItem>
                      <SelectItem value="lender_side" data-testid={`party-type-lender-${index}`}>Lender Side</SelectItem>
                      <SelectItem value="third_party" data-testid={`party-type-third-party-${index}`}>Third Party</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Deal Role</Label>
                  <Select
                    value={participant.deal_role}
                    onValueChange={(value) => onUpdateParticipant(index, 'deal_role', value)}
                  >
                    <SelectTrigger className="mt-1" data-testid={`participant-deal-role-select-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deal_lead" data-testid={`deal-role-lead-${index}`}>Deal Lead</SelectItem>
                      <SelectItem value="negotiator" data-testid={`deal-role-negotiator-${index}`}>Negotiator</SelectItem>
                      <SelectItem value="reviewer" data-testid={`deal-role-reviewer-${index}`}>Reviewer</SelectItem>
                      <SelectItem value="observer" data-testid={`deal-role-observer-${index}`}>Observer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={onAddParticipant}
        className="w-full transition-transform hover:scale-105"
        data-testid="add-participant-btn"
      >
        <Users className="w-4 h-4 mr-2" />
        Add Participant
      </Button>
    </div>
  );
});
