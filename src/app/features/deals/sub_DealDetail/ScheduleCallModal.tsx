'use client';

import React, { useState, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Video,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SuggestedIntervention, SchedulingConfig } from '../lib/velocity-types';

interface ScheduleCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: SuggestedIntervention | null;
  alertId: string;
  dealId: string;
  onSchedule: (config: ScheduleConfig) => void;
}

interface ScheduleConfig {
  alertId: string;
  interventionId: string;
  dealId: string;
  title: string;
  description: string;
  participantIds: string[];
  duration: number;
  preferredTimeSlot: {
    startTime: string;
    endTime: string;
  } | null;
  calendarProvider: 'google' | 'outlook' | 'calendly' | 'manual';
  sendInvites: boolean;
  agendaItems: string[];
}

export function ScheduleCallModal({
  isOpen,
  onClose,
  intervention,
  alertId,
  dealId,
  onSchedule,
}: ScheduleCallModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'outlook' | 'calendly' | 'manual'>('google');
  const [sendInvites, setSendInvites] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const schedulingConfig = intervention?.schedulingConfig;

  const handleSchedule = useCallback(async () => {
    if (!intervention || !schedulingConfig) return;

    setIsScheduling(true);

    const slot = schedulingConfig.suggestedTimeSlots.find(
      (s) => s.startTime === selectedSlot
    );

    const config: ScheduleConfig = {
      alertId,
      interventionId: intervention.id,
      dealId,
      title: intervention.title,
      description: intervention.description,
      participantIds: schedulingConfig.suggestedParticipants,
      duration: schedulingConfig.suggestedDuration,
      preferredTimeSlot: slot ? { startTime: slot.startTime, endTime: slot.endTime } : null,
      calendarProvider: selectedProvider,
      sendInvites,
      agendaItems: schedulingConfig.agendaItems,
    };

    try {
      await onSchedule(config);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setSelectedSlot(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to schedule:', error);
    } finally {
      setIsScheduling(false);
    }
  }, [
    intervention,
    schedulingConfig,
    selectedSlot,
    selectedProvider,
    sendInvites,
    alertId,
    dealId,
    onSchedule,
    onClose,
  ]);

  if (!isOpen || !intervention || !schedulingConfig) return null;

  const formatTimeSlot = (startTime: string) => {
    const date = new Date(startTime);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200"
      onClick={onClose}
      data-testid="schedule-call-modal-overlay"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid="schedule-call-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900">Schedule {schedulingConfig.meetingType.replace(/_/g, ' ')}</h2>
              <p className="text-sm text-zinc-500">{intervention.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
            data-testid="close-modal-btn"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center" data-testid="schedule-success">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Meeting Scheduled!</h3>
            <p className="text-zinc-500">
              Calendar invites will be sent to all participants.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Meeting Details */}
            <div className="bg-zinc-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span>{schedulingConfig.suggestedDuration} minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-zinc-400" />
                <span>{schedulingConfig.suggestedParticipants.length} participants</span>
              </div>
            </div>

            {/* Agenda */}
            <div>
              <h4 className="text-sm font-medium text-zinc-700 mb-2">Agenda</h4>
              <ul className="space-y-1" data-testid="agenda-list">
                {schedulingConfig.agendaItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-zinc-600">
                    <span className="text-zinc-400">{index + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Time Slots */}
            <div>
              <h4 className="text-sm font-medium text-zinc-700 mb-2">Select Time Slot</h4>
              <div className="grid grid-cols-2 gap-2" data-testid="time-slots">
                {schedulingConfig.suggestedTimeSlots.map((slot) => {
                  const { date, time } = formatTimeSlot(slot.startTime);
                  const isSelected = selectedSlot === slot.startTime;

                  return (
                    <button
                      key={slot.startTime}
                      onClick={() => setSelectedSlot(slot.startTime)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                      data-testid={`time-slot-${slot.startTime}`}
                    >
                      <p className="font-medium text-sm text-zinc-900">{date}</p>
                      <p className="text-xs text-zinc-500">{time}</p>
                      <Badge
                        variant={
                          slot.availability === 'high'
                            ? 'success'
                            : slot.availability === 'medium'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="mt-1 text-xs"
                      >
                        {slot.availability} availability
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calendar Provider */}
            <div>
              <h4 className="text-sm font-medium text-zinc-700 mb-2">Calendar Integration</h4>
              <div className="flex gap-2" data-testid="calendar-providers">
                {(['google', 'outlook', 'calendly', 'manual'] as const).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className={`flex-1 p-2 rounded-lg border text-sm transition-all ${
                      selectedProvider === provider
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                    data-testid={`provider-${provider}`}
                  >
                    {provider === 'google' && 'Google'}
                    {provider === 'outlook' && 'Outlook'}
                    {provider === 'calendly' && 'Calendly'}
                    {provider === 'manual' && 'Manual'}
                  </button>
                ))}
              </div>
            </div>

            {/* Send Invites Toggle */}
            <label className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvites}
                onChange={(e) => setSendInvites(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                data-testid="send-invites-checkbox"
              />
              <span className="text-sm text-zinc-700">Send calendar invites to participants</span>
            </label>

            {/* Expected Impact */}
            <div className="bg-green-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-green-800 mb-1">Expected Impact</h4>
              <div className="flex items-center gap-4 text-sm text-green-700">
                <span>+{intervention.estimatedImpact.velocityImprovement}% velocity</span>
                <span>-{intervention.estimatedImpact.stallRiskReduction}% risk</span>
                <span>+{intervention.estimatedImpact.closeRateImprovement}pp close rate</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!isSuccess && (
          <div className="flex items-center justify-end gap-3 p-4 border-t bg-zinc-50">
            <Button variant="outline" onClick={onClose} data-testid="cancel-schedule-btn">
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={!selectedSlot || isScheduling}
              data-testid="confirm-schedule-btn"
            >
              {isScheduling ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Scheduling...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
