'use client';

import React, { useState, useCallback } from 'react';
import { Send, User, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils/formatters';
import type { Question } from '../lib/types';

interface QuestionsPanelProps {
  questions: Question[];
  tradeId: string;
  userParty: 'buyer' | 'seller';
  onQuestionAnswered?: (questionId: string, response: AnswerResult) => void;
  onQuestionAsked?: (question: AskResult) => void;
}

interface AnswerResult {
  question_id: string;
  response_text: string;
  responder_name: string;
  responded_at: string;
}

interface AskResult {
  question_id: string;
  question_text: string;
  asker_name: string;
  created_at: string;
}

export const QuestionsPanel = React.memo<QuestionsPanelProps>(({
  questions,
  tradeId,
  userParty,
  onQuestionAnswered,
  onQuestionAsked
}) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [submittingResponse, setSubmittingResponse] = useState<string | null>(null);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [localAnswers, setLocalAnswers] = useState<Record<string, { response_text: string; responder_name: string; responded_at: string }>>({});
  const [error, setError] = useState<string | null>(null);

  const toggleResponseForm = (questionId: string) => {
    setExpandedResponses(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const canRespond = (question: Question): boolean => {
    if (question.status !== 'open') return false;
    // User can respond if they are the opposite party from who asked
    const askerParty = question.asked_by_party.toLowerCase();
    return askerParty !== userParty;
  };

  const handleSubmitResponse = useCallback(async (questionId: string) => {
    const responseText = responseTexts[questionId]?.trim();
    if (!responseText) return;

    setSubmittingResponse(questionId);
    setError(null);

    try {
      const response = await fetch(`/api/trading/trades/${tradeId}/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response_text: responseText }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to submit response');
      }

      // Update local state to show the response immediately
      const answeredAt = data.data?.responded_at || new Date().toISOString();
      const responderName = data.data?.responder_name || 'You';

      setLocalAnswers(prev => ({
        ...prev,
        [questionId]: {
          response_text: responseText,
          responder_name: responderName,
          responded_at: answeredAt,
        },
      }));

      // Clear the form
      setResponseTexts(prev => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      setExpandedResponses(prev => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });

      // Notify parent
      if (onQuestionAnswered) {
        onQuestionAnswered(questionId, {
          question_id: questionId,
          response_text: responseText,
          responder_name: responderName,
          responded_at: answeredAt,
        });
      }
    } catch (err) {
      console.error('Error submitting response:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setSubmittingResponse(null);
    }
  }, [tradeId, responseTexts, onQuestionAnswered]);

  const handleAskQuestion = useCallback(async () => {
    const questionText = newQuestion.trim();
    if (!questionText) return;

    setSubmittingQuestion(true);
    setError(null);

    try {
      const response = await fetch(`/api/trading/trades/${tradeId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question_text: questionText }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to ask question');
      }

      setNewQuestion('');

      if (onQuestionAsked) {
        onQuestionAsked({
          question_id: data.data?.question_id || `q-${Date.now()}`,
          question_text: questionText,
          asker_name: data.data?.asker_name || 'You',
          created_at: data.data?.created_at || new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error asking question:', err);
      setError(err instanceof Error ? err.message : 'Failed to ask question');
    } finally {
      setSubmittingQuestion(false);
    }
  }, [tradeId, newQuestion, onQuestionAsked]);

  // Get question state with local updates
  const getQuestionState = (question: Question) => {
    if (localAnswers[question.id]) {
      return {
        ...question,
        status: 'answered' as const,
        response_text: localAnswers[question.id].response_text,
        responder_name: localAnswers[question.id].responder_name,
        responded_at: localAnswers[question.id].responded_at,
      };
    }
    return question;
  };

  return (
    <Card className="animate-in fade-in slide-in-from-left-4 duration-500">
      <CardHeader>
        <CardTitle>Questions & Answers</CardTitle>
        <CardDescription>
          {questions.filter((q) => getQuestionState(q).status === 'open').length} open,{' '}
          {questions.filter((q) => getQuestionState(q).status === 'answered').length} answered
        </CardDescription>
        {error && (
          <p className="text-sm text-red-600 mt-2" data-testid="questions-panel-error">{error}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {questions.map((originalQuestion) => {
            const question = getQuestionState(originalQuestion);
            const showResponseForm = canRespond(originalQuestion) && expandedResponses.has(question.id);
            const isSubmitting = submittingResponse === question.id;

            return (
              <div
                key={question.id}
                className="border border-zinc-200 rounded-lg p-3 hover:border-zinc-300 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
                data-testid={`question-card-${question.id}`}
              >
                <div className="flex items-start gap-2">
                  <div className="p-1.5 rounded-full bg-blue-100">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-zinc-900">{question.asker_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {question.asked_by_party}
                      </Badge>
                      <span className="text-xs text-zinc-400">{formatDate(question.created_at, 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-sm text-zinc-700 mt-1">{question.question_text}</p>

                    {question.status === 'answered' && question.response_text && (
                      <div className="mt-2 pl-3 border-l-2 border-green-200 bg-green-50/50 p-2.5 rounded-r-lg animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-green-800">{question.responder_name}</span>
                          <span className="text-xs text-green-600">
                            {formatDate(question.responded_at!, 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-green-900 mt-0.5">{question.response_text}</p>
                      </div>
                    )}

                    {question.status === 'open' && (
                      <div className="mt-2 space-y-2">
                        {canRespond(originalQuestion) ? (
                          <>
                            <button
                              onClick={() => toggleResponseForm(question.id)}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                              data-testid={`toggle-response-btn-${question.id}`}
                            >
                              {showResponseForm ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              <span>{showResponseForm ? 'Hide response form' : 'Respond to question'}</span>
                            </button>

                            {showResponseForm && (
                              <div className="mt-2 pl-3 border-l-2 border-blue-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                <Textarea
                                  placeholder="Type your response..."
                                  value={responseTexts[question.id] || ''}
                                  onChange={(e) => setResponseTexts(prev => ({ ...prev, [question.id]: e.target.value }))}
                                  rows={3}
                                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                                  disabled={isSubmitting}
                                  data-testid={`response-textarea-${question.id}`}
                                />
                                <div className="flex justify-end mt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSubmitResponse(question.id)}
                                    disabled={!responseTexts[question.id]?.trim() || isSubmitting}
                                    className="hover:shadow-md transition-all duration-200"
                                    data-testid={`submit-response-btn-${question.id}`}
                                  >
                                    {isSubmitting ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting
                                      </>
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Submit Response
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <Badge variant="warning" className="text-xs">Awaiting Response</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="border-t border-zinc-200 pt-4 animate-in fade-in duration-500">
            <Textarea
              placeholder="Ask a question about this trade..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={3}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              disabled={submittingQuestion}
              data-testid="new-question-textarea"
            />
            <div className="flex justify-end mt-2">
              <Button
                disabled={!newQuestion.trim() || submittingQuestion}
                onClick={handleAskQuestion}
                className="hover:shadow-md transition-all duration-200"
                data-testid="ask-question-btn"
              >
                {submittingQuestion ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Asking
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Ask Question
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

QuestionsPanel.displayName = 'QuestionsPanel';
