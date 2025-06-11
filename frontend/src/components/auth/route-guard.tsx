// frontend/src/components/auth/route-guard.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import type { UserRole } from '@/types/auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: UserRole | UserRole[]
  requirePermission?: string
  requirePremium?: boolean
  requireVerification?: boolean
  fallback?: React.ReactNode
  redirectTo?: string
  loadingComponent?: React.ReactNode
}

export function RouteGuard({
  children,
  requireAuth = false,
  requireRole,
  requirePermission,
  requirePremium = false,
  requireVerification = false,
  fallback,
  redirectTo,
  loadingComponent,
}: RouteGuardProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    hasRole, 
    hasPermission: checkPermission,
    isPremium,
    isVerified
  } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo || '/auth/login')
      return
    }

    // Check email verification
    if (requireVerification && !isVerified) {
      router.push(redirectTo || '/auth/verify-email')
      return
    }

    // Check role
    if (requireRole && !hasRole(requireRole)) {
      router.push(redirectTo || '/403')
      return
    }

    // Check permission
    if (requirePermission && !checkPermission(requirePermission)) {
      router.push(redirectTo || '/403')
      return
    }

    // Check premium subscription
    if (requirePremium && !isPremium) {
      router.push(redirectTo || '/pricing')
      return
    }
  }, [
    isLoading,
    isAuthenticated,
    isVerified,
    requireAuth,
    requireRole,
    requirePermission,
    requirePremium,
    requireVerification,
    hasRole,
    checkPermission,
    isPremium,
    router,
    redirectTo
  ])

  if (isLoading) {
    return loadingComponent || fallback || <LoadingSpinner />
  }

  if (requireAuth && !isAuthenticated) {
    return fallback || null
  }

  if (requireVerification && !isVerified) {
    return fallback || null
  }

  if (requireRole && !hasRole(requireRole)) {
    return fallback || null
  }

  if (requirePermission && !checkPermission(requirePermission)) {
    return fallback || null
  }

  if (requirePremium && !isPremium) {
    return fallback || null
  }

  return <>{children}</>
}

// Convenience components for common patterns
export function RequireAuth({ 
  children, 
  fallback,
  redirectTo = '/auth/login',
  ...props 
}: Omit<RouteGuardProps, 'requireAuth'>) {
  return (
    <RouteGuard 
      requireAuth 
      redirectTo={redirectTo}
      fallback={fallback}
      {...props}
    >
      {children}
    </RouteGuard>
  )
}

export function RequireRole({ 
  role, 
  children, 
  fallback,
  redirectTo = '/403',
  ...props 
}: { role: UserRole | UserRole[] } & Omit<RouteGuardProps, 'requireRole'>) {
  return (
    <RouteGuard 
      requireAuth
      requireRole={role} 
      redirectTo={redirectTo}
      fallback={fallback}
      {...props}
    >
      {children}
    </RouteGuard>
  )
}

export function RequireAdmin({ 
  children, 
  fallback,
  redirectTo = '/403',
  ...props 
}: Omit<RouteGuardProps, 'requireRole'>) {
  return (
    <RouteGuard 
      requireAuth
      requireRole="admin" 
      redirectTo={redirectTo}
      fallback={fallback}
      {...props}
    >
      {children}
    </RouteGuard>
  )
}

export function RequireStudent({ 
  children, 
  fallback,
  redirectTo = '/403',
  ...props 
}: Omit<RouteGuardProps, 'requireRole'>) {
  return (
    <RouteGuard 
      requireAuth
      requireRole={['student', 'professional', 'admin']} 
      redirectTo={redirectTo}
      fallback={fallback}
      {...props}
    >
      {children}
    </RouteGuard>
  )
}

export function RequireProfessional({ 
  children, 
  fallback,
  redirectTo = '/403',
  ...props 
}: Omit<RouteGuardProps, 'requireRole'>) {
  return (
    <RouteGuard 
      requireAuth
      requireRole={['professional', 'admin']} 
      redirectTo={redirectTo}
      fallback={fallback}
      {...props}
    >
      {children}
    </RouteGuard>
  )
}

export function RequirePremium({ 
  children, 
  fallback,
  redirectTo = '/pricing',
  ...props 
}: Omit<RouteGuardProps, 'requirePremium'>) {
  return (
    <RouteGuard 
      requireAuth
      requirePremium 
      redirectTo={redirectTo}
      fallback={fallback}
      {...props}
    >
      {children}
    </RouteGuard>
  )
}

export function RequireVerification({ 
  children, 
  fallback,
  redirectTo = '/auth/verify-email',
  ...props 
}: Omit<RouteGuardProps, 'requireVerification'>) {
  return (
    <RouteGuard 
      requireAuth
      requireVerification 
      redirectTo={redirectTo}
      fallback={fallback}
      {...props}
    >
      {children}
    </RouteGuard>
  )
}

export function RequirePermission({ 
  permission, 
  children, 
  fallback,
  redirectTo = '/403',
  ...props 
}: { permission: string } & Omit<RouteGuardProps, 'requirePermission'>) {
  return (
    <RouteGuard 
      requireAuth
      requirePermission={permission} 
      redirectTo={redirectTo}
      fallback={fallback}
      {...props}
    >
      {children}
    </RouteGuard>
  )
}

// Combined requirements components
export function RequireProfessionalWithVerification({ 
  children, 
  fallback,
  ...props 
}: Omit<RouteGuardProps, 'requireRole' | 'requireVerification'>) {
  return (
    <RouteGuard 
      requireAuth
      requireRole={['professional', 'admin']}
      requireVerification
      fallback={fallback}
      {...props}
    >
      {children}
    </RouteGuard>
  )
}

export function RequirePremiumWithVerification({ 
  children, 
  fallback,
  ...props 
}: Omit<RouteGuardProps, 'requirePremium' | 'requireVerification'>) {
  return (
    <RouteGuard 
      requireAuth
      requirePremium
      requireVerification
      fallback={fallback}
      {...props}
    >
      {children}
    </RouteGuard>
  )
}

// Conditional rendering component that doesn't redirect
export function ShowIf({
  condition,
  role,
  permission,
  premium,
  verified,
  authenticated,
  children,
  fallback,
}: {
  condition?: boolean
  role?: UserRole | UserRole[]
  permission?: string
  premium?: boolean
  verified?: boolean
  authenticated?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { 
    isAuthenticated, 
    isLoading, 
    hasRole, 
    hasPermission,
    isPremium,
    isVerified
  } = useAuth()

  if (isLoading) {
    return fallback || null
  }

  // Check custom condition
  if (condition !== undefined && !condition) {
    return fallback || null
  }

  // Check authentication
  if (authenticated !== undefined && isAuthenticated !== authenticated) {
    return fallback || null
  }

  // Check role
  if (role && !hasRole(role)) {
    return fallback || null
  }

  // Check permission
  if (permission && !hasPermission(permission)) {
    return fallback || null
  }

  // Check premium
  if (premium !== undefined && isPremium !== premium) {
    return fallback || null
  }

  // Check verification
  if (verified !== undefined && isVerified !== verified) {
    return fallback || null
  }

  return <>{children}</>
}

// Utility component for different content based on auth state
export function AuthContent({
  authenticated,
  guest,
  student,
  professional,
  admin,
  premium,
  free,
  verified,
  unverified,
}: {
  authenticated?: React.ReactNode
  guest?: React.ReactNode
  student?: React.ReactNode
  professional?: React.ReactNode
  admin?: React.ReactNode
  premium?: React.ReactNode
  free?: React.ReactNode
  verified?: React.ReactNode
  unverified?: React.ReactNode
}) {
  const { 
    isAuthenticated, 
    isLoading, 
    hasRole, 
    isPremium,
    isVerified
  } = useAuth()

  if (isLoading) {
    return null
  }

  // Check verification state first
  if (unverified && !isVerified) {
    return <>{unverified}</>
  }
  if (verified && isVerified) {
    return <>{verified}</>
  }

  // Check subscription state
  if (premium && isPremium) {
    return <>{premium}</>
  }
  if (free && !isPremium) {
    return <>{free}</>
  }

  // Check role-specific content
  if (admin && hasRole('admin')) {
    return <>{admin}</>
  }
  if (professional && hasRole(['professional', 'admin'])) {
    return <>{professional}</>
  }
  if (student && hasRole(['student', 'professional', 'admin'])) {
    return <>{student}</>
  }

  // Check authentication state
  if (authenticated && isAuthenticated) {
    return <>{authenticated}</>
  }
  if (guest && !isAuthenticated) {
    return <>{guest}</>
  }

  return null
}