'use client';

import React, { memo, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderInput,
  Sparkles,
  Briefcase,
  Building,
  FileStack,
  FileText,
  FileEdit,
  CheckCircle,
  Users,
  ClipboardList,
  FolderCheck,
  FolderSync,
  Files,
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
import { useDocumentListStore } from '../lib/document-list-store';
import type { FolderTreeNode } from '../lib/types';

interface FolderIconProps {
  iconName?: string;
  className?: string;
  isOpen?: boolean;
}

function FolderIcon({ iconName, className, isOpen }: FolderIconProps) {
  const baseClass = cn('w-4 h-4 flex-shrink-0', className);

  switch (iconName) {
    case 'briefcase':
      return <Briefcase className={baseClass} />;
    case 'building':
      return <Building className={baseClass} />;
    case 'file-stack':
      return <FileStack className={baseClass} />;
    case 'file-text':
      return <FileText className={baseClass} />;
    case 'file-edit':
      return <FileEdit className={baseClass} />;
    case 'check-circle':
      return <CheckCircle className={baseClass} />;
    case 'users':
      return <Users className={baseClass} />;
    case 'clipboard-list':
      return <ClipboardList className={baseClass} />;
    case 'folder-check':
      return <FolderCheck className={baseClass} />;
    case 'folder-sync':
      return <FolderSync className={baseClass} />;
    case 'folder':
    default:
      return isOpen ? (
        <FolderOpen className={baseClass} />
      ) : (
        <Folder className={baseClass} />
      );
  }
}

interface FolderTreeItemProps {
  node: FolderTreeNode;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (folderId: string) => void;
  onToggleExpand: (folderId: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  onRename: (folderId: string) => void;
  onDelete: (folderId: string) => void;
}

const FolderTreeItem = memo(function FolderTreeItem({
  node,
  level,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onCreateSubfolder,
  onRename,
  onDelete,
}: FolderTreeItemProps) {
  const hasChildren = node.children.length > 0;
  const paddingLeft = level * 16 + 8;

  const handleChevronClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleExpand(node.id);
    },
    [node.id, onToggleExpand]
  );

  const handleSelect = useCallback(() => {
    onSelect(node.id);
  }, [node.id, onSelect]);

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-1 py-1.5 pr-2 rounded-md cursor-pointer transition-colors',
          isSelected
            ? 'bg-zinc-900 text-white'
            : 'hover:bg-zinc-100 text-zinc-700'
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleSelect}
        data-testid={`folder-tree-item-${node.id}`}
      >
        {/* Expand/collapse chevron */}
        <button
          className={cn(
            'w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-200/50 transition-colors',
            isSelected && 'hover:bg-zinc-700',
            !hasChildren && 'invisible'
          )}
          onClick={handleChevronClick}
          data-testid={`folder-expand-btn-${node.id}`}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Folder icon with color */}
        <div
          className="flex items-center justify-center"
          style={{ color: node.color || '#6B7280' }}
        >
          <FolderIcon
            iconName={node.icon}
            isOpen={isExpanded && hasChildren}
          />
        </div>

        {/* Folder name and badges */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">{node.name}</span>
          {node.isSmartFolder && (
            <Sparkles
              className={cn(
                'w-3 h-3 flex-shrink-0',
                isSelected ? 'text-yellow-300' : 'text-yellow-500'
              )}
            />
          )}
        </div>

        {/* Document count badge */}
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full flex-shrink-0',
            isSelected
              ? 'bg-zinc-700 text-zinc-300'
              : 'bg-zinc-100 text-zinc-500'
          )}
        >
          {node.totalDocumentCount}
        </span>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'opacity-0 group-hover:opacity-100 h-6 w-6 p-0 transition-opacity',
                isSelected ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'
              )}
              onClick={(e) => e.stopPropagation()}
              data-testid={`folder-menu-btn-${node.id}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => onCreateSubfolder(node.id)}
              data-testid={`folder-create-subfolder-${node.id}`}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Create Subfolder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRename(node.id)}
              data-testid={`folder-rename-${node.id}`}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(node.id)}
              className="text-red-600 focus:text-red-600"
              data-testid={`folder-delete-${node.id}`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Render children if expanded */}
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              isSelected={isSelected}
              isExpanded={useDocumentListStore.getState().expandedFolderIds.has(child.id)}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onCreateSubfolder={onCreateSubfolder}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </>
  );
});

interface FolderTreeProps {
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder?: (folderId: string) => void;
}

export const FolderTree = memo(function FolderTree({
  onCreateFolder,
  onRenameFolder,
}: FolderTreeProps) {
  const {
    getFolderTree,
    expandedFolderIds,
    selectedFolderId,
    folderFilter,
    toggleFolderExpanded,
    selectFolder,
    setFolderFilter,
    deleteFolder,
    expandAllFolders,
    collapseAllFolders,
  } = useDocumentListStore();

  const folderTree = getFolderTree();

  const handleSelectFolder = useCallback(
    (folderId: string) => {
      selectFolder(folderId);
    },
    [selectFolder]
  );

  const handleSelectAll = useCallback(() => {
    selectFolder(null);
    setFolderFilter({ type: 'all' });
  }, [selectFolder, setFolderFilter]);

  const handleSelectUnfiled = useCallback(() => {
    selectFolder(null);
    setFolderFilter({ type: 'unfiled' });
  }, [selectFolder, setFolderFilter]);

  const handleRename = useCallback(
    (folderId: string) => {
      if (onRenameFolder) {
        onRenameFolder(folderId);
      } else {
        // Fallback to simple prompt
        const folder = useDocumentListStore.getState().getFolderById(folderId);
        if (folder) {
          const newName = prompt('Enter new folder name:', folder.name);
          if (newName && newName.trim()) {
            useDocumentListStore.getState().updateFolder(folderId, { name: newName.trim() });
          }
        }
      }
    },
    [onRenameFolder]
  );

  const handleDelete = useCallback(
    (folderId: string) => {
      const folder = useDocumentListStore.getState().getFolderById(folderId);
      if (folder) {
        const hasChildren = folder.childFolderCount > 0;
        const hasDocuments = folder.documentCount > 0;

        let message = `Are you sure you want to delete "${folder.name}"?`;
        if (hasChildren) {
          message += '\n\nThis will also delete all subfolders.';
        }
        if (hasDocuments || hasChildren) {
          message += '\n\nDocuments in this folder will be moved to Unfiled.';
        }

        if (confirm(message)) {
          deleteFolder(folderId);
        }
      }
    },
    [deleteFolder]
  );

  const isAllSelected = folderFilter.type === 'all' && selectedFolderId === null;
  const isUnfiledSelected = folderFilter.type === 'unfiled';

  return (
    <Card className="w-64 flex-shrink-0 animate-in fade-in slide-in-from-left-4 duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-zinc-700">
            Folders
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={expandAllFolders}
              title="Expand all"
              data-testid="expand-all-folders-btn"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={collapseAllFolders}
              title="Collapse all"
              data-testid="collapse-all-folders-btn"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => onCreateFolder(null)}
              data-testid="create-folder-btn"
            >
              <FolderPlus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        {/* All Documents */}
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
            isAllSelected
              ? 'bg-zinc-900 text-white'
              : 'hover:bg-zinc-100 text-zinc-700'
          )}
          onClick={handleSelectAll}
          data-testid="folder-all-documents"
        >
          <Files className="w-4 h-4" />
          <span className="text-sm font-medium">All Documents</span>
        </div>

        {/* Unfiled Documents */}
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
            isUnfiledSelected
              ? 'bg-zinc-900 text-white'
              : 'hover:bg-zinc-100 text-zinc-700'
          )}
          onClick={handleSelectUnfiled}
          data-testid="folder-unfiled"
        >
          <FolderInput className="w-4 h-4" />
          <span className="text-sm font-medium">Unfiled</span>
        </div>

        {/* Separator */}
        <div className="h-px bg-zinc-200 my-2" />

        {/* Folder Tree */}
        <div className="space-y-0.5">
          {folderTree.map((node) => (
            <FolderTreeItem
              key={node.id}
              node={node}
              level={0}
              isSelected={selectedFolderId === node.id}
              isExpanded={expandedFolderIds.has(node.id)}
              onSelect={handleSelectFolder}
              onToggleExpand={toggleFolderExpanded}
              onCreateSubfolder={onCreateFolder}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {folderTree.length === 0 && (
          <div className="py-8 text-center text-zinc-400 text-sm">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No folders yet</p>
            <Button
              variant="link"
              size="sm"
              className="mt-1"
              onClick={() => onCreateFolder(null)}
              data-testid="create-first-folder-btn"
            >
              Create your first folder
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
