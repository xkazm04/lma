'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  /** Page title - main heading */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[];
  /** Back button href - shows back arrow when provided */
  backHref?: string;
  /** Custom back handler (overrides backHref navigation) */
  onBack?: () => void;
  /** Icon to display alongside title */
  icon?: React.ReactNode;
  /** Badge to display alongside title */
  badge?: React.ReactNode;
  /** Status badges to show above title */
  statusBadges?: React.ReactNode;
  /** Action buttons on the right side */
  actions?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Compact mode - reduces spacing for dense UIs */
  compact?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

const Breadcrumbs = memo(function Breadcrumbs({
  items
}: {
  items: BreadcrumbItem[]
}) {
  if (items.length === 0) return null;

  return (
    <nav
      className="flex items-center gap-1.5 text-sm mb-1"
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={item.label}>
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-zinc-500 hover:text-zinc-900 transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate max-w-[200px]",
                  isLast ? "text-zinc-900 font-medium" : "text-zinc-500"
                )}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
});

const BackButton = memo(function BackButton({
  href,
  onClick
}: {
  href?: string;
  onClick?: () => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="h-9 w-9 shrink-0 -ml-2"
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4" />
    </Button>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * PageHeader - Universal page header component
 *
 * Based on landing page typography with clean, modern styling.
 * Supports breadcrumbs, back navigation, icons, badges, and action buttons.
 *
 * @example
 * // Simple header
 * <PageHeader title="Dashboard" subtitle="Overview of your portfolio" />
 *
 * @example
 * // With breadcrumbs and actions
 * <PageHeader
 *   title="Covenant Tracking"
 *   subtitle="Monitor covenant tests across all facilities"
 *   breadcrumbs={[
 *     { label: 'Compliance', href: '/compliance' },
 *     { label: 'Covenants' }
 *   ]}
 *   actions={<Button>New Covenant</Button>}
 * />
 *
 * @example
 * // With back button and icon
 * <PageHeader
 *   title="Create New Deal"
 *   subtitle="Set up a new negotiation workspace"
 *   backHref="/deals"
 *   icon={<Handshake className="w-6 h-6 text-purple-600" />}
 *   badge={<Badge variant="info">Draft</Badge>}
 * />
 */
export const PageHeader = memo(function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  backHref,
  onBack,
  icon,
  badge,
  statusBadges,
  actions,
  className,
  compact = false,
  testId,
}: PageHeaderProps) {
  const showBackButton = backHref || onBack;
  const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;

  return (
    <header
      className={cn(
        'animate-in fade-in slide-in-from-top-4 duration-500',
        compact ? 'mb-4' : 'mb-6',
        className
      )}
      data-testid={testId || 'page-header'}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side: Back button + Content */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {showBackButton && (
            <BackButton href={backHref} onClick={onBack} />
          )}

          <div className="min-w-0 flex-1">
            {/* Breadcrumbs */}
            {hasBreadcrumbs && <Breadcrumbs items={breadcrumbs} />}

            {/* Status badges above title */}
            {statusBadges && (
              <div className="flex items-center gap-2 mb-1.5">
                {statusBadges}
              </div>
            )}

            {/* Title row with icon and badge */}
            <div className="flex items-center gap-3 flex-wrap">
              {icon && (
                <div className="shrink-0">
                  {icon}
                </div>
              )}

              <h1
                className={cn(
                  'font-bold tracking-tight text-zinc-900',
                  compact ? 'text-xl' : 'text-2xl'
                )}
              >
                {title}
              </h1>

              {badge && (
                <div className="shrink-0">
                  {badge}
                </div>
              )}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p
                className={cn(
                  'text-zinc-500 mt-1',
                  compact ? 'text-xs' : 'text-sm'
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
});

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

/**
 * PageHeaderActions - Wrapper for consistent action button styling
 */
export const PageHeaderActions = memo(function PageHeaderActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  );
});

/**
 * PageHeaderBadge - Styled badge for page headers
 */
export const PageHeaderBadge = memo(function PageHeaderBadge({
  children,
  variant = 'secondary',
  icon,
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge variant={variant} className={cn('gap-1', className)}>
      {icon}
      {children}
    </Badge>
  );
});

export default PageHeader;
