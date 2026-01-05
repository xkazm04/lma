'use client';

import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Play, Pause, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GraphVisualizationSettings } from '../lib/types';

interface GraphControlsProps {
  settings: GraphVisualizationSettings;
  zoomLevel: number;
  onSettingsChange: (settings: Partial<GraphVisualizationSettings>) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

/**
 * Control buttons for the cross-reference graph
 */
export function GraphControls({
  settings,
  zoomLevel,
  onSettingsChange,
  onZoomIn,
  onZoomOut,
  onResetView,
}: GraphControlsProps) {
  return (
    <div
      className="absolute bottom-4 right-4 flex items-center gap-1 bg-white rounded-lg border border-zinc-200 shadow-sm p-1"
      data-testid="graph-controls"
    >
      {/* Zoom Controls */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomOut}
        disabled={zoomLevel <= 0.3}
        data-testid="zoom-out-btn"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomIn}
        disabled={zoomLevel >= 3}
        data-testid="zoom-in-btn"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onResetView}
        data-testid="reset-view-btn"
        title="Reset view"
      >
        <Maximize2 className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-zinc-200 mx-1" />

      {/* Physics Toggle */}
      <Button
        variant={settings.enablePhysics ? 'default' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => onSettingsChange({ enablePhysics: !settings.enablePhysics })}
        data-testid="toggle-physics-btn"
        title={settings.enablePhysics ? 'Pause physics' : 'Resume physics'}
      >
        {settings.enablePhysics ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      <div className="w-px h-6 bg-zinc-200 mx-1" />

      {/* Color Scheme */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-testid="color-scheme-btn"
            title="Color scheme"
          >
            <Palette className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Color By</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={settings.colorScheme}
            onValueChange={(value) => onSettingsChange({ colorScheme: value as typeof settings.colorScheme })}
          >
            <DropdownMenuRadioItem value="type">
              Node Type
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="category">
              Category
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="impact">
              Impact Severity
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="modifications">
              Modifications
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
