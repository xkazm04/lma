/**
 * Collaboration Mock Data
 *
 * Mock data for team presence, activity streams, counterparty actions,
 * and mentions in the stakeholder command center.
 */

import { FileText, Handshake, ClipboardCheck, Leaf } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';
export type ActivityType = 'document' | 'deal' | 'compliance' | 'esg' | 'trading';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
  initials: string;
  status: PresenceStatus;
  lastActive: string;
  currentFocus?: {
    type: ActivityType;
    resourceId: string;
    resourceName: string;
  };
}

export interface LoanActivityEvent {
  id: string;
  loanId: string;
  loanName: string;
  type: 'view' | 'edit' | 'comment' | 'upload' | 'proposal' | 'mention';
  description: string;
  userId: string;
  userName: string;
  userInitials: string;
  timestamp: string;
  relativeTime: string;
  metadata?: {
    documentName?: string;
    fieldName?: string;
    commentText?: string;
    mentionedUsers?: string[];
  };
}

export interface CounterpartyAction {
  id: string;
  dealId: string;
  dealName: string;
  counterpartyId: string;
  counterpartyName: string;
  counterpartyOrg: string;
  actionType: 'viewing' | 'proposing' | 'commented' | 'requested' | 'approved' | 'rejected';
  description: string;
  timestamp: string;
  relativeTime: string;
  isActive: boolean;
  resourceType: 'term' | 'document' | 'condition' | 'general';
  resourceName?: string;
}

export interface Mention {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserInitials: string;
  message: string;
  context: {
    type: ActivityType;
    resourceId: string;
    resourceName: string;
  };
  timestamp: string;
  relativeTime: string;
  read: boolean;
}

// =============================================================================
// Mock Data
// =============================================================================

export const teamMembers: TeamMember[] = [
  {
    id: 'user-1',
    name: 'Sarah Johnson',
    role: 'Senior Credit Analyst',
    email: 'sarah.johnson@bank.com',
    initials: 'SJ',
    status: 'online',
    lastActive: 'Now',
    currentFocus: {
      type: 'document',
      resourceId: 'doc-apollo',
      resourceName: 'Facility Agreement - Project Apollo',
    },
  },
  {
    id: 'user-2',
    name: 'Mike Chen',
    role: 'Deal Manager',
    email: 'mike.chen@bank.com',
    initials: 'MC',
    status: 'online',
    lastActive: 'Now',
    currentFocus: {
      type: 'deal',
      resourceId: 'deal-neptune',
      resourceName: 'Neptune Refinancing',
    },
  },
  {
    id: 'user-3',
    name: 'Emily Rodriguez',
    role: 'Compliance Officer',
    email: 'emily.rodriguez@bank.com',
    initials: 'ER',
    status: 'busy',
    lastActive: '5 min ago',
    currentFocus: {
      type: 'compliance',
      resourceId: 'comp-abc',
      resourceName: 'ABC Holdings - Q4 Review',
    },
  },
  {
    id: 'user-4',
    name: 'David Park',
    role: 'ESG Analyst',
    email: 'david.park@bank.com',
    initials: 'DP',
    status: 'away',
    lastActive: '15 min ago',
  },
  {
    id: 'user-5',
    name: 'Lisa Thompson',
    role: 'Portfolio Manager',
    email: 'lisa.thompson@bank.com',
    initials: 'LT',
    status: 'online',
    lastActive: 'Now',
    currentFocus: {
      type: 'trading',
      resourceId: 'trade-xyz',
      resourceName: 'XYZ Corp Trade DD',
    },
  },
  {
    id: 'user-6',
    name: 'James Wilson',
    role: 'Associate',
    email: 'james.wilson@bank.com',
    initials: 'JW',
    status: 'offline',
    lastActive: '2 hours ago',
  },
];

export const loanActivityStream: LoanActivityEvent[] = [
  {
    id: 'evt-1',
    loanId: 'loan-apollo',
    loanName: 'Project Apollo',
    type: 'upload',
    description: 'Uploaded Amendment No. 4 for review',
    userId: 'user-1',
    userName: 'Sarah Johnson',
    userInitials: 'SJ',
    timestamp: '2024-12-10T14:30:00Z',
    relativeTime: '2 min ago',
    metadata: {
      documentName: 'Amendment No. 4 - Project Apollo.pdf',
    },
  },
  {
    id: 'evt-2',
    loanId: 'loan-neptune',
    loanName: 'Project Neptune',
    type: 'proposal',
    description: 'Submitted margin ratchet proposal',
    userId: 'user-2',
    userName: 'Mike Chen',
    userInitials: 'MC',
    timestamp: '2024-12-10T14:25:00Z',
    relativeTime: '7 min ago',
    metadata: {
      fieldName: 'Margin Ratchet',
    },
  },
  {
    id: 'evt-3',
    loanId: 'loan-abc',
    loanName: 'ABC Holdings - Term Loan A',
    type: 'comment',
    description: 'Added comment on covenant compliance',
    userId: 'user-3',
    userName: 'Emily Rodriguez',
    userInitials: 'ER',
    timestamp: '2024-12-10T14:15:00Z',
    relativeTime: '17 min ago',
    metadata: {
      commentText: 'Need to verify Q3 leverage ratio calculation',
    },
  },
  {
    id: 'evt-4',
    loanId: 'loan-xyz',
    loanName: 'XYZ Corp - Revolving Facility',
    type: 'view',
    description: 'Reviewed trade due diligence checklist',
    userId: 'user-5',
    userName: 'Lisa Thompson',
    userInitials: 'LT',
    timestamp: '2024-12-10T14:10:00Z',
    relativeTime: '22 min ago',
  },
  {
    id: 'evt-5',
    loanId: 'loan-ecotech',
    loanName: 'EcoTech Green Bond',
    type: 'edit',
    description: 'Updated ESG performance targets',
    userId: 'user-4',
    userName: 'David Park',
    userInitials: 'DP',
    timestamp: '2024-12-10T13:45:00Z',
    relativeTime: '47 min ago',
    metadata: {
      fieldName: 'Carbon Reduction Target',
    },
  },
  {
    id: 'evt-6',
    loanId: 'loan-apollo',
    loanName: 'Project Apollo',
    type: 'mention',
    description: 'Mentioned you in document review',
    userId: 'user-2',
    userName: 'Mike Chen',
    userInitials: 'MC',
    timestamp: '2024-12-10T13:30:00Z',
    relativeTime: '1 hour ago',
    metadata: {
      mentionedUsers: ['Current User'],
      commentText: '@you Please review the interest rate cap terms',
    },
  },
];

export const counterpartyActions: CounterpartyAction[] = [
  {
    id: 'cpa-1',
    dealId: 'deal-neptune',
    dealName: 'Neptune Refinancing',
    counterpartyId: 'cp-neptune-llc',
    counterpartyName: 'Robert Martinez',
    counterpartyOrg: 'Neptune LLC',
    actionType: 'viewing',
    description: 'Currently viewing pricing terms',
    timestamp: '2024-12-10T14:32:00Z',
    relativeTime: 'Now',
    isActive: true,
    resourceType: 'term',
    resourceName: 'Pricing Grid',
  },
  {
    id: 'cpa-2',
    dealId: 'deal-apollo',
    dealName: 'Project Apollo Amendment',
    counterpartyId: 'cp-apollo-ind',
    counterpartyName: 'Jennifer Lee',
    counterpartyOrg: 'Apollo Industries',
    actionType: 'proposing',
    description: 'Drafting counter-proposal on financial covenants',
    timestamp: '2024-12-10T14:28:00Z',
    relativeTime: '4 min ago',
    isActive: true,
    resourceType: 'condition',
    resourceName: 'Leverage Ratio Covenant',
  },
  {
    id: 'cpa-3',
    dealId: 'deal-delta',
    dealName: 'Delta Working Capital Increase',
    counterpartyId: 'cp-delta-corp',
    counterpartyName: 'Tom Anderson',
    counterpartyOrg: 'Delta Corp',
    actionType: 'commented',
    description: 'Left feedback on security package',
    timestamp: '2024-12-10T14:15:00Z',
    relativeTime: '17 min ago',
    isActive: false,
    resourceType: 'document',
    resourceName: 'Security Agreement Draft',
  },
  {
    id: 'cpa-4',
    dealId: 'deal-neptune',
    dealName: 'Neptune Refinancing',
    counterpartyId: 'cp-neptune-llc',
    counterpartyName: 'Robert Martinez',
    counterpartyOrg: 'Neptune LLC',
    actionType: 'approved',
    description: 'Accepted maturity date extension',
    timestamp: '2024-12-10T13:45:00Z',
    relativeTime: '47 min ago',
    isActive: false,
    resourceType: 'term',
    resourceName: 'Maturity Date',
  },
  {
    id: 'cpa-5',
    dealId: 'deal-apollo',
    dealName: 'Project Apollo Amendment',
    counterpartyId: 'cp-apollo-ind',
    counterpartyName: 'Jennifer Lee',
    counterpartyOrg: 'Apollo Industries',
    actionType: 'requested',
    description: 'Requested additional time for document review',
    timestamp: '2024-12-10T12:30:00Z',
    relativeTime: '2 hours ago',
    isActive: false,
    resourceType: 'general',
  },
];

export const recentMentions: Mention[] = [
  {
    id: 'mention-1',
    fromUserId: 'user-2',
    fromUserName: 'Mike Chen',
    fromUserInitials: 'MC',
    message: '@you Please review the interest rate cap terms in the Apollo amendment',
    context: {
      type: 'document',
      resourceId: 'doc-apollo-amendment',
      resourceName: 'Project Apollo - Amendment No. 4',
    },
    timestamp: '2024-12-10T13:30:00Z',
    relativeTime: '1 hour ago',
    read: false,
  },
  {
    id: 'mention-2',
    fromUserId: 'user-3',
    fromUserName: 'Emily Rodriguez',
    fromUserInitials: 'ER',
    message: '@you Need your sign-off on the ABC Holdings compliance certificate',
    context: {
      type: 'compliance',
      resourceId: 'comp-abc-q4',
      resourceName: 'ABC Holdings - Q4 Compliance',
    },
    timestamp: '2024-12-10T11:15:00Z',
    relativeTime: '3 hours ago',
    read: false,
  },
  {
    id: 'mention-3',
    fromUserId: 'user-5',
    fromUserName: 'Lisa Thompson',
    fromUserInitials: 'LT',
    message: '@you Trade documentation for XYZ is ready for your review',
    context: {
      type: 'trading',
      resourceId: 'trade-xyz-dd',
      resourceName: 'XYZ Corp - Trade DD',
    },
    timestamp: '2024-12-10T09:00:00Z',
    relativeTime: '5 hours ago',
    read: true,
  },
];

// =============================================================================
// Config Maps
// =============================================================================

/**
 * Activity type icons and colors mapping
 */
export const activityTypeConfig: Record<ActivityType, { icon: typeof FileText; color: string; bgColor: string }> = {
  document: { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  deal: { icon: Handshake, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  compliance: { icon: ClipboardCheck, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  esg: { icon: Leaf, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  trading: { icon: FileText, color: 'text-green-600', bgColor: 'bg-green-100' },
};

/**
 * Presence status colors
 */
export const presenceStatusConfig: Record<PresenceStatus, { color: string; bgColor: string; label: string }> = {
  online: { color: 'bg-green-500', bgColor: 'bg-green-100', label: 'Online' },
  away: { color: 'bg-amber-500', bgColor: 'bg-amber-100', label: 'Away' },
  busy: { color: 'bg-red-500', bgColor: 'bg-red-100', label: 'Busy' },
  offline: { color: 'bg-zinc-400', bgColor: 'bg-zinc-100', label: 'Offline' },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get active team members count
 */
export function getActiveTeamMembersCount(): number {
  return teamMembers.filter((m) => m.status === 'online' || m.status === 'busy').length;
}

/**
 * Get unread mentions count
 */
export function getUnreadMentionsCount(): number {
  return recentMentions.filter((m) => !m.read).length;
}

/**
 * Get active counterparty actions count
 */
export function getActiveCounterpartyActionsCount(): number {
  return counterpartyActions.filter((a) => a.isActive).length;
}
