
/**
 * Shared status helper functions
 */

export interface StatusBadgeConfig {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
    color?: string;
}

/**
 * Returns configuration for status badges based on the status string.
 * Supports facility statuses, compliance statuses, etc.
 */
export function getStatusBadge(status: string): StatusBadgeConfig {
    const normalizedStatus = status.toLowerCase();

    switch (normalizedStatus) {
        case 'active':
        case 'performing':
        case 'compliant':
        case 'pass':
        case 'completed':
        case 'verified':
            return { label: 'Active', variant: 'success' };

        case 'inactive':
        case 'closed':
        case 'terminated':
            return { label: 'Inactive', variant: 'secondary' };

        case 'pending_review':
        case 'under_review':
        case 'review_required':
        case 'pending':
        case 'processing':
            return { label: 'Pending Review', variant: 'warning' };

        case 'default':
        case 'non_performing':
        case 'in_breach':
        case 'fail':
        case 'failed':
        case 'critical':
            return { label: 'Attention Required', variant: 'destructive' };

        case 'waiver_period':
        case 'waived':
        case 'cured':
            return { label: 'Waiver Active', variant: 'outline' };

        case 'upcoming':
        case 'due_soon':
            return { label: 'Upcoming', variant: 'outline' };

        case 'overdue':
            return { label: 'Overdue', variant: 'destructive' };

        default:
            // Format the unknown status: "unknown_status" -> "Unknown Status"
            const label = status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            return { label, variant: 'secondary' };
    }
}

/**
 * Get status color class (text color)
 */
export function getStatusColor(status: string): string {
    const badge = getStatusBadge(status);
    switch (badge.variant) {
        case 'success': return 'text-green-600';
        case 'warning': return 'text-amber-600';
        case 'destructive': return 'text-red-600';
        case 'secondary': return 'text-zinc-500';
        default: return 'text-zinc-900';
    }
}

/**
 * Get status label (human-readable string)
 */
export function getStatusLabel(status: string): string {
    return getStatusBadge(status).label;
}

/**
 * Get status badge variant
 */
export function getStatusBadgeVariant(status: string): StatusBadgeConfig['variant'] {
    return getStatusBadge(status).variant;
}
