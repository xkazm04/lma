'use client';

import React, { memo, useState, useCallback } from 'react';
import {
  Settings,
  Bot,
  Shield,
  Clock,
  Save,
  X,
  Info,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type {
  AutopilotSettings,
  AutoApprovalThresholds,
  InterventionType,
} from '../lib/mocks';

interface AutopilotSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AutopilotSettings;
  thresholds: AutoApprovalThresholds;
  onSaveSettings?: (settings: AutopilotSettings) => void;
  onSaveThresholds?: (thresholds: AutoApprovalThresholds) => void;
}

const interventionTypeLabels: Record<InterventionType, string> = {
  borrower_call: 'Borrower Calls',
  amendment_draft: 'Amendment Drafts',
  counterparty_alert: 'Counterparty Alerts',
  compliance_reminder: 'Compliance Reminders',
  esg_action: 'ESG Actions',
  risk_escalation: 'Risk Escalations',
  waiver_request: 'Waiver Requests',
  document_request: 'Document Requests',
};

// Slider Component
const ThresholdSlider = memo(function ThresholdSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  description,
  alwaysRequireApproval = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  description?: string;
  alwaysRequireApproval?: boolean;
}) {
  const getColor = (v: number) => {
    if (v >= 90) return 'bg-green-500';
    if (v >= 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-3 rounded-lg border border-zinc-100 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-700">{label}</span>
          {alwaysRequireApproval && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
              <Shield className="w-2.5 h-2.5 mr-0.5" />
              Manual Only
            </Badge>
          )}
        </div>
        <span className={cn(
          'text-sm font-semibold',
          value >= 90 ? 'text-green-600' : value >= 75 ? 'text-amber-600' : 'text-red-600'
        )}>
          {value}%
        </span>
      </div>
      {alwaysRequireApproval ? (
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span>Always requires manual approval</span>
        </div>
      ) : (
        <>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${value >= 90 ? '#22c55e' : value >= 75 ? '#f59e0b' : '#ef4444'} 0%, ${value >= 90 ? '#22c55e' : value >= 75 ? '#f59e0b' : '#ef4444'} ${value}%, #e4e4e7 ${value}%, #e4e4e7 100%)`,
            }}
            data-testid={`threshold-slider-${label.toLowerCase().replace(/\s+/g, '-')}`}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-zinc-400">Low (more manual)</span>
            <span className="text-[10px] text-zinc-400">High (more auto)</span>
          </div>
          {description && (
            <p className="text-[10px] text-zinc-500 mt-1">{description}</p>
          )}
        </>
      )}
    </div>
  );
});

// Toggle Switch Component
const ToggleSwitch = memo(function ToggleSwitch({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 bg-white">
      <div className="flex-1">
        <span className="text-xs font-medium text-zinc-700">{label}</span>
        {description && (
          <p className="text-[10px] text-zinc-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
          checked ? 'bg-indigo-600' : 'bg-zinc-200'
        )}
        data-testid={`toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
});

export const AutopilotSettingsPanel = memo(function AutopilotSettingsPanel({
  open,
  onOpenChange,
  settings,
  thresholds,
  onSaveSettings,
  onSaveThresholds,
}: AutopilotSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [localSettings, setLocalSettings] = useState(settings);
  const [localThresholds, setLocalThresholds] = useState(thresholds);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = useCallback(<K extends keyof AutopilotSettings>(
    key: K,
    value: AutopilotSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleThresholdChange = useCallback((
    type: InterventionType,
    value: number
  ) => {
    setLocalThresholds((prev) => ({
      ...prev,
      typeThresholds: {
        ...prev.typeThresholds,
        [type]: value,
      },
    }));
    setHasChanges(true);
  }, []);

  const handleGlobalThresholdChange = useCallback((value: number) => {
    setLocalThresholds((prev) => ({
      ...prev,
      globalThreshold: value,
    }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    onSaveSettings?.(localSettings);
    onSaveThresholds?.(localThresholds);
    setHasChanges(false);
    onOpenChange(false);
  }, [localSettings, localThresholds, onSaveSettings, onSaveThresholds, onOpenChange]);

  const handleCancel = useCallback(() => {
    setLocalSettings(settings);
    setLocalThresholds(thresholds);
    setHasChanges(false);
    onOpenChange(false);
  }, [settings, thresholds, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Autopilot Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="general" data-testid="settings-tab-general" className="text-xs">
              General
            </TabsTrigger>
            <TabsTrigger value="thresholds" data-testid="settings-tab-thresholds" className="text-xs">
              Thresholds
            </TabsTrigger>
            <TabsTrigger value="actions" data-testid="settings-tab-actions" className="text-xs">
              Action Types
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="settings-tab-notifications" className="text-xs">
              Notifications
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {/* General Tab */}
            <TabsContent value="general" className="mt-0 space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-700">Autopilot Status</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(['active', 'paused', 'learning', 'disabled'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleSettingChange('status', status)}
                      className={cn(
                        'p-2 rounded-lg border text-xs font-medium transition-all',
                        localSettings.status === status
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-indigo-300'
                      )}
                      data-testid={`status-btn-${status}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-indigo-600 mt-2">
                  {localSettings.status === 'active' && 'Autopilot is actively generating and executing actions'}
                  {localSettings.status === 'paused' && 'Autopilot analysis is paused, no new actions generated'}
                  {localSettings.status === 'learning' && 'Autopilot is learning from historical data'}
                  {localSettings.status === 'disabled' && 'Autopilot is completely disabled'}
                </p>
              </div>

              <ThresholdSlider
                label="Global Auto-Approval Threshold"
                value={localThresholds.globalThreshold}
                onChange={handleGlobalThresholdChange}
                description="Actions with confidence above this threshold will auto-execute"
              />

              <div className="p-3 rounded-lg border border-zinc-100 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-700">Prediction Horizon</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {([30, 60, 90, 180] as const).map((days) => (
                    <button
                      key={days}
                      onClick={() => handleSettingChange('predictionHorizon', days)}
                      className={cn(
                        'p-2 rounded-lg border text-xs font-medium transition-all',
                        localSettings.predictionHorizon === days
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-indigo-300'
                      )}
                      data-testid={`horizon-btn-${days}`}
                    >
                      {days} days
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Thresholds Tab */}
            <TabsContent value="thresholds" className="mt-0 space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-700">
                    Higher thresholds = more conservative (fewer auto-approvals)
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-medium text-zinc-700">Impact Level Thresholds</h4>
                <div className="grid grid-cols-2 gap-3">
                  {(['low', 'medium', 'high', 'critical'] as const).map((impact) => (
                    <ThresholdSlider
                      key={impact}
                      label={`${impact.charAt(0).toUpperCase() + impact.slice(1)} Impact`}
                      value={localThresholds.impactThresholds[impact]}
                      onChange={(value) =>
                        setLocalThresholds((prev) => ({
                          ...prev,
                          impactThresholds: {
                            ...prev.impactThresholds,
                            [impact]: value,
                          },
                        }))
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-medium text-zinc-700">Time Restrictions</h4>
                <ToggleSwitch
                  label="Business Hours Only"
                  checked={localThresholds.timeRestrictions.businessHoursOnly}
                  onChange={(checked) =>
                    setLocalThresholds((prev) => ({
                      ...prev,
                      timeRestrictions: {
                        ...prev.timeRestrictions,
                        businessHoursOnly: checked,
                      },
                    }))
                  }
                  description="Only execute actions during business hours"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-zinc-100 bg-white">
                    <span className="text-xs font-medium text-zinc-700">Max Actions/Hour</span>
                    <input
                      type="number"
                      value={localThresholds.timeRestrictions.maxActionsPerHour}
                      onChange={(e) =>
                        setLocalThresholds((prev) => ({
                          ...prev,
                          timeRestrictions: {
                            ...prev.timeRestrictions,
                            maxActionsPerHour: parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 text-sm border border-zinc-200 rounded"
                      data-testid="max-actions-hour-input"
                    />
                  </div>
                  <div className="p-3 rounded-lg border border-zinc-100 bg-white">
                    <span className="text-xs font-medium text-zinc-700">Max Actions/Day</span>
                    <input
                      type="number"
                      value={localThresholds.timeRestrictions.maxActionsPerDay}
                      onChange={(e) =>
                        setLocalThresholds((prev) => ({
                          ...prev,
                          timeRestrictions: {
                            ...prev.timeRestrictions,
                            maxActionsPerDay: parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 text-sm border border-zinc-200 rounded"
                      data-testid="max-actions-day-input"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Action Types Tab */}
            <TabsContent value="actions" className="mt-0 space-y-4">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs text-amber-700">
                    Some action types always require manual approval
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {(Object.keys(interventionTypeLabels) as InterventionType[]).map((type) => {
                  const alwaysManual = localThresholds.riskFactors.alwaysRequireApproval.includes(type);
                  return (
                    <ThresholdSlider
                      key={type}
                      label={interventionTypeLabels[type]}
                      value={localThresholds.typeThresholds[type]}
                      onChange={(value) => handleThresholdChange(type, value)}
                      alwaysRequireApproval={alwaysManual}
                    />
                  );
                })}
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <h4 className="text-xs font-medium text-zinc-700">Action Type Settings</h4>
                {(Object.keys(localSettings.interventionTypes) as Array<keyof typeof localSettings.interventionTypes>).map((key) => (
                  <ToggleSwitch
                    key={key}
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    checked={localSettings.interventionTypes[key]}
                    onChange={(checked) =>
                      handleSettingChange('interventionTypes', {
                        ...localSettings.interventionTypes,
                        [key]: checked,
                      })
                    }
                    description={`Enable ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} actions`}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="mt-0 space-y-4">
              <div className="space-y-3">
                <ToggleSwitch
                  label="Email Alerts"
                  checked={localSettings.notificationPreferences.emailAlerts}
                  onChange={(checked) =>
                    handleSettingChange('notificationPreferences', {
                      ...localSettings.notificationPreferences,
                      emailAlerts: checked,
                    })
                  }
                  description="Receive email notifications for autopilot actions"
                />
                <ToggleSwitch
                  label="In-App Alerts"
                  checked={localSettings.notificationPreferences.inAppAlerts}
                  onChange={(checked) =>
                    handleSettingChange('notificationPreferences', {
                      ...localSettings.notificationPreferences,
                      inAppAlerts: checked,
                    })
                  }
                  description="Show in-app notifications for autopilot actions"
                />
                <ToggleSwitch
                  label="Slack Integration"
                  checked={localSettings.notificationPreferences.slackIntegration}
                  onChange={(checked) =>
                    handleSettingChange('notificationPreferences', {
                      ...localSettings.notificationPreferences,
                      slackIntegration: checked,
                    })
                  }
                  description="Send notifications to connected Slack channel"
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="text-[10px]">
                Unsaved changes
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel} data-testid="settings-cancel-btn">
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges} data-testid="settings-save-btn">
              <Save className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
