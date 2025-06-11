import { Inter, JetBrains_Mono, Lexend } from 'next/font/google'
import { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { Providers } from '@/components/providers'
import { cn } from '@/lib/utils'
import '@/styles/globals.css'

// Font configurations
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

// Metadata configuration
export const metadata: Metadata = {
  title: {
    default: 'TheTruthSchool - AI-Powered Job Preparation Platform',
    template: '%s | TheTruthSchool',
  },
  description: 'Master your interviews with AI-powered practice sessions, coding challenges, resume reviews, and comprehensive feedback. Land your dream job with TheTruthSchool.',
  keywords: [
    'job preparation',
    'interview practice',
    'coding challenges',
    'resume review',
    'AI-powered feedback',
    'mock interviews',
    'career development',
    'technical interviews',
    'behavioral interviews',
    'job search',
  ],
  authors: [
    {
      name: 'TheTruthSchool Team',
      url: 'https://thetruthschool.com',
    },
  ],
  creator: 'TheTruthSchool',
  publisher: 'TheTruthSchool',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'TheTruthSchool - AI-Powered Job Preparation Platform',
    description: 'Master your interviews with AI-powered practice sessions. Get personalized feedback and land your dream job.',
    siteName: 'TheTruthSchool',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TheTruthSchool - AI-Powered Job Preparation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TheTruthSchool - AI-Powered Job Preparation Platform',
    description: 'Master your interviews with AI-powered practice sessions. Get personalized feedback and land your dream job.',
    images: ['/twitter-card.png'],
    creator: '@thetruthschool',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#0ea5e9',
      },
    ],
  },
  category: 'education',
  classification: 'Business',
  referrer: 'origin-when-cross-origin',
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  colorScheme: 'dark light',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={cn(
        'antialiased',
        inter.variable,
        jetbrainsMono.variable,
        lexend.variable
      )}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="//api.judge0.com" />
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Performance hints */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="" />
        
        {/* Analytics and monitoring scripts */}
        {process.env.NEXT_PUBLIC_GA_TRACKING_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_TRACKING_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_TRACKING_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans text-foreground',
        'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border',
        'selection:bg-primary/20 selection:text-primary-foreground'
      )}>
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Skip to main content
        </a>

        {/* Providers wrapper for app-wide context */}
        <Providers>
          {/* Main application content */}
          <div id="main-content" className="relative flex min-h-screen flex-col">
            {children}
          </div>

          {/* Global toast notifications */}
          <Toaster
            position="bottom-right"
            expand={false}
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
              className: 'toast',
            }}
          />

          {/* Development tools */}
          {process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_DEVTOOLS === 'true' && (
            <div className="fixed bottom-4 left-4 z-50 rounded-lg bg-black/80 px-3 py-2 text-xs text-white backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400"></div>
                <span>Development Mode</span>
              </div>
            </div>
          )}
        </Providers>

        {/* Background patterns for visual appeal */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-primary/5 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-secondary/5 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-3xl"></div>
        </div>

        {/* Performance monitoring */}
        {process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS === 'true' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}