'use client';

import { useParams } from 'next/navigation';
import { ExtractionReviewPage } from '@/app/features/documents';

export default function Page() {
  const params = useParams();
  const documentId = params.id as string;

  return <ExtractionReviewPage documentId={documentId} />;
}
