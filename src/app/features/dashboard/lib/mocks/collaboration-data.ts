/**
 * Collaboration Mock Data
 *
 * Mock data for team presence, activity streams, counterparty actions,
 * and mentions in the stakeholder command center.
 */

import { FileText, Handshake, ClipboardCheck, Leaf } from 'lucide-react';
import {
  borrowers,
  facilities,
  BORROWER_IDS,
  FACILITY_IDS,
} from './borrower-registry';
import {
  relativeMinutesAgo,
  relativeHoursAgo,
  eventTimestamp,
  eventTimestampHoursAgo,
} from './date-factory';

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

// Helper references from canonical registry
const bAbc = borrowers[BORROWER_IDS.ABC_HOLDINGS];
const bXyz = borrowers[BORROWER_IDS.XYZ_CORP];
const bApollo = borrowers[BORROWER_IDS.APOLLO_INDUSTRIES];
const bNeptune = borrowers[BORROWER_IDS.NEPTUNE_LLC];
const bDelta = borrowers[BORROWER_IDS.DELTA_CORP];
const bEcotech = borrowers[BORROWER_IDS.ECOTECH_LTD];

const fApollo = facilities[FACILITY_IDS.APOLLO_PROJECT];
const fNeptune = facilities[FACILITY_IDS.NEPTUNE_SYNDICATED];
const fAbc = facilities[FACILITY_IDS.ABC_TERM_A];
const fXyz = facilities[FACILITY_IDS.XYZ_REVOLVER];
const fEcotech = facilities[FACILITY_IDS.ECOTECH_GREEN];
const fDelta = facilities[FACILITY_IDS.DELTA_WC];

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
      resourceId: `doc-${bApollo.id}`,
      resourceName: `Facility Agreement - ${fApollo.name}`,
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
      resourceId: `deal-${bNeptune.id}`,
      resourceName: `${bNeptune.shortName} Refinancing`,
    },
  },
  {
    id: 'user-3',
    name: 'Emily Rodriguez',
    role: 'Compliance Officer',
    email: 'emily.rodriguez@bank.com',
    initials: 'ER',
    status: 'busy',
    lastActive: relativeMinutesAgo(5),
    currentFocus: {
      type: 'compliance',
      resourceId: `comp-${bAbc.id}`,
      resourceName: `${bAbc.name} - Q4 Review`,
    },
  },
  {
    id: 'user-4',
    name: 'David Park',
    role: 'ESG Analyst',
    email: 'david.park@bank.com',
    initials: 'DP',
    status: 'away',
    lastActive: relativeMinutesAgo(15),
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
      resourceId: `trade-${bXyz.id}`,
      resourceName: `${bXyz.name} Trade DD`,
    },
  },
  {
    id: 'user-6',
    name: 'James Wilson',
    role: 'Associate',
    email: 'james.wilson@bank.com',
    initials: 'JW',
    status: 'offline',
    lastActive: relativeHoursAgo(2),
  },
];

export const loanActivityStream: LoanActivityEvent[] = [
  {
    id: 'evt-1',
    loanId: fApollo.id,
    loanName: fApollo.name,
    type: 'upload',
    description: 'Uploaded Amendment No. 4 for review',
    userId: 'user-1',
    userName: 'Sarah Johnson',
    userInitials: 'SJ',
    timestamp: eventTimestamp(2),
    relativeTime: relativeMinutesAgo(2),
    metadata: {
      documentName: `Amendment No. 4 - ${fApollo.name}.pdf`,
    },
  },
  {
    id: 'evt-2',
    loanId: fNeptune.id,
    loanName: fNeptune.name,
    type: 'proposal',
    description: 'Submitted margin ratchet proposal',
    userId: 'user-2',
    userName: 'Mike Chen',
    userInitials: 'MC',
    timestamp: eventTimestamp(7),
    relativeTime: relativeMinutesAgo(7),
    metadata: {
      fieldName: 'Margin Ratchet',
    },
  },
  {
    id: 'evt-3',
    loanId: fAbc.id,
    loanName: `${bAbc.name} - ${fAbc.name}`,
    type: 'comment',
    description: 'Added comment on covenant compliance',
    userId: 'user-3',
    userName: 'Emily Rodriguez',
    userInitials: 'ER',
    timestamp: eventTimestamp(17),
    relativeTime: relativeMinutesAgo(17),
    metadata: {
      commentText: 'Need to verify Q3 leverage ratio calculation',
    },
  },
  {
    id: 'evt-4',
    loanId: fXyz.id,
    loanName: `${bXyz.name} - ${fXyz.name}`,
    type: 'view',
    description: 'Reviewed trade due diligence checklist',
    userId: 'user-5',
    userName: 'Lisa Thompson',
    userInitials: 'LT',
    timestamp: eventTimestamp(22),
    relativeTime: relativeMinutesAgo(22),
  },
  {
    id: 'evt-5',
    loanId: fEcotech.id,
    loanName: `${bEcotech.name} ${fEcotech.name}`,
    type: 'edit',
    description: 'Updated ESG performance targets',
    userId: 'user-4',
    userName: 'David Park',
    userInitials: 'DP',
    timestamp: eventTimestamp(47),
    relativeTime: relativeMinutesAgo(47),
    metadata: {
      fieldName: 'Carbon Reduction Target',
    },
  },
  {
    id: 'evt-6',
    loanId: fApollo.id,
    loanName: fApollo.name,
    type: 'mention',
    description: 'Mentioned you in document review',
    userId: 'user-2',
    userName: 'Mike Chen',
    userInitials: 'MC',
    timestamp: eventTimestampHoursAgo(1),
    relativeTime: relativeHoursAgo(1),
    metadata: {
      mentionedUsers: ['Current User'],
      commentText: '@you Please review the interest rate cap terms',
    },
  },
];

export const counterpartyActions: CounterpartyAction[] = [
  {
    id: 'cpa-1',
    dealId: `deal-${bNeptune.id}`,
    dealName: `${bNeptune.shortName} Refinancing`,
    counterpartyId: `cp-${bNeptune.id}`,
    counterpartyName: 'Robert Martinez',
    counterpartyOrg: bNeptune.name,
    actionType: 'viewing',
    description: 'Currently viewing pricing terms',
    timestamp: eventTimestamp(0),
    relativeTime: 'Now',
    isActive: true,
    resourceType: 'term',
    resourceName: 'Pricing Grid',
  },
  {
    id: 'cpa-2',
    dealId: `deal-${bApollo.id}`,
    dealName: `${fApollo.name} Amendment`,
    counterpartyId: `cp-${bApollo.id}`,
    counterpartyName: 'Jennifer Lee',
    counterpartyOrg: bApollo.name,
    actionType: 'proposing',
    description: 'Drafting counter-proposal on financial covenants',
    timestamp: eventTimestamp(4),
    relativeTime: relativeMinutesAgo(4),
    isActive: true,
    resourceType: 'condition',
    resourceName: 'Leverage Ratio Covenant',
  },
  {
    id: 'cpa-3',
    dealId: `deal-${bDelta.id}`,
    dealName: `${bDelta.shortName} Working Capital Increase`,
    counterpartyId: `cp-${bDelta.id}`,
    counterpartyName: 'Tom Anderson',
    counterpartyOrg: bDelta.name,
    actionType: 'commented',
    description: 'Left feedback on security package',
    timestamp: eventTimestamp(17),
    relativeTime: relativeMinutesAgo(17),
    isActive: false,
    resourceType: 'document',
    resourceName: 'Security Agreement Draft',
  },
  {
    id: 'cpa-4',
    dealId: `deal-${bNeptune.id}`,
    dealName: `${bNeptune.shortName} Refinancing`,
    counterpartyId: `cp-${bNeptune.id}`,
    counterpartyName: 'Robert Martinez',
    counterpartyOrg: bNeptune.name,
    actionType: 'approved',
    description: 'Accepted maturity date extension',
    timestamp: eventTimestamp(47),
    relativeTime: relativeMinutesAgo(47),
    isActive: false,
    resourceType: 'term',
    resourceName: 'Maturity Date',
  },
  {
    id: 'cpa-5',
    dealId: `deal-${bApollo.id}`,
    dealName: `${fApollo.name} Amendment`,
    counterpartyId: `cp-${bApollo.id}`,
    counterpartyName: 'Jennifer Lee',
    counterpartyOrg: bApollo.name,
    actionType: 'requested',
    description: 'Requested additional time for document review',
    timestamp: eventTimestampHoursAgo(2),
    relativeTime: relativeHoursAgo(2),
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
    message: `@you Please review the interest rate cap terms in the ${bApollo.shortName} amendment`,
    context: {
      type: 'document',
      resourceId: `doc-${bApollo.id}-amendment`,
      resourceName: `${fApollo.name} - Amendment No. 4`,
    },
    timestamp: eventTimestampHoursAgo(1),
    relativeTime: relativeHoursAgo(1),
    read: false,
  },
  {
    id: 'mention-2',
    fromUserId: 'user-3',
    fromUserName: 'Emily Rodriguez',
    fromUserInitials: 'ER',
    message: `@you Need your sign-off on the ${bAbc.name} compliance certificate`,
    context: {
      type: 'compliance',
      resourceId: `comp-${bAbc.id}-q4`,
      resourceName: `${bAbc.name} - Q4 Compliance`,
    },
    timestamp: eventTimestampHoursAgo(3),
    relativeTime: relativeHoursAgo(3),
    read: false,
  },
  {
    id: 'mention-3',
    fromUserId: 'user-5',
    fromUserName: 'Lisa Thompson',
    fromUserInitials: 'LT',
    message: `@you Trade documentation for ${bXyz.shortName} is ready for your review`,
    context: {
      type: 'trading',
      resourceId: `trade-${bXyz.id}-dd`,
      resourceName: `${bXyz.name} - Trade DD`,
    },
    timestamp: eventTimestampHoursAgo(5),
    relativeTime: relativeHoursAgo(5),
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
