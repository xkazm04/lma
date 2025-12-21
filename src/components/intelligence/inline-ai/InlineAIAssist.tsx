'use client';

import React, { memo, useState, useCallback } from 'react';
import {
  Sparkles,
  Lightbulb,
  BarChart3,
  ChevronRight,
  X,
  Loader2,
  RefreshCw,
  Check,
  AlertCircle,
  GitCompare,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useInlineAI } from './hooks/useInlineAI';
import { domainConfig } from '../config';
import type { InlineAIContext, InlineAIAction, InlineAISuggestion, Domain } from '../types';

type InlineAIVariant = 'tooltip' | 'popover' | 'inline-row';

interface InlineAIAssistProps {
  /** Domain context */
  domain: Domain;
  /** Entity context for AI */
  context: InlineAIContext;
  /** Display variant */
  variant?: InlineAIVariant;
  /** Available actions */
  actions?: InlineAIAction[];
  /** Callback when suggestion is accepted */
  onSuggestionAccept?: (suggestion: InlineAISuggestion) => void;
  /** Custom trigger element */
  trigger?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Test ID */
  testId?: string;
}

const actionConfig: Record<InlineAIAction, { icon: typeof Sparkles; label: string; description: string }> = {
  explain: {
    icon: Sparkles,
    label: 'Explain',
    description: 'Get AI explanation',
  },
  suggest: {
    icon: Lightbulb,
    label: 'Suggest',
    description: 'Get AI suggestions',
  },
  analyze: {
    icon: BarChart3,
    label: 'Analyze',
    description: 'Run AI analysis',
  },
  compare: {
    icon: GitCompare,
    label: 'Compare',
    description: 'Compare with alternatives',
  },
  generate: {
    icon: Wand2,
    label: 'Generate',
    description: 'Generate content',
  },
};

export const InlineAIAssist = memo(function InlineAIAssist({
  domain,
  context,
  variant = 'popover',
  actions = ['explain', 'suggest', 'analyze'],
  onSuggestionAccept,
  trigger,
  className,
  testId,
}: InlineAIAssistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<InlineAIAction | null>(null);

  const {
    isLoading,
    error,
    explanation,
    suggestions,
    explain,
    getSuggestions,
    analyze,
    clearResponse,
    clearError,
  } = useInlineAI({
    cacheKey: `${context.entityType}-${context.entityId}`,
  });

  const domConfig = domainConfig[domain];

  const handleAction = useCallback(
    async (action: InlineAIAction) => {
      setActiveAction(action);
      clearError();

      switch (action) {
        case 'explain':
          await explain(context);
          break;
        case 'suggest':
          await getSuggestions(context);
          break;
        case 'analyze':
          await analyze(context);
          break;
      }
    },
    [context, explain, getSuggestions, analyze, clearError]
  );

  const handleSuggestionAccept = useCallback(
    (suggestion: InlineAISuggestion) => {
      onSuggestionAccept?.(suggestion);
    },
    [onSuggestionAccept]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setActiveAction(null);
    clearResponse();
    clearError();
  }, [clearResponse, clearError]);

  const handleRetry = useCallback(() => {
    if (activeAction) {
      handleAction(activeAction);
    }
  }, [activeAction, handleAction]);

  // Default trigger button
  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'h-7 gap-1.5 text-xs',
        `text-${domConfig.primaryColor}-600 hover:text-${domConfig.primaryColor}-700`,
        `hover:bg-${domConfig.primaryColor}-50`
      )}
    >
      <Sparkles className="w-3.5 h-3.5" />
      AI Assist
    </Button>
  );

  // Render content based on state
  const renderContent = () => {
    if (error) {
      return (
        <div className="p-3">
          <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-red-700">Error</p>
              <p className="text-xs text-red-600 mt-0.5">{error.message}</p>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleRetry}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="p-4 flex flex-col items-center justify-center">
          <Loader2 className={cn('w-6 h-6 animate-spin', `text-${domConfig.primaryColor}-500`)} />
          <p className="text-xs text-zinc-500 mt-2">
            {activeAction === 'explain' && 'Generating explanation...'}
            {activeAction === 'suggest' && 'Finding suggestions...'}
            {activeAction === 'analyze' && 'Running analysis...'}
          </p>
        </div>
      );
    }

    if (explanation) {
      return (
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-700 flex items-center gap-1">
              <Sparkles className={cn('w-3.5 h-3.5', `text-${domConfig.primaryColor}-500`)} />
              AI Explanation
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => clearResponse()}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">{explanation}</p>
        </div>
      );
    }

    if (suggestions.length > 0) {
      return (
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-700 flex items-center gap-1">
              <Lightbulb className={cn('w-3.5 h-3.5', `text-${domConfig.primaryColor}-500`)} />
              AI Suggestions
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => clearResponse()}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id || index}
                className="p-2 rounded-lg border border-zinc-100 hover:border-zinc-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-800">{suggestion.title}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{suggestion.description}</p>
                    {suggestion.impact && (
                      <span className={cn(
                        'inline-block text-[10px] mt-1 px-1.5 py-0.5 rounded',
                        suggestion.impact === 'high' ? 'bg-green-100 text-green-700' :
                        suggestion.impact === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-zinc-100 text-zinc-600'
                      )}>
                        {suggestion.impact} impact
                      </span>
                    )}
                  </div>
                  {onSuggestionAccept && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleSuggestionAccept(suggestion)}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default: Show action buttons
    return (
      <div className="p-3">
        <div className="flex items-center gap-1 mb-2">
          <domConfig.icon className={cn('w-3.5 h-3.5', `text-${domConfig.primaryColor}-500`)} />
          <span className="text-xs font-medium text-zinc-700">
            {context.entityName || context.entityType}
          </span>
        </div>
        <div className="space-y-1">
          {actions.map((action) => {
            const config = actionConfig[action];
            const ActionIcon = config.icon;
            return (
              <button
                key={action}
                className={cn(
                  'w-full flex items-center gap-2 p-2 rounded-lg text-left',
                  'hover:bg-zinc-50 transition-colors',
                  'group'
                )}
                onClick={() => handleAction(action)}
              >
                <ActionIcon className={cn(
                  'w-4 h-4 flex-shrink-0',
                  `text-${domConfig.primaryColor}-500`
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-700">{config.label}</p>
                  <p className="text-[10px] text-zinc-500">{config.description}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-400 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Tooltip variant
  if (variant === 'tooltip') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {trigger || defaultTrigger}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="p-0 w-64"
          data-testid={testId || 'inline-ai-tooltip'}
        >
          {renderContent()}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Inline-row variant
  if (variant === 'inline-row') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg border transition-all',
          `border-${domConfig.primaryColor}-100 bg-${domConfig.primaryColor}-50/50`,
          className
        )}
        data-testid={testId || 'inline-ai-row'}
      >
        <Sparkles className={cn('w-4 h-4 flex-shrink-0', `text-${domConfig.primaryColor}-500`)} />

        {isLoading ? (
          <div className="flex items-center gap-2 flex-1">
            <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
            <span className="text-xs text-zinc-500">Processing...</span>
          </div>
        ) : explanation ? (
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-600 line-clamp-2">{explanation}</p>
          </div>
        ) : (
          <div className="flex items-center gap-1 flex-1">
            {actions.map((action) => {
              const config = actionConfig[action];
              const ActionIcon = config.icon;
              return (
                <Button
                  key={action}
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => handleAction(action)}
                >
                  <ActionIcon className="w-3 h-3 mr-1" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        )}

        {(explanation || error) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 flex-shrink-0"
            onClick={() => {
              clearResponse();
              clearError();
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  // Default: Popover variant
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-72 p-0', className)}
        align="start"
        data-testid={testId || 'inline-ai-popover'}
      >
        <div className="flex items-center justify-between p-2 border-b border-zinc-100">
          <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
            <Sparkles className={cn('w-3.5 h-3.5', `text-${domConfig.primaryColor}-500`)} />
            AI Assistant
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
        {renderContent()}
      </PopoverContent>
    </Popover>
  );
});
