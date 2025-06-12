types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: 'student' | 'professional' | 'admin'
      subscription_plan: 'free' | 'pro' | 'enterprise'
      onboarding_completed: boolean
      email_verified: boolean
    } & DefaultSession["user"]
    accessToken?: string
    error?: string
  }

  interface User extends DefaultUser {
    id: string
    role: 'student' | 'professional' | 'admin'
    subscription_plan: 'free' | 'pro' | 'enterprise'
    onboarding_completed: boolean
    email_verified: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    role: 'student' | 'professional' | 'admin'
    subscription_plan: 'free' | 'pro' | 'enterprise'
    onboarding_completed: boolean
    email_verified: boolean
    accessToken?: string
    refreshToken?: string
    error?: string
  }
}