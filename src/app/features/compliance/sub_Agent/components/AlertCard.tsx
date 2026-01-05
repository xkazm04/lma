'use client';

import React, { memo, useMemo, useCallback } from 'react';
import type { AgentAlert } from '../lib/types';
import { UnifiedAlertCard } from '../../components/UnifiedAlertCard';
import { normalizeAgentAlert } from '../../lib/unified-alert-types';

interface AlertCardProps {
  alert: AgentAlert;
  onAction?: (alert: AgentAlert) => void;
  compact?: boolean;
}

/**
 * AlertCard for the Compliance Agent module.
 * This is a thin wrapper around UnifiedAlertCard that normalizes AgentAlert
 * to the unified format while preserving the original onAction callback signature.
 */
export const AlertCard = memo(function AlertCard({
  alert,
  onAction,
  compact = false,
}: AlertCardProps) {
  // Memoize the normalized alert to avoid recalculating on every render
  const unifiedAlert = useMemo(() => normalizeAgentAlert(alert), [alert]);

  // Wrap the onAction callback to pass the original AgentAlert
  const handleAction = useCallback(() => {
    if (onAction) {
      onAction(alert);
    }
  }, [alert, onAction]);

  return (
    <UnifiedAlertCard
      alert={unifiedAlert}
      compact={compact}
      onAction={onAction ? handleAction : undefined}
      showAcknowledgeActions={false}
      showTimestamp={false}
    />
  );
});
