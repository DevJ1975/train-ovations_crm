import { designTokens } from './design-tokens';

const {
  hero,
  sectionTitle,
  cardTitle,
  body,
  label,
} = designTokens.typography;

function toFontSizeToken(
  token: readonly [string, { readonly lineHeight: string; readonly fontWeight: string }],
): [string, { lineHeight: string; fontWeight: string }] {
  return [
    token[0],
    {
      lineHeight: token[1].lineHeight,
      fontWeight: token[1].fontWeight,
    },
  ];
}

export const tailwindTheme = {
  fontFamily: {
    sans: designTokens.fontFamilies.sans,
    display: designTokens.fontFamilies.display,
  },
  colors: {
    border: 'hsl(var(--tv-border))',
    input: 'hsl(var(--tv-border))',
    ring: 'hsl(var(--tv-ring))',
    background: 'hsl(var(--tv-background))',
    foreground: 'hsl(var(--tv-foreground))',
    primary: {
      DEFAULT: 'hsl(var(--tv-primary))',
      foreground: 'hsl(var(--tv-primary-foreground))',
    },
    accent: {
      DEFAULT: 'hsl(var(--tv-accent))',
      foreground: 'hsl(var(--tv-accent-foreground))',
    },
    surface: {
      DEFAULT: 'hsl(var(--tv-surface))',
      muted: 'hsl(var(--tv-surface-muted))',
    },
    muted: {
      DEFAULT: 'hsl(var(--tv-surface-muted))',
      foreground: 'hsl(var(--tv-muted-foreground))',
    },
    success: 'hsl(var(--tv-success))',
    warning: 'hsl(var(--tv-warning))',
    danger: 'hsl(var(--tv-danger))',
  },
  fontSize: {
    hero: toFontSizeToken(hero),
    section: toFontSizeToken(sectionTitle),
    card: toFontSizeToken(cardTitle),
    body: toFontSizeToken(body),
    label: toFontSizeToken(label),
  },
  borderRadius: {
    sm: designTokens.radius.sm,
    md: designTokens.radius.md,
    lg: designTokens.radius.lg,
    xl: designTokens.radius.xl,
  },
  boxShadow: {
    sm: designTokens.shadows.sm,
    md: designTokens.shadows.md,
    lg: designTokens.shadows.lg,
  },
  spacing: designTokens.spacing,
};
