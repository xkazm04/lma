'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import type { ESGRating } from '../lib';

interface RatingDisplayProps {
  rating: ESGRating;
}

export const RatingDisplay = memo(function RatingDisplay({ rating }: RatingDisplayProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Generate unique ID for accessibility
  const ratingId = `rating-${rating.provider.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <Card
      className="transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
      role="region"
      aria-labelledby={ratingId}
      data-testid={`rating-display-${rating.provider.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <CardContent className="pt-6 text-center">
        <div className="p-3 rounded-full bg-blue-100 w-fit mx-auto mb-4 transition-transform hover:scale-110" aria-hidden="true">
          <Star className="w-6 h-6 text-blue-600" aria-hidden="true" />
        </div>
        <p id={ratingId} className="text-sm text-zinc-500 uppercase tracking-wider">{rating.provider}</p>
        <p className="text-3xl font-bold text-zinc-900 my-2" aria-label={`Rating: ${rating.rating}`}>{rating.rating}</p>
        <p className="text-sm text-zinc-500">As of {formatDate(rating.rating_date)}</p>
        {rating.outlook && (
          <Badge variant="outline" className="mt-2" data-testid={`rating-outlook-${rating.provider.replace(/\s+/g, '-').toLowerCase()}`}>
            Outlook: {rating.outlook}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
});
