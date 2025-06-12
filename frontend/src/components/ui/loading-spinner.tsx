// frontend/src/components/ui/loading-spinner.tsx
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'muted'
}

export function LoadingSpinner({ 
  className, 
  size = 'md', 
  variant = 'primary',
  ...props 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
  }

  const variantClasses = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    muted: 'border-muted-foreground',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-transparent border-t-current',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
