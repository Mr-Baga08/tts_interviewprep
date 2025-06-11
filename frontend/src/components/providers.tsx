'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'

// Create a client
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        cacheTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors except 408, 429
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            if (error?.response?.status === 408 || error?.response?.status === 429) {
              return failureCount < 2
            }
            return false
          }
          // Retry on network errors and 5xx up to 3 times
          return failureCount < 3
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: (failureCount, error: any) => {
          // Don't retry mutations on 4xx errors
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false
          }
          // Retry on network errors and 5xx up to 2 times
          return failureCount < 2
        },
      },
    },
  })

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => createQueryClient())
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <SessionProvider
      // Re-fetch session every 5 minutes
      refetchInterval={5 * 60}
      // Re-fetch on window focus
      refetchOnWindowFocus={true}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NotificationProvider>
            <KeyboardShortcutsProvider>
              <ErrorBoundaryProvider>
                {children}
              </ErrorBoundaryProvider>
            </KeyboardShortcutsProvider>
          </NotificationProvider>
          
          {/* React Query Devtools - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools
              initialIsOpen={false}
              position="bottom-right"
            />
          )}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}

// Notification Provider for global notifications
function NotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        expand={false}
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </>
  )
}

// Keyboard shortcuts provider
function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Global keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'k':
            // Open command palette (implement if needed)
            event.preventDefault()
            // dispatch search modal
            break
          case '/':
            // Focus search
            event.preventDefault()
            const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
            if (searchInput) {
              searchInput.focus()
            }
            break
          case ',':
            // Open settings (implement if needed)
            event.preventDefault()
            // dispatch settings modal
            break
        }
      }

      // Escape key to close modals
      if (event.key === 'Escape') {
        // Close any open modals or overlays
        const backdrop = document.querySelector('[data-backdrop]')
        if (backdrop) {
          backdrop.click()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return <>{children}</>
}

// Error Boundary Provider
import { ErrorBoundary } from 'react-error-boundary'

function ErrorBoundaryProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Error caught by boundary:', error, errorInfo)
        
        // Report to error tracking service
        if (typeof window !== 'undefined' && window.Sentry) {
          window.Sentry.captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
          })
        }
      }}
      onReset={() => {
        // Clear any app state if needed
        window.location.reload()
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

function ErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error
  resetErrorBoundary: () => void 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-destructive">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We apologize for the inconvenience. An error occurred while loading the application.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm font-medium">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        
        <div className="flex flex-col space-y-4">
          <button
            onClick={resetErrorBoundary}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Try again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex justify-center py-2 px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Go to homepage
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            If this problem persists, please{' '}
            <a
              href="mailto:support@thetruthschool.com"
              className="font-medium text-primary hover:underline"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// Global types for window objects
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    Sentry: any
  }
}