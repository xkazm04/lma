/**
 * Format a currency amount for display in the ESG module.
 * Handles billions, millions, and smaller amounts with appropriate abbreviations.
 *
 * @param amount - The numeric amount to format
 * @param options - Optional configuration
 * @param options.decimals - Number of decimal places for abbreviated amounts (default: 1 for billions, 0 for millions)
 * @returns Formatted currency string (e.g., "$1.5B", "$250M", "$50,000")
 */
export function formatCurrency(
  amount: number,
  options?: { decimals?: number }
): string {
  if (amount >= 1_000_000_000) {
    const decimals = options?.decimals ?? 1;
    return `$${(amount / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (amount >= 1_000_000) {
    const decimals = options?.decimals ?? 0;
    return `$${(amount / 1_000_000).toFixed(decimals)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
