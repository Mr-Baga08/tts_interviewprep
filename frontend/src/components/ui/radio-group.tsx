// frontend/src/components/ui/radio-group.tsx
'use client'

import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Circle } from 'lucide-react'

import { cn } from '@/lib/utils'

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn('grid gap-2', className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

// Enhanced RadioGroup with label support
interface RadioGroupWithLabelProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  options: Array<{
    value: string
    label: string
    description?: string
    disabled?: boolean
  }>
  orientation?: 'horizontal' | 'vertical'
}

const RadioGroupWithLabels = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupWithLabelProps
>(({ className, options, orientation = 'vertical', ...props }, ref) => {
  return (
    <RadioGroup
      ref={ref}
      className={cn(
        orientation === 'horizontal' ? 'flex flex-wrap gap-6' : 'grid gap-2',
        className
      )}
      {...props}
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <RadioGroupItem 
            value={option.value} 
            id={option.value}
            disabled={option.disabled}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor={option.value}
              className={cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {option.label}
            </label>
            {option.description && (
              <p className="text-xs text-muted-foreground">
                {option.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </RadioGroup>
  )
})
RadioGroupWithLabels.displayName = 'RadioGroupWithLabels'

export { RadioGroup, RadioGroupItem, RadioGroupWithLabels }