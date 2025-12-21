import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import type { BulkEventGenerationResult } from '@/app/features/compliance/sub_AutomatedCalendar/lib/types';
import {
  generateCovenantEvents,
  generateObligationEvents,
  generateFutureOccurrences,
  DEFAULT_REMINDER_SETTINGS,
} from '@/app/features/compliance/sub_AutomatedCalendar/lib/event-generator';

interface GenerateEventsRequest {
  facility_ids?: string[];
  include_covenants?: boolean;
  include_obligations?: boolean;
  start_date?: string;
  end_date?: string;
  apply_default_reminders?: boolean;
  occurrences_count?: number;
}

// POST /api/compliance/calendar/generate - Generate calendar events from covenants and obligations
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, { status: 401 });
    }

    interface UserData {
      organization_id: string;
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single() as { data: UserData | null };

    if (!userData) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found',
        },
      }, { status: 404 });
    }

    const orgId = userData.organization_id;

    const body: GenerateEventsRequest = await request.json().catch(() => ({}));
    const {
      facility_ids,
      include_covenants = true,
      include_obligations = true,
      apply_default_reminders = true,
      occurrences_count = 4,
    } = body;

    const result: BulkEventGenerationResult = {
      events_created: 0,
      events_updated: 0,
      events_skipped: 0,
      errors: [],
    };

    // Get facilities to process
    let facilitiesQuery = (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('id, facility_name, borrower_name')
      .eq('organization_id', orgId);

    if (facility_ids && facility_ids.length > 0) {
      facilitiesQuery = facilitiesQuery.in('id', facility_ids);
    }

    const { data: facilities } = await facilitiesQuery;

    if (!facilities || facilities.length === 0) {
      return NextResponse.json<ApiResponse<BulkEventGenerationResult>>({
        success: true,
        data: result,
      });
    }

    const facilityIds = facilities.map((f: { id: string }) => f.id);

    // Process covenants
    if (include_covenants) {
      interface CovenantData {
        id: string;
        name: string;
        covenant_type: string;
        threshold_type: string | null;
        current_threshold: number | null;
        test_frequency: string | null;
        next_test_date: string | null;
        status: string;
        facility_id: string;
        compliance_facilities: {
          facility_name: string;
          borrower_name: string;
        };
      }

      const { data: covenants } = await (supabase
        .from('compliance_covenants') as ReturnType<typeof supabase.from>)
        .select(`
          id,
          name,
          covenant_type,
          threshold_type,
          current_threshold,
          test_frequency,
          next_test_date,
          status,
          facility_id,
          compliance_facilities!inner (
            facility_name,
            borrower_name
          )
        `)
        .in('facility_id', facilityIds)
        .eq('status', 'active') as { data: CovenantData[] | null };

      if (covenants && covenants.length > 0) {
        for (const covenant of covenants) {
          try {
            // Map status to valid CovenantStatus type ('active' | 'waived' | 'breached')
            const mapDbStatus = (s: string): 'active' | 'waived' | 'breached' => {
              if (s === 'waived') return 'waived';
              if (s === 'breached') return 'breached';
              return 'active'; // default to active for 'active', 'inactive', or unknown
            };

            // Transform to expected format with defaults for null values
            const covenantData = {
              id: covenant.id,
              name: covenant.name,
              covenant_type: covenant.covenant_type,
              facility_id: covenant.facility_id,
              facility_name: covenant.compliance_facilities.facility_name,
              borrower_name: covenant.compliance_facilities.borrower_name,
              threshold_type: (covenant.threshold_type || 'maximum') as 'maximum' | 'minimum',
              current_threshold: covenant.current_threshold ?? 0,
              status: mapDbStatus(covenant.status),
              test_frequency: (covenant.test_frequency || 'quarterly') as 'monthly' | 'quarterly' | 'annually',
              next_test_date: covenant.next_test_date || new Date().toISOString(),
              latest_test: {
                test_date: new Date().toISOString(),
                calculated_ratio: 0,
                test_result: 'pass' as const,
                headroom_percentage: 0,
                headroom_absolute: 0,
              },
            };

            const events = generateCovenantEvents(
              covenantData,
              apply_default_reminders ? DEFAULT_REMINDER_SETTINGS : undefined
            );

            // Generate future occurrences
            for (const event of events) {
              const allOccurrences = generateFutureOccurrences(
                event,
                occurrences_count,
                apply_default_reminders ? DEFAULT_REMINDER_SETTINGS : undefined
              );
              result.events_created += allOccurrences.length;
            }
          } catch (err) {
            result.errors.push({
              source_type: 'covenant',
              source_id: covenant.id,
              error: err instanceof Error ? err.message : 'Unknown error',
            });
          }
        }
      }
    }

    // Process obligations
    if (include_obligations) {
      interface ObligationData {
        id: string;
        name: string;
        obligation_type: string;
        frequency: string | null;
        deadline_days_after_period: number | null;
        is_active: boolean;
        facility_id: string;
        compliance_facilities: {
          id: string;
          facility_name: string;
          borrower_name: string;
        };
      }

      const { data: obligations } = await (supabase
        .from('compliance_obligations') as ReturnType<typeof supabase.from>)
        .select(`
          id,
          name,
          obligation_type,
          frequency,
          deadline_days_after_period,
          is_active,
          facility_id,
          compliance_facilities!inner (
            id,
            facility_name,
            borrower_name
          )
        `)
        .in('facility_id', facilityIds)
        .eq('is_active', true) as { data: ObligationData[] | null };

      if (obligations && obligations.length > 0) {
        for (const obligation of obligations) {
          try {
            // Calculate upcoming event date based on frequency
            const now = new Date();
            const deadlineDate = new Date(now);
            deadlineDate.setDate(deadlineDate.getDate() + (obligation.deadline_days_after_period || 30));

            const obligationData = {
              id: obligation.id,
              name: obligation.name,
              obligation_type: obligation.obligation_type,
              frequency: (obligation.frequency || 'quarterly') as 'monthly' | 'quarterly' | 'annually',
              deadline_days_after_period: obligation.deadline_days_after_period ?? 30,
              is_active: obligation.is_active,
              upcoming_event: {
                deadline_date: deadlineDate.toISOString().split('T')[0],
                status: 'upcoming' as const,
              },
            };

            const events = generateObligationEvents(
              obligationData,
              obligation.facility_id,
              obligation.compliance_facilities.facility_name,
              obligation.compliance_facilities.borrower_name,
              apply_default_reminders ? DEFAULT_REMINDER_SETTINGS : undefined
            );

            // Generate future occurrences
            for (const event of events) {
              const allOccurrences = generateFutureOccurrences(
                event,
                occurrences_count,
                apply_default_reminders ? DEFAULT_REMINDER_SETTINGS : undefined
              );
              result.events_created += allOccurrences.length;
            }
          } catch (err) {
            result.errors.push({
              source_type: 'obligation',
              source_id: obligation.id,
              error: err instanceof Error ? err.message : 'Unknown error',
            });
          }
        }
      }
    }

    return NextResponse.json<ApiResponse<BulkEventGenerationResult>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in POST /api/compliance/calendar/generate:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
