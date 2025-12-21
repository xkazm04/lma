import { PredictiveIntelligenceDashboard } from '@/app/features/deals/predictive-intelligence';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PredictiveIntelligencePage({ params }: PageProps) {
  const { id: dealId } = await params;

  return (
    <div className="container mx-auto py-6 px-4" data-testid="predictive-intelligence-page">
      <PredictiveIntelligenceDashboard dealId={dealId} />
    </div>
  );
}

export const metadata = {
  title: 'Predictive Intelligence | Deal Room | LoanOS',
  description: 'AI-powered deal predictions, market insights, and negotiation strategies',
};
