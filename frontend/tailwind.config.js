/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        container: {
            center: true,
            padding: {
                DEFAULT: '1rem',
                sm: '1.5rem',
                lg: '2rem',
            },
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            colors: {
                border: 'var(--color-border)', /*slate-400/20*/
                input: 'var(--color-input)', /*slate-400/20*/
                ring: 'var(--color-ring)', /*cyan-900*/
                background: 'var(--color-background)', /*gray-50*/
                foreground: 'var(--color-foreground)', /*slate-900*/
                primary: {
                    DEFAULT: 'var(--color-primary)', /*cyan-900*/
                    foreground: 'var(--color-primary-foreground)', /*white*/
                },
                secondary: {
                    DEFAULT: 'var(--color-secondary)', /*cyan-800*/
                    foreground: 'var(--color-secondary-foreground)', /*white*/
                },
                destructive: {
                    DEFAULT: 'var(--color-destructive)', /*red-600*/
                    foreground: 'var(--color-destructive-foreground)', /*white*/
                },
                muted: {
                    DEFAULT: 'var(--color-muted)', /*slate-100*/
                    foreground: 'var(--color-muted-foreground)', /*slate-600*/
                },
                accent: {
                    DEFAULT: 'var(--color-accent)', /*cyan-500*/
                    foreground: 'var(--color-accent-foreground)', /*white*/
                },
                popover: {
                    DEFAULT: 'var(--color-popover)', /*white*/
                    foreground: 'var(--color-popover-foreground)', /*slate-900*/
                },
                card: {
                    DEFAULT: 'var(--color-card)', /*white*/
                    foreground: 'var(--color-card-foreground)', /*slate-900*/
                },
                success: {
                    DEFAULT: 'var(--color-success)', /*emerald-600*/
                    foreground: 'var(--color-success-foreground)', /*white*/
                },
                warning: {
                    DEFAULT: 'var(--color-warning)', /*amber-600*/
                    foreground: 'var(--color-warning-foreground)', /*white*/
                },
                error: {
                    DEFAULT: 'var(--color-error)', /*red-600*/
                    foreground: 'var(--color-error-foreground)', /*white*/
                },
                surface: 'var(--color-surface)', /*white*/
                'text-primary': 'var(--color-text-primary)', /*slate-900*/
                'text-secondary': 'var(--color-text-secondary)', /*slate-600*/
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            fontFamily: {
                heading: ['Lexend', 'system-ui', '-apple-system', 'sans-serif'],
                body: ['Source Sans 3', 'system-ui', '-apple-system', 'sans-serif'],
                caption: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
                data: ['JetBrains Mono', 'monospace'],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '104': '26rem',
            },
            maxWidth: {
                '8xl': '88rem',
                '9xl': '96rem',
            },
            keyframes: {
                'pulse-subtle': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                },
                'slide-in-right': {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                'slide-out-right': {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
            animation: {
                'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'slide-in-right': 'slide-in-right 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                'slide-out-right': 'slide-out-right 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                'fade-in': 'fade-in 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            },
        },
    },
    plugins: [],
}