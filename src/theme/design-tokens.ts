export const designTokens = {
  fontFamilies: {
    sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  },
  colors: {
    primary: '#0B5FFF',
    primaryForeground: '#F8FAFC',
    accent: '#FF7A18',
    accentForeground: '#0F172A',
    background: '#F4F7FB',
    surface: '#FFFFFF',
    surfaceMuted: '#E9EEF6',
    foreground: '#0F172A',
    mutedForeground: '#5B6472',
    border: '#D7DEE8',
    ring: '#0B5FFF',
    success: '#14804A',
    warning: '#B76E00',
    danger: '#C73636',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  typography: {
    hero: ['3rem', { lineHeight: '1.05', fontWeight: '700' }],
    sectionTitle: ['2rem', { lineHeight: '1.15', fontWeight: '700' }],
    cardTitle: ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
    body: ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
    label: ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
  },
  radius: {
    sm: '0.375rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(15, 23, 42, 0.06)',
    md: '0 10px 30px -12px rgba(15, 23, 42, 0.16)',
    lg: '0 24px 48px -20px rgba(15, 23, 42, 0.2)',
  },
} as const;

export type DesignTokens = typeof designTokens;
