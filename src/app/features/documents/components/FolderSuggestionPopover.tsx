'use client';

import React, { useState, useCallback, memo, useMemo } from 'react';
import {
  Sparkles,
  Folder,
  FolderInput,
  Check,
  ChevronRight,
  Brain,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useDocumentListStore } from '../lib/document-list-store';
import { getMockFolderSuggestions } from '../lib/folder-mock-data';
import type { FolderSuggestion } from '../lib/types';

interface FolderSuggestionPopoverProps {
  documentId: string;
  documentName: string;
  documentType: string;
  currentFolderId: string | null;
  onMoveToFolder: (folderId: string | null) => void;
  trigger?: React.ReactNode;
}

export const FolderSuggestionPopover = memo(function FolderSuggestionPopover({
  documentId,
  documentName,
  documentType,
  currentFolderId,
  onMoveToFolder,
  trigger,
}: FolderSuggestionPopoverProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FolderSuggestion[]>([]);

  const { folders, moveDocumentToFolder } = useDocumentListStore();

  // Get current folder info
  const currentFolder = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)
    : null;

  // Load suggestions when popover opens
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen && suggestions.length === 0) {
        setLoading(true);
        // Simulate AI processing delay
        setTimeout(() => {
          const sug = getMockFolderSuggestions(
            documentId,
            documentName,
            documentType
          );
          setSuggestions(sug);
          setLoading(false);
        }, 500);
      }
    },
    [documentId, documentName, documentType, suggestions.length]
  );

  const handleSelectFolder = useCallback(
    (folderId: string | null) => {
      moveDocumentToFolder(documentId, folderId);
      onMoveToFolder(folderId);
      setOpen(false);
    },
    [documentId, moveDocumentToFolder, onMoveToFolder]
  );

  // Get top suggestion (highest confidence)
  const topSuggestion = useMemo(() => {
    if (suggestions.length === 0) return null;
    return suggestions[0];
  }, [suggestions]);

  // Get quick access folders (recently used or popular)
  const quickAccessFolders = useMemo(() => {
    return folders
      .filter((f) => f.parentId === null)
      .slice(0, 5)
      .map((f) => ({
        id: f.id,
        name: f.name,
        color: f.color,
        documentCount: f.documentCount,
      }));
  }, [folders]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-zinc-500 hover:text-zinc-700"
            data-testid={`folder-suggestion-btn-${documentId}`}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            <span className="text-xs">Organize</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        data-testid={`folder-suggestion-popover-${documentId}`}
      >
        {/* Header */}
        <div className="p-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-sm">AI Folder Suggestions</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Based on document content and classification rules
          </p>
        </div>

        {/* Current Location */}
        {currentFolder && (
          <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100">
            <div className="text-xs text-zinc-500">Current location</div>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: currentFolder.color }}
              />
              <span className="text-sm font-medium">{currentFolder.name}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-6 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-400" />
            <p className="text-sm text-zinc-500 mt-2">Analyzing document...</p>
          </div>
        )}

        {/* Suggestions */}
        {!loading && suggestions.length > 0 && (
          <div className="py-2">
            <div className="px-3 pb-1">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Suggested Folders
              </span>
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.folderId}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-2 hover:bg-zinc-50 transition-colors text-left',
                  index === 0 && 'bg-green-50 hover:bg-green-100'
                )}
                onClick={() => handleSelectFolder(suggestion.folderId)}
                data-testid={`suggestion-${suggestion.folderId}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {index === 0 ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <Folder
                      className="w-5 h-5 text-zinc-400"
                      style={{
                        color:
                          folders.find((f) => f.id === suggestion.folderId)
                            ?.color || undefined,
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {suggestion.folderName}
                    </span>
                    <span
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        suggestion.confidence >= 0.9
                          ? 'bg-green-100 text-green-700'
                          : suggestion.confidence >= 0.7
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-zinc-100 text-zinc-600'
                      )}
                    >
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                    {suggestion.reasoning}
                  </p>
                  {suggestion.matchedRules &&
                    suggestion.matchedRules.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {suggestion.matchedRules.map((rule) => (
                          <span
                            key={rule.ruleId}
                            className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded"
                          >
                            {rule.fieldType.replace('_', ' ')}:{' '}
                            {rule.matchedValue}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        )}

        {/* Quick Access Folders */}
        {!loading && (
          <div className="border-t border-zinc-100 py-2">
            <div className="px-3 pb-1">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Quick Access
              </span>
            </div>
            {quickAccessFolders.map((folder) => (
              <button
                key={folder.id}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 transition-colors text-left',
                  currentFolderId === folder.id && 'bg-zinc-100'
                )}
                onClick={() => handleSelectFolder(folder.id)}
                disabled={currentFolderId === folder.id}
                data-testid={`quick-access-${folder.id}`}
              >
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="text-sm flex-1 truncate">{folder.name}</span>
                {currentFolderId === folder.id && (
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
              </button>
            ))}

            {/* Move to Unfiled */}
            <button
              className={cn(
                'w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 transition-colors text-left',
                !currentFolderId && 'bg-zinc-100'
              )}
              onClick={() => handleSelectFolder(null)}
              disabled={!currentFolderId}
              data-testid="move-to-unfiled"
            >
              <FolderInput className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <span className="text-sm flex-1">Unfiled</span>
              {!currentFolderId && (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
            </button>
          </div>
        )}

        {/* No Suggestions */}
        {!loading && suggestions.length === 0 && (
          <div className="p-4 text-center text-sm text-zinc-500">
            <p>No folder suggestions available.</p>
            <p className="text-xs mt-1">
              Create smart folders with classification rules to get AI
              suggestions.
            </p>
          </div>
        )}

        {/* Auto-organize hint */}
        {!loading && topSuggestion && topSuggestion.confidence >= 0.9 && (
          <div className="px-3 py-2 bg-green-50 border-t border-green-100 text-xs text-green-700">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span className="font-medium">High confidence match!</span>
            </div>
            <p className="mt-0.5">
              This document strongly matches the &quot;{topSuggestion.folderName}&quot;
              folder rules.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});

/**
 * Compact version for use in document cards/lists
 */
interface FolderBadgeProps {
  documentId: string;
  documentName: string;
  documentType: string;
  onMoveToFolder?: (folderId: string | null) => void;
}

export const DocumentFolderBadge = memo(function DocumentFolderBadge({
  documentId,
  documentName,
  documentType,
  onMoveToFolder,
}: FolderBadgeProps) {
  const { documentFolderMap, folders } = useDocumentListStore();
  const currentFolderId = documentFolderMap[documentId] || null;
  const currentFolder = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)
    : null;

  const handleMove = useCallback(
    (folderId: string | null) => {
      onMoveToFolder?.(folderId);
    },
    [onMoveToFolder]
  );

  return (
    <FolderSuggestionPopover
      documentId={documentId}
      documentName={documentName}
      documentType={documentType}
      currentFolderId={currentFolderId}
      onMoveToFolder={handleMove}
      trigger={
        <button
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
            currentFolder
              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-500'
          )}
          data-testid={`folder-badge-${documentId}`}
        >
          {currentFolder ? (
            <>
              <div
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: currentFolder.color }}
              />
              <span className="truncate max-w-[100px]">{currentFolder.name}</span>
            </>
          ) : (
            <>
              <FolderInput className="w-3 h-3 flex-shrink-0" />
              <span>Unfiled</span>
            </>
          )}
        </button>
      }
    />
  );
});
