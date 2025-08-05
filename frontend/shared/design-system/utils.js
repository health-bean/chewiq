// Design System Utilities
// Helper functions for consistent styling

import { designTokens } from './tokens.js';

// Class name utility (similar to clsx/classnames)
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Get color value from design tokens
export const getColor = (colorPath) => {
  const keys = colorPath.split('.');
  let value = designTokens.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || colorPath;
};

// Generate component variants
export const createVariants = (baseClasses, variants) => {
  return (variant = 'default') => {
    const variantClasses = variants[variant] || variants.default || '';
    return cn(baseClasses, variantClasses);
  };
};

// Responsive utility
export const responsive = (values) => {
  const breakpoints = ['sm', 'md', 'lg', 'xl'];
  let classes = '';
  
  Object.entries(values).forEach(([breakpoint, value]) => {
    if (breakpoint === 'base') {
      classes += ` ${value}`;
    } else if (breakpoints.includes(breakpoint)) {
      classes += ` ${breakpoint}:${value}`;
    }
  });
  
  return classes.trim();
};

// FILO semantic color utilities for chronic illness accessibility
export const getSemanticColor = (category, type, variant = 'container') => {
  const semanticColors = {
    // Status colors using FILO palette
    status: {
      info: {
        container: 'border-primary-200 bg-primary-50',
        text: 'text-primary-800',
        accent: 'text-primary-600'
      },
      success: {
        container: 'border-allowed-200 bg-allowed-50',
        text: 'text-allowed-800',
        accent: 'text-allowed-600'
      },
      warning: {
        container: 'border-warning-200 bg-warning-50',
        text: 'text-warning-800',
        accent: 'text-warning-600'
      },
      error: {
        container: 'border-avoid-200 bg-avoid-50',
        text: 'text-avoid-800',
        accent: 'text-avoid-600'
      }
    },
    
    // Health-specific colors - gentle but meaningful
    health: {
      symptom: {
        container: 'border-avoid-200 bg-avoid-50',
        text: 'text-avoid-800',
        accent: 'text-avoid-600'
      },
      improvement: {
        container: 'border-allowed-200 bg-allowed-50',
        text: 'text-allowed-800',
        accent: 'text-allowed-600'
      },
      medication: {
        container: 'border-info-200 bg-info-50',
        text: 'text-info-800',
        accent: 'text-info-600'
      },
      supplement: {
        container: 'border-primary-200 bg-primary-50',
        text: 'text-primary-800',
        accent: 'text-primary-600'
      },
      food: {
        container: 'border-accent-200 bg-accent-50',
        text: 'text-accent-800',
        accent: 'text-accent-600'
      },
      neutral: {
        container: 'border-neutral-200 bg-neutral-100',
        text: 'text-neutral-800',
        accent: 'text-neutral-600'
      }
    },
    
    // Protocol compliance colors - intuitive but gentle
    protocol: {
      allowed: {
        container: 'border-allowed-200 bg-allowed-50',
        text: 'text-allowed-800',
        accent: 'text-allowed-600'
      },
      avoid: {
        container: 'border-avoid-200 bg-avoid-50',
        text: 'text-avoid-800',
        accent: 'text-avoid-600'
      },
      reintroduction: {
        container: 'border-accent-200 bg-accent-50',
        text: 'text-accent-800',
        accent: 'text-accent-600'
      },
      unknown: {
        container: 'border-neutral-200 bg-neutral-100',
        text: 'text-neutral-800',
        accent: 'text-neutral-600'
      }
    }
  };
  
  return semanticColors[category]?.[type]?.[variant] || semanticColors.status.info.container;
};

// Legacy health color function - updated for FILO colors
export const getHealthColor = (type, shade = 500) => {
  const healthColors = {
    symptom: designTokens.colors.avoid[shade],
    improvement: designTokens.colors.allowed[shade],
    medication: designTokens.colors.info[shade],
    supplement: designTokens.colors.primary[shade],
    food: designTokens.colors.accent[shade],
    neutral: designTokens.colors.neutral[shade],
  };
  
  return healthColors[type] || healthColors.neutral;
};

// Protocol compliance color utility
export const getProtocolColor = (status, variant = 'container') => {
  return getSemanticColor('protocol', status, variant);
};

// Component size utilities
export const getComponentSize = (component, size = 'md') => {
  return designTokens.components[component]?.[size] || size;
};

// Focus ring utility for accessibility
export const focusRing = (color = 'primary') => {
  return `focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-offset-2`;
};

// Transition utility
export const transition = (properties = 'all', duration = 'normal') => {
  const dur = designTokens.animation.duration[duration] || duration;
  const easing = designTokens.animation.easing.ease;
  return `transition-${properties} duration-${dur} ${easing}`;
};

// Shadow utility
export const shadow = (size = 'base') => {
  const shadows = {
    sm: 'shadow-sm',
    base: 'shadow',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };
  
  return shadows[size] || shadows.base;
};

// Spacing utility
export const spacing = (value) => {
  return designTokens.spacing[value] || value;
};

// Typography utility
export const typography = (size = 'base', weight = 'normal') => {
  const sizeClass = `text-${size}`;
  const weightClass = `font-${weight}`;
  return cn(sizeClass, weightClass);
};

// Health status color mapping
export const getStatusColor = (status) => {
  const statusColors = {
    excellent: 'text-green-600 bg-green-50',
    good: 'text-green-500 bg-green-50',
    fair: 'text-yellow-600 bg-yellow-50',
    poor: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50',
  };
  
  return statusColors[status] || statusColors.fair;
};

// Form validation state colors
export const getValidationColor = (state) => {
  const validationColors = {
    success: 'border-green-500 focus:ring-green-500',
    error: 'border-red-500 focus:ring-red-500',
    warning: 'border-yellow-500 focus:ring-yellow-500',
    default: 'border-gray-300 focus:ring-primary-500',
  };
  
  return validationColors[state] || validationColors.default;
};

// FILO button variant generator - chronic illness friendly
export const buttonVariants = createVariants(
  'inline-flex items-center justify-center rounded-md font-medium transition-standard focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none touch-target',
  {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-400',
    secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus:ring-neutral-400',
    success: 'bg-allowed-600 text-white hover:bg-allowed-700 focus:ring-allowed-400',
    warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-400',
    error: 'bg-avoid-600 text-white hover:bg-avoid-700 focus:ring-avoid-400',
    outline: 'border border-neutral-300 bg-transparent hover:bg-neutral-50 focus:ring-neutral-400',
    ghost: 'hover:bg-neutral-100 focus:ring-neutral-400',
    link: 'text-primary-600 underline-offset-4 hover:underline focus:ring-primary-400',
  }
);

// FILO input variant generator - chronic illness friendly
export const inputVariants = createVariants(
  'flex w-full rounded-md border px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-target bg-neutral-50',
  {
    default: 'border-neutral-300 focus:ring-primary-400',
    success: 'border-allowed-300 focus:ring-allowed-400',
    error: 'border-avoid-300 focus:ring-avoid-400',
    warning: 'border-warning-300 focus:ring-warning-400',
  }
);

// FILO card variant generator - chronic illness friendly
export const cardVariants = createVariants(
  'rounded-lg border shadow-sm',
  {
    // Base variants with FILO cream background
    default: 'border-neutral-200 bg-neutral-50',
    elevated: 'border-neutral-200 bg-neutral-50 shadow-md',
    outlined: 'border-neutral-300 bg-neutral-50 shadow-none',
    
    // Semantic variants using FILO-derived colors
    section: 'border-neutral-200 bg-neutral-50 shadow-sm',
    feature: 'border-primary-200 bg-primary-50',
    success: 'border-allowed-200 bg-allowed-50',
    warning: 'border-warning-200 bg-warning-50',
    error: 'border-avoid-200 bg-avoid-50',
    
    // Health-specific variants
    symptom: 'border-avoid-200 bg-avoid-50',
    improvement: 'border-allowed-200 bg-allowed-50',
    medication: 'border-info-200 bg-info-50',
    supplement: 'border-primary-200 bg-primary-50',
    food: 'border-accent-200 bg-accent-50',
    
    // Interactive variants with gentle hover states
    interactive: 'border-neutral-200 bg-neutral-50 hover:border-primary-300 hover:shadow-md transition-gentle cursor-pointer',
    selected: 'border-primary-300 bg-primary-50 shadow-sm',
    
    // Protocol compliance variants
    allowed: 'border-allowed-200 bg-allowed-50',
    avoid: 'border-avoid-200 bg-avoid-50',
    reintroduction: 'border-accent-200 bg-accent-50',
  }
);

export default {
  cn,
  getColor,
  createVariants,
  responsive,
  getHealthColor,
  getSemanticColor,
  getProtocolColor,
  getComponentSize,
  focusRing,
  transition,
  shadow,
  spacing,
  typography,
  getStatusColor,
  getValidationColor,
  buttonVariants,
  inputVariants,
  cardVariants,
};
