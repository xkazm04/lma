'use client';

import { useParams } from 'next/navigation';
import { DocumentDetailPage } from '@/app/features/documents';

export default function Page() {
  const params = useParams();
  const documentId = params.id as string;

  return <DocumentDetailPage documentId={documentId} />;
}
