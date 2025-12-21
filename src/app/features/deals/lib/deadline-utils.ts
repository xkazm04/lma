import type { NegotiationTerm, CategoryWithTerms } from './types';

/**
 * Deadline status types for visual representation
 */
export type DeadlineStatus = 'overdue' | 'due_today' | 'due_soon' | 'on_track' | 'no_deadline';

/**
 * Parse a YYYY-MM-DD date string as UTC midnight.
 * This ensures consistent behavior across all timezones.
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object set to UTC midnight, or null if invalid
 */
export function parseDeadlineDateUTC(dateString: string | null): Date | null {
  if (!dateString) return null;

  // Match YYYY-MM-DD format
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  // Use Date.UTC to create a UTC timestamp at midnight
  const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)));

  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Get today's date as UTC midnight.
 * @returns Date object set to today's date at UTC midnight
 */
export function getTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Calculate the number of days until a deadline using UTC-based comparison.
 * This ensures all users see the same countdown regardless of timezone.
 * @param deadline - Date string in YYYY-MM-DD format
 * @returns Number of days (negative if overdue)
 */
export function getDaysUntilDeadline(deadline: string | null): number | null {
  const deadlineDate = parseDeadlineDateUTC(deadline);
  if (!deadlineDate) return null;

  const today = getTodayUTC();

  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get deadline status based on days remaining
 * @param deadline - ISO date string
 * @returns DeadlineStatus
 */
export function getDeadlineStatus(deadline: string | null): DeadlineStatus {
  const days = getDaysUntilDeadline(deadline);

  if (days === null) return 'no_deadline';
  if (days < 0) return 'overdue';
  if (days === 0) return 'due_today';
  if (days <= 7) return 'due_soon';
  return 'on_track';
}

/**
 * Format deadline countdown text
 * @param deadline - ISO date string
 * @returns Formatted countdown string (e.g., "3 days left", "Overdue by 2 days")
 */
export function formatDeadlineCountdown(deadline: string | null): string | null {
  const days = getDaysUntilDeadline(deadline);

  if (days === null) return null;

  if (days < 0) {
    const absDays = Math.abs(days);
    return absDays === 1 ? 'Overdue by 1 day' : `Overdue by ${absDays} days`;
  }

  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

/**
 * Get status color classes for deadline badges
 * @param status - DeadlineStatus
 * @returns Tailwind CSS classes for the badge
 */
export function getDeadlineStatusColors(status: DeadlineStatus): string {
  switch (status) {
    case 'overdue':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'due_today':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'due_soon':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'on_track':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-zinc-100 text-zinc-600 border-zinc-200';
  }
}

/**
 * Format a deadline date string for display using UTC interpretation.
 * Returns a human-readable date string that is consistent across timezones.
 * @param deadline - Date string in YYYY-MM-DD format
 * @param options - Optional formatting configuration
 * @returns Formatted date string (e.g., "Mon, Jan 15, 2025 (UTC)")
 */
export function formatDeadlineDisplay(
  deadline: string | null,
  options?: {
    includeWeekday?: boolean;
    includeYear?: boolean;
    showUTCIndicator?: boolean;
  }
): string | null {
  const date = parseDeadlineDateUTC(deadline);
  if (!date) return null;

  const {
    includeWeekday = true,
    includeYear = true,
    showUTCIndicator = true,
  } = options ?? {};

  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  };

  if (includeWeekday) {
    formatOptions.weekday = 'short';
  }

  if (includeYear) {
    formatOptions.year = 'numeric';
  }

  const formatted = date.toLocaleDateString('en-US', formatOptions);
  return showUTCIndicator ? `${formatted} (UTC)` : formatted;
}

/**
 * Calculate deadline statistics for a collection of terms
 * @param terms - Array of negotiation terms with optional deadlines
 * @returns Deadline statistics object
 */
export function calculateDeadlineStats(terms: Array<Pick<NegotiationTerm, 'deadline'>>) {
  const stats = {
    total_with_deadlines: 0,
    overdue: 0,
    due_soon: 0,
    on_track: 0,
  };

  for (const term of terms) {
    if (!term.deadline) continue;

    stats.total_with_deadlines++;
    const status = getDeadlineStatus(term.deadline);

    switch (status) {
      case 'overdue':
        stats.overdue++;
        break;
      case 'due_today':
      case 'due_soon':
        stats.due_soon++;
        break;
      case 'on_track':
        stats.on_track++;
        break;
    }
  }

  return stats;
}

/**
 * Calculate deadline statistics from categories
 * @param categories - Array of categories with terms
 * @returns Deadline statistics object
 */
export function calculateDeadlineStatsFromCategories(categories: CategoryWithTerms[]) {
  const allTerms = categories.flatMap((c) => c.terms);
  return calculateDeadlineStats(allTerms);
}

/**
 * Format a Date object to ICS timestamp format
 * @param date - Date to format
 * @returns ICS timestamp string (e.g., "20231215T120000Z")
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate a single VEVENT block for ICS export
 * @param term - Negotiation term with deadline
 * @param dealName - Name of the deal for context
 * @param dtstamp - ICS timestamp for the event creation
 * @returns VEVENT block as array of lines
 */
function generateICSEvent(
  term: Pick<NegotiationTerm, 'id' | 'term_label' | 'deadline'>,
  dealName: string,
  dtstamp: string
): string[] {
  const uid = `term-${term.id}-${Date.now()}@loanos`;
  const dtstart = term.deadline!.replace(/-/g, '');

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `SUMMARY:Deadline: ${term.term_label}`,
    `DESCRIPTION:Term deadline for "${term.term_label}" in deal: ${dealName}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Term deadline reminder',
    'TRIGGER:-P1D',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Term deadline reminder',
    'TRIGGER:-P3D',
    'END:VALARM',
    'END:VEVENT',
  ];
}

/**
 * Generate ICS file content for a single term deadline
 * @param term - Negotiation term with deadline
 * @param dealName - Name of the deal for context
 * @returns ICS file content as string
 */
export function generateTermDeadlineICS(
  term: Pick<NegotiationTerm, 'id' | 'term_label' | 'deadline'>,
  dealName: string
): string | null {
  if (!term.deadline) return null;

  const deadlineDate = new Date(term.deadline);
  if (isNaN(deadlineDate.getTime())) return null;

  const dtstamp = formatICSDate(new Date());
  const eventLines = generateICSEvent(term, dealName, dtstamp);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LoanOS//Term Deadline//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...eventLines,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Generate ICS file content for multiple term deadlines
 * @param terms - Array of negotiation terms with deadlines
 * @param dealName - Name of the deal for context
 * @returns ICS file content as string
 */
export function generateMultipleDeadlinesICS(
  terms: Array<Pick<NegotiationTerm, 'id' | 'term_label' | 'deadline'>>,
  dealName: string
): string | null {
  const termsWithDeadlines = terms.filter((t) => t.deadline);
  if (termsWithDeadlines.length === 0) return null;

  const dtstamp = formatICSDate(new Date());
  const eventLines = termsWithDeadlines.flatMap((term) => generateICSEvent(term, dealName, dtstamp));

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LoanOS//Term Deadlines//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${dealName} - Term Deadlines`,
    ...eventLines,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Download ICS file in the browser
 * @param content - ICS file content
 * @param filename - Name for the downloaded file
 */
export function downloadICSFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL for a term deadline
 * @param term - Negotiation term with deadline
 * @param dealName - Name of the deal for context
 * @returns Google Calendar event URL
 */
export function generateGoogleCalendarUrl(
  term: Pick<NegotiationTerm, 'term_label' | 'deadline'>,
  dealName: string
): string | null {
  if (!term.deadline) return null;

  const title = encodeURIComponent(`Deadline: ${term.term_label}`);
  const details = encodeURIComponent(`Term deadline for "${term.term_label}" in deal: ${dealName}`);
  const date = term.deadline.replace(/-/g, '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${date}/${date}`;
}

/**
 * Generate Outlook.com calendar URL for a term deadline
 * @param term - Negotiation term with deadline
 * @param dealName - Name of the deal for context
 * @returns Outlook calendar event URL
 */
export function generateOutlookCalendarUrl(
  term: Pick<NegotiationTerm, 'term_label' | 'deadline'>,
  dealName: string
): string | null {
  if (!term.deadline) return null;

  const title = encodeURIComponent(`Deadline: ${term.term_label}`);
  const details = encodeURIComponent(`Term deadline for "${term.term_label}" in deal: ${dealName}`);
  const startDate = term.deadline;

  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&startdt=${startDate}&enddt=${startDate}&allday=true`;
}
