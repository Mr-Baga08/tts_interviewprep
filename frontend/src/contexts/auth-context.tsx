// frontend/src/contexts/auth-context.tsx
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Import your helper functions
import { checkRole, hasPermission, isAdmin, isPremiumUser, isEmailVerified } from '@/app/api/auth/[...nextauth]/route'

interface AuthUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  role: 'student' | 'professional' | 'admin'
  subscription_plan: 'free' | 'pro' | 'enterprise'
  onboarding_completed: boolean
  email_verified: boolean
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  hasRole: (role: string | string[]) => boolean
  hasPermission: (permission: string) => boolean
  isPremium: boolean
  isVerified: boolean
  isAdmin: boolean
  accessToken: string | null
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  const user: AuthUser | null = session?.user ? {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
    image: session.user.image,
    role: session.user.role,
    subscription_plan: session.user.subscription_plan,
    onboarding_completed: session.user.onboarding_completed,
    email_verified: session.user.email_verified,
  } : null

  const isAuthenticated = !!session?.user && !session.error
  const accessToken = session?.accessToken || null
  const isVerified = user ? isEmailVerified(user) : false
  const isPremium = user ? isPremiumUser(user.subscription_plan) : false
  const userIsAdmin = user ? isAdmin(user.role) : false

  const hasRoleCheck = useCallback((roles: string | string[]): boolean => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    
    // Check if user has any of the required roles
    return roleArray.some(role => checkRole(user.role, role))
  }, [user])

  const hasPermissionCheck = useCallback((permission: string): boolean => {
    if (!user) return false
    return hasPermission(user.role, permission, user.subscription_plan)
  }, [user])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      })
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Error signing out')
    }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      await update()
    } catch (error) {
      console.error('Session refresh error:', error)
    }
  }, [update])

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }

    // Handle token refresh errors
    if (session?.error === 'RefreshAccessTokenError') {
      toast.error('Session expired. Please sign in again.')
      signOut({ callbackUrl: '/auth/login' })
    }
  }, [status, session])

  // Handle onboarding redirect
  useEffect(() => {
    if (isAuthenticated && user && !user.onboarding_completed) {
      // Don't redirect if already on onboarding page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/onboarding')) {
        router.push('/onboarding')
      }
    }
  }, [isAuthenticated, user, router])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading: isLoading || status === 'loading',
      isAuthenticated,
      hasRole: hasRoleCheck,
      hasPermission: hasPermissionCheck,
      isPremium,
      isVerified,
      isAdmin: userIsAdmin,
      accessToken,
      signOut: handleSignOut,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Convenience hooks with your role hierarchy
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  return { isAuthenticated, isLoading }
}

export function useRequireRole(role: string | string[]) {
  const { hasRole, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  const hasRequiredRole = hasRole(role)

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login')
      } else if (!hasRequiredRole) {
        router.push('/403') // Forbidden page
      }
    }
  }, [hasRequiredRole, isLoading, isAuthenticated, router])

  return { hasRole: hasRequiredRole, isLoading }
}

export function useRequirePermission(permission: string) {
  const { hasPermission, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  const hasRequiredPermission = hasPermission(permission)

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login')
      } else if (!hasRequiredPermission) {
        router.push('/403')
      }
    }
  }, [hasRequiredPermission, isLoading, isAuthenticated, router])

  return { hasPermission: hasRequiredPermission, isLoading }
}

export function useRequireVerification() {
  const { isVerified, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login')
      } else if (!isVerified) {
        router.push('/auth/verify-email')
      }
    }
  }, [isVerified, isLoading, isAuthenticated, router])

  return { isVerified, isLoading }
}

export function useRequirePremium() {
  const { isPremium, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login')
      } else if (!isPremium) {
        router.push('/pricing')
      }
    }
  }, [isPremium, isLoading, isAuthenticated, router])

  return { isPremium, isLoading }
}

export function useRequireOnboarding() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (!user.onboarding_completed) {
        router.push('/onboarding')
      }
    }
  }, [user, isLoading, isAuthenticated, router])

  return { onboardingCompleted: user?.onboarding_completed || false, isLoading }
}

// Hook for conditional rendering based on auth state
export function useAuthState() {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    hasRole, 
    hasPermission, 
    isPremium, 
    isVerified, 
    isAdmin 
  } = useAuth()

  return {
    user,
    isLoading,
    isAuthenticated,
    isGuest: !isAuthenticated,
    isStudent: hasRole('student'),
    isProfessional: hasRole('professional'),
    isAdmin,
    isPremium,
    isVerified,
    needsOnboarding: user && !user.onboarding_completed,
    hasRole,
    hasPermission,
  }
}