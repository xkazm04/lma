'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Edit,
  Trash2,
  Share2,
  GitBranch,
  Clock,
  User,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimulationScenario, SimulationStatus } from '../lib/types';
import { getScenarioTypeLabel } from '../lib/types';

interface ScenarioCardProps {
  scenario: SimulationScenario;
  onRun: (scenario: SimulationScenario) => void;
  onEdit: (scenario: SimulationScenario) => void;
  onDelete: (scenario: SimulationScenario) => void;
  onViewResults: (scenario: SimulationScenario) => void;
  index?: number;
}

function getStatusColor(status: SimulationStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-zinc-100 text-zinc-700';
    case 'running':
      return 'bg-blue-100 text-blue-700';
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
  }
}

function getStatusLabel(status: SimulationStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'running':
      return 'Running';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(email: string): string {
  const parts = email.split('@')[0].split('.');
  return parts.map(p => p[0].toUpperCase()).join('');
}

export const ScenarioCard = memo(function ScenarioCard({
  scenario,
  onRun,
  onEdit,
  onDelete,
  onViewResults,
  index = 0,
}: ScenarioCardProps) {
  return (
    <Card
      className="group hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`scenario-card-${scenario.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base truncate">{scenario.name}</CardTitle>
              {scenario.version > 1 && (
                <Badge variant="outline" className="text-xs shrink-0">
                  <GitBranch className="w-3 h-3 mr-1" />
                  v{scenario.version}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {getInitials(scenario.created_by)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(scenario.modified_at)}
              </span>
              {scenario.is_shared && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Share2 className="w-3 h-3" />
                  Shared
                </span>
              )}
            </div>
          </div>
          <Badge className={cn('shrink-0', getStatusColor(scenario.status))}>
            {getStatusLabel(scenario.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {scenario.description && (
          <CardDescription className="line-clamp-2">
            {scenario.description}
          </CardDescription>
        )}

        <div className="flex flex-wrap gap-1.5">
          {scenario.params.map((param, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {getScenarioTypeLabel(param.type)}
            </Badge>
          ))}
          {scenario.monte_carlo_config && (
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
              Monte Carlo ({scenario.monte_carlo_config.iterations.toLocaleString()} runs)
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{scenario.selected_covenant_ids.length} covenants</span>
          <span className="text-zinc-300">|</span>
          <span>{scenario.selected_facility_ids.length} facilities</span>
          {scenario.collaborators.length > 0 && (
            <>
              <span className="text-zinc-300">|</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {scenario.collaborators.length} collaborators
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {scenario.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
          {scenario.tags.length > 3 && (
            <span className="text-xs text-zinc-400">+{scenario.tags.length - 3}</span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
          {scenario.status === 'completed' ? (
            <Button
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onViewResults(scenario);
              }}
              data-testid={`scenario-results-btn-${scenario.id}`}
            >
              View Results
              <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onRun(scenario);
              }}
              disabled={scenario.status === 'running'}
              data-testid={`scenario-run-btn-${scenario.id}`}
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              {scenario.status === 'running' ? 'Running...' : 'Run Simulation'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(scenario);
            }}
            data-testid={`scenario-edit-btn-${scenario.id}`}
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(scenario);
            }}
            data-testid={`scenario-delete-btn-${scenario.id}`}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
