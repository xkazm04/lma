'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Copy, TrendingUp, Percent, Building2, Layers, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StressTestTemplate, ScenarioType } from '../lib/types';
import { getScenarioTypeLabel, getScenarioTypeIconColor, getStressSeverityColor } from '../lib/types';

interface StressTestTemplateCardProps {
  template: StressTestTemplate;
  onSelect: (template: StressTestTemplate) => void;
  onClone: (template: StressTestTemplate) => void;
  index?: number;
}

function getScenarioIcon(type: ScenarioType) {
  switch (type) {
    case 'rate_change':
      return Percent;
    case 'ebitda_fluctuation':
      return TrendingUp;
    case 'ma_event':
      return Building2;
    case 'industry_downturn':
      return Layers;
    case 'custom':
      return Layers;
  }
}

export const StressTestTemplateCard = memo(function StressTestTemplateCard({
  template,
  onSelect,
  onClone,
  index = 0,
}: StressTestTemplateCardProps) {
  const mainScenario = template.scenarios[0];
  const ScenarioIcon = mainScenario ? getScenarioIcon(mainScenario.type) : Layers;

  return (
    <Card
      className={cn(
        'group hover:shadow-md transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2',
        template.is_builtin && 'border-l-4 border-l-blue-400'
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`template-card-${template.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              'p-2 rounded-lg transition-colors',
              mainScenario ? 'bg-zinc-100 group-hover:bg-zinc-200' : 'bg-zinc-100'
            )}>
              <ScenarioIcon className={cn(
                'w-5 h-5',
                mainScenario ? getScenarioTypeIconColor(mainScenario.type) : 'text-zinc-600'
              )} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{template.name}</CardTitle>
              {template.is_builtin && (
                <span className="text-xs text-blue-600 font-medium">Built-in Template</span>
              )}
            </div>
          </div>
          {mainScenario && (
            <Badge
              variant="outline"
              className={cn('shrink-0', getStressSeverityColor(mainScenario.severity))}
            >
              {mainScenario.severity}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="line-clamp-2">
          {template.description}
        </CardDescription>

        <div className="flex flex-wrap gap-1.5">
          {template.scenarios.map((scenario, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {getScenarioTypeLabel(scenario.type)}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="text-xs text-zinc-400">+{template.tags.length - 3}</span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
          <Button
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(template);
            }}
            data-testid={`template-select-btn-${template.id}`}
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Run Simulation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClone(template);
            }}
            data-testid={`template-clone-btn-${template.id}`}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
