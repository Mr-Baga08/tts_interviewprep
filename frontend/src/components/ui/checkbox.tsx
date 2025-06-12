// frontend/src/components/ui/checkbox.tsx
'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'

import { cn } from '@/lib/utils'

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-current')}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

// Enhanced Checkbox with label and description
interface CheckboxWithLabelProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string
  description?: string
  error?: boolean
  indeterminate?: boolean
}

const CheckboxWithLabel = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxWithLabelProps
>(({ className, label, description, error, indeterminate, ...props }, ref) => {
  return (
    <div className="flex items-start space-x-2">
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
          error && 'border-destructive data-[state=checked]:bg-destructive',
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className={cn('flex items-center justify-center text-current')}
        >
          {indeterminate ? (
            <Minus className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {(label || description) && (
        <div className="grid gap-1.5 leading-none">
          {label && (
            <label
              htmlFor={props.id}
              className={cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                error && 'text-destructive'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={cn(
              'text-xs',
              error ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
})
CheckboxWithLabel.displayName = 'CheckboxWithLabel'

// Checkbox group for multiple selections
interface CheckboxGroupProps {
  options: Array<{
    value: string
    label: string
    description?: string
    disabled?: boolean
  }>
  value?: string[]
  onValueChange?: (value: string[]) => void
  className?: string
  orientation?: 'horizontal' | 'vertical'
  error?: boolean
}

const CheckboxGroup = React.forwardRef<
  HTMLDivElement,
  CheckboxGroupProps
>(({ 
  options, 
  value = [], 
  onValueChange, 
  className, 
  orientation = 'vertical',
  error,
  ...props 
}, ref) => {
  const handleCheckedChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onValueChange?.([...value, optionValue])
    } else {
      onValueChange?.(value.filter(v => v !== optionValue))
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        orientation === 'horizontal' ? 'flex flex-wrap gap-6' : 'grid gap-3',
        className
      )}
      {...props}
    >
      {options.map((option) => (
        <CheckboxWithLabel
          key={option.value}
          id={option.value}
          label={option.label}
          description={option.description}
          disabled={option.disabled}
          error={error}
          checked={value.includes(option.value)}
          onCheckedChange={(checked) => 
            handleCheckedChange(option.value, checked as boolean)
          }
        />
      ))}
    </div>
  )
})
CheckboxGroup.displayName = 'CheckboxGroup'

export { Checkbox, CheckboxWithLabel, CheckboxGroup }