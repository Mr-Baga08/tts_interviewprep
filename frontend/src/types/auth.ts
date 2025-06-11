// frontend/src/types/auth.ts
export type UserRole = 'student' | 'professional' | 'admin'

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise'

export type SubscriptionStatus = 'active' | 'canceled' | 'expired'

export interface AuthUser {
  id: string
  email: string
  name: string
  image?: string
  role: UserRole
  subscription_plan: SubscriptionPlan
  subscription_status?: SubscriptionStatus
  is_verified: boolean
  first_name?: string
  last_name?: string
  created_at?: string
  last_login_at?: string
}

export interface LoginCredentials {
  email: string
  password: string
  remember_me?: boolean
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  role?: UserRole
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  user: AuthUser
}

export interface OAuthCallbackData {
  provider: string
  access_token: string
  id_token?: string
  email?: string
  name?: string
  image?: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirm {
  token: string
  new_password: string
}

export interface EmailVerificationRequest {
  token: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface UpdateProfileRequest {
  first_name?: string
  last_name?: string
  display_name?: string
  bio?: string
  phone?: string
  location?: string
  website?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
}

// Permission definitions
export type Permission = 
  // Challenge permissions
  | 'read_challenges'
  | 'submit_challenges'
  | 'create_challenges'
  | 'update_challenges'
  | 'delete_challenges'
  | 'view_challenge_solutions'
  
  // Interview permissions
  | 'read_interviews'
  | 'create_interviews'
  | 'update_interviews'
  | 'delete_interviews'
  | 'join_interviews'
  | 'schedule_interviews'
  
  // Test permissions
  | 'read_tests'
  | 'take_tests'
  | 'create_tests'
  | 'update_tests'
  | 'delete_tests'
  | 'view_test_results'
  
  // Resume permissions
  | 'read_resumes'
  | 'create_resumes'
  | 'update_resumes'
  | 'delete_resumes'
  
  // Feedback permissions
  | 'read_feedback'
  | 'request_feedback'
  | 'view_analytics'
  | 'view_basic_analytics'
  | 'advanced_analytics'
  
  // User management permissions
  | 'read_users'
  | 'create_users'
  | 'update_users'
  | 'delete_users'
  
  // Admin permissions
  | 'access_admin_panel'
  | 'manage_platform'
  | 'view_system_logs'
  | 'moderate_content'
  | 'review_submissions'
  | 'manage_feedback'
  | 'generate_reports'
  | 'view_all_analytics'
  
  // Premium features
  | 'access_advanced_features'
  | 'priority_support'

// Role permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [
    'read_challenges',
    'submit_challenges',
    'read_interviews',
    'create_interviews',
    'join_interviews',
    'read_tests',
    'take_tests',
    'view_test_results',
    'read_resumes',
    'create_resumes',
    'update_resumes',
    'read_feedback',
    'request_feedback',
    'view_basic_analytics',
  ],
  professional: [
    'read_challenges',
    'submit_challenges',
    'view_challenge_solutions',
    'read_interviews',
    'create_interviews',
    'join_interviews',
    'schedule_interviews',
    'read_tests',
    'take_tests',
    'view_test_results',
    'read_resumes',
    'create_resumes',
    'update_resumes',
    'delete_resumes',
    'read_feedback',
    'request_feedback',
    'view_analytics',
    'access_advanced_features',
    'priority_support',
    'advanced_analytics',
  ],
  admin: [
    // All permissions
    'read_challenges',
    'submit_challenges',
    'create_challenges',
    'update_challenges',
    'delete_challenges',
    'view_challenge_solutions',
    'read_interviews',
    'create_interviews',
    'update_interviews',
    'delete_interviews',
    'join_interviews',
    'schedule_interviews',
    'read_tests',
    'take_tests',
    'create_tests',
    'update_tests',
    'delete_tests',
    'view_test_results',
    'read_resumes',
    'create_resumes',
    'update_resumes',
    'delete_resumes',
    'read_feedback',
    'request_feedback',
    'view_analytics',
    'view_basic_analytics',
    'advanced_analytics',
    'read_users',
    'create_users',
    'update_users',
    'delete_users',
    'access_admin_panel',
    'manage_platform',
    'view_system_logs',
    'moderate_content',
    'review_submissions',
    'manage_feedback',
    'generate_reports',
    'view_all_analytics',
    'access_advanced_features',
    'priority_support',
  ],
}

// Auth state interfaces
export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  hasRole: (role: UserRole | UserRole[]) => boolean
  hasPermission: (permission: Permission) => boolean
  isPremium: boolean
  isVerified: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

// Form validation schemas (for use with react-hook-form)
export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  role?: UserRole
  acceptTerms: boolean
}

export interface ForgotPasswordFormData {
  email: string
}

export interface ResetPasswordFormData {
  token: string
  password: string
  confirmPassword: string
}

export interface ChangePasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// API error types
export interface AuthError {
  code: string
  message: string
  details?: Record<string, any>
}

export interface ValidationError {
  field: string
  message: string
}

// Session types for NextAuth
export interface ExtendedSession {
  user: AuthUser
  access_token: string
  error?: string
}

export interface ExtendedJWT {
  access_token: string
  refresh_token?: string
  role: UserRole
  subscription_plan: SubscriptionPlan
  expires_at: number
  error?: string
  is_verified: boolean
}

// Utility types
export type AuthAction = 
  | 'login'
  | 'register'
  | 'logout'
  | 'refresh'
  | 'verify_email'
  | 'reset_password'
  | 'change_password'
  | 'update_profile'

export interface AuthConfig {
  baseURL: string
  apiVersion: string
  tokenRefreshThreshold: number // seconds before expiry to refresh token
  maxRetryAttempts: number
  retryDelay: number // milliseconds
}

// Route protection types
export interface RouteRequirements {
  requireAuth?: boolean
  requireRole?: UserRole | UserRole[]
  requirePermission?: Permission | Permission[]
  requirePremium?: boolean
  requireVerification?: boolean
}

export interface ProtectedRouteProps extends RouteRequirements {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  loadingComponent?: React.ReactNode
}

// Hook return types
export interface UseAuthReturn extends AuthContextType {}

export interface UseRequireAuthReturn {
  isAuthenticated: boolean
  isLoading: boolean
}

export interface UseRequireRoleReturn {
  hasRole: boolean
  isLoading: boolean
}

export interface UseRequirePermissionReturn {
  hasPermission: boolean
  isLoading: boolean
}

export interface UseAuthStateReturn {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  isStudent: boolean
  isProfessional: boolean
  isAdmin: boolean
  isPremium: boolean
  isVerified: boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
  hasPermission: (permission: Permission) => boolean
}