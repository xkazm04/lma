'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  DealHealthSummary,
  SuggestedIntervention,
  ScheduledMeeting,
} from './velocity-types';

interface UseAccelerationAlertsReturn {
  healthSummary: DealHealthSummary | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  actOnAlert: (alertId: string, interventionId: string) => Promise<void>;
  scheduleCall: (config: ScheduleCallConfig) => Promise<ScheduledMeeting | null>;
}

interface ScheduleCallConfig {
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

export function useAccelerationAlerts(dealId: string): UseAccelerationAlertsReturn {
  const [healthSummary, setHealthSummary] = useState<DealHealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!dealId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/deals/${dealId}/acceleration-alerts`);
      const data = await response.json();

      if (data.success) {
        setHealthSummary(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch alerts');
      }
    } catch (err) {
      console.error('Error fetching acceleration alerts:', err);
      setError('Failed to fetch acceleration alerts');
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const refresh = useCallback(async () => {
    await fetchAlerts();
  }, [fetchAlerts]);

  const dismissAlert = useCallback(
    async (alertId: string) => {
      try {
        const response = await fetch(`/api/deals/${dealId}/acceleration-alerts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertId, action: 'dismiss' }),
        });

        const data = await response.json();

        if (data.success && healthSummary) {
          // Update local state to remove dismissed alert
          setHealthSummary({
            ...healthSummary,
            activeAlerts: healthSummary.activeAlerts.filter((a) => a.id !== alertId),
          });
        }
      } catch (err) {
        console.error('Error dismissing alert:', err);
      }
    },
    [dealId, healthSummary]
  );

  const actOnAlert = useCallback(
    async (alertId: string, interventionId: string) => {
      try {
        const response = await fetch(`/api/deals/${dealId}/acceleration-alerts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertId, action: 'act', interventionId }),
        });

        const data = await response.json();

        if (data.success && healthSummary) {
          // Update local state to mark alert as acted upon
          setHealthSummary({
            ...healthSummary,
            activeAlerts: healthSummary.activeAlerts.map((a) =>
              a.id === alertId
                ? {
                    ...a,
                    status: 'acted_upon' as const,
                    actionTakenAt: new Date().toISOString(),
                  }
                : a
            ),
          });
        }
      } catch (err) {
        console.error('Error acting on alert:', err);
      }
    },
    [dealId, healthSummary]
  );

  const scheduleCall = useCallback(
    async (config: ScheduleCallConfig): Promise<ScheduledMeeting | null> => {
      try {
        const response = await fetch(`/api/deals/${dealId}/acceleration-alerts/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });

        const data = await response.json();

        if (data.success) {
          // Update local state to mark alert as acted upon
          if (healthSummary) {
            setHealthSummary({
              ...healthSummary,
              activeAlerts: healthSummary.activeAlerts.map((a) =>
                a.id === config.alertId
                  ? {
                      ...a,
                      status: 'acted_upon' as const,
                      actionTakenAt: new Date().toISOString(),
                    }
                  : a
              ),
            });
          }

          return data.data.meeting;
        }

        return null;
      } catch (err) {
        console.error('Error scheduling call:', err);
        return null;
      }
    },
    [dealId, healthSummary]
  );

  return {
    healthSummary,
    isLoading,
    error,
    refresh,
    dismissAlert,
    actOnAlert,
    scheduleCall,
  };
}
