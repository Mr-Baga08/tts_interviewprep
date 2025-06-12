'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Github, Mail, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input, PasswordInput } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const error = searchParams.get('error')

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  // Show error messages from URL params
  useState(() => {
    if (error) {
      const errorMessages: Record<string, string> = {
        CredentialsSignin: 'Invalid email or password. Please try again.',
        EmailSignin: 'Unable to send email. Please try again.',
        OAuthSignin: 'OAuth authentication failed. Please try again.',
        OAuthCallback: 'OAuth callback error. Please try again.',
        OAuthCreateAccount: 'Could not create OAuth account. Please try again.',
        EmailCreateAccount: 'Could not create account. Please try again.',
        Callback: 'Authentication callback error. Please try again.',
        OAuthAccountNotLinked: 'This account is linked to a different sign-in method.',
        SessionRequired: 'Please sign in to access this page.',
        default: 'An authentication error occurred. Please try again.',
      }
      
      toast.error(errorMessages[error] || errorMessages.default)
    }
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid email or password. Please try again.')
        return
      }

      if (result?.ok) {
        toast.success('Successfully signed in!')
        
        // Get the updated session to check onboarding status
        const session = await getSession()
        
        if (session?.user?.onboarding_completed === false) {
          router.push('/onboarding')
        } else {
          router.push(callbackUrl)
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setOauthLoading(provider)

    try {
      await signIn(provider, {
        callbackUrl,
      })
    } catch (error) {
      console.error(`${provider} sign in error:`, error)
      toast.error(`Failed to sign in with ${provider}. Please try again.`)
      setOauthLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
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
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground">
              Sign in to your TheTruthSchool account
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
                Or continue with email
              </span>
            </div>
          </div>

          {/* Login Form */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>
                Enter your email and password to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          <Link
                            href="/auth/forgot-password"
                            className="text-sm text-primary hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <PasswordInput
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      {...form.register('rememberMe')}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Remember me for 30 days
                    </label>
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
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-primary hover:underline"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Help links */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <Link href="/help" className="hover:underline">
                Help
              </Link>
              <span>•</span>
              <Link href="/privacy" className="hover:underline">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:underline">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Branding/Image */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-muted">
        <div className="mx-auto max-w-md text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Master Your Next Interview
            </h2>
            <p className="text-muted-foreground">
              Join thousands of job seekers who have successfully landed their dream jobs 
              with our AI-powered preparation platform.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">1</span>
              </div>
              <div className="text-left">
                <p className="font-medium">AI-Powered Mock Interviews</p>
                <p className="text-sm text-muted-foreground">
                  Practice with realistic AI interviews
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">2</span>
              </div>
              <div className="text-left">
                <p className="font-medium">Coding Challenges</p>
                <p className="text-sm text-muted-foreground">
                  Solve problems and improve your skills
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">3</span>
              </div>
              <div className="text-left">
                <p className="font-medium">Personalized Feedback</p>
                <p className="text-sm text-muted-foreground">
                  Get detailed insights and improvement tips
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <div className="bg-background rounded-lg p-4 text-left">
              <p className="text-sm italic text-muted-foreground mb-2">
                &ldquo;TheTruthSchool helped me prepare for my Google interview. 
                The AI feedback was incredibly detailed and helped me improve my communication skills.&rdquo;
              </p>
              <p className="text-sm font-medium">— Sarah Chen, Software Engineer at Google</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}