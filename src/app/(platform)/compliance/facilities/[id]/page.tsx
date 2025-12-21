import { use } from 'react';
import { FacilityDetailPage } from '@/app/features/compliance';

export default function FacilityDetailPageWrapper({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = use(params);
  const { tab } = use(searchParams);
  return <FacilityDetailPage facilityId={id} initialTab={tab} />;
}
