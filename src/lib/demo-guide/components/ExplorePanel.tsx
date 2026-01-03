'use client';

import React, { memo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  X,
  Compass,
  ChevronRight,
  CheckCircle,
  Sparkles,
  BarChart3,
  Activity,
  FolderTree,
  FileText,
  Handshake,
  GitBranch,
  Calendar,
  AlertTriangle,
  Brain,
  List,
  ClipboardCheck,
  Building2,
  ArrowLeftRight,
  GitCompare,
  Shield,
  Upload,
  Search,
  Layers,
  Network,
  TrendingUp,
  Globe,
  History,
  Gauge,
  Settings,
  Zap,
  Target,
  LineChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemoGuideStore } from '../store';
import { getModuleContent } from '../content';
import type { DemoSection } from '../types';

// Icon mapping for sections
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  Activity,
  FolderTree,
  FileText,
  Handshake,
  GitBranch,
  Calendar,
  AlertTriangle,
  Brain,
  List,
  ClipboardCheck,
  Building2,
  ArrowLeftRight,
  GitCompare,
  Shield,
  Upload,
  Search,
  Layers,
  Network,
  TrendingUp,
  Globe,
  History,
  Gauge,
  Settings,
  Zap,
  Target,
  LineChart,
};

function getIcon(iconName?: string) {
  if (!iconName) return FileText;
  return iconMap[iconName] || FileText;
}

/**
 * Normalize pathname to content key
 * Handles exact matching for submodules
 */
function pathnameToContentKey(pathname: string): string {
  // Remove trailing slash
  const path = pathname.replace(/\/$/, '');

  // Handle root dashboard
  if (path === '' || path === '/' || path === '/dashboard') {
    return 'dashboard';
  }

  // Remove leading slash and return as key
  const key = path.startsWith('/') ? path.slice(1) : path;

  return key;
}

/**
 * ExplorePanel - Centered floating exploration panel
 *
 * Shows when explore mode is active:
 * - Left side: List of explorable sections
 * - Top right: Page introduction
 * - Bottom right: Section details when selected
 */
export const ExplorePanel = memo(function ExplorePanel() {
  const pathname = usePathname();
  const {
    isExploreMode,
    activeModule,
    activeSection,
    setActiveModule,
    setActiveSection,
    disableExploreMode,
    hasViewed,
  } = useDemoGuideStore();

  // Determine module content from pathname
  useEffect(() => {
    if (!isExploreMode) return;

    const contentKey = pathnameToContentKey(pathname);
    const content = getModuleContent(contentKey);

    if (content && content.moduleId !== activeModule?.moduleId) {
      setActiveModule(content);
    } else if (!content && activeModule) {
      // No content for this page - keep showing closest parent or clear
      const parentKey = contentKey.split('/').slice(0, -1).join('/');
      const parentContent = getModuleContent(parentKey);
      if (parentContent) {
        setActiveModule(parentContent);
      }
    }
  }, [pathname, isExploreMode, activeModule?.moduleId, setActiveModule]);

  if (!isExploreMode || !activeModule) {
    return null;
  }

  const handleSectionClick = (section: DemoSection) => {
    setActiveSection(section.id === activeSection?.id ? null : section);
  };

  const handleClose = () => {
    disableExploreMode();
  };

  return (
    <div
      className={cn(
        'fixed top-20 left-1/2 -translate-x-1/2 z-40',
        'w-[90%] max-w-4xl',
        'bg-white rounded-xl border border-zinc-200 shadow-2xl',
        'animate-in fade-in slide-in-from-top-4 duration-300'
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 text-white shadow-sm">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Explore Mode</h2>
            <p className="text-xs text-zinc-500">{activeModule.moduleName}</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-white/80 transition-colors"
          aria-label="Close explore panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex min-h-[200px] max-h-[320px]">
        {/* Left Side - Section List */}
        <div className="w-56 border-r border-zinc-100 bg-zinc-50/50 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-1">
              Explorable Sections
            </h3>
            <div className="space-y-1.5">
              {activeModule.sections.map((section) => {
                const Icon = getIcon(section.icon);
                const isActive = activeSection?.id === section.id;
                const isViewed = hasViewed(section.id);

                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all text-xs',
                      isActive
                        ? 'bg-blue-100 text-blue-900 shadow-sm'
                        : 'hover:bg-zinc-100 text-zinc-700'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0',
                        isActive ? 'bg-blue-500 text-white' : 'bg-zinc-200 text-zinc-500'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="flex-1 truncate font-medium">{section.title}</span>
                    {isViewed && !isActive && (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    )}
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side - Introduction and Section Details */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top - Page Introduction */}
          <div className="flex-1 p-5 overflow-y-auto border-b border-zinc-100">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                  About This Page
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {activeModule.introduction}
                </p>
                {/* Highlights */}
                {activeModule.highlights && activeModule.highlights.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeModule.highlights.map((highlight, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-100 rounded-full text-[11px] text-green-700"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom - Section Details (when selected) */}
          <div className={cn(
            'p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 transition-all duration-200',
            activeSection ? 'min-h-[90px]' : 'min-h-0 p-0 h-0 overflow-hidden'
          )}>
            {activeSection && (
              <div className="flex items-start gap-4">
                {(() => {
                  const Icon = getIcon(activeSection.icon);
                  return (
                    <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-blue-500 text-white shadow-sm flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-900 mb-1">
                    {activeSection.title}
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {activeSection.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-zinc-100 bg-zinc-50/50 rounded-b-xl">
        <p className="text-[11px] text-zinc-400 text-center">
          Click highlighted sections on the page or select from the list to learn more
        </p>
      </div>
    </div>
  );
});

export default ExplorePanel;
