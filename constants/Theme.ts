/**
 * Premium Design System
 * Modern, cohesive theme with gradients, spacing, shadows, and typography
 */

export const Theme = {
  // Color Palette
  colors: {
    // Primary gradient (emerald → teal)
    primary: {
      main: '#10B981', // emerald-500
      light: '#34D399', // emerald-400
      dark: '#059669', // emerald-600
      gradient: ['#10B981', '#14B8A6'], // emerald → teal
    },
    // Accent colors
    accent: {
      orange: '#F59E0B', // amber-500
      yellow: '#FBBF24', // amber-400
      purple: '#8B5CF6', // violet-500
    },
    // Background & Surface
    background: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB', // gray-50
      tertiary: '#F3F4F6', // gray-100
      gradient: ['#F0FDF4', '#ECFDF5'], // emerald-50 gradient
    },
    // Text colors
    text: {
      primary: '#111827', // gray-900
      secondary: '#6B7280', // gray-500
      tertiary: '#9CA3AF', // gray-400
      inverse: '#FFFFFF',
      muted: '#D1D5DB', // gray-300
    },
    // Semantic colors
    semantic: {
      success: '#10B981', // emerald-500
      error: '#EF4444', // red-500
      warning: '#F59E0B', // amber-500
      info: '#3B82F6', // blue-500
    },
    // Border & Divider
    border: {
      light: '#E5E7EB', // gray-200
      medium: '#D1D5DB', // gray-300
      dark: '#9CA3AF', // gray-400
    },
  },

  // Spacing Scale (4px base)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
  },

  // Border Radius Scale
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },

  // Typography Scale
  typography: {
    // Title (28-32, bold)
    title: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    // Section title (18-20, semibold)
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
      letterSpacing: -0.3,
    },
    // Body (14-16)
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    // Caption (12-13, muted)
    caption: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    captionSmall: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    // Button text
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
  },

  // Shadow Presets
  shadows: {
    // Card shadow (subtle elevation)
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3, // Android
    },
    // Button shadow (more prominent)
    button: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6, // Android
    },
    // Modal/Dialog shadow
    modal: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12, // Android
    },
    // Input focus shadow
    inputFocus: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 2, // Android
    },
  },

  // Animation Durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
};

// Legacy Colors compatibility (for existing code)
export const Colors = {
  primary: {
    green: Theme.colors.primary.main,
    orange: Theme.colors.accent.orange,
    yellow: Theme.colors.accent.yellow,
  },
  neutral: {
    backgroundLight: Theme.colors.background.secondary,
    cardSurface: Theme.colors.background.primary,
    textDark: Theme.colors.text.primary,
    mutedGray: Theme.colors.text.secondary,
  },
};

