'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface AIInsightsPanelProps {
  insights: string;
  analyzedAt: string;
}

/**
 * Simple markdown-like renderer for AI insights
 * Supports: ## headings, **bold**, - bullet lists
 */
function renderSimpleMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listKey = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="my-2 ml-4 space-y-1 list-disc list-inside">
          {currentList.map((item, i) => (
            <li key={i} className="text-zinc-700">{renderInlineFormatting(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const renderInlineFormatting = (line: string): React.ReactNode => {
    // Handle **bold** text
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-zinc-900 font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      flushList();
      return;
    }

    // ## Heading
    if (trimmedLine.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h-${index}`} className="text-base font-semibold text-zinc-900 mt-4 mb-2">
          {trimmedLine.slice(3)}
        </h3>
      );
      return;
    }

    // - Bullet point
    if (trimmedLine.startsWith('- ')) {
      currentList.push(trimmedLine.slice(2));
      return;
    }

    // Numbered list (1. 2. etc.)
    if (/^\d+\.\s/.test(trimmedLine)) {
      const content = trimmedLine.replace(/^\d+\.\s/, '');
      currentList.push(content);
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${index}`} className="text-zinc-700 my-2">
        {renderInlineFormatting(trimmedLine)}
      </p>
    );
  });

  flushList();
  return elements;
}

export const AIInsightsPanel = memo(function AIInsightsPanel({
  insights,
  analyzedAt,
}: AIInsightsPanelProps) {
  const formattedDate = new Date(analyzedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const renderedContent = useMemo(() => renderSimpleMarkdown(insights), [insights]);

  return (
    <Card
      className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
      data-testid="ai-insights-panel"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            AI Portfolio Intelligence
          </CardTitle>
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
            Analyzed {formattedDate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-w-none">
          {renderedContent}
        </div>
      </CardContent>
    </Card>
  );
});
