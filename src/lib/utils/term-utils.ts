/**
 * Term utility functions for deal negotiation
 * Shared helpers for working with negotiation terms
 */

/**
 * Minimal interface for checking if a term has been modified.
 * Uses Pick-style typing to accept any object with these 4 properties.
 */
export interface TermModifiedCheckable {
  current_value: unknown;
  current_value_text: string | null;
  original_value: unknown;
  original_value_text: string | null;
}

/**
 * Check if a term has been modified from its original value.
 * Compares using text representations for accurate comparison.
 *
 * @param term - Any object containing current/original value properties
 * @returns true if the current value differs from the original value
 */
export function isTermModified(term: TermModifiedCheckable): boolean {
  const currentText = term.current_value_text ?? String(term.current_value);
  const originalText = term.original_value_text ?? String(term.original_value);
  return currentText !== originalText;
}
