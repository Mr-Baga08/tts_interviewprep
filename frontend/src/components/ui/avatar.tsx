import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn, getAvatarFallback, stringToColor } from "@/lib/utils"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
        "2xl": "h-20 w-20",
        "3xl": "h-24 w-24",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> &
    VariantProps<typeof avatarVariants>
>(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size }), className)}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Enhanced Avatar component with automatic fallback generation
interface UserAvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string | null
  name?: string | null
  email?: string | null
  className?: string
  showStatus?: boolean
  status?: 'online' | 'offline' | 'away' | 'busy'
  customFallback?: string
  colorFromName?: boolean
}

const UserAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  UserAvatarProps
>(({ 
  src, 
  name, 
  email, 
  className, 
  size, 
  showStatus = false,
  status = 'offline',
  customFallback,
  colorFromName = true,
  ...props 
}, ref) => {
  const displayName = name || email || 'User'
  const fallbackText = customFallback || getAvatarFallback(displayName)
  
  const fallbackStyle = colorFromName && name ? {
    backgroundColor: stringToColor(name),
    color: 'white'
  } : {}

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  }

  const statusSizes = {
    sm: 'h-2 w-2',
    default: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5',
    '2xl': 'h-4 w-4',
    '3xl': 'h-5 w-5',
  }

  return (
    <div className="relative">
      <Avatar ref={ref} className={className} size={size} {...props}>
        {src && <AvatarImage src={src} alt={displayName} />}
        <AvatarFallback style={fallbackStyle}>
          {fallbackText}
        </AvatarFallback>
      </Avatar>
      
      {showStatus && (
        <span 
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-background",
            statusColors[status],
            statusSizes[size || 'default']
          )}
        />
      )}
    </div>
  )
})
UserAvatar.displayName = "UserAvatar"

// Avatar Group component for showing multiple avatars
interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null
    name?: string | null
    email?: string | null
  }>
  max?: number
  size?: VariantProps<typeof avatarVariants>['size']
  className?: string
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ avatars, max = 3, size = 'default', className }, ref) => {
    const visibleAvatars = avatars.slice(0, max)
    const remainingCount = Math.max(0, avatars.length - max)
    
    const sizeClasses = {
      sm: '-ml-2',
      default: '-ml-3',
      lg: '-ml-4',
      xl: '-ml-5',
      '2xl': '-ml-6',
      '3xl': '-ml-7',
    }

    return (
      <div 
        ref={ref}
        className={cn("flex items-center", className)}
      >
        {visibleAvatars.map((avatar, index) => (
          <div
            key={index}
            className={cn(
              "relative ring-2 ring-background",
              index > 0 && sizeClasses[size || 'default']
            )}
            style={{ zIndex: visibleAvatars.length - index }}
          >
            <UserAvatar
              src={avatar.src}
              name={avatar.name}
              email={avatar.email}
              size={size}
            />
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div
            className={cn(
              "relative ring-2 ring-background",
              sizeClasses[size || 'default']
            )}
            style={{ zIndex: 0 }}
          >
            <Avatar size={size}>
              <AvatarFallback className="bg-muted-foreground text-muted">
                +{remainingCount}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    )
  }
)
AvatarGroup.displayName = "AvatarGroup"

export { 
  Avatar, 
  AvatarImage, 
  AvatarFallback, 
  UserAvatar, 
  AvatarGroup,
  avatarVariants 
}