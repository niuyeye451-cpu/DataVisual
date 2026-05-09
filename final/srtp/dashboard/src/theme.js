/**
 * Design tokens extracted from Stitch design system.
 * Colors / Typography / Spacing match the original HTML Tailwind config.
 */
const theme = {
  colors: {
    primary: '#003d9b',
    primaryContainer: '#0052cc',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#c4d2ff',
    primaryFixed: '#dae2ff',
    primaryFixedDim: '#b2c5ff',

    secondary: '#00687b',
    secondaryContainer: '#50dcff',
    onSecondary: '#ffffff',

    tertiary: '#7b2600',
    tertiaryContainer: '#a33500',
    onTertiary: '#ffffff',
    tertiaryFixed: '#ffdbcf',
    tertiaryFixedDim: '#ffb59b',

    error: '#ba1a1a',
    errorHigh: '#DE350B',
    errorContainer: '#ffdad6',
    onError: '#ffffff',

    surface: '#faf8ff',
    surfaceDim: '#d9d9e4',
    surfaceBright: '#faf8ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f3f3fd',
    surfaceContainer: '#ededf8',
    surfaceContainerHigh: '#e7e7f2',
    surfaceContainerHighest: '#e1e2ec',

    onSurface: '#191b23',
    onSurfaceVariant: '#434654',

    outline: '#737685',
    outlineVariant: '#c3c6d6',

    background: '#faf8ff',
    neutralSurface: '#F4F5F7',

    // Semantic chart colors
    loadPrimary: '#0052CC',
    loadActual: '#2684FF',
    loadForecast: '#FF8B00',
    successMetrics: '#36B37E',
  },

  typography: {
    headlineLg: {
      fontFamily: 'IBM Plex Sans, sans-serif',
      fontSize: 24,
      fontWeight: 600,
      lineHeight: '32px',
    },
    headlineMd: {
      fontFamily: 'IBM Plex Sans, sans-serif',
      fontSize: 18,
      fontWeight: 600,
      lineHeight: '24px',
    },
    bodyBase: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '20px',
    },
    bodySm: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 12,
      fontWeight: 400,
      lineHeight: '18px',
    },
    dataMono: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 13,
      fontWeight: 500,
      lineHeight: '16px',
    },
  },

  spacing: {
    unit: 4,
    gutter: 16,
    marginPage: 24,
    cardPadding: 20,
  },

  borderRadius: {
    sm: 2,
    DEFAULT: 2,
    md: 4,
    lg: 6,
    xl: 8,
    full: 12,
  },
};

export default theme;
