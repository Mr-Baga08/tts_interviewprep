// frontend/src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { apiClient } from '@/lib/api-client' // ✅ Fixed import

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
    accessToken: string
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
    accessToken: string
    refreshToken: string
    accessTokenExpires: number
  }
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
            return null
          }

          // ✅ Use the cleaned up API client method
          const authData = await apiClient.loginForNextAuth(
            credentials.email, 
            credentials.password
          )

          if (authData?.access_token) {
            // Get user profile
            const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
              headers: {
                'Authorization': `Bearer ${authData.access_token}`,
              },
            })

            if (!userResponse.ok) {
              return null
            }

            const userData = await userResponse.json()

            return {
              id: userData.id,
              email: userData.email,
              name: userData.first_name 
                ? `${userData.first_name} ${userData.last_name || ''}`.trim()
                : userData.display_name || userData.email,
              image: userData.avatar_url,
              role: userData.role,
              subscription_plan: userData.subscription_plan || 'free',
              onboarding_completed: userData.onboarding_completed || false,
              email_verified: userData.is_verified || false,
              access_token: authData.access_token,
            }
          }

          return null
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
  },

  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/onboarding',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // For OAuth providers, handle user creation/login with backend
        if (account?.provider === 'google' || account?.provider === 'github') {
          // ✅ Use the cleaned up API client method
          const response = await apiClient.handleOAuthCallback(
            account.provider,
            account.access_token!,
            account.id_token,
            {
              id: profile?.sub || profile?.id,
              email: profile?.email || user.email,
              name: profile?.name || user.name,
              image: profile?.picture || profile?.avatar_url || user.image,
            }
          )

          if (response?.access_token && response?.user) {
            // Update user object with backend data
            user.id = response.user.id
            user.role = response.user.role
            user.subscription_plan = response.user.subscription_plan || 'free'
            user.onboarding_completed = response.user.onboarding_completed || false
            user.email_verified = response.user.is_verified || true // OAuth users are typically verified
            user.access_token = response.access_token
            
            return true
          }

          return false
        }

        // For credentials provider, user is already authenticated
        if (account?.provider === 'credentials') {
          return true
        }

        return false
      } catch (error) {
        console.error('Sign in error:', error)
        return false
      }
    },

    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          subscription_plan: user.subscription_plan,
          onboarding_completed: user.onboarding_completed,
          email_verified: user.email_verified,
          accessToken: user.access_token || '',
          refreshToken: account.refresh_token || '',
          accessTokenExpires: account.expires_at 
            ? account.expires_at * 1000 
            : Date.now() + 7 * 24 * 60 * 60 * 1000,
        }
      }

      // Update session trigger
      if (trigger === 'update' && session) {
        return {
          ...token,
          ...session,
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token
      }

      // Access token has expired, try to update it
      try {
        // ✅ Use the cleaned up API client method
        const response = await apiClient.refreshToken(token.refreshToken)

        if (response?.access_token) {
          return {
            ...token,
            accessToken: response.access_token,
            accessTokenExpires: Date.now() + 7 * 24 * 60 * 60 * 1000,
            refreshToken: response.refresh_token || token.refreshToken,
          }
        }
      } catch (error) {
        console.error('Token refresh error:', error)
      }

      // Return previous token and let the session handle the error
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.subscription_plan = token.subscription_plan
        session.user.onboarding_completed = token.onboarding_completed
        session.user.email_verified = token.email_verified
        session.accessToken = token.accessToken
      }

      return session
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url
      
      return baseUrl
    },
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', user.email)
      
      // Track sign in event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'login', {
          method: account?.provider || 'credentials',
          user_id: user.id,
        })
      }
    },

    async signOut({ token }) {
      console.log('User signed out:', token.email)
      
      // Track sign out event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'logout', {
          user_id: token.id,
        })
      }
      
      // Invalidate backend session
      try {
        await apiClient.logout()
      } catch (error) {
        console.error('Backend logout error:', error)
      }
    },

    async session({ session, token }) {
      // Update last active time (optional, be careful about performance)
      try {
        await apiClient.updateProfile({ 
          last_active_at: new Date().toISOString() 
        })
      } catch (error) {
        // Silently fail - this is not critical
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',

  secret: process.env.NEXTAUTH_SECRET,
}

// Helper functions for role-based access control
export const checkRole = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy = {
    student: 0,
    professional: 1,
    admin: 2,
  }

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] ?? -1
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
    ]
    
    if (premiumPermissions.includes(permission)) {
      return true
    }
  }

  return false
}

// Type guards
export const isAdmin = (role: string): boolean => role === 'admin'
export const isPremiumUser = (plan: string): boolean => ['pro', 'enterprise'].includes(plan)
export const isEmailVerified = (user: any): boolean => user?.email_verified === true

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }