import type { Deal } from './types';

/**
 * Deal Search Utility
 *
 * SEARCH BEHAVIOR SPECIFICATION:
 *
 * 1. SEARCH SCOPE
 *    - Searches ONLY the `deal_name` field (intentional design decision)
 *    - Description field is NOT searched (by design - descriptions can contain
 *      sensitive details that shouldn't affect quick filtering)
 *
 * 2. MATCHING RULES
 *    - Case-insensitive substring matching
 *    - Matches anywhere in the deal name (not just prefix)
 *    - Partial word matches are allowed (e.g., "Apo" matches "Apollo")
 *
 * 3. QUERY HANDLING
 *    - Empty string ("") matches all deals
 *    - Whitespace-only queries ("   ") match all deals (trimmed to empty)
 *    - Leading/trailing whitespace is trimmed before matching
 *    - Special characters are matched literally (no regex interpretation)
 *    - Queries with only special characters work as literal searches
 *
 * 4. EDGE CASES
 *    - Null/undefined queries are treated as empty string (match all)
 *    - Empty results returned when no deals match (not an error)
 *    - Single character queries are valid and perform substring match
 *
 * @example
 * searchDeals(deals, "apollo")      // matches "Project Apollo - Term Loan"
 * searchDeals(deals, "APOLLO")      // matches "Project Apollo - Term Loan" (case-insensitive)
 * searchDeals(deals, "   ")         // matches all deals (whitespace trimmed)
 * searchDeals(deals, "")            // matches all deals
 * searchDeals(deals, "XYZ Corp")    // matches "XYZ Corp - Amendment No. 2"
 * searchDeals(deals, "-")           // matches deals with "-" in name
 */

/**
 * Normalizes a search query for consistent matching.
 *
 * - Trims leading/trailing whitespace
 * - Converts to lowercase for case-insensitive matching
 * - Returns empty string for null/undefined input
 */
export function normalizeSearchQuery(query: string | null | undefined): string {
  if (query == null) {
    return '';
  }
  return query.trim().toLowerCase();
}

/**
 * Checks if a query string is considered "empty" (matches all).
 *
 * Empty queries are:
 * - null or undefined
 * - Empty string ""
 * - Whitespace-only string "   "
 */
export function isEmptyQuery(query: string | null | undefined): boolean {
  return normalizeSearchQuery(query) === '';
}

/**
 * Checks if a deal name matches the search query.
 *
 * @param dealName - The deal name to check
 * @param normalizedQuery - Pre-normalized query (lowercase, trimmed)
 * @returns true if the deal name contains the query as a substring
 */
export function matchesDealName(dealName: string, normalizedQuery: string): boolean {
  if (normalizedQuery === '') {
    return true;
  }
  return dealName.toLowerCase().includes(normalizedQuery);
}

/**
 * Filters deals by search query.
 *
 * See module documentation for complete behavior specification.
 *
 * @param deals - Array of deals to filter
 * @param query - Search query string
 * @returns Filtered array of deals matching the query
 */
export function searchDeals<T extends Pick<Deal, 'deal_name'>>(
  deals: T[],
  query: string | null | undefined
): T[] {
  const normalizedQuery = normalizeSearchQuery(query);

  // Empty query matches all deals
  if (normalizedQuery === '') {
    return deals;
  }

  return deals.filter((deal) => matchesDealName(deal.deal_name, normalizedQuery));
}

/**
 * Creates a search predicate function for use with Array.filter.
 *
 * @param query - Search query string
 * @returns Predicate function that returns true for matching deals
 */
export function createSearchPredicate<T extends Pick<Deal, 'deal_name'>>(
  query: string | null | undefined
): (deal: T) => boolean {
  const normalizedQuery = normalizeSearchQuery(query);

  if (normalizedQuery === '') {
    return () => true;
  }

  return (deal: T) => matchesDealName(deal.deal_name, normalizedQuery);
}
