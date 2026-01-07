'use client';

import React, { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type ListItemVariant = 'default' | 'bordered' | 'accent' | 'ghost';
export type ListItemSize = 'sm' | 'md' | 'lg';
export type AccentColor = 'red' | 'amber' | 'green' | 'blue' | 'purple' | 'zinc';

export interface ListItemProps {
  /** Main title text */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Icon element to display on the left */
  icon?: React.ReactNode;
  /** Background color for icon container */
  iconBgClass?: string;
  /** Trailing content (badges, buttons, etc.) */
  trailing?: React.ReactNode;
  /** Badge content (shorthand for simple badge) */
  badge?: string;
  /** Badge variant */
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  /** Click handler */
  onClick?: () => void;
  /** Show chevron arrow on the right */
  showChevron?: boolean;
  /** Visual variant */
  variant?: ListItemVariant;
  /** Size variant */
  size?: ListItemSize;
  /** Accent color for 'accent' variant (left border color) */
  accentColor?: AccentColor;
  /** Disable hover effects */
  disableHover?: boolean;
  /** Animation index for staggered entrance */
  index?: number;
  /** Additional className */
  className?: string;
  /** Test ID */
  testId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_CLASSES = {
  sm: {
    container: 'p-2 gap-2',
    icon: 'p-1.5',
    iconSize: 'w-3.5 h-3.5',
    title: 'text-xs font-medium',
    subtitle: 'text-[10px]',
  },
  md: {
    container: 'p-3 gap-3',
    icon: 'p-2',
    iconSize: 'w-4 h-4',
    title: 'text-sm font-medium',
    subtitle: 'text-xs',
  },
  lg: {
    container: 'p-4 gap-4',
    icon: 'p-2.5',
    iconSize: 'w-5 h-5',
    title: 'text-base font-medium',
    subtitle: 'text-sm',
  },
};

const ACCENT_COLORS = {
  red: 'border-l-red-500',
  amber: 'border-l-amber-500',
  green: 'border-l-green-500',
  blue: 'border-l-blue-500',
  purple: 'border-l-purple-500',
  zinc: 'border-l-zinc-400',
};

const VARIANT_CLASSES = {
  default: 'bg-zinc-50',
  bordered: 'bg-white border border-zinc-200',
  accent: 'bg-white border-l-4',
  ghost: 'bg-transparent',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ListItem - Universal list item component
 *
 * Standardized list item with icon, title/subtitle, trailing content,
 * and multiple visual variants for consistent styling across the application.
 *
 * @example
 * // Basic usage
 * <ListItem
 *   title="Document uploaded"
 *   subtitle="2 minutes ago"
 *   icon={<FileText className="w-4 h-4" />}
 * />
 *
 * @example
 * // With accent and badge
 * <ListItem
 *   title="Critical Alert"
 *   subtitle="Covenant breach detected"
 *   icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
 *   variant="accent"
 *   accentColor="red"
 *   badge="Critical"
 *   badgeVariant="destructive"
 * />
 *
 * @example
 * // Clickable with trailing content
 * <ListItem
 *   title="Upcoming deadline"
 *   subtitle="Due in 3 days"
 *   icon={<Calendar className="w-4 h-4" />}
 *   trailing={<span className="text-xs text-amber-600">3 days</span>}
 *   onClick={() => handleClick()}
 *   showChevron
 * />
 */
export const ListItem = memo(function ListItem({
  title,
  subtitle,
  icon,
  iconBgClass = 'bg-zinc-100',
  trailing,
  badge,
  badgeVariant = 'secondary',
  onClick,
  showChevron = false,
  variant = 'default',
  size = 'md',
  accentColor = 'blue',
  disableHover = false,
  index = 0,
  className,
  testId,
}: ListItemProps) {
  const sizeClasses = SIZE_CLASSES[size];
  const isClickable = Boolean(onClick);
  const showChevronIcon = showChevron || isClickable;

  const Component = isClickable ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex items-start w-full rounded-lg transition-all duration-200',
        'animate-in fade-in slide-in-from-bottom-2',
        sizeClasses.container,
        VARIANT_CLASSES[variant],
        variant === 'accent' && ACCENT_COLORS[accentColor],
        isClickable && 'cursor-pointer text-left',
        !disableHover && 'hover:bg-zinc-100',
        !disableHover && variant === 'bordered' && 'hover:border-zinc-300',
        !disableHover && variant === 'accent' && 'hover:bg-zinc-50',
        className
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: 'both',
      }}
      data-testid={testId}
    >
      {/* Icon */}
      {icon && (
        <div
          className={cn(
            'rounded-lg shrink-0 transition-transform',
            sizeClasses.icon,
            iconBgClass,
            isClickable && 'group-hover:scale-110'
          )}
        >
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-zinc-900 truncate', sizeClasses.title)}>
          {title}
        </p>
        {subtitle && (
          <p className={cn('text-zinc-500 truncate mt-0.5', sizeClasses.subtitle)}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Badge */}
      {badge && (
        <Badge variant={badgeVariant} className="shrink-0 ml-2">
          {badge}
        </Badge>
      )}

      {/* Trailing */}
      {trailing && (
        <div className="shrink-0 ml-2">
          {trailing}
        </div>
      )}

      {/* Chevron */}
      {showChevronIcon && (
        <ChevronRight
          className={cn(
            'w-4 h-4 text-zinc-400 shrink-0 transition-transform',
            isClickable && 'group-hover:translate-x-0.5'
          )}
        />
      )}
    </Component>
  );
});

// ============================================================================
// LIST CONTAINER
// ============================================================================

export interface ListContainerProps {
  /** List items */
  children: React.ReactNode;
  /** Spacing between items */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /** Add dividers between items */
  dividers?: boolean;
  /** Additional className */
  className?: string;
  /** Test ID */
  testId?: string;
}

const SPACING_CLASSES = {
  none: '',
  sm: 'space-y-1',
  md: 'space-y-2',
  lg: 'space-y-3',
};

/**
 * ListContainer - Wrapper for ListItem components with consistent spacing
 */
export const ListContainer = memo(function ListContainer({
  children,
  spacing = 'md',
  dividers = false,
  className,
  testId,
}: ListContainerProps) {
  return (
    <div
      className={cn(
        dividers ? 'divide-y divide-zinc-100' : SPACING_CLASSES[spacing],
        className
      )}
      data-testid={testId}
    >
      {children}
    </div>
  );
});

// ============================================================================
// EMPTY STATE
// ============================================================================

export interface ListEmptyStateProps {
  /** Main message */
  message: string;
  /** Optional description */
  description?: string;
  /** Icon element */
  icon?: React.ReactNode;
  /** Action button */
  action?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * ListEmptyState - Empty state for lists
 */
export const ListEmptyState = memo(function ListEmptyState({
  message,
  description,
  icon,
  action,
  className,
}: ListEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 text-center',
        className
      )}
    >
      {icon && (
        <div className="p-3 rounded-full bg-zinc-100 mb-3">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-zinc-900">{message}</p>
      {description && (
        <p className="text-xs text-zinc-500 mt-1 max-w-[250px]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
});

export default ListItem;
