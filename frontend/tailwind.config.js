/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      './pages/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      './app/**/*.{ts,tsx}',
      './src/**/*.{ts,tsx}',
    ],
    theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      extend: {
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
            950: '#082f49',
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617',
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
          // Custom brand colors
          brand: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
          },
          success: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          warning: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          },
          error: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        keyframes: {
          "accordion-down": {
            from: { height: "0" },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: "0" },
          },
          "fade-in": {
            "0%": { opacity: "0" },
            "100%": { opacity: "1" },
          },
          "fade-out": {
            "0%": { opacity: "1" },
            "100%": { opacity: "0" },
          },
          "slide-in-from-top": {
            "0%": { transform: "translateY(-100%)" },
            "100%": { transform: "translateY(0)" },
          },
          "slide-in-from-bottom": {
            "0%": { transform: "translateY(100%)" },
            "100%": { transform: "translateY(0)" },
          },
          "slide-in-from-left": {
            "0%": { transform: "translateX(-100%)" },
            "100%": { transform: "translateX(0)" },
          },
          "slide-in-from-right": {
            "0%": { transform: "translateX(100%)" },
            "100%": { transform: "translateX(0)" },
          },
          "zoom-in": {
            "0%": { transform: "scale(0.8)", opacity: "0" },
            "100%": { transform: "scale(1)", opacity: "1" },
          },
          "bounce-in": {
            "0%": { transform: "scale(0.3)", opacity: "0" },
            "50%": { transform: "scale(1.05)" },
            "70%": { transform: "scale(0.9)" },
            "100%": { transform: "scale(1)", opacity: "1" },
          },
          "pulse": {
            "0%, 100%": { opacity: "1" },
            "50%": { opacity: "0.5" },
          },
          "spin": {
            "from": { transform: "rotate(0deg)" },
            "to": { transform: "rotate(360deg)" },
          },
          "typing": {
            "from": { width: "0" },
            "to": { width: "100%" },
          },
          "blink": {
            "from, to": { borderColor: "transparent" },
            "50%": { borderColor: "currentColor" },
          },
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
          "fade-in": "fade-in 0.3s ease-out",
          "fade-out": "fade-out 0.3s ease-out",
          "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
          "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
          "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
          "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
          "zoom-in": "zoom-in 0.3s ease-out",
          "bounce-in": "bounce-in 0.6s ease-out",
          "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          "spin": "spin 1s linear infinite",
          "typing": "typing 3.5s steps(40, end), blink 500ms step-end infinite alternate",
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
          heading: ['Lexend', 'Inter', 'system-ui', 'sans-serif'],
        },
        fontSize: {
          'xs': ['0.75rem', { lineHeight: '1rem' }],
          'sm': ['0.875rem', { lineHeight: '1.25rem' }],
          'base': ['1rem', { lineHeight: '1.5rem' }],
          'lg': ['1.125rem', { lineHeight: '1.75rem' }],
          'xl': ['1.25rem', { lineHeight: '1.75rem' }],
          '2xl': ['1.5rem', { lineHeight: '2rem' }],
          '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
          '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
          '5xl': ['3rem', { lineHeight: '1' }],
          '6xl': ['3.75rem', { lineHeight: '1' }],
          '7xl': ['4.5rem', { lineHeight: '1' }],
          '8xl': ['6rem', { lineHeight: '1' }],
          '9xl': ['8rem', { lineHeight: '1' }],
        },
        spacing: {
          '18': '4.5rem',
          '88': '22rem',
          '112': '28rem',
          '128': '32rem',
        },
        maxWidth: {
          '8xl': '88rem',
          '9xl': '96rem',
        },
        aspectRatio: {
          '4/3': '4 / 3',
          '3/2': '3 / 2',
          '2/3': '2 / 3',
          '9/16': '9 / 16',
        },
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
          'hero-pattern': "url('/images/hero-pattern.svg')",
          'dots-pattern': "url('/images/dots-pattern.svg')",
        },
        backdropBlur: {
          xs: '2px',
        },
        boxShadow: {
          'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
          'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)',
          'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
        },
        dropShadow: {
          'glow': '0 0 10px rgba(59, 130, 246, 0.8)',
        },
      },
    },
    plugins: [
      require("tailwindcss-animate"),
      require("@tailwindcss/forms"),
      require("@tailwindcss/typography"),
      require("@tailwindcss/aspect-ratio"),
      require("@tailwindcss/container-queries"),
      
      // Custom plugin for utilities
      function({ addUtilities, addComponents, theme }) {
        // Custom utilities
        addUtilities({
          '.scrollbar-hide': {
            '-ms-overflow-style': 'none',
            'scrollbar-width': 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          },
          '.scrollbar-default': {
            '-ms-overflow-style': 'auto',
            'scrollbar-width': 'auto',
            '&::-webkit-scrollbar': {
              display: 'block',
            },
          },
          '.text-balance': {
            'text-wrap': 'balance',
          },
          '.writing-vertical': {
            'writing-mode': 'vertical-rl',
          },
        });
  
        // Custom components
        addComponents({
          '.glass': {
            'background': 'rgba(255, 255, 255, 0.1)',
            'backdrop-filter': 'blur(10px)',
            'border': '1px solid rgba(255, 255, 255, 0.2)',
          },
          '.glass-dark': {
            'background': 'rgba(0, 0, 0, 0.1)',
            'backdrop-filter': 'blur(10px)',
            'border': '1px solid rgba(255, 255, 255, 0.1)',
          },
          '.btn-gradient': {
            'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'color': 'white',
            'border': 'none',
            'transition': 'all 0.3s ease',
            '&:hover': {
              'transform': 'translateY(-2px)',
              'box-shadow': '0 4px 20px rgba(102, 126, 234, 0.4)',
            },
          },
          '.card-hover': {
            'transition': 'all 0.3s ease',
            '&:hover': {
              'transform': 'translateY(-4px)',
              'box-shadow': '0 10px 40px rgba(0, 0, 0, 0.1)',
            },
          },
        });
      },
    ],
  }