'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Github, Mail, Loader2, ArrowLeft, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input, PasswordInput } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
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
      // Register the user
      await authApi.register({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      })

      toast.success('Account created successfully!')

      // Automatically sign in the user
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.ok) {
        toast.success('Welcome to TheTruthSchool!')
        router.push('/onboarding')
      } else {
        toast.error('Account created but login failed. Please try signing in.')
        router.push('/auth/login')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      
      if (error.response?.status === 409) {
        toast.error('An account with this email already exists.')
        form.setError('email', {
          message: 'An account with this email already exists.'
        })
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
      await signIn(provider, {
        callbackUrl: '/onboarding',
      })
    } catch (error) {
      console.error(`${provider} sign in error:`, error)
      toast.error(`Failed to sign up with ${provider}. Please try again.`)
      setOauthLoading(null)
    }
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
              Start your journey to landing your dream job
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
                            <Input
                              placeholder="John"
                              autoComplete="given-name"
                              {...field}
                            />
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
                            <Input
                              placeholder="Doe"
                              autoComplete="family-name"
                              {...field}
                            />
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
                            autoComplete="email"
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
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        
                        {/* Password Requirements */}
                        {password && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Password requirements:</p>
                            <div className="grid grid-cols-1 gap-1">
                              {passwordRequirements.map((req, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <div className={cn(
                                    "w-3 h-3 rounded-full flex items-center justify-center",
                                    req.test(password) ? "bg-green-500" : "bg-muted"
                                  )}>
                                    {req.test(password) && (
                                      <Check className="w-2 h-2 text-white" />
                                    )}
                                  </div>
                                  <span className={cn(
                                    "text-xs",
                                    req.test(password) ? "text-green-600" : "text-muted-foreground"
                                  )}>
                                    {req.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <FormMessage />
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
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="agreeToTerms"
                        {...form.register('agreeToTerms')}
                        className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="text-sm">
                        <label htmlFor="agreeToTerms" className="font-medium leading-none">
                          I agree to the{' '}
                          <Link href="/terms" className="text-primary hover:underline">
                            Terms of Service
                          </Link>
                          {' '}and{' '}
                          <Link href="/privacy" className="text-primary hover:underline">
                            Privacy Policy
                          </Link>
                        </label>
                      </div>
                    </div>
                    {form.formState.errors.agreeToTerms && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.agreeToTerms.message}
                      </p>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="subscribeToNewsletter"
                        {...form.register('subscribeToNewsletter')}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <label htmlFor="subscribeToNewsletter" className="text-sm leading-none">
                        Subscribe to our newsletter for tips and updates
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Sign in link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Benefits */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-muted">
        <div className="mx-auto max-w-md text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Start Your Success Journey
            </h2>
            <p className="text-muted-foreground">
              Join thousands of professionals who have transformed their careers 
              with our comprehensive preparation platform.
            </p>
          </div>

          <div className="text-center space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">92%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Companies</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-left">
                <h3 className="font-semibold mb-2">What you'll get:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Unlimited AI mock interviews</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>500+ coding challenges</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>AI-powered resume review</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Personalized feedback & insights</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Progress tracking & analytics</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <div className="bg-background rounded-lg p-4 text-left">
              <p className="text-sm italic text-muted-foreground mb-2">
                &ldquo;I went from 0 interviews to 5 offers in 2 months. 
                TheTruthSchool&apos;s AI feedback was game-changing.&rdquo;
              </p>
              <p className="text-sm font-medium">— Michael Rodriguez, Senior Developer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}