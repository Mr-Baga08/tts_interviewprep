import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-success-500 text-white hover:bg-success-600",
        warning: "border-transparent bg-warning-500 text-white hover:bg-warning-600",
        info: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
        // Difficulty variants
        easy: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        medium: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        hard: "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
        expert: "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200",
        // Status variants
        active: "border-transparent bg-green-100 text-green-800",
        inactive: "border-transparent bg-gray-100 text-gray-800",
        pending: "border-transparent bg-yellow-100 text-yellow-800",
        completed: "border-transparent bg-blue-100 text-blue-800",
        failed: "border-transparent bg-red-100 text-red-800",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  dot?: boolean
}

function Badge({ className, variant, size, icon, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {icon && (
        <span className="mr-1 h-3 w-3">
          {icon}
        </span>
      )}
      {children}
    </div>
  )
}

// Specialized badge components
interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  className?: string
}

function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  return (
    <Badge variant={difficulty} className={className}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </Badge>
  )
}

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed'
  className?: string
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
  }

  return (
    <Badge variant={status} className={className} dot>
      {statusLabels[status]}
    </Badge>
  )
}

interface ScoreBadgeProps {
  score: number
  maxScore?: number
  showPercentage?: boolean
  className?: string
}

function ScoreBadge({ score, maxScore = 100, showPercentage = true, className }: ScoreBadgeProps) {
  const percentage = Math.round((score / maxScore) * 100)
  
  let variant: 'success' | 'info' | 'warning' | 'destructive'
  if (percentage >= 90) variant = 'success'
  else if (percentage >= 70) variant = 'info'
  else if (percentage >= 50) variant = 'warning'
  else variant = 'destructive'

  return (
    <Badge variant={variant} className={className}>
      {showPercentage ? `${percentage}%` : `${score}/${maxScore}`}
    </Badge>
  )
}

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  className?: string
}

function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const priorityConfig = {
    low: { variant: 'secondary' as const, label: 'Low' },
    medium: { variant: 'warning' as const, label: 'Medium' },
    high: { variant: 'destructive' as const, label: 'High' },
    urgent: { variant: 'destructive' as const, label: 'Urgent' },
  }

  const config = priorityConfig[priority]

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

export { Badge, DifficultyBadge, StatusBadge, ScoreBadge, PriorityBadge, badgeVariants }