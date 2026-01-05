'use client';

import React, { memo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockFacilityDetail, mockObligations, mockCovenants, getWaiversByFacility } from '../lib';
import { FacilityHeader, FacilityOverview, ObligationsTab, CovenantsTab, CalendarTab, WaiversTab, PredictionsTab } from './components';

const VALID_TABS = ['obligations', 'covenants', 'waivers', 'calendar', 'predictions'] as const;
type ValidTab = typeof VALID_TABS[number];

interface FacilityDetailPageProps {
  facilityId: string;
  /** Optional initial tab to display (from URL query parameter) */
  initialTab?: string;
}

export const FacilityDetailPage = memo(function FacilityDetailPage({ facilityId, initialTab }: FacilityDetailPageProps) {
  const facility = mockFacilityDetail;
  const facilityCovenants = mockCovenants.filter((c) => c.facility_id === facilityId);
  const facilityWaivers = getWaiversByFacility(facilityId);

  // Validate the initial tab - default to 'obligations' if invalid or not provided
  const defaultTab: ValidTab = initialTab && VALID_TABS.includes(initialTab as ValidTab)
    ? (initialTab as ValidTab)
    : 'obligations';

  const handleRequestWaiver = () => {
    // In a real app, this would open a waiver request modal/form
  };

  return (
    <div className="space-y-6 animate-in fade-in" data-testid="facility-detail-page">
      <FacilityHeader facility={facility} />
      <FacilityOverview facility={facility} />

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList data-testid="facility-tabs-list">
          <TabsTrigger value="obligations" data-testid="obligations-tab">Obligations</TabsTrigger>
          <TabsTrigger value="covenants" data-testid="covenants-tab">Covenants</TabsTrigger>
          <TabsTrigger value="waivers" data-testid="waivers-tab">Waivers</TabsTrigger>
          <TabsTrigger value="calendar" data-testid="calendar-tab">Calendar</TabsTrigger>
          <TabsTrigger value="predictions" data-testid="predictions-tab">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="obligations" data-testid="obligations-tab-content">
          <ObligationsTab obligations={mockObligations} />
        </TabsContent>

        <TabsContent value="covenants" data-testid="covenants-tab-content">
          <CovenantsTab covenants={facilityCovenants} waivers={facilityWaivers} />
        </TabsContent>

        <TabsContent value="waivers" data-testid="waivers-tab-content">
          <WaiversTab
            waivers={facilityWaivers}
            covenants={facilityCovenants}
            onRequestWaiver={handleRequestWaiver}
          />
        </TabsContent>

        <TabsContent value="calendar" data-testid="calendar-tab-content">
          <CalendarTab facilityId={facilityId} facilityName={facility.facility_name} />
        </TabsContent>

        <TabsContent value="predictions" data-testid="predictions-tab-content">
          <PredictionsTab facilityId={facilityId} facilityName={facility.facility_name} />
        </TabsContent>
      </Tabs>
    </div>
  );
});
