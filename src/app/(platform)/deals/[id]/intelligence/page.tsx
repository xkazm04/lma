import { DealIntelligenceDashboard } from '@/app/features/deals/intelligence';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DealIntelligencePage({ params }: PageProps) {
  const { id } = await params;
  return <DealIntelligenceDashboard dealId={id} />;
}
