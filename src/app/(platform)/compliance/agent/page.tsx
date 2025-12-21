import { ComplianceAgentPage } from '@/app/features/compliance/sub_Agent';

// Force dynamic rendering for this page since it uses client-side hooks
export const dynamic = 'force-dynamic';

export default function AgentPage() {
  return <ComplianceAgentPage />;
}
