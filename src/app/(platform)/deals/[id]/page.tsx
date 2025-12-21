'use client';

import { useParams } from 'next/navigation';
import { DealDetailPage } from '@/app/features/deals';

export default function DealDetailRoute() {
  const params = useParams();
  return <DealDetailPage dealId={params.id as string} />;
}
