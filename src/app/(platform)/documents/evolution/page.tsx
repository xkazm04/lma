'use client';

import { Suspense } from 'react';
import { EvolutionDashboardPage } from '@/app/features/documents';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingState() {
  return (
    <div className="space-y-6" data-testid="evolution-loading">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-[300px]" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-48 w-full rounded-lg col-span-2" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function DocumentEvolutionPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <EvolutionDashboardPage />
    </Suspense>
  );
}
