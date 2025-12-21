'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { use } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileQuestion,
  MessageSquare,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronRight,
  Send,
  Sparkles,
  History,
  User,
  CheckCircle2,
  XCircle,
  Flag,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { formatDate as formatDateGlobal } from '@/lib/utils/formatters';

// Types for DD checklist items
interface DDChecklistItem {
  id: string;
  item_name: string;
  status: string;
  verified_at?: string;
  flag_reason?: string;
  flag_severity?: string;
}

interface DDCategory {
  name: string;
  key: string;
  items: DDChecklistItem[];
}

// Mock trade data
const tradeData = {
  id: '1',
  trade_reference: 'TR-2024-001',
  status: 'in_due_diligence',
  facility: {
    id: 'f1',
    facility_name: 'ABC Holdings TL-A',
    borrower_name: 'ABC Holdings LLC',
    facility_type: 'term_loan',
    total_commitment: 150000000,
  },
  seller: {
    organization_id: 's1',
    organization_name: 'Bank of America',
    contact_name: 'John Smith',
    contact_email: 'jsmith@bofa.com',
  },
  buyer: {
    organization_id: 'b1',
    organization_name: 'Credit Suisse AG',
    contact_name: 'Jane Doe',
    contact_email: 'jdoe@cs.com',
  },
  is_buyer: true,
  trade_amount: 15000000,
  trade_price: 99.5,
  settlement_amount: 14925000,
  trade_date: '2024-12-01',
  settlement_date: '2024-12-15',
  consent_required: true,
  consent_received: false,
  created_at: '2024-12-01T10:00:00Z',
  updated_at: '2024-12-07T14:30:00Z',
};

const ddChecklist: {
  id: string;
  status: string;
  total_items: number;
  completed_items: number;
  flagged_items: number;
  categories: DDCategory[];
} = {
  id: 'dd1',
  status: 'in_progress',
  total_items: 23,
  completed_items: 17,
  flagged_items: 2,
  categories: [
    {
      name: 'Facility Status',
      key: 'facility_status',
      items: [
        { id: '1', item_name: 'Credit Agreement', status: 'verified', verified_at: '2024-12-05T10:00:00Z' },
        { id: '2', item_name: 'Outstanding Principal', status: 'verified', verified_at: '2024-12-05T11:00:00Z' },
        { id: '3', item_name: 'Accrued Interest', status: 'pending' },
      ],
    },
    {
      name: 'Borrower Creditworthiness',
      key: 'borrower_creditworthiness',
      items: [
        { id: '4', item_name: 'Credit Rating', status: 'verified', verified_at: '2024-12-04T09:00:00Z' },
        { id: '5', item_name: 'Financial Statements', status: 'flagged', flag_reason: 'Q3 statements not yet received', flag_severity: 'warning' },
      ],
    },
    {
      name: 'Covenant Compliance',
      key: 'covenant_compliance',
      items: [
        { id: '6', item_name: 'Covenant Test Results', status: 'verified', verified_at: '2024-12-06T14:00:00Z' },
        { id: '7', item_name: 'Waiver Status', status: 'verified', verified_at: '2024-12-06T14:30:00Z' },
        { id: '8', item_name: 'Default Status', status: 'flagged', flag_reason: 'Potential technical default', flag_severity: 'blocker' },
      ],
    },
    {
      name: 'Transferability',
      key: 'transferability',
      items: [
        { id: '9', item_name: 'Transfer Restrictions', status: 'verified', verified_at: '2024-12-03T16:00:00Z' },
        { id: '10', item_name: 'Consent Requirements', status: 'in_review' },
        { id: '11', item_name: 'Minimum Hold Period', status: 'verified', verified_at: '2024-12-03T16:30:00Z' },
      ],
    },
  ],
};

const questions = [
  {
    id: 'q1',
    asked_by_party: 'buyer',
    asker_name: 'Jane Doe',
    question_text: 'Can you confirm the current outstanding debt levels and any recent drawdowns on the facility?',
    status: 'answered',
    response_text: 'Outstanding principal is $120M as of Nov 30. Last drawdown of $5M was on Oct 15.',
    responder_name: 'John Smith',
    created_at: '2024-12-05T09:00:00Z',
    responded_at: '2024-12-05T14:00:00Z',
  },
  {
    id: 'q2',
    asked_by_party: 'buyer',
    asker_name: 'Jane Doe',
    question_text: 'What is the status of the Q3 financial statements? When can we expect delivery?',
    status: 'open',
    response_text: null,
    responder_name: null,
    created_at: '2024-12-07T10:00:00Z',
    responded_at: null,
  },
];

const events = [
  { id: 'e1', event_type: 'trade_created', description: 'Trade created', occurred_at: '2024-12-01T10:00:00Z', actor_name: 'System' },
  { id: 'e2', event_type: 'terms_agreed', description: 'Terms agreed', occurred_at: '2024-12-01T15:00:00Z', actor_name: 'John Smith' },
  { id: 'e3', event_type: 'dd_started', description: 'DD checklist created', occurred_at: '2024-12-01T15:30:00Z', actor_name: 'System' },
  { id: 'e4', event_type: 'dd_item_verified', description: 'Verified: Credit Agreement', occurred_at: '2024-12-05T10:00:00Z', actor_name: 'Jane Doe' },
  { id: 'e5', event_type: 'question_asked', description: 'Question: Confirm current debt levels...', occurred_at: '2024-12-05T09:00:00Z', actor_name: 'Jane Doe' },
  { id: 'e6', event_type: 'question_answered', description: 'Question answered', occurred_at: '2024-12-05T14:00:00Z', actor_name: 'John Smith' },
  { id: 'e7', event_type: 'dd_item_flagged', description: 'Flagged: Default Status', occurred_at: '2024-12-06T16:00:00Z', actor_name: 'Jane Doe' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return formatDateGlobal(dateStr, 'MMM d, h:mm a');
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return <Badge variant="outline">Draft</Badge>;
    case 'agreed':
      return <Badge variant="default" className="bg-blue-100 text-blue-700">Agreed</Badge>;
    case 'in_due_diligence':
      return <Badge variant="default" className="bg-purple-100 text-purple-700">In Due Diligence</Badge>;
    case 'documentation':
      return <Badge variant="secondary">Documentation</Badge>;
    case 'pending_consent':
      return <Badge variant="warning">Pending Consent</Badge>;
    case 'pending_settlement':
      return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Pending Settlement</Badge>;
    case 'settled':
      return <Badge variant="default" className="bg-green-100 text-green-700">Settled</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getItemStatusIcon(status: string) {
  switch (status) {
    case 'verified':
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case 'flagged':
      return <Flag className="w-4 h-4 text-red-600" />;
    case 'in_review':
      return <Clock className="w-4 h-4 text-blue-600" />;
    case 'waived':
      return <XCircle className="w-4 h-4 text-zinc-400" />;
    default:
      return <div className="w-4 h-4 rounded-full border-2 border-zinc-300" />;
  }
}

function getEventIcon(type: string) {
  switch (type) {
    case 'trade_created':
    case 'terms_agreed':
      return <ArrowLeftRight className="w-4 h-4" />;
    case 'dd_started':
    case 'dd_completed':
      return <FileText className="w-4 h-4" />;
    case 'dd_item_verified':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'dd_item_flagged':
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case 'question_asked':
    case 'question_answered':
      return <MessageSquare className="w-4 h-4 text-blue-600" />;
    case 'consent_received':
    case 'trade_settled':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

interface VerifyResult {
  item_id: string;
  item_status: string;
  timeline_event_id: string;
  actor_name: string;
  verified_at: string;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  description: string;
  occurred_at: string;
  actor_name: string;
}

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('checklist');
  const [newQuestion, setNewQuestion] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['facility_status', 'borrower_creditworthiness', 'covenant_compliance', 'transferability']);
  const [verifyingItems, setVerifyingItems] = useState<Set<string>>(new Set());
  const [localItemStatus, setLocalItemStatus] = useState<Record<string, { status: string; verified_at?: string }>>({});
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(events);
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [submittingResponse, setSubmittingResponse] = useState<string | null>(null);
  const [localAnswers, setLocalAnswers] = useState<Record<string, { response_text: string; responder_name: string; responded_at: string }>>({});
  const [responseError, setResponseError] = useState<string | null>(null);

  // Determine user's party based on trade data
  const userParty: 'buyer' | 'seller' = tradeData.is_buyer ? 'buyer' : 'seller';

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

  const canRespond = (question: typeof questions[0]): boolean => {
    if (question.status !== 'open') return false;
    // Check if already answered locally
    if (localAnswers[question.id]) return false;
    // User can respond if they are the opposite party from who asked
    const askerParty = question.asked_by_party.toLowerCase();
    return askerParty !== userParty;
  };

  const handleSubmitResponse = useCallback(async (questionId: string) => {
    const responseText = responseTexts[questionId]?.trim();
    if (!responseText) return;

    setSubmittingResponse(questionId);
    setResponseError(null);

    try {
      const response = await fetch(`/api/trading/trades/${id}/questions/${questionId}`, {
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

      // Add timeline event
      const newEvent: TimelineEvent = {
        id: `e-${Date.now()}`,
        event_type: 'question_answered',
        description: 'Question answered',
        occurred_at: answeredAt,
        actor_name: responderName,
      };
      setTimelineEvents(prev => [newEvent, ...prev]);
    } catch (err) {
      console.error('Error submitting response:', err);
      setResponseError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setSubmittingResponse(null);
    }
  }, [id, responseTexts]);

  const getQuestionState = (question: typeof questions[0]) => {
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

  // Compute item status considering local updates
  const getItemStatus = (item: DDChecklistItem) => {
    if (localItemStatus[item.id]) {
      return { ...item, ...localItemStatus[item.id] };
    }
    return item;
  };

  // Calculate dd progress including local updates
  const completedCount = ddChecklist.categories.reduce((count, category) => {
    return count + category.items.filter(item => {
      const status = getItemStatus(item).status;
      return status === 'verified' || status === 'waived';
    }).length;
  }, 0);
  const ddProgress = Math.round((completedCount / ddChecklist.total_items) * 100);

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Handler for verifying DD items - calls the unified atomic endpoint
  const handleVerifyItem = useCallback(async (itemId: string, itemName: string) => {
    setVerifyingItems(prev => new Set(prev).add(itemId));
    setVerifyError(null);

    try {
      const response = await fetch(`/api/trading/trades/${id}/checklist/items/${itemId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to verify item');
      }

      // Update local item status
      setLocalItemStatus(prev => ({
        ...prev,
        [itemId]: {
          status: 'verified',
          verified_at: data.data.verified_at || new Date().toISOString(),
        },
      }));

      // Add new timeline event (verification creates timeline event atomically)
      const newEvent: TimelineEvent = {
        id: data.data.timeline_event_id || `e-${Date.now()}`,
        event_type: 'dd_item_verified',
        description: `Verified: ${itemName}`,
        occurred_at: data.data.verified_at || new Date().toISOString(),
        actor_name: data.data.actor_name || 'You',
      };
      setTimelineEvents(prev => [newEvent, ...prev]);
    } catch (err) {
      console.error('Error verifying item:', err);
      setVerifyError(err instanceof Error ? err.message : 'Failed to verify item');
    } finally {
      setVerifyingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [id]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/trading/trades">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900">{tradeData.trade_reference}</h1>
              {getStatusBadge(tradeData.status)}
            </div>
            <p className="text-zinc-500 mt-1">
              {tradeData.is_buyer ? 'Buying from' : 'Selling to'}{' '}
              <span className="font-medium">{tradeData.is_buyer ? tradeData.seller.organization_name : tradeData.buyer.organization_name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          {tradeData.status === 'in_due_diligence' && ddProgress === 100 && (
            <Button>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Due Diligence
            </Button>
          )}
        </div>
      </div>

      {/* Trade Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-zinc-100">
                <Building2 className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Facility</p>
                <p className="font-semibold text-zinc-900">{tradeData.facility.facility_name}</p>
                <p className="text-xs text-zinc-500">{tradeData.facility.borrower_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-zinc-100">
                <DollarSign className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Trade Amount</p>
                <p className="font-semibold text-zinc-900">{formatCurrency(tradeData.trade_amount)}</p>
                <p className="text-xs text-zinc-500">@ {tradeData.trade_price}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-zinc-100">
                <Calendar className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Settlement Date</p>
                <p className="font-semibold text-zinc-900">{formatDate(tradeData.settlement_date)}</p>
                <p className="text-xs text-zinc-500">Trade: {formatDate(tradeData.trade_date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-zinc-500">DD Progress</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-zinc-900">{ddProgress}%</p>
                  <span className="text-xs text-zinc-500">({ddChecklist.completed_items}/{ddChecklist.total_items})</span>
                </div>
                <Progress value={ddProgress} className="h-1.5 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {ddChecklist.flagged_items > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-800">
                  {ddChecklist.flagged_items} item(s) flagged for review
                </p>
                <p className="text-sm text-red-700">
                  Review flagged items before completing due diligence
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-100">
                View Flagged Items
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - DD Checklist & Q&A */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="checklist">
                <FileText className="w-4 h-4 mr-2" />
                DD Checklist
              </TabsTrigger>
              <TabsTrigger value="questions">
                <FileQuestion className="w-4 h-4 mr-2" />
                Q&A ({questions.filter(q => q.status === 'open').length} open)
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <History className="w-4 h-4 mr-2" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Due Diligence Checklist</CardTitle>
                  <CardDescription>
                    {completedCount} of {ddChecklist.total_items} items completed
                  </CardDescription>
                  {verifyError && (
                    <p className="text-sm text-red-600 mt-2" data-testid="dd-verify-error">{verifyError}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ddChecklist.categories.map((category) => {
                      // Count verified items including local updates
                      const verifiedCount = category.items.filter(i => getItemStatus(i).status === 'verified').length;
                      const hasFlagged = category.items.some(i => getItemStatus(i).status === 'flagged');

                      return (
                        <div key={category.key} className="border border-zinc-200 rounded-lg">
                          <button
                            onClick={() => toggleCategory(category.key)}
                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
                            data-testid={`dd-category-toggle-${category.key}`}
                          >
                            <div className="flex items-center gap-3">
                              {expandedCategories.includes(category.key) ? (
                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-zinc-400" />
                              )}
                              <span className="font-medium text-zinc-900">{category.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {verifiedCount}/{category.items.length}
                              </Badge>
                            </div>
                            {hasFlagged && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </button>

                          {expandedCategories.includes(category.key) && (
                            <div className="border-t border-zinc-200 divide-y divide-zinc-100">
                              {category.items.map((originalItem) => {
                                const item = getItemStatus(originalItem);
                                const isVerifying = verifyingItems.has(item.id);

                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-4 pl-12"
                                    data-testid={`dd-item-${item.id}`}
                                  >
                                    {isVerifying ? (
                                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                    ) : (
                                      getItemStatusIcon(item.status)
                                    )}
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-zinc-900">{item.item_name}</p>
                                      {item.status === 'verified' && item.verified_at && (
                                        <p className="text-xs text-zinc-500">
                                          Verified {formatDateTime(item.verified_at)}
                                        </p>
                                      )}
                                      {item.status === 'flagged' && originalItem.flag_reason && (
                                        <p className="text-xs text-red-600 mt-1">{originalItem.flag_reason}</p>
                                      )}
                                    </div>
                                    {item.status === 'pending' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleVerifyItem(item.id, item.item_name)}
                                        disabled={isVerifying}
                                        data-testid={`dd-verify-btn-${item.id}`}
                                      >
                                        {isVerifying ? (
                                          <>
                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            Verifying
                                          </>
                                        ) : (
                                          'Verify'
                                        )}
                                      </Button>
                                    )}
                                    {item.status === 'flagged' && (
                                      <Badge variant={originalItem.flag_severity === 'blocker' ? 'destructive' : 'warning'}>
                                        {originalItem.flag_severity}
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Questions & Answers</CardTitle>
                  <CardDescription>
                    {questions.filter(q => getQuestionState(q).status === 'open').length} open, {questions.filter(q => getQuestionState(q).status === 'answered').length} answered
                  </CardDescription>
                  {responseError && (
                    <p className="text-sm text-red-600 mt-2" data-testid="questions-error">{responseError}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {questions.map((originalQuestion) => {
                      const question = getQuestionState(originalQuestion);
                      const showResponseForm = canRespond(originalQuestion) && expandedResponses.has(question.id);
                      const isSubmitting = submittingResponse === question.id;

                      return (
                        <div
                          key={question.id}
                          className="border border-zinc-200 rounded-lg p-4"
                          data-testid={`question-card-${question.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-blue-100">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-zinc-900">{question.asker_name}</span>
                                <Badge variant="outline" className="text-xs">{question.asked_by_party}</Badge>
                                <span className="text-xs text-zinc-400">{formatDateTime(question.created_at)}</span>
                              </div>
                              <p className="text-sm text-zinc-700">{question.question_text}</p>

                              {question.status === 'answered' && question.response_text && (
                                <div className="mt-3 pl-4 border-l-2 border-green-200 bg-green-50/50 p-3 rounded-r-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-green-800">{question.responder_name}</span>
                                    <span className="text-xs text-green-600">{formatDateTime(question.responded_at!)}</span>
                                  </div>
                                  <p className="text-sm text-green-900">{question.response_text}</p>
                                </div>
                              )}

                              {question.status === 'open' && (
                                <div className="mt-3 space-y-2">
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
                                        <div className="mt-2 pl-4 border-l-2 border-blue-200 animate-in fade-in slide-in-from-top-2 duration-200">
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
                                    <Badge variant="warning">Awaiting Response</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="border-t border-zinc-200 pt-4">
                      <Textarea
                        placeholder="Ask a question about this trade..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        rows={3}
                        data-testid="new-question-textarea"
                      />
                      <div className="flex justify-end mt-2">
                        <Button disabled={!newQuestion.trim()} data-testid="ask-question-btn">
                          <Send className="w-4 h-4 mr-2" />
                          Ask Question
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trade Timeline</CardTitle>
                  <CardDescription>Complete history of trade events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-200" />
                    <div className="space-y-4">
                      {timelineEvents.slice().sort((a, b) =>
                        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
                      ).map((event) => (
                        <div key={event.id} className="relative flex items-start gap-4 pl-10" data-testid={`timeline-event-${event.id}`}>
                          <div className="absolute left-2 p-1.5 bg-white rounded-full border border-zinc-200">
                            {getEventIcon(event.event_type)}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium text-zinc-900">{event.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-500">{event.actor_name}</span>
                              <span className="text-xs text-zinc-400">{formatDateTime(event.occurred_at)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - AI Assistant & Details */}
        <div className="space-y-6">
          {/* AI Query */}
          <Card className="border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Assistant
              </CardTitle>
              <CardDescription className="text-purple-700">
                Ask questions about this trade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., What are the key risks with this trade?"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                rows={3}
                className="border-purple-200 focus:border-purple-400"
              />
              <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700" disabled={!aiQuery.trim()}>
                <Sparkles className="w-4 h-4 mr-2" />
                Ask AI
              </Button>
            </CardContent>
          </Card>

          {/* Counterparty Details */}
          <Card>
            <CardHeader>
              <CardTitle>Counterparty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-zinc-500">{tradeData.is_buyer ? 'Seller' : 'Buyer'}</p>
                  <p className="font-medium text-zinc-900">
                    {tradeData.is_buyer ? tradeData.seller.organization_name : tradeData.buyer.organization_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Contact</p>
                  <p className="font-medium text-zinc-900">
                    {tradeData.is_buyer ? tradeData.seller.contact_name : tradeData.buyer.contact_name}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {tradeData.is_buyer ? tradeData.seller.contact_email : tradeData.buyer.contact_email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settlement Details */}
          <Card>
            <CardHeader>
              <CardTitle>Settlement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Trade Amount</span>
                  <span className="font-medium text-zinc-900">{formatCurrency(tradeData.trade_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Price</span>
                  <span className="font-medium text-zinc-900">{tradeData.trade_price}%</span>
                </div>
                <div className="border-t border-zinc-200 pt-3 flex justify-between">
                  <span className="text-sm font-medium text-zinc-700">Settlement Amount</span>
                  <span className="font-semibold text-zinc-900">{formatCurrency(tradeData.settlement_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Settlement Date</span>
                  <span className="font-medium text-zinc-900">{formatDate(tradeData.settlement_date)}</span>
                </div>
                {tradeData.consent_required && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-zinc-500">Consent Status</span>
                    {tradeData.consent_received ? (
                      <Badge variant="default" className="bg-green-100 text-green-700">Received</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                View Documents
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-2" />
                Calculate Settlement
              </Button>
              {tradeData.consent_required && !tradeData.consent_received && (
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Request Consent
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
