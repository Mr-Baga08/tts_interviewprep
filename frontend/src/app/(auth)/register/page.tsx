// frontend/src/app/(auth)/register/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Github, Mail, Loader2, ArrowLeft, Check, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input, PasswordInput } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authApi } from '@/lib/api-client'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  subscribeToNewsletter: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

const passwordRequirements = [
  { label: 'At least 8 characters', test: (password: string) => password.length >= 8 },
  { label: 'One uppercase letter', test: (password: string) => /[A-Z]/.test(password) },
  { label: 'One lowercase letter', test: (password: string) => /[a-z]/.test(password) },
  { label: 'One number', test: (password: string) => /\d/.test(password) },
]

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [registrationStep, setRegistrationStep] = useState<'form' | 'success' | 'verification'>('form')

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
      subscribeToNewsletter: true,
    },
  })

  const password = form.watch('password')

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)

    try {
      // Step 1: Register the user with your backend
      const registrationResponse = await authApi.register({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        subscribe_to_newsletter: data.subscribeToNewsletter,
      })

      toast.success('Account created successfully!')
      setRegistrationStep('success')

      // Step 2: Automatically sign in the user using NextAuth
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.ok) {
        toast.success('Welcome to TheTruthSchool!')
        
        // Check if user needs email verification
        if (registrationResponse?.user?.is_verified === false) {
          setRegistrationStep('verification')
          // Don't redirect yet, show verification message
          return
        }
        
        // Redirect based on user status
        if (registrationResponse?.user?.onboarding_completed === false) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
      } else {
        // Registration succeeded but auto-login failed
        toast.warning('Account created! Please sign in to continue.')
        router.push('/auth/login?email=' + encodeURIComponent(data.email))
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Handle specific error cases
      if (error.response?.status === 409 || error.message?.includes('already exists')) {
        toast.error('An account with this email already exists.')
        form.setError('email', {
          message: 'An account with this email already exists.'
        })
      } else if (error.response?.status === 422) {
        // Validation errors from backend
        const details = error.response?.data?.detail
        if (Array.isArray(details)) {
          details.forEach((detail: any) => {
            if (detail.loc && detail.loc.includes('email')) {
              form.setError('email', { message: detail.msg })
            } else if (detail.loc && detail.loc.includes('password')) {
              form.setError('password', { message: detail.msg })
            }
          })
        } else {
          toast.error(details || 'Please check your input and try again.')
        }
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail)
      } else {
        toast.error('Failed to create account. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setOauthLoading(provider)

    try {
      const result = await signIn(provider, {
        callbackUrl: '/onboarding', // OAuth users typically need onboarding
        redirect: true,
      })
      
      // If redirect is false and there's an error
      if (result?.error) {
        toast.error(`Failed to sign up with ${provider}. Please try again.`)
        setOauthLoading(null)
      }
    } catch (error) {
      console.error(`${provider} sign up error:`, error)
      toast.error(`Failed to sign up with ${provider}. Please try again.`)
      setOauthLoading(null)
    }
  }

  const resendVerificationEmail = async () => {
    try {
      const email = form.getValues('email')
      await authApi.resendVerificationEmail(email)
      toast.success('Verification email sent! Please check your inbox.')
    } catch (error) {
      toast.error('Failed to send verification email. Please try again.')
    }
  }

  // Success state
  if (registrationStep === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">Account Created!</CardTitle>
            <CardDescription>
              Your account has been successfully created and you're now signed in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/onboarding')} className="w-full">
              Continue to Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Email verification state
  if (registrationStep === 'verification') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to {form.getValues('email')}. 
              Please check your email and click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={resendVerificationEmail} variant="outline" className="w-full">
              Resend Verification Email
            </Button>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Continue to Dashboard
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You can verify your email later from your account settings.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Back to home link */}
          <Link 
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground">
              Join TheTruthSchool and start your journey to career success
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => handleOAuthSignIn('google')}
                disabled={!!oauthLoading}
              >
                {oauthLoading === 'google' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Continue with Google
              </Button>
            )}

            {process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID && (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => handleOAuthSignIn('github')}
                disabled={!!oauthLoading}
              >
                {oauthLoading === 'github' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Github className="mr-2 h-4 w-4" />
                )}
                Continue with GitHub
              </Button>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or create account with email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Sign up</CardTitle>
              <CardDescription>
                Create your account to get started with TheTruthSchool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="john@example.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="Create a strong password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        
                        {/* Password Requirements */}
                        {password && (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Password requirements:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {passwordRequirements.map((req, index) => (
                                <div
                                  key={index}
                                  className={cn(
                                    "flex items-center text-xs",
                                    req.test(password)
                                      ? "text-green-600"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  <Check
                                    className={cn(
                                      "mr-1 h-3 w-3",
                                      req.test(password) ? "opacity-100" : "opacity-30"
                                    )}
                                  />
                                  {req.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="Confirm your password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Terms and Conditions */}
                  <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            I agree to the{' '}
                            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                              Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                              Privacy Policy
                            </Link>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Newsletter Subscription */}
                  <FormField
                    control={form.control}
                    name="subscribeToNewsletter"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            Subscribe to our newsletter for tips and updates
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create account
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Already have account link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link 
                href="/auth/login" 
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Feature highlights or image */}
      <div className="hidden lg:flex lg:flex-1 lg:bg-muted">
        <div className="flex items-center justify-center p-12">
          <div className="max-w-md space-y-6 text-center">
            <h2 className="text-2xl font-bold">Ready to land your dream job?</h2>
            <p className="text-muted-foreground">
              Join thousands of professionals who've transformed their careers with TheTruthSchool's 
              comprehensive job preparation platform.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">AI-powered interview practice</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Personalized coding challenges</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Resume optimization tools</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Progress tracking & analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}