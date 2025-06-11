/** @type {import('next').NextConfig} */
const nextConfig = {
    // App Router configuration
    experimental: {
      appDir: true,
      serverComponentsExternalPackages: ['mongoose', 'bcryptjs'],
    },
  
    // TypeScript configuration
    typescript: {
      // Type checking is done in CI/CD pipeline
      ignoreBuildErrors: false,
    },
  
    // ESLint configuration
    eslint: {
      ignoreDuringBuilds: false,
    },
  
    // Environment variables
    env: {
      CUSTOM_KEY: process.env.CUSTOM_KEY,
    },
  
    // API configuration
    async rewrites() {
      return [
        {
          source: '/api/v1/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
        },
      ];
    },
  
    // Headers for security
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()',
            },
          ],
        },
      ];
    },
  
    // Image optimization
    images: {
      domains: [
        'localhost',
        'thetruthschool.com',
        'storage.googleapis.com',
        'lh3.googleusercontent.com',
        'avatars.githubusercontent.com',
      ],
      formats: ['image/webp', 'image/avif'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
  
    // Webpack configuration
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      // Monaco Editor configuration
      config.module.rules.push({
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' },
      });
  
      // Handle PDF.js worker
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdfjs-dist/build/pdf.worker.js': 'pdfjs-dist/build/pdf.worker.min.js',
      };
  
      // LiveKit WebRTC configuration
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
  
      // Performance optimizations
      if (!dev && !isServer) {
        config.optimization.splitChunks.chunks = 'all';
        config.optimization.splitChunks.cacheGroups = {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        };
      }
  
      return config;
    },
  
    // Compression
    compress: true,
  
    // Power optimization
    poweredByHeader: false,
  
    // Strict mode
    reactStrictMode: true,
  
    // SWC minification
    swcMinify: true,
  
    // Bundle analyzer
    ...(process.env.ANALYZE === 'true' && {
      webpack: (config, { isServer }) => {
        if (!isServer) {
          const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')({
            enabled: true,
          });
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
            })
          );
        }
        return config;
      },
    }),
  
    // Output configuration for static export if needed
    // output: 'export',
    // trailingSlash: true,
  
    // Internationalization (if needed in future)
    // i18n: {
    //   locales: ['en', 'es', 'fr'],
    //   defaultLocale: 'en',
    // },
  
    // Redirects
    async redirects() {
      return [
        {
          source: '/home',
          destination: '/',
          permanent: true,
        },
        {
          source: '/login',
          destination: '/auth/login',
          permanent: true,
        },
        {
          source: '/register',
          destination: '/auth/register',
          permanent: true,
        },
      ];
    },
  
    // Performance monitoring
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  
    // Development configuration
    ...(process.env.NODE_ENV === 'development' && {
      // Fast refresh
      fastRefresh: true,
      // Development indicators
      devIndicators: {
        buildActivity: true,
        buildActivityPosition: 'bottom-right',
      },
    }),
  
    // Production optimizations
    ...(process.env.NODE_ENV === 'production' && {
      // Disable source maps in production for security
      productionBrowserSourceMaps: false,
      // Optimize fonts
      optimizeFonts: true,
      // Generate build ID
      generateBuildId: async () => {
        return process.env.BUILD_ID || `build-${Date.now()}`;
      },
    }),
  };
  
  module.exports = nextConfig;