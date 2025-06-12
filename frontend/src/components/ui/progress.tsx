'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

/**
 * Displays an indicator showing the completion progress of a task.
 * This component is built on top of the Radix UI Progress primitive for accessibility.
 */
const Progress = React.forwardRef<
  // The type of element that the ref will be forwarded to (the main div).
  React.ElementRef<typeof ProgressPrimitive.Root>,
  // The type of props that this component accepts. It includes all standard props for the Radix Progress component.
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  // The root container of the progress bar.
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
      className // Allows for additional classes to be passed in from the parent.
    )}
    {...props}
  >
    {/* The indicator that visually represents the progress.
      Its width is controlled via a CSS transform based on the `value` prop.
      This is handled automatically by the Radix component.
    */}
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }