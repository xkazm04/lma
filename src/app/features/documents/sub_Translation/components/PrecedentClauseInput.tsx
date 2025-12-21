'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrecedentClauseInputProps {
  precedentClauses: string[];
  onAdd: (clause: string) => void;
  onRemove: (index: number) => void;
  maxClauses?: number;
}

export function PrecedentClauseInput({
  precedentClauses,
  onAdd,
  onRemove,
  maxClauses = 5,
}: PrecedentClauseInputProps) {
  const [newClause, setNewClause] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAdd = useCallback(() => {
    if (newClause.trim() && precedentClauses.length < maxClauses) {
      onAdd(newClause.trim());
      setNewClause('');
    }
  }, [newClause, precedentClauses.length, maxClauses, onAdd]);

  const canAdd = precedentClauses.length < maxClauses;

  return (
    <Card data-testid="precedent-clause-input">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-zinc-500" />
            Precedent Clauses
            {precedentClauses.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {precedentClauses.length}/{maxClauses}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
            data-testid="toggle-precedent-section-btn"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        <p className="text-xs text-zinc-500">
          Add existing clause examples to match their style in the generated output
        </p>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {/* Existing Precedent Clauses */}
          {precedentClauses.length > 0 && (
            <div className="space-y-2">
              {precedentClauses.map((clause, index) => (
                <div
                  key={index}
                  className="relative p-3 bg-indigo-50 rounded-lg border border-indigo-200 group"
                  data-testid={`precedent-clause-${index}`}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemove(index)}
                    data-testid={`remove-precedent-${index}-btn`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <p className="text-xs text-indigo-800 pr-6 line-clamp-3">{clause}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span className="text-[10px] text-indigo-600">
                      Style will be matched
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Precedent */}
          {canAdd && (
            <div className="space-y-2">
              <Textarea
                placeholder="Paste an existing clause from your document corpus to use as a style reference..."
                value={newClause}
                onChange={(e) => setNewClause(e.target.value)}
                rows={3}
                className="text-xs"
                data-testid="new-precedent-textarea"
              />
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAdd}
                  disabled={!newClause.trim()}
                  data-testid="add-precedent-btn"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Precedent
                </Button>
              </div>
            </div>
          )}

          {!canAdd && (
            <p className="text-xs text-zinc-400 text-center py-2">
              Maximum {maxClauses} precedent clauses reached
            </p>
          )}

          {/* Help Text */}
          <div className="p-2 bg-zinc-50 rounded border border-zinc-200">
            <p className="text-[10px] text-zinc-500">
              <strong>Tip:</strong> Adding precedent clauses from your institution&apos;s existing
              agreements helps the AI match your preferred drafting style, defined term
              conventions, and structural patterns.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default PrecedentClauseInput;
