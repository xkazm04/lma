'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GraphVisualizationSettings } from '../lib/types';
import {
  NODE_TYPE_LABELS,
  NODE_TYPE_COLORS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  IMPACT_COLORS,
  LINK_TYPE_LABELS,
  LINK_TYPE_COLORS,
} from '../lib/types';

interface GraphLegendProps {
  settings: GraphVisualizationSettings;
}

/**
 * Legend component showing color meanings based on current color scheme
 */
export function GraphLegend({ settings }: GraphLegendProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getColorItems = () => {
    switch (settings.colorScheme) {
      case 'type':
        return Object.entries(NODE_TYPE_LABELS).map(([key, label]) => ({
          color: NODE_TYPE_COLORS[key as keyof typeof NODE_TYPE_COLORS],
          label,
        }));
      case 'category':
        return Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
          color: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS],
          label,
        }));
      case 'impact':
        return Object.entries(IMPACT_COLORS).map(([key, color]) => ({
          color,
          label: key.charAt(0).toUpperCase() + key.slice(1),
        }));
      case 'modifications':
        return [
          { color: '#f97316', label: 'Modified' },
          { color: '#6b7280', label: 'Unchanged' },
        ];
      default:
        return [];
    }
  };

  const colorItems = getColorItems();

  const colorSchemeLabel = {
    type: 'Node Types',
    category: 'Categories',
    impact: 'Impact Severity',
    modifications: 'Modification Status',
  }[settings.colorScheme];

  return (
    <div
      className="absolute bottom-4 left-4 bg-white rounded-lg border border-zinc-200 shadow-sm"
      data-testid="graph-legend"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 rounded-lg"
        data-testid="toggle-legend-btn"
      >
        <span>Legend: {colorSchemeLabel}</span>
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronUp className="w-3 h-3" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-2 space-y-1 border-t border-zinc-100">
          <div className="pt-2">
            {colorItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 py-0.5"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-zinc-600">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Link types legend */}
          <div className="pt-2 border-t border-zinc-100 mt-2">
            <p className="text-xs font-medium text-zinc-500 mb-1">Link Types</p>
            {Object.entries(LINK_TYPE_LABELS).slice(0, 4).map(([key, label]) => (
              <div
                key={key}
                className="flex items-center gap-2 py-0.5"
              >
                <div className="w-4 h-0.5" style={{ backgroundColor: LINK_TYPE_COLORS[key as keyof typeof LINK_TYPE_COLORS] }} />
                <span className="text-xs text-zinc-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Indicators */}
          <div className="pt-2 border-t border-zinc-100 mt-2">
            <p className="text-xs font-medium text-zinc-500 mb-1">Indicators</p>
            <div className="flex items-center gap-2 py-0.5">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-xs text-zinc-500">Modified term</span>
            </div>
            <div className="flex items-center gap-2 py-0.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-zinc-500">Pinned node</span>
            </div>
            <div className="flex items-center gap-2 py-0.5">
              <div className="w-4 h-0.5 border-t-2 border-dashed border-orange-400" />
              <span className="text-xs text-zinc-500">Modified link</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
