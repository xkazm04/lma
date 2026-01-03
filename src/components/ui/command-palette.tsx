'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  FileText,
  Handshake,
  ClipboardCheck,
  ArrowLeftRight,
  LayoutDashboard,
  Plus,
  Search,
  Calendar,
  Building2,
  GitCompare,
  Shield,
  Clock,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Command types
type CommandType = 'navigation' | 'action' | 'recent' | 'search';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  type: CommandType;
  href?: string;
  action?: () => void;
  keywords?: string[];
  shortcut?: string;
}

// Define all available commands
const navigationCommands: CommandItem[] = [
  {
    id: 'nav-dashboard',
    label: 'Dashboard',
    description: 'Portfolio overview and analytics',
    icon: LayoutDashboard,
    type: 'navigation',
    href: '/dashboard',
    keywords: ['home', 'overview', 'portfolio', 'stats'],
  },
  {
    id: 'nav-documents',
    label: 'Documents',
    description: 'Document Intelligence Hub',
    icon: FileText,
    type: 'navigation',
    href: '/documents',
    keywords: ['files', 'upload', 'extraction', 'pdf'],
  },
  {
    id: 'nav-deals',
    label: 'Deal Room',
    description: 'Negotiate and manage deals',
    icon: Handshake,
    type: 'navigation',
    href: '/deals',
    keywords: ['negotiation', 'terms', 'pipeline'],
  },
  {
    id: 'nav-compliance',
    label: 'Compliance Tracker',
    description: 'Obligations and covenants',
    icon: ClipboardCheck,
    type: 'navigation',
    href: '/compliance',
    keywords: ['obligations', 'deadlines', 'covenants'],
  },
  {
    id: 'nav-compliance-calendar',
    label: 'Compliance Calendar',
    description: 'View obligation calendar',
    icon: Calendar,
    type: 'navigation',
    href: '/compliance/calendar',
    keywords: ['deadlines', 'dates', 'schedule'],
  },
  {
    id: 'nav-compliance-covenants',
    label: 'Covenant Tracking',
    description: 'Monitor covenant tests',
    icon: ClipboardCheck,
    type: 'navigation',
    href: '/compliance/covenants',
    keywords: ['tests', 'headroom', 'ratios'],
  },
  {
    id: 'nav-compliance-facilities',
    label: 'Compliance Facilities',
    description: 'Facility-level compliance',
    icon: Building2,
    type: 'navigation',
    href: '/compliance/facilities',
    keywords: ['facilities', 'loans'],
  },
  {
    id: 'nav-trading',
    label: 'Trading',
    description: 'Trade due diligence and positions',
    icon: ArrowLeftRight,
    type: 'navigation',
    href: '/trading',
    keywords: ['trades', 'positions', 'settlement', 'dd'],
  },
];

const actionCommands: CommandItem[] = [
  {
    id: 'action-new-deal',
    label: 'New Deal',
    description: 'Create a new deal',
    icon: Plus,
    type: 'action',
    href: '/deals/new',
    keywords: ['create', 'add'],
    shortcut: '⌘N',
  },
  {
    id: 'action-upload-doc',
    label: 'Upload Document',
    description: 'Upload a new document',
    icon: Plus,
    type: 'action',
    href: '/documents/upload',
    keywords: ['create', 'add', 'file'],
  },
  {
    id: 'action-new-trade',
    label: 'New Trade',
    description: 'Create a new trade',
    icon: Plus,
    type: 'action',
    href: '/trading/trades/new',
    keywords: ['create', 'add'],
  },
  {
    id: 'action-compare-docs',
    label: 'Compare Documents',
    description: 'Side-by-side document comparison',
    icon: GitCompare,
    type: 'action',
    href: '/documents/compare',
    keywords: ['diff', 'versions'],
  },
  {
    id: 'action-risk-detection',
    label: 'Risk Detection',
    description: 'Scan documents for risks',
    icon: Shield,
    type: 'action',
    href: '/documents/risk-detection',
    keywords: ['scan', 'analyze'],
  },
];

// Fuzzy search function
function fuzzyMatch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Direct substring match
  if (textLower.includes(queryLower)) return true;

  // Fuzzy match (all query chars appear in order)
  let queryIdx = 0;
  for (let i = 0; i < textLower.length && queryIdx < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIdx]) {
      queryIdx++;
    }
  }
  return queryIdx === queryLower.length;
}

function searchCommands(query: string, commands: CommandItem[]): CommandItem[] {
  if (!query.trim()) return commands;

  return commands.filter((cmd) => {
    const searchText = [
      cmd.label,
      cmd.description || '',
      ...(cmd.keywords || []),
    ].join(' ');
    return fuzzyMatch(query, searchText);
  });
}

interface CommandPaletteProps {
  /** Additional className */
  className?: string;
}

export function CommandPalette({ className }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    const allCommands = [...actionCommands, ...navigationCommands];
    return searchCommands(query, allCommands);
  }, [query]);

  // Group commands by type
  const groupedCommands = useMemo(() => {
    const groups: Record<CommandType, CommandItem[]> = {
      action: [],
      navigation: [],
      recent: [],
      search: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.type].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Flatten for keyboard navigation
  const flatCommands = useMemo(() => {
    return [
      ...groupedCommands.action,
      ...groupedCommands.navigation,
    ];
  }, [groupedCommands]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && flatCommands.length > 0) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, flatCommands.length]);

  // Handle keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Handle command execution
  const executeCommand = useCallback((command: CommandItem) => {
    setOpen(false);

    if (command.action) {
      command.action();
    } else if (command.href) {
      router.push(command.href);
    }
  }, [router]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < flatCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : flatCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          executeCommand(flatCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  }, [flatCommands, selectedIndex, executeCommand]);

  if (!open) return null;

  let currentIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setOpen(false)}
      />

      {/* Command Palette */}
      <div
        className={cn(
          'fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2',
          'bg-white rounded-xl shadow-2xl border border-zinc-200',
          'animate-in fade-in slide-in-from-top-4 duration-200',
          className
        )}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
          <Search className="w-5 h-5 text-zinc-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, pages, or actions..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-zinc-400"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-100 rounded">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2">
          {flatCommands.length === 0 ? (
            <div className="py-8 text-center">
              <Search className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500">No results found</p>
              <p className="text-xs text-zinc-400 mt-1">Try a different search term</p>
            </div>
          ) : (
            <>
              {/* Actions */}
              {groupedCommands.action.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Actions
                  </div>
                  {groupedCommands.action.map((cmd) => {
                    const idx = currentIndex++;
                    return (
                      <CommandItemRow
                        key={cmd.id}
                        command={cmd}
                        isSelected={selectedIndex === idx}
                        dataIndex={idx}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Navigation */}
              {groupedCommands.navigation.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Navigation
                  </div>
                  {groupedCommands.navigation.map((cmd) => {
                    const idx = currentIndex++;
                    return (
                      <CommandItemRow
                        key={cmd.id}
                        command={cmd}
                        isSelected={selectedIndex === idx}
                        dataIndex={idx}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50 rounded-b-xl">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[9px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[9px]">↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[9px]">↵</kbd>
                <span>Select</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>K to toggle</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// Command Item Row Component
function CommandItemRow({
  command,
  isSelected,
  dataIndex,
  onClick,
  onMouseEnter,
}: {
  command: CommandItem;
  isSelected: boolean;
  dataIndex: number;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  const Icon = command.icon;

  return (
    <button
      data-index={dataIndex}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
        isSelected ? 'bg-blue-50 text-blue-900' : 'text-zinc-700 hover:bg-zinc-50'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0',
          isSelected ? 'bg-blue-100' : 'bg-zinc-100'
        )}
      >
        <Icon className={cn('w-4 h-4', isSelected ? 'text-blue-600' : 'text-zinc-500')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', isSelected && 'text-blue-900')}>
          {command.label}
        </p>
        {command.description && (
          <p className={cn('text-xs truncate', isSelected ? 'text-blue-600' : 'text-zinc-400')}>
            {command.description}
          </p>
        )}
      </div>
      {command.shortcut && (
        <kbd className={cn(
          'px-1.5 py-0.5 text-[10px] font-medium rounded',
          isSelected ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-400'
        )}>
          {command.shortcut}
        </kbd>
      )}
      <ArrowRight className={cn(
        'w-4 h-4 flex-shrink-0 transition-transform',
        isSelected ? 'text-blue-500 translate-x-0.5' : 'text-zinc-300'
      )} />
    </button>
  );
}

export default CommandPalette;
