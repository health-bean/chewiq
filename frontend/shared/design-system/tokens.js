// Health Platform Design System - Design Tokens
// Centralized design values for consistent UI

// FILO Brand Colors - Exact hex colors specified
export const filoColors = {
  // Primary brand teal - #339999
  primary: {
    50: '#f0fffe',   // Very light teal
    100: '#ccf2f2',  // Light teal
    200: '#99e6e6',  // Soft teal
    300: '#66d9d9',  // Medium teal
    400: '#339999',  // FILO brand teal (exact)
    500: '#339999',  // Core teal (exact)
    600: '#2d8080',  // Darker teal
    700: '#266666',  // Deep teal
    800: '#1f4d4d',  // Very deep teal
    900: '#193333'   // Darkest teal
  },
  
  // Orange for moderate/reintroduction - #993300
  accent: {
    50: '#fff5f0',   // Very light orange
    100: '#ffe6cc',  // Light orange
    200: '#ffcc99',  // Soft orange
    300: '#ffb366',  // Medium orange
    400: '#cc6600',  // Lighter orange
    500: '#993300',  // Core orange (exact)
    600: '#993300',  // FILO orange (exact)
    700: '#802b00',  // Deep orange
    800: '#662200',  // Very deep orange
    900: '#4d1a00'   // Darkest orange
  },
  
  // Cream background - #FFFFCC
  neutral: {
    50: '#FFFFCC',   // FILO cream background (exact)
    100: '#ffffc2',  // Slightly darker cream
    200: '#ffffb8',  // Light warm cream
    300: '#ffffae',  // Medium warm cream
    400: '#ffffa3',  // Darker warm cream
    500: '#cccc99',  // Medium neutral
    600: '#999966',  // Dark neutral
    700: '#666633',  // Darker neutral
    800: '#333300',  // Very dark neutral
    900: '#1a1a00'   // Darkest neutral
  }
};

// FILO Protocol Colors - Exact hex colors specified
export const extendedColors = {
  // Green for allowed/matches protocol - #336633
  allowed: {
    50: '#f0fff0',   // Very light green
    100: '#ccf2cc',  // Light green
    200: '#99e699',  // Soft green
    300: '#66d966',  // Medium green
    400: '#339933',  // Lighter green
    500: '#336633',  // Core allowed green (exact)
    600: '#336633',  // FILO allowed green (exact)
    700: '#2d5529',  // Deep green
    800: '#264426',  // Very deep green
    900: '#1f331f'   // Darkest green
  },
  
  // Red for forbidden/avoid - #993333
  avoid: {
    50: '#fff0f0',   // Very light red
    100: '#ffcccc',  // Light red
    200: '#ff9999',  // Soft red
    300: '#ff6666',  // Medium red
    400: '#cc3333',  // Lighter red
    500: '#993333',  // Core avoid red (exact)
    600: '#993333',  // FILO avoid red (exact)
    700: '#802929',  // Deep red
    800: '#661f1f',  // Very deep red
    900: '#4d1616'   // Darkest red
  },
  
  // Yellow for warnings - #FFCC66
  warning: {
    50: '#fffef0',   // Very light yellow
    100: '#fffacc',  // Light yellow
    200: '#fff599',  // Soft yellow
    300: '#fff066',  // Medium yellow
    400: '#ffeb33',  // Lighter yellow
    500: '#FFCC66',  // Core warning yellow (exact)
    600: '#FFCC66',  // FILO warning yellow (exact)
    700: '#ccaa52',  // Deep yellow
    800: '#99883d',  // Very deep yellow
    900: '#666629'   // Darkest yellow
  },
  
  // Blue for info - #006699
  info: {
    50: '#f0f9ff',   // Very light blue
    100: '#ccebff',  // Light blue
    200: '#99d6ff',  // Soft blue
    300: '#66c2ff',  // Medium blue
    400: '#3399cc',  // Lighter blue
    500: '#006699',  // Core info blue (exact)
    600: '#006699',  // FILO info blue (exact)
    700: '#005580',  // Deep blue
    800: '#004466',  // Very deep blue
    900: '#00334d'   // Darkest blue
  }
};

export const designTokens = {
  // FILO Color Palette - Chronic illness optimized
  colors: {
    // Core FILO brand colors
    primary: filoColors.primary,
    accent: filoColors.accent,
    neutral: filoColors.neutral,
    
    // FILO Protocol Colors
    allowed: extendedColors.allowed,   // Green for protocol allowed
    avoid: extendedColors.avoid,       // Red for protocol forbidden
    warning: extendedColors.warning,   // Yellow for warnings
    info: extendedColors.info,         // Blue for info
    
    // Legacy mappings for backward compatibility
    secondary: extendedColors.allowed,  // Map to allowed green
    error: extendedColors.avoid,        // Map to avoid red
    success: extendedColors.allowed     // Map to allowed green
    
    // Semantic Colors
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    
    // Neutrals - Clean & Professional
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Special Health Colors
    health: {
      symptom: '#ef4444',    // Red for symptoms
      improvement: '#22c55e', // Green for improvements
      neutral: '#6b7280',     // Gray for neutral
      medication: '#8b5cf6',  // Purple for medications
      supplement: '#06b6d4',  // Cyan for supplements
      food: '#f59e0b',        // Amber for foods
    }
  },
  
  // Typography optimized for readability and chronic illness
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'], // High readability
      mono: ['JetBrains Mono', 'monospace']
    },
    
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1.25rem' }],  // Increased line height
      sm: ['0.875rem', { lineHeight: '1.5rem' }],  // Increased line height
      base: ['1rem', { lineHeight: '1.5rem' }],    // Standard readable line height
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    lineHeight: {
      tight: '1.25',    // For headings
      normal: '1.5',    // For body text - easier to read
      relaxed: '1.75'   // For long-form content
    },
    
    contrast: {
      minimum: '4.5:1', // WCAG AA compliance
      enhanced: '7:1'   // WCAG AAA for better accessibility
    }
  },
  
  // Spacing Scale - 8px base
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },
  
  // Shadows - Subtle & Professional
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // Chronic illness-friendly semantic mappings
  semantic: {
    status: {
      info: 'primary',      // FILO teal
      success: 'sage',      // Soft sage green
      warning: 'amber',     // Warm amber
      error: 'coral'        // Muted coral
    },
    health: {
      symptom: 'coral',     // Gentle coral instead of harsh red
      improvement: 'sage',  // Soft sage instead of bright green
      medication: 'lavender', // Calming lavender
      supplement: 'primary', // FILO brand teal
      food: 'accent',       // FILO terracotta
      neutral: 'neutral'    // Warm cream/gray
    },
    protocol: {
      allowed: 'sage',      // Soft green = safe to eat
      avoid: 'coral',       // Muted coral = avoid for now
      reintroduction: 'amber', // Warm amber = try carefully
      unknown: 'neutral'    // Neutral = not specified
    }
  },

  // Layout patterns optimized for chronic illness users
  layout: {
    spacing: {
      section: '1.5rem',    // 24px - generous spacing reduces cognitive load
      card: '1rem',         // 16px - comfortable card spacing
      form: '0.75rem',      // 12px - form field spacing
      tight: '0.5rem'       // 8px - minimal spacing
    },
    containers: {
      maxWidth: '28rem',    // 448px - mobile-first, easy to scan
      padding: '1rem',      // 16px - comfortable touch targets
      margin: '0 auto',     // Centered content
      background: 'neutral-50' // FILO cream background
    },
    accessibility: {
      minTouchTarget: '44px',  // Minimum touch target for motor difficulties
      focusRingWidth: '2px',   // Visible focus indicators
      animationDuration: '200ms' // Gentle transitions, not jarring
    }
  },

  // Component-Specific Tokens - Enhanced for accessibility
  components: {
    button: {
      height: {
        sm: '2.75rem',   // 44px minimum for accessibility
        md: '2.75rem',   // 44px minimum for accessibility
        lg: '3rem',      // 48px
      },
      padding: {
        sm: '0.5rem 0.75rem',
        md: '0.625rem 1rem',
        lg: '0.75rem 1.5rem',
      },
      minTouchTarget: '44px', // Chronic illness accessibility
    },
    
    input: {
      height: {
        sm: '2.75rem',   // 44px minimum for accessibility
        md: '2.75rem',   // 44px minimum for accessibility
        lg: '3rem',      // 48px
      },
      padding: '0.625rem 0.75rem',
      minTouchTarget: '44px',
    },
    
    card: {
      padding: '1.5rem',
      borderRadius: '0.5rem',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      background: 'neutral-50', // FILO cream background
    },
  },
  
  // Animation & Transitions
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  
  // Z-Index Scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};
