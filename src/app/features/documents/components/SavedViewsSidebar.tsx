'use client';

import React, { memo, useState, useCallback } from 'react';
import {
  Files,
  Eye,
  AlertTriangle,
  FileText,
  Plus,
  MoreHorizontal,
  Star,
  Share2,
  Pencil,
  Copy,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useSavedViewsStore } from '../lib/saved-views-store';
import type { SavedView } from '../lib/types';

interface SavedViewsSidebarProps {
  onViewSelect: (view: SavedView) => void;
  onSaveCurrentFilters: () => void;
}

// Icon component that renders the appropriate icon based on name
function ViewIcon({ iconName, className }: { iconName?: string; className?: string }) {
  switch (iconName) {
    case 'files':
      return <Files className={className} />;
    case 'eye':
      return <Eye className={className} />;
    case 'alert-triangle':
      return <AlertTriangle className={className} />;
    case 'file-text':
    default:
      return <FileText className={className} />;
  }
}

interface ViewItemProps {
  view: SavedView;
  isActive: boolean;
  onSelect: () => void;
  onSetDefault: () => void;
  onToggleShare: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: () => void;
}

const ViewItem = memo(function ViewItem({
  view,
  isActive,
  onSelect,
  onSetDefault,
  onToggleShare,
  onDuplicate,
  onDelete,
  onRename,
}: ViewItemProps) {
  const isPreset = view.id.startsWith('preset-');

  return (
    <div
      className={cn(
        'group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors',
        isActive
          ? 'bg-zinc-900 text-white'
          : 'hover:bg-zinc-100 text-zinc-700'
      )}
      onClick={onSelect}
      data-testid={`saved-view-item-${view.id}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <ViewIcon
          iconName={view.icon}
          className={cn(
            'w-4 h-4 flex-shrink-0',
            isActive ? 'text-zinc-300' : 'text-zinc-400'
          )}
        />
        <span className="text-sm font-medium truncate">{view.name}</span>
        {view.isDefault && (
          <Star
            className={cn(
              'w-3 h-3 flex-shrink-0 fill-current',
              isActive ? 'text-yellow-300' : 'text-yellow-500'
            )}
          />
        )}
        {view.isShared && !isPreset && (
          <Users
            className={cn(
              'w-3 h-3 flex-shrink-0',
              isActive ? 'text-zinc-300' : 'text-zinc-400'
            )}
          />
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'opacity-0 group-hover:opacity-100 h-6 w-6 p-0 transition-opacity',
              isActive ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'
            )}
            onClick={(e) => e.stopPropagation()}
            data-testid={`saved-view-menu-${view.id}`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onSetDefault} data-testid="view-set-default-btn">
            <Star className="w-4 h-4 mr-2" />
            {view.isDefault ? 'Remove as default' : 'Set as default'}
          </DropdownMenuItem>
          {!isPreset && (
            <>
              <DropdownMenuItem onClick={onToggleShare} data-testid="view-toggle-share-btn">
                <Share2 className="w-4 h-4 mr-2" />
                {view.isShared ? 'Stop sharing' : 'Share with team'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRename} data-testid="view-rename-btn">
                <Pencil className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={onDuplicate} data-testid="view-duplicate-btn">
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          {!isPreset && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-600 focus:text-red-600"
                data-testid="view-delete-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

export const SavedViewsSidebar = memo(function SavedViewsSidebar({
  onViewSelect,
  onSaveCurrentFilters,
}: SavedViewsSidebarProps) {
  const [myViewsExpanded, setMyViewsExpanded] = useState(true);
  const [sharedViewsExpanded, setSharedViewsExpanded] = useState(true);

  const {
    views,
    activeViewId,
    setActiveView,
    setDefaultView,
    toggleViewSharing,
    duplicateView,
    deleteView,
    updateView,
    preferences,
  } = useSavedViewsStore();

  // Separate preset views, user views, and shared views from others
  const presetViews = views.filter((v) => v.id.startsWith('preset-'));
  const userViews = views.filter(
    (v) => !v.id.startsWith('preset-') && v.createdBy !== 'system'
  );
  const teamSharedViews = views.filter(
    (v) =>
      v.isShared &&
      !v.id.startsWith('preset-') &&
      v.createdBy !== 'current-user' // In real app, check actual user ID
  );

  const handleViewSelect = useCallback(
    (view: SavedView) => {
      setActiveView(view.id);
      onViewSelect(view);
    },
    [setActiveView, onViewSelect]
  );

  const handleSetDefault = useCallback(
    (viewId: string) => {
      const currentDefault = preferences.defaultViewId;
      setDefaultView(currentDefault === viewId ? null : viewId);
    },
    [preferences.defaultViewId, setDefaultView]
  );

  const handleDuplicate = useCallback(
    (viewId: string) => {
      const view = views.find((v) => v.id === viewId);
      if (view) {
        const newView = duplicateView(viewId, `${view.name} (Copy)`);
        if (newView) {
          setActiveView(newView.id);
          onViewSelect(newView);
        }
      }
    },
    [views, duplicateView, setActiveView, onViewSelect]
  );

  const handleRename = useCallback((viewId: string) => {
    // For simplicity, using prompt. In production, use inline editing.
    const view = useSavedViewsStore.getState().views.find((v) => v.id === viewId);
    if (view) {
      const newName = prompt('Enter new name:', view.name);
      if (newName && newName.trim()) {
        updateView(viewId, { name: newName.trim() });
      }
    }
  }, [updateView]);

  const handleDelete = useCallback(
    (viewId: string) => {
      if (confirm('Are you sure you want to delete this view?')) {
        deleteView(viewId);
      }
    },
    [deleteView]
  );

  return (
    <Card className="w-64 flex-shrink-0 animate-in fade-in slide-in-from-left-4 duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-zinc-700">
            Saved Views
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={onSaveCurrentFilters}
            data-testid="save-current-filters-btn"
          >
            <Plus className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Preset Views */}
        <div>
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
            Quick Access
          </div>
          <div className="space-y-1">
            {presetViews.map((view) => (
              <ViewItem
                key={view.id}
                view={view}
                isActive={activeViewId === view.id}
                onSelect={() => handleViewSelect(view)}
                onSetDefault={() => handleSetDefault(view.id)}
                onToggleShare={() => toggleViewSharing(view.id)}
                onDuplicate={() => handleDuplicate(view.id)}
                onDelete={() => handleDelete(view.id)}
                onRename={() => handleRename(view.id)}
              />
            ))}
          </div>
        </div>

        {/* My Views */}
        {userViews.length > 0 && (
          <div>
            <button
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 hover:text-zinc-700 transition-colors"
              onClick={() => setMyViewsExpanded(!myViewsExpanded)}
              data-testid="my-views-toggle"
            >
              {myViewsExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              My Views ({userViews.length})
            </button>
            {myViewsExpanded && (
              <div className="space-y-1">
                {userViews.map((view) => (
                  <ViewItem
                    key={view.id}
                    view={view}
                    isActive={activeViewId === view.id}
                    onSelect={() => handleViewSelect(view)}
                    onSetDefault={() => handleSetDefault(view.id)}
                    onToggleShare={() => toggleViewSharing(view.id)}
                    onDuplicate={() => handleDuplicate(view.id)}
                    onDelete={() => handleDelete(view.id)}
                    onRename={() => handleRename(view.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Team Shared Views */}
        {teamSharedViews.length > 0 && (
          <div>
            <button
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 hover:text-zinc-700 transition-colors"
              onClick={() => setSharedViewsExpanded(!sharedViewsExpanded)}
              data-testid="shared-views-toggle"
            >
              {sharedViewsExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <Users className="w-3 h-3 mr-1" />
              Team Views ({teamSharedViews.length})
            </button>
            {sharedViewsExpanded && (
              <div className="space-y-1">
                {teamSharedViews.map((view) => (
                  <ViewItem
                    key={view.id}
                    view={view}
                    isActive={activeViewId === view.id}
                    onSelect={() => handleViewSelect(view)}
                    onSetDefault={() => handleSetDefault(view.id)}
                    onToggleShare={() => toggleViewSharing(view.id)}
                    onDuplicate={() => handleDuplicate(view.id)}
                    onDelete={() => handleDelete(view.id)}
                    onRename={() => handleRename(view.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
