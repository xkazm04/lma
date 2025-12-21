'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Save, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_ALERT_THRESHOLDS } from '../lib/types';
import type { HeadroomThreshold } from '../lib/types';

interface AlertThresholdSettingsProps {
  onClose: () => void;
}

export const AlertThresholdSettings = memo(function AlertThresholdSettings({
  onClose,
}: AlertThresholdSettingsProps) {
  const [thresholds, setThresholds] = useState<HeadroomThreshold[]>(DEFAULT_ALERT_THRESHOLDS);
  const [rapidDeclineEnabled, setRapidDeclineEnabled] = useState(true);
  const [rapidDeclinePercentage, setRapidDeclinePercentage] = useState(20);
  const [breachPredictionEnabled, setBreachPredictionEnabled] = useState(true);
  const [breachPredictionDays, setBreachPredictionDays] = useState(30);
  const [staleDataEnabled, setStaleDataEnabled] = useState(true);
  const [staleDataHours, setStaleDataHours] = useState(24);

  const toggleThreshold = (index: number) => {
    const newThresholds = [...thresholds];
    newThresholds[index].enabled = !newThresholds[index].enabled;
    setThresholds(newThresholds);
  };

  const toggleNotificationChannel = (thresholdIndex: number, channel: string) => {
    const newThresholds = [...thresholds];
    const channels = newThresholds[thresholdIndex].notification_channels;
    const channelIndex = channels.indexOf(channel as any);

    if (channelIndex > -1) {
      channels.splice(channelIndex, 1);
    } else {
      channels.push(channel as any);
    }

    setThresholds(newThresholds);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in"
      onClick={onClose}
      data-testid="settings-dialog-overlay"
    >
      <Card
        className="w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
        data-testid="settings-dialog"
      >
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle>Alert Threshold Configuration</CardTitle>
            <p className="text-sm text-zinc-500 mt-1">
              Configure when and how you receive covenant headroom alerts
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="shrink-0"
            data-testid="close-settings-btn"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto pt-6 space-y-6">
          {/* Headroom Thresholds */}
          <div>
            <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Headroom Thresholds
            </h3>
            <div className="space-y-3">
              {thresholds.map((threshold, idx) => (
                <Card key={idx} data-testid={`threshold-${threshold.percentage}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={threshold.enabled}
                          onChange={() => toggleThreshold(idx)}
                          className="w-4 h-4 rounded border-zinc-300"
                          data-testid={`threshold-toggle-${threshold.percentage}`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900">
                              {threshold.percentage}% Headroom
                            </span>
                            <Badge className={getSeverityColor(threshold.severity)}>
                              {threshold.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">
                            Alert when covenant headroom drops below {threshold.percentage}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {threshold.enabled && (
                      <div>
                        <p className="text-xs font-medium text-zinc-700 mb-2">
                          Notification Channels:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {['email', 'sms', 'slack', 'in_app'].map((channel) => (
                            <Button
                              key={channel}
                              variant={
                                threshold.notification_channels.includes(channel as any)
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => toggleNotificationChannel(idx, channel)}
                              data-testid={`channel-${threshold.percentage}-${channel}`}
                            >
                              {channel === 'in_app' ? 'In-App' : channel.toUpperCase()}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Rapid Decline Alert */}
          <div>
            <h3 className="font-semibold text-zinc-900 mb-3">Rapid Decline Detection</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={rapidDeclineEnabled}
                      onChange={() => setRapidDeclineEnabled(!rapidDeclineEnabled)}
                      className="w-4 h-4 rounded border-zinc-300"
                      data-testid="rapid-decline-toggle"
                    />
                    <div>
                      <span className="font-medium text-zinc-900">
                        Alert on Rapid Headroom Decline
                      </span>
                      <p className="text-xs text-zinc-500 mt-1">
                        Detect unusual drops in covenant headroom
                      </p>
                    </div>
                  </div>
                </div>

                {rapidDeclineEnabled && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-zinc-700">
                      Alert if headroom drops more than
                    </label>
                    <input
                      type="number"
                      value={rapidDeclinePercentage}
                      onChange={(e) => setRapidDeclinePercentage(Number(e.target.value))}
                      className="w-20 px-3 py-1 border border-zinc-300 rounded-md text-sm"
                      min="5"
                      max="50"
                      data-testid="rapid-decline-input"
                    />
                    <span className="text-sm text-zinc-700">% in 24 hours</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Breach Prediction Alert */}
          <div>
            <h3 className="font-semibold text-zinc-900 mb-3">Breach Prediction</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={breachPredictionEnabled}
                      onChange={() => setBreachPredictionEnabled(!breachPredictionEnabled)}
                      className="w-4 h-4 rounded border-zinc-300"
                      data-testid="breach-prediction-toggle"
                    />
                    <div>
                      <span className="font-medium text-zinc-900">
                        Predictive Breach Alerts
                      </span>
                      <p className="text-xs text-zinc-500 mt-1">
                        Forecast potential breaches based on current trends
                      </p>
                    </div>
                  </div>
                </div>

                {breachPredictionEnabled && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-zinc-700">
                      Alert if breach predicted within
                    </label>
                    <input
                      type="number"
                      value={breachPredictionDays}
                      onChange={(e) => setBreachPredictionDays(Number(e.target.value))}
                      className="w-20 px-3 py-1 border border-zinc-300 rounded-md text-sm"
                      min="7"
                      max="90"
                      data-testid="breach-prediction-input"
                    />
                    <span className="text-sm text-zinc-700">days</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stale Data Alert */}
          <div>
            <h3 className="font-semibold text-zinc-900 mb-3">Data Freshness</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={staleDataEnabled}
                      onChange={() => setStaleDataEnabled(!staleDataEnabled)}
                      className="w-4 h-4 rounded border-zinc-300"
                      data-testid="stale-data-toggle"
                    />
                    <div>
                      <span className="font-medium text-zinc-900">Stale Data Alerts</span>
                      <p className="text-xs text-zinc-500 mt-1">
                        Alert when data hasn't been updated recently
                      </p>
                    </div>
                  </div>
                </div>

                {staleDataEnabled && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-zinc-700">
                      Alert if no update in
                    </label>
                    <input
                      type="number"
                      value={staleDataHours}
                      onChange={(e) => setStaleDataHours(Number(e.target.value))}
                      className="w-20 px-3 py-1 border border-zinc-300 rounded-md text-sm"
                      min="1"
                      max="168"
                      data-testid="stale-data-input"
                    />
                    <span className="text-sm text-zinc-700">hours</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>

        <div className="border-t p-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} data-testid="cancel-settings-btn">
            Cancel
          </Button>
          <Button data-testid="save-settings-btn">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </Card>
    </div>
  );
});
