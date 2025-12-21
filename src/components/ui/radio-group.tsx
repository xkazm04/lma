'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn('grid gap-2', className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-zinc-300 text-zinc-900 ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-zinc-900',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

interface RadioOptionProps {
  value: string;
  title: string;
  description: string;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

const RadioOption = React.forwardRef<HTMLDivElement, RadioOptionProps>(
  ({ value, title, description, disabled, className, 'data-testid': testId }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center space-x-3 p-4 border rounded-lg transition-colors',
          disabled ? 'opacity-50' : 'hover:bg-zinc-50',
          className
        )}
        data-testid={testId}
      >
        <RadioGroupItem
          value={value}
          id={value}
          disabled={disabled}
          data-testid={testId ? `${testId}-radio` : undefined}
        />
        <Label htmlFor={value} className="flex-1 cursor-pointer">
          <span className="font-medium">{title}</span>
          <p className="text-sm text-zinc-500">{description}</p>
        </Label>
      </div>
    );
  }
);
RadioOption.displayName = 'RadioOption';

export { RadioGroup, RadioGroupItem, RadioOption };
