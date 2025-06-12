// frontend/src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import type { NextAuthOptions, Profile } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { apiClient } from '@/lib/api-client' 

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: 'student' | 'professional' | 'admin'
      subscription_plan: 'free' | 'pro' | 'enterprise'
      onboarding_completed: boolean
      email_verified: boolean
    }
    accessToken?: string | null
    error?: string
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: 'student' | 'professional' | 'admin'
    subscription_plan: 'free' | 'pro' | 'enterprise'
    onboarding_completed: boolean
    email_verified: boolean
    access_token?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'student' | 'professional' | 'admin'
    subscription_plan: 'free' | 'pro' | 'enterprise'
    onboarding_completed: boolean
    email_verified: boolean
    accessToken?: string | null
    refreshToken?: string | null
    accessTokenExpires: number
    error?: string
  }
}

// Extended Profile interface to handle provider-specific properties
interface ExtendedProfile extends Profile {
  sub?: string
  id?: string
  picture?: string
  avatar_url?: string
  login?: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    // OAuth providers
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    
    // Credentials provider for backend authentication
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'john@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing email or password in credentials')
            return null
          }

          console.log('Attempting to authenticate user:', credentials.email)

          // Use the API client method for authentication
          const authData = await apiClient.loginForNextAuth(
            credentials.email, 
            credentials.password
          )

          if (!authData?.access_token) {
            console.log('No access token received from backend')
            return null
          }

          console.log('Successfully authenticated, fetching user profile')

          // Get detailed user profile with the access token
          const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
            headers: {
              'Authorization': `Bearer ${authData.access_token}`,
              'Content-Type': 'application/json',
            },
          })

          if (!userResponse.ok) {
            console.log('Failed to fetch user profile:', userResponse.status)
            return null
          }

          const userData = await userResponse.json()
          console.log('User profile fetched successfully for:', userData.email)

          return {
            id: userData.id,
            email: userData.email,
            name: userData.first_name 
              ? `${userData.first_name} ${userData.last_name || ''}`.trim()
              : userData.display_name || userData.email,
            image: userData.avatar_url || null,
            role: userData.role || 'student',
            subscription_plan: userData.subscription_plan || 'free',
            onboarding_completed: userData.onboarding_completed || false,
            email_verified: userData.is_verified || false,
            access_token: authData.access_token,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/onboarding',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log('SignIn callback triggered for provider:', account?.provider)

        // For OAuth providers, handle user creation/login with backend
        if (account?.provider === 'google' || account?.provider === 'github') {
          const extendedProfile = profile as ExtendedProfile
          
          console.log('Processing OAuth sign-in for:', extendedProfile?.email)

          // Use the API client method for OAuth callback
          const response = await apiClient.handleOAuthCallback(
            account.provider,
            account.access_token || '',
            account.id_token || undefined,
            {
              id: extendedProfile?.sub || extendedProfile?.id || user.id,
              email: extendedProfile?.email || user.email || '',
              name: extendedProfile?.name || user.name || '',
              image: extendedProfile?.picture || extendedProfile?.avatar_url || user.image || undefined,
            }
          )

          if (response?.access_token && response?.user) {
            console.log('OAuth backend integration successful for:', response.user.email)

            // Update user object with backend data
            user.id = response.user.id
            user.role = response.user.role || 'student'
            user.subscription_plan = response.user.subscription_plan || 'free'
            user.onboarding_completed = response.user.onboarding_completed || false
            user.email_verified = response.user.is_verified || true // OAuth users are typically verified
            user.access_token = response.access_token
            
            return true
          }

          console.log('OAuth backend integration failed')
          return false
        }

        // For credentials provider, user is already authenticated
        if (account?.provider === 'credentials') {
          console.log('Credentials authentication successful for:', user.email)
          return true
        }

        console.log('Unknown provider or missing account:', account?.provider)
        return false
      } catch (error) {
        console.error('Sign in callback error:', error)
        return false
      }
    },

    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in - populate token with user data
      if (account && user) {
        console.log('JWT callback: Initial sign in for user:', user.email)
        return {
          ...token,
          id: user.id,
          role: user.role,
          subscription_plan: user.subscription_plan,
          onboarding_completed: user.onboarding_completed,
          email_verified: user.email_verified,
          accessToken: user.access_token || null,
          refreshToken: account.refresh_token || null,
          accessTokenExpires: account.expires_at 
            ? account.expires_at * 1000 
            : Date.now() + 7 * 24 * 60 * 60 * 1000,
        }
      }

      // Handle session update trigger (when user data changes)
      if (trigger === 'update' && session) {
        console.log('JWT callback: Session update triggered')
        return {
          ...token,
          ...session,
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token
      }

      console.log('JWT callback: Access token expired, attempting refresh')

      // Access token has expired, try to refresh it
      try {
        if (token.refreshToken) {
          const response = await apiClient.refreshToken(token.refreshToken)

          if (response?.access_token) {
            console.log('Token refresh successful')
            return {
              ...token,
              accessToken: response.access_token,
              accessTokenExpires: Date.now() + 7 * 24 * 60 * 60 * 1000,
              refreshToken: response.refresh_token || token.refreshToken,
              error: undefined, // Clear any previous errors
            }
          }
        }
      } catch (error) {
        console.error('Token refresh error:', error)
      }

      console.log('Token refresh failed, marking token as expired')
      // Return token with error flag
      return {
        ...token,
        error: 'RefreshAccessTokenError',
      }
    },

    async session({ session, token }) {
      if (token) {
        // Populate session with token data
        session.user.id = token.id
        session.user.role = token.role
        session.user.subscription_plan = token.subscription_plan
        session.user.onboarding_completed = token.onboarding_completed
        session.user.email_verified = token.email_verified
        session.accessToken = token.accessToken
        
        // Pass token errors to session for frontend handling
        if (token.error) {
          session.error = token.error
        }
      }

      return session
    },

    async redirect({ url, baseUrl }) {
      // Handle custom redirect logic
      console.log('Redirect callback:', { url, baseUrl })
      
      // Allows relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url
      }
      
      // Default redirect to base URL
      return baseUrl
    },
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('SignIn event:', {
        userEmail: user.email,
        provider: account?.provider,
        isNewUser,
      })
      
      // Track sign in event for analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'login', {
          method: account?.provider || 'credentials',
          user_id: user.id,
          is_new_user: isNewUser,
        })
      }

      // You could add additional logic here like:
      // - Sending welcome emails for new users
      // - Updating login statistics
      // - Triggering webhooks
    },

    async signOut({ token }) {
      console.log('SignOut event for user:', token.email)
      
      // Track sign out event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'logout', {
          user_id: token.id,
        })
      }
      
      // Invalidate backend session
      try {
        await apiClient.logout()
        console.log('Backend session invalidated successfully')
      } catch (error) {
        console.error('Backend logout error:', error)
      }
    },

    async session({ session, token }) {
      // Optional: Update last active time (be careful about performance)
      // Consider rate limiting this to avoid too many API calls
      const shouldUpdateActivity = typeof window !== 'undefined' && 
        window.sessionStorage.getItem('last_activity_update')
      
      const now = Date.now()
      const lastUpdate = shouldUpdateActivity ? parseInt(shouldUpdateActivity) : 0
      
      // Only update activity once per hour
      if (now - lastUpdate > 60 * 60 * 1000) {
        try {
          await apiClient.updateProfile({ 
            last_active_at: new Date().toISOString() 
          })
          
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('last_activity_update', now.toString())
          }
        } catch (error) {
          // Silently fail - this is not critical
          console.debug('Failed to update last activity:', error)
        }
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',

  secret: process.env.NEXTAUTH_SECRET,

  // Additional configuration for better error handling
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', code, metadata)
      }
    },
  },
}

// Enhanced helper functions for role-based access control
export const checkRole = (userRole: string, requiredRole: string | string[]): boolean => {
  const roleHierarchy = {
    student: 0,
    professional: 1,
    admin: 2,
  }

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] ?? -1
  
  // Handle multiple required roles
  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => {
      const requiredLevel = roleHierarchy[role as keyof typeof roleHierarchy] ?? 99
      return userLevel >= requiredLevel
    })
  }
  
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] ?? 99
  return userLevel >= requiredLevel
}

export const hasPermission = (
  userRole: string, 
  permission: string,
  subscriptionPlan?: string
): boolean => {
  // Define permissions by role
  const permissions = {
    student: [
      'read_challenges',
      'submit_challenges',
      'read_interviews',
      'create_interviews',
      'read_tests',
      'take_tests',
      'read_resumes',
      'create_resumes',
      'update_resumes',
      'read_feedback',
    ],
    professional: [
      'read_challenges',
      'submit_challenges',
      'read_interviews',
      'create_interviews',
      'read_tests',
      'take_tests',
      'read_resumes',
      'create_resumes',
      'update_resumes',
      'read_feedback',
      'advanced_analytics',
      'export_data',
    ],
    admin: [
      'read_users',
      'create_users',
      'update_users',
      'delete_users',
      'read_challenges',
      'create_challenges',
      'update_challenges',
      'delete_challenges',
      'read_interviews',
      'create_interviews',
      'update_interviews',
      'delete_interviews',
      'read_analytics',
      'create_reports',
      'manage_content',
      'manage_system',
      'view_all_data',
    ],
  }

  const rolePermissions = permissions[userRole as keyof typeof permissions] || []
  
  // Check basic role permission
  if (rolePermissions.includes(permission)) {
    return true
  }

  // Check subscription-based permissions
  if (subscriptionPlan === 'pro' || subscriptionPlan === 'enterprise') {
    const premiumPermissions = [
      'unlimited_interviews',
      'advanced_challenges',
      'priority_support',
      'detailed_analytics',
      'custom_branding',
      'api_access',
    ]
    
    if (premiumPermissions.includes(permission)) {
      return true
    }
  }

  // Enterprise-only permissions
  if (subscriptionPlan === 'enterprise') {
    const enterprisePermissions = [
      'bulk_operations',
      'advanced_integrations',
      'custom_domains',
      'sso_access',
    ]
    
    if (enterprisePermissions.includes(permission)) {
      return true
    }
  }

  return false
}

// Enhanced type guards with better error handling
export const isAdmin = (role: string): boolean => role === 'admin'
export const isPremiumUser = (plan: string): boolean => ['pro', 'enterprise'].includes(plan)
export const isEmailVerified = (user: any): boolean => Boolean(user?.email_verified)

// Additional utility functions
export const getUserDisplayName = (user: any): string => {
  return user?.name || user?.email || 'Unknown User'
}

export const canAccessFeature = (
  userRole: string, 
  subscriptionPlan: string, 
  feature: string
): boolean => {
  const featureRequirements = {
    advanced_interviews: { roles: ['professional', 'admin'], plans: ['pro', 'enterprise'] },
    unlimited_challenges: { roles: ['professional', 'admin'], plans: ['pro', 'enterprise'] },
    analytics_dashboard: { roles: ['professional', 'admin'], plans: ['free', 'pro', 'enterprise'] },
    admin_panel: { roles: ['admin'], plans: ['free', 'pro', 'enterprise'] },
  }

  const requirement = featureRequirements[feature as keyof typeof featureRequirements]
  if (!requirement) return false

  const hasRole = requirement.roles.includes(userRole)
  const hasPlan = requirement.plans.includes(subscriptionPlan)

  return hasRole && hasPlan
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }