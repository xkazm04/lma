'use client';

import React, { memo, useState, useCallback } from 'react';
import { Save, Share2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSavedViewsStore } from '../lib/saved-views-store';
import type { DocumentFilters } from '../lib/types';

interface SaveViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: DocumentFilters;
}

// Available icons for views
const VIEW_ICONS = [
  { value: 'files', label: 'Files' },
  { value: 'eye', label: 'Eye' },
  { value: 'alert-triangle', label: 'Alert' },
  { value: 'file-text', label: 'Document' },
];

// Available colors for views
const VIEW_COLORS = [
  { value: 'default', label: 'Default', className: 'bg-zinc-500' },
  { value: 'blue', label: 'Blue', className: 'bg-blue-500' },
  { value: 'green', label: 'Green', className: 'bg-green-500' },
  { value: 'yellow', label: 'Yellow', className: 'bg-yellow-500' },
  { value: 'red', label: 'Red', className: 'bg-red-500' },
  { value: 'purple', label: 'Purple', className: 'bg-purple-500' },
];

export const SaveViewDialog = memo(function SaveViewDialog({
  open,
  onOpenChange,
  filters,
}: SaveViewDialogProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('file-text');
  const [color, setColor] = useState('default');
  const [isShared, setIsShared] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');

  const { createView, setActiveView, setDefaultView } = useSavedViewsStore();

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      setError('Please enter a name for this view');
      return;
    }

    const newView = createView({
      name: name.trim(),
      filters,
      createdBy: 'current-user', // In real app, use actual user ID
      isShared,
      isDefault: false,
      icon,
      color: color === 'default' ? undefined : color,
    });

    // Set as active
    setActiveView(newView.id);

    // Set as default if requested
    if (isDefault) {
      setDefaultView(newView.id);
    }

    // Reset form and close
    setName('');
    setIcon('file-text');
    setColor('default');
    setIsShared(false);
    setIsDefault(false);
    setError('');
    onOpenChange(false);
  }, [
    name,
    filters,
    isShared,
    isDefault,
    icon,
    color,
    createView,
    setActiveView,
    setDefaultView,
    onOpenChange,
  ]);

  const handleClose = useCallback(() => {
    setName('');
    setIcon('file-text');
    setColor('default');
    setIsShared(false);
    setIsDefault(false);
    setError('');
    onOpenChange(false);
  }, [onOpenChange]);

  // Generate a filter summary
  const filterSummary = [];
  if (filters.searchQuery) {
    filterSummary.push(`Search: "${filters.searchQuery}"`);
  }
  if (filters.statusFilter !== 'all') {
    filterSummary.push(`Status: ${filters.statusFilter.replace('_', ' ')}`);
  }
  if (filters.typeFilter !== 'all') {
    filterSummary.push(`Type: ${filters.typeFilter.replace('_', ' ')}`);
  }
  filterSummary.push(`View: ${filters.viewMode}`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Current View</DialogTitle>
          <DialogDescription>
            Save your current filter combination as a named view for quick access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* View Name */}
          <div className="space-y-2">
            <Label htmlFor="view-name">View Name</Label>
            <Input
              id="view-name"
              placeholder="e.g., My Review Queue, Apollo Deal Docs"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              error={!!error}
              data-testid="save-view-name-input"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {/* Current Filters Summary */}
          <div className="space-y-2">
            <Label>Current Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filterSummary.map((item, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs bg-zinc-100 rounded-md text-zinc-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger data-testid="save-view-icon-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIEW_ICONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {VIEW_COLORS.map((c) => (
                <button
                  key={c.value}
                  className={`w-6 h-6 rounded-full transition-all ${c.className} ${
                    color === c.value
                      ? 'ring-2 ring-offset-2 ring-zinc-900'
                      : 'hover:ring-2 hover:ring-offset-2 hover:ring-zinc-300'
                  }`}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  data-testid={`save-view-color-${c.value}`}
                />
              ))}
            </div>
          </div>

          {/* Share Toggle */}
          <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Share with team</p>
                <p className="text-xs text-zinc-500">
                  Team members can see and use this view
                </p>
              </div>
            </div>
            <button
              className={`relative w-10 h-6 rounded-full transition-colors ${
                isShared ? 'bg-zinc-900' : 'bg-zinc-300'
              }`}
              onClick={() => setIsShared(!isShared)}
              data-testid="save-view-share-toggle"
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isShared ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Default View Toggle */}
          <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Set as default</p>
                <p className="text-xs text-zinc-500">
                  Load this view automatically when visiting documents
                </p>
              </div>
            </div>
            <button
              className={`relative w-10 h-6 rounded-full transition-colors ${
                isDefault ? 'bg-zinc-900' : 'bg-zinc-300'
              }`}
              onClick={() => setIsDefault(!isDefault)}
              data-testid="save-view-default-toggle"
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isDefault ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} data-testid="save-view-cancel-btn">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="save-view-confirm-btn">
            <Save className="w-4 h-4 mr-2" />
            Save View
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
