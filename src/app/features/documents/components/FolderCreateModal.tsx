'use client';

import React, { useState, useCallback, useEffect, memo } from 'react';
import {
  Folder,
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDocumentListStore } from '../lib/document-list-store';
import { folderColors, folderIcons } from '../lib/folder-mock-data';
import type {
  CreateFolderRequest,
  ClassificationRuleType,
  ClassificationOperator,
} from '../lib/types';

interface FolderCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string | null;
  onFolderCreated?: (folderId: string) => void;
}

interface ClassificationRuleInput {
  fieldType: ClassificationRuleType;
  operator: ClassificationOperator;
  value: string;
  priority: number;
}

const fieldTypeOptions: { value: ClassificationRuleType; label: string }[] = [
  { value: 'borrower_name', label: 'Borrower Name' },
  { value: 'deal_reference', label: 'Deal Reference' },
  { value: 'document_type', label: 'Document Type' },
  { value: 'date_range', label: 'Date Range' },
  { value: 'custom_field', label: 'Custom Field' },
];

const operatorOptions: { value: ClassificationOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'regex', label: 'Regex Pattern' },
];

const documentTypeValues = [
  { value: 'facility_agreement', label: 'Facility Agreement' },
  { value: 'amendment', label: 'Amendment' },
  { value: 'consent', label: 'Consent' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'other', label: 'Other' },
];

export const FolderCreateModal = memo(function FolderCreateModal({
  open,
  onOpenChange,
  parentId,
  onFolderCreated,
}: FolderCreateModalProps) {
  const { addFolder, getFolderById, getFolderPath } = useDocumentListStore();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [icon, setIcon] = useState('folder');
  const [isSmartFolder, setIsSmartFolder] = useState(false);
  const [matchAnyRule, setMatchAnyRule] = useState(true);
  const [rules, setRules] = useState<ClassificationRuleInput[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get parent folder info
  const parentFolder = parentId ? getFolderById(parentId) : null;
  const parentPath = parentId ? getFolderPath(parentId) : null;

  // Reset form when modal opens
  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setColor('#3B82F6');
    setIcon('folder');
    setIsSmartFolder(false);
    setMatchAnyRule(true);
    setRules([]);
    setShowAdvanced(false);
  }, []);

  // Use effect to reset when dialog opens
  useEffect(() => {
    if (open) {
      // Schedule reset for next tick to avoid synchronous setState in effect
      const timer = setTimeout(resetForm, 0);
      return () => clearTimeout(timer);
    }
  }, [open, resetForm]);

  const addRule = useCallback(() => {
    setRules((prev) => [
      ...prev,
      {
        fieldType: 'borrower_name',
        operator: 'contains',
        value: '',
        priority: prev.length + 1,
      },
    ]);
  }, []);

  const removeRule = useCallback((index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateRule = useCallback(
    (index: number, updates: Partial<ClassificationRuleInput>) => {
      setRules((prev) =>
        prev.map((rule, i) => (i === index ? { ...rule, ...updates } : rule))
      );
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!name.trim()) return;

      const request: CreateFolderRequest = {
        parentId,
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon,
        isSmartFolder: isSmartFolder && rules.length > 0,
        classificationRules: isSmartFolder
          ? rules.filter((r) => r.value.trim())
          : undefined,
        matchAnyRule: isSmartFolder ? matchAnyRule : undefined,
      };

      const newFolder = addFolder(request);
      onFolderCreated?.(newFolder.id);
      onOpenChange(false);
    },
    [
      name,
      description,
      color,
      icon,
      isSmartFolder,
      matchAnyRule,
      rules,
      parentId,
      addFolder,
      onFolderCreated,
      onOpenChange,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {parentFolder ? 'Create Subfolder' : 'Create New Folder'}
          </DialogTitle>
          <DialogDescription>
            {parentPath
              ? `Creating folder inside: ${parentPath}`
              : 'Create a new folder to organize your documents'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Folder Name */}
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="Enter folder name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              data-testid="folder-name-input"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="folder-description">Description (optional)</Label>
            <Input
              id="folder-description"
              placeholder="Brief description of the folder"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="folder-description-input"
            />
          </div>

          {/* Color and Icon */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {folderColors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                      color === c.value
                        ? 'border-zinc-900 scale-110'
                        : 'border-transparent'
                    )}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setColor(c.value)}
                    title={c.label}
                    data-testid={`folder-color-${c.label.toLowerCase()}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger data-testid="folder-icon-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {folderIcons.map((i) => (
                    <SelectItem
                      key={i.value}
                      value={i.value}
                      data-testid={`folder-icon-${i.value}`}
                    >
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Smart Folder Toggle */}
          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
            <button
              type="button"
              className={cn(
                'w-10 h-6 rounded-full transition-colors flex items-center',
                isSmartFolder ? 'bg-zinc-900' : 'bg-zinc-300'
              )}
              onClick={() => setIsSmartFolder(!isSmartFolder)}
              data-testid="smart-folder-toggle"
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full bg-white transition-transform mx-1',
                  isSmartFolder ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium text-sm">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Smart Folder
              </div>
              <p className="text-xs text-zinc-500">
                Automatically organize documents based on rules
              </p>
            </div>
          </div>

          {/* Classification Rules (for Smart Folders) */}
          {isSmartFolder && (
            <div className="space-y-3 p-3 border border-zinc-200 rounded-lg">
              <div className="flex items-center justify-between">
                <Label>Classification Rules</Label>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-500">Match:</span>
                  <button
                    type="button"
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                      matchAnyRule
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    )}
                    onClick={() => setMatchAnyRule(true)}
                    data-testid="match-any-btn"
                  >
                    Any
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                      !matchAnyRule
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    )}
                    onClick={() => setMatchAnyRule(false)}
                    data-testid="match-all-btn"
                  >
                    All
                  </button>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-2">
                {rules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-zinc-50 rounded"
                  >
                    <Select
                      value={rule.fieldType}
                      onValueChange={(v) =>
                        updateRule(index, { fieldType: v as ClassificationRuleType })
                      }
                    >
                      <SelectTrigger
                        className="w-36"
                        data-testid={`rule-field-type-${index}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={rule.operator}
                      onValueChange={(v) =>
                        updateRule(index, { operator: v as ClassificationOperator })
                      }
                    >
                      <SelectTrigger
                        className="w-28"
                        data-testid={`rule-operator-${index}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operatorOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {rule.fieldType === 'document_type' ? (
                      <Select
                        value={rule.value}
                        onValueChange={(v) => updateRule(index, { value: v })}
                      >
                        <SelectTrigger
                          className="flex-1"
                          data-testid={`rule-value-${index}`}
                        >
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypeValues.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="flex-1"
                        placeholder="Value to match"
                        value={rule.value}
                        onChange={(e) =>
                          updateRule(index, { value: e.target.value })
                        }
                        data-testid={`rule-value-${index}`}
                      />
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-red-500"
                      onClick={() => removeRule(index)}
                      data-testid={`rule-remove-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={addRule}
                data-testid="add-rule-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>

              {rules.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-2">
                  Add rules to automatically classify documents into this folder
                </p>
              )}
            </div>
          )}

          {/* Advanced Options (collapsible) */}
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Advanced Options
          </button>

          {showAdvanced && (
            <div className="p-3 bg-zinc-50 rounded-lg text-sm text-zinc-600">
              <p>
                Additional folder settings like access permissions, retention
                policies, and audit settings will be available in a future
                update.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="folder-create-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              data-testid="folder-create-submit-btn"
            >
              <Folder className="w-4 h-4 mr-2" />
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
