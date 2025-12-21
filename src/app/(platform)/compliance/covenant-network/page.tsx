import { CovenantNetworkPage } from '@/app/features/compliance/sub_CovenantNetwork';

export default function CovenantNetworkRoute() {
  return <CovenantNetworkPage />;
}

export const metadata = {
  title: 'Covenant Network Analysis | LoanOS',
  description: 'Cross-facility covenant correlation and breach propagation analysis',
};
