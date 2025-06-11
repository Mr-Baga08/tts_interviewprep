import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200",
        success: "bg-success-500 text-white hover:bg-success-600",
        warning: "bg-warning-500 text-white hover:bg-warning-600",
        error: "bg-error-500 text-white hover:bg-error-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className={cn(
            "animate-spin",
            size === "icon" || size === "icon-sm" ? "h-4 w-4" : "mr-2 h-4 w-4"
          )} />
        )}
        
        {!loading && leftIcon && (
          <span className={cn(
            "inline-flex",
            size === "icon" || size === "icon-sm" || size === "icon-lg" ? "" : "mr-2"
          )}>
            {leftIcon}
          </span>
        )}
        
        {(size === "icon" || size === "icon-sm" || size === "icon-lg") ? (
          loading ? null : children
        ) : (
          <span className={loading ? "opacity-0" : ""}>
            {loading && loadingText ? loadingText : children}
          </span>
        )}
        
        {!loading && rightIcon && (
          <span className={cn(
            "inline-flex",
            size === "icon" || size === "icon-sm" || size === "icon-lg" ? "" : "ml-2"
          )}>
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

// Button group component for related actions
interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  spacing?: "none" | "sm" | "md" | "lg"
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", spacing = "sm", children, ...props }, ref) => {
    const spacingClasses = {
      none: "",
      sm: orientation === "horizontal" ? "space-x-2" : "space-y-2",
      md: orientation === "horizontal" ? "space-x-4" : "space-y-4",
      lg: orientation === "horizontal" ? "space-x-6" : "space-y-6",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "flex-row items-center" : "flex-col",
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ButtonGroup.displayName = "ButtonGroup"

// Icon button component
interface IconButtonProps extends Omit<ButtonProps, "leftIcon" | "rightIcon" | "children"> {
  icon: React.ReactNode
  "aria-label": string
  tooltip?: string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = "icon", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        className={className}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

// Loading button variant
interface LoadingButtonProps extends ButtonProps {
  loading: boolean
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        loading={loading}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
LoadingButton.displayName = "LoadingButton"

export { Button, ButtonGroup, IconButton, LoadingButton, buttonVariants }