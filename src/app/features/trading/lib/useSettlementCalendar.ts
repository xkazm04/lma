'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isWeekend,
  differenceInDays,
  parseISO,
} from 'date-fns';
import type {
  CalendarSettlement,
  CalendarDay,
  FundingForecast,
  CalendarViewMode,
  SettlementRiskLevel,
  ReminderInterval,
  SettlementReminder,
} from './types';
import { createSettlement, generateId, daysFromNow } from './fixtures';

// ============================================================================
// Risk Level Calculation
// ============================================================================

/**
 * Calculate risk level based on settlement factors
 */
export function calculateSettlementRiskLevel(
  daysUntil: number,
  hasFlaggedItems: boolean,
  missingConsents: boolean,
  ddComplete: boolean
): SettlementRiskLevel {
  // Critical: Overdue or same day with issues
  if (daysUntil <= 0 && (hasFlaggedItems || missingConsents || !ddComplete)) {
    return 'critical';
  }

  // Critical: Tomorrow with blocking issues
  if (daysUntil === 1 && (hasFlaggedItems || missingConsents)) {
    return 'critical';
  }

  // High: Within 3 days with any issue
  if (daysUntil <= 3 && (hasFlaggedItems || missingConsents || !ddComplete)) {
    return 'high';
  }

  // High: Overdue but no issues
  if (daysUntil <= 0) {
    return 'high';
  }

  // Medium: Within 7 days with issues or within 3 days without
  if (daysUntil <= 7 && (hasFlaggedItems || missingConsents || !ddComplete)) {
    return 'medium';
  }

  if (daysUntil <= 3) {
    return 'medium';
  }

  // Low: More than 7 days away without issues
  return 'low';
}

/**
 * Get the highest risk level from multiple settlements
 */
export function getHighestRiskLevel(
  settlements: CalendarSettlement[]
): SettlementRiskLevel | null {
  if (settlements.length === 0) return null;

  const riskOrder: SettlementRiskLevel[] = ['critical', 'high', 'medium', 'low'];

  for (const risk of riskOrder) {
    if (settlements.some((s) => s.risk_level === risk)) {
      return risk;
    }
  }

  return 'low';
}

// ============================================================================
// Reminder Generation
// ============================================================================

const REMINDER_INTERVALS: ReminderInterval[] = [7, 3, 1];

/**
 * Generate reminders for a settlement
 */
export function generateReminders(
  settlementId: string,
  settlementDate: string
): SettlementReminder[] {
  const settlementDateObj = parseISO(settlementDate);
  const today = new Date();

  return REMINDER_INTERVALS.map((daysBefore) => {
    const reminderDate = new Date(settlementDateObj);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);

    const isPast = reminderDate < today;

    return {
      id: generateId(),
      settlement_id: settlementId,
      days_before: daysBefore,
      scheduled_date: format(reminderDate, 'yyyy-MM-dd'),
      sent: isPast,
      sent_at: isPast ? format(reminderDate, "yyyy-MM-dd'T'HH:mm:ss") : null,
      channel: 'in_app' as const,
    };
  });
}

// ============================================================================
// Mock Data Generation
// ============================================================================

const BORROWER_NAMES = [
  'Acme Corporation',
  'Global Industries LLC',
  'Pinnacle Holdings Inc',
  'Summit Enterprises',
  'Nexus Capital Group',
];

const FACILITY_TYPES = ['Term Loan A', 'Term Loan B', 'Revolver', 'ABL', 'Bridge'];

/**
 * Generate mock calendar settlements for demo purposes
 */
export function generateMockCalendarSettlements(count: number = 12): CalendarSettlement[] {
  const settlements: CalendarSettlement[] = [];

  for (let i = 0; i < count; i++) {
    const baseSettlement = createSettlement({
      settlement_date: daysFromNow(Math.floor(Math.random() * 60) - 10), // -10 to +50 days
    });

    const daysUntil = differenceInDays(
      parseISO(baseSettlement.settlement_date),
      new Date()
    );

    const hasFlaggedItems = Math.random() > 0.7;
    const missingConsents = Math.random() > 0.8;
    const ddComplete = Math.random() > 0.3;

    const borrowerName = BORROWER_NAMES[Math.floor(Math.random() * BORROWER_NAMES.length)];
    const facilityType = FACILITY_TYPES[Math.floor(Math.random() * FACILITY_TYPES.length)];

    const calendarSettlement: CalendarSettlement = {
      ...baseSettlement,
      risk_level: calculateSettlementRiskLevel(
        daysUntil,
        hasFlaggedItems,
        missingConsents,
        ddComplete
      ),
      has_flagged_items: hasFlaggedItems,
      missing_consents: missingConsents,
      dd_complete: ddComplete,
      days_until: daysUntil,
      funding_requirement: baseSettlement.is_buyer ? baseSettlement.amount : 0,
      reminders: generateReminders(baseSettlement.trade_id, baseSettlement.settlement_date),
      borrower_name: borrowerName,
      facility_name: `${borrowerName.split(' ')[0]} ${facilityType}`,
    };

    settlements.push(calendarSettlement);
  }

  return settlements.sort((a, b) =>
    parseISO(a.settlement_date).getTime() - parseISO(b.settlement_date).getTime()
  );
}

// ============================================================================
// Calendar Generation
// ============================================================================

/**
 * Generate calendar days for a given date and view mode
 */
export function generateCalendarDays(
  currentDate: Date,
  viewMode: CalendarViewMode,
  settlements: CalendarSettlement[],
  forecasts: FundingForecast[]
): CalendarDay[] {
  let startDate: Date;
  let endDate: Date;

  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  } else if (viewMode === 'week') {
    startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
  } else {
    // List view - show next 30 days
    startDate = new Date();
    endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const today = new Date();

  return days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const daySettlements = settlements.filter(
      (s) => s.settlement_date === dateStr
    );
    const forecast = forecasts.find((f) => f.date === dateStr) || null;

    return {
      date: dateStr,
      isCurrentMonth: isSameMonth(day, currentDate),
      isToday: isSameDay(day, today),
      isWeekend: isWeekend(day),
      settlements: daySettlements,
      totalAmount: daySettlements.reduce((sum, s) => sum + s.amount, 0),
      highestRisk: getHighestRiskLevel(daySettlements),
      fundingForecast: forecast,
    };
  });
}

/**
 * Generate funding forecasts from settlements
 */
export function generateFundingForecasts(
  settlements: CalendarSettlement[]
): FundingForecast[] {
  const forecastsByDate = new Map<string, FundingForecast>();

  for (const settlement of settlements) {
    const date = settlement.settlement_date;
    let forecast = forecastsByDate.get(date);

    if (!forecast) {
      forecast = {
        date,
        total_inflows: 0,
        total_outflows: 0,
        net_position: 0,
        settlements: [],
      };
      forecastsByDate.set(date, forecast);
    }

    if (settlement.is_buyer) {
      forecast.total_outflows += settlement.amount;
    } else {
      forecast.total_inflows += settlement.amount;
    }

    forecast.net_position = forecast.total_inflows - forecast.total_outflows;
    forecast.settlements.push(settlement);
  }

  return Array.from(forecastsByDate.values()).sort(
    (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
  );
}

// ============================================================================
// Hook
// ============================================================================

interface UseSettlementCalendarOptions {
  initialViewMode?: CalendarViewMode;
  initialDate?: Date;
}

interface UseSettlementCalendarResult {
  // State
  currentDate: Date;
  viewMode: CalendarViewMode;
  selectedDate: string | null;
  settlements: CalendarSettlement[];
  calendarDays: CalendarDay[];
  forecasts: FundingForecast[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setViewMode: (mode: CalendarViewMode) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  goToToday: () => void;
  selectDate: (date: string | null) => void;

  // Computed
  upcomingReminders: SettlementReminder[];
  criticalSettlements: CalendarSettlement[];
  totalFundingRequired: number;
  monthLabel: string;
}

/**
 * Hook for managing settlement calendar state and data
 */
export function useSettlementCalendar(
  options: UseSettlementCalendarOptions = {}
): UseSettlementCalendarResult {
  const { initialViewMode = 'month', initialDate = new Date() } = options;

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  // Generate mock settlements (in production, this would fetch from API)
  const settlements = useMemo(() => generateMockCalendarSettlements(15), []);

  // Generate forecasts from settlements
  const forecasts = useMemo(
    () => generateFundingForecasts(settlements),
    [settlements]
  );

  // Generate calendar days
  const calendarDays = useMemo(
    () => generateCalendarDays(currentDate, viewMode, settlements, forecasts),
    [currentDate, viewMode, settlements, forecasts]
  );

  // Navigation actions
  const goToNext = useCallback(() => {
    setCurrentDate((prev) =>
      viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1)
    );
  }, [viewMode]);

  const goToPrevious = useCallback(() => {
    setCurrentDate((prev) =>
      viewMode === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1)
    );
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const selectDate = useCallback((date: string | null) => {
    setSelectedDate(date);
  }, []);

  // Computed values
  const upcomingReminders = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const in7Days = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

    return settlements
      .flatMap((s) => s.reminders)
      .filter((r) => !r.sent && r.scheduled_date >= today && r.scheduled_date <= in7Days)
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
  }, [settlements]);

  const criticalSettlements = useMemo(
    () => settlements.filter((s) => s.risk_level === 'critical'),
    [settlements]
  );

  const totalFundingRequired = useMemo(() => {
    const today = new Date();
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    return settlements
      .filter((s) => {
        const settlementDate = parseISO(s.settlement_date);
        return s.is_buyer && settlementDate >= today && settlementDate <= next30Days;
      })
      .reduce((sum, s) => sum + s.amount, 0);
  }, [settlements]);

  const monthLabel = useMemo(
    () => format(currentDate, 'MMMM yyyy'),
    [currentDate]
  );

  return {
    currentDate,
    viewMode,
    selectedDate,
    settlements,
    calendarDays,
    forecasts,
    isLoading,
    error,
    setViewMode,
    goToNext,
    goToPrevious,
    goToToday,
    selectDate,
    upcomingReminders,
    criticalSettlements,
    totalFundingRequired,
    monthLabel,
  };
}
