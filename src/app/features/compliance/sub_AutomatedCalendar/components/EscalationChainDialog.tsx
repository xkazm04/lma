'use client';

import React, { memo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  Users,
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Settings,
  Mail,
  MessageSquare,
  Bell,
  Calendar,
  User,
  ArrowUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  EscalationChain,
  EscalationStep,
  EscalationAssignee,
  ReminderChannel,
  EscalationLevel,
} from '../lib/types';
import {
  getEscalationLevelLabel,
  getEscalationLevelColor,
} from '../lib/types';
import type { ItemType } from '../../lib/types';
import { getItemTypeLabel } from '../../lib/types';

interface EscalationChainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chain: EscalationChain | null;
  availableAssignees: EscalationAssignee[];
  onSave: (chain: EscalationChain) => void;
}

export const EscalationChainDialog = memo(function EscalationChainDialog({
  open,
  onOpenChange,
  chain,
  availableAssignees,
  onSave,
}: EscalationChainDialogProps) {
  const isNew = !chain;
  const [localChain, setLocalChain] = useState<EscalationChain>(
    chain || {
      id: `chain-${Date.now()}`,
      name: '',
      description: '',
      is_active: true,
      applies_to_event_types: [],
      applies_to_facility_ids: [],
      steps: [
        {
          id: `step-${Date.now()}-1`,
          level: 1,
          trigger_days_overdue: 0,
          assignees: [],
          channels: ['email', 'in_app'],
          notify_previous_levels: false,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'current-user',
    }
  );

  const eventTypes: ItemType[] = [
    'covenant_test',
    'compliance_event',
    'notification_due',
    'waiver_expiration',
  ];

  const channels: { id: ReminderChannel; name: string; icon: typeof Mail }[] = [
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'slack', name: 'Slack', icon: MessageSquare },
    { id: 'in_app', name: 'In-App', icon: Bell },
    { id: 'calendar_push', name: 'Calendar', icon: Calendar },
  ];

  const toggleEventType = (type: ItemType) => {
    setLocalChain((prev) => ({
      ...prev,
      applies_to_event_types: prev.applies_to_event_types.includes(type)
        ? prev.applies_to_event_types.filter((t) => t !== type)
        : [...prev.applies_to_event_types, type],
    }));
  };

  const updateStep = (stepId: string, updates: Partial<EscalationStep>) => {
    setLocalChain((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
    }));
  };

  const addStep = () => {
    const nextLevel = (localChain.steps.length + 1) as EscalationLevel;
    if (nextLevel > 4) return;

    const lastStep = localChain.steps[localChain.steps.length - 1];
    const newStep: EscalationStep = {
      id: `step-${Date.now()}-${nextLevel}`,
      level: nextLevel,
      trigger_days_overdue: (lastStep?.trigger_days_overdue || 0) + 3,
      assignees: [],
      channels: ['email', 'in_app', 'slack'],
      notify_previous_levels: true,
    };

    setLocalChain((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
  };

  const removeStep = (stepId: string) => {
    if (localChain.steps.length <= 1) return;

    setLocalChain((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((step) => step.id !== stepId)
        .map((step, idx) => ({
          ...step,
          level: (idx + 1) as EscalationLevel,
        })),
    }));
  };

  const toggleAssignee = (stepId: string, assignee: EscalationAssignee) => {
    setLocalChain((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => {
        if (step.id !== stepId) return step;
        const hasAssignee = step.assignees.some((a) => a.id === assignee.id);
        return {
          ...step,
          assignees: hasAssignee
            ? step.assignees.filter((a) => a.id !== assignee.id)
            : [...step.assignees, assignee],
        };
      }),
    }));
  };

  const toggleChannel = (stepId: string, channel: ReminderChannel) => {
    setLocalChain((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => {
        if (step.id !== stepId) return step;
        return {
          ...step,
          channels: step.channels.includes(channel)
            ? step.channels.filter((c) => c !== channel)
            : [...step.channels, channel],
        };
      }),
    }));
  };

  const handleSave = () => {
    onSave({
      ...localChain,
      updated_at: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            {isNew ? 'Create Escalation Chain' : 'Edit Escalation Chain'}
          </DialogTitle>
          <DialogDescription>
            Configure escalation levels, assignees, and notification channels for overdue events
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Chain Details */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block">
                Chain Name
              </label>
              <input
                type="text"
                value={localChain.name}
                onChange={(e) =>
                  setLocalChain((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Standard Covenant Escalation"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                data-testid="chain-name-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block">
                Description
              </label>
              <textarea
                value={localChain.description}
                onChange={(e) =>
                  setLocalChain((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe when this escalation chain applies..."
                rows={2}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm resize-none"
                data-testid="chain-description-input"
              />
            </div>
          </div>

          {/* Event Types */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-2 block">
              Applies to Event Types
            </label>
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((type) => (
                <Badge
                  key={type}
                  variant={
                    localChain.applies_to_event_types.includes(type)
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => toggleEventType(type)}
                  data-testid={`event-type-${type}`}
                >
                  {getItemTypeLabel(type)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium text-zinc-900">Chain Active</h4>
              <p className="text-sm text-zinc-500">
                Enable or disable this escalation chain
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localChain.is_active}
                onChange={(e) =>
                  setLocalChain((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className="sr-only peer"
                data-testid="chain-active-toggle"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Escalation Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-zinc-700">
                Escalation Steps
              </label>
              {localChain.steps.length < 4 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addStep}
                  data-testid="add-step-btn"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Level
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {localChain.steps.map((step, idx) => (
                <Card
                  key={step.id}
                  className={cn(
                    'border-l-4',
                    step.level === 1 && 'border-l-blue-500',
                    step.level === 2 && 'border-l-amber-500',
                    step.level === 3 && 'border-l-orange-500',
                    step.level === 4 && 'border-l-red-500'
                  )}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getEscalationLevelColor(step.level)}>
                          Level {step.level} - {getEscalationLevelLabel(step.level)}
                        </Badge>
                        {idx > 0 && (
                          <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <ArrowUp className="w-3 h-3" />
                            Escalate from Level {step.level - 1}
                          </div>
                        )}
                      </div>
                      {localChain.steps.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(step.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          data-testid={`remove-step-${step.level}-btn`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Trigger Days */}
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Trigger after (days overdue)
                        </label>
                        <input
                          type="number"
                          min={idx === 0 ? 0 : localChain.steps[idx - 1].trigger_days_overdue + 1}
                          value={step.trigger_days_overdue}
                          onChange={(e) =>
                            updateStep(step.id, {
                              trigger_days_overdue: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                          data-testid={`step-${step.level}-days-input`}
                        />
                      </div>

                      {/* Notify Previous Levels */}
                      {idx > 0 && (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={step.notify_previous_levels}
                            onChange={(e) =>
                              updateStep(step.id, {
                                notify_previous_levels: e.target.checked,
                              })
                            }
                            className="rounded border-zinc-300"
                            data-testid={`step-${step.level}-notify-previous`}
                          />
                          <label className="text-sm text-zinc-600">
                            Also notify previous level assignees
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Assignees */}
                    <div className="mt-4">
                      <label className="text-xs text-zinc-500 mb-2 block">
                        <Users className="w-3 h-3 inline mr-1" />
                        Assignees at this level
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableAssignees.map((assignee) => (
                          <Badge
                            key={assignee.id}
                            variant={
                              step.assignees.some((a) => a.id === assignee.id)
                                ? 'default'
                                : 'outline'
                            }
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => toggleAssignee(step.id, assignee)}
                            data-testid={`step-${step.level}-assignee-${assignee.id}`}
                          >
                            <User className="w-3 h-3 mr-1" />
                            {assignee.name}
                            <span className="ml-1 text-xs opacity-70">
                              ({assignee.role})
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Channels */}
                    <div className="mt-4">
                      <label className="text-xs text-zinc-500 mb-2 block">
                        Notification channels
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {channels.map(({ id, name, icon: Icon }) => (
                          <Badge
                            key={id}
                            variant={
                              step.channels.includes(id) ? 'default' : 'outline'
                            }
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => toggleChannel(step.id, id)}
                            data-testid={`step-${step.level}-channel-${id}`}
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Visual Escalation Flow */}
          <div className="p-4 bg-zinc-50 rounded-lg">
            <h4 className="text-sm font-medium text-zinc-700 mb-3">
              Escalation Flow Preview
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              {localChain.steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm',
                      getEscalationLevelColor(step.level)
                    )}
                  >
                    <div className="font-medium">
                      {getEscalationLevelLabel(step.level)}
                    </div>
                    <div className="text-xs opacity-75">
                      {step.trigger_days_overdue === 0
                        ? 'Immediately'
                        : `+${step.trigger_days_overdue} days`}
                    </div>
                  </div>
                  {idx < localChain.steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="cancel-chain-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !localChain.name ||
                localChain.applies_to_event_types.length === 0 ||
                localChain.steps.some((s) => s.assignees.length === 0)
              }
              data-testid="save-chain-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {isNew ? 'Create Chain' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
