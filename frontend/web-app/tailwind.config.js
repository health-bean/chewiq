/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared/components/**/*.{js,ts,jsx,tsx}", // More specific path to avoid node_modules
    "../shared/utils/**/*.{js,ts,jsx,tsx}",     // More specific path to avoid node_modules
  ],
  theme: {
    extend: {
      colors: {
        // FILO Primary - Brand Teal (#339999)
        primary: {
          50: '#f0fffe',
          100: '#ccf2f2',
          200: '#99e6e6',
          300: '#66d9d9',
          400: '#339999',
          500: '#339999',
          600: '#2d8080',
          700: '#266666',
          800: '#1f4d4d',
          900: '#193333',
        },
        
        // FILO Accent - Orange (#993300)
        accent: {
          50: '#fff5f0',
          100: '#ffe6cc',
          200: '#ffcc99',
          300: '#ffb366',
          400: '#cc6600',
          500: '#993300',
          600: '#993300',
          700: '#802b00',
          800: '#662200',
          900: '#4d1a00',
        },
        
        // FILO Neutral - Cream (#FFFFCC)
        neutral: {
          50: '#FFFFCC',
          100: '#ffffc2',
          200: '#ffffb8',
          300: '#ffffae',
          400: '#ffffa3',
          500: '#cccc99',
          600: '#999966',
          700: '#666633',
          800: '#333300',
          900: '#1a1a00',
        },
        
        // FILO Protocol Colors
        allowed: {
          50: '#f0fff0',
          100: '#ccf2cc',
          200: '#99e699',
          300: '#66d966',
          400: '#339933',
          500: '#336633',
          600: '#336633',
          700: '#2d5529',
          800: '#264426',
          900: '#1f331f',
        },
        
        avoid: {
          50: '#fff0f0',
          100: '#ffcccc',
          200: '#ff9999',
          300: '#ff6666',
          400: '#cc3333',
          500: '#993333',
          600: '#993333',
          700: '#802929',
          800: '#661f1f',
          900: '#4d1616',
        },
        
        warning: {
          50: '#fffef0',
          100: '#fffacc',
          200: '#fff599',
          300: '#fff066',
          400: '#ffeb33',
          500: '#FFCC66',
          600: '#FFCC66',
          700: '#ccaa52',
          800: '#99883d',
          900: '#666629',
        },
        
        info: {
          50: '#f0f9ff',
          100: '#ccebff',
          200: '#99d6ff',
          300: '#66c2ff',
          400: '#3399cc',
          500: '#006699',
          600: '#006699',
          700: '#005580',
          800: '#004466',
          900: '#00334d',
        },
        
        // Legacy mappings for backward compatibility
        secondary: {
          50: '#f0fff0',
          100: '#ccf2cc',
          200: '#99e699',
          300: '#66d966',
          400: '#339933',
          500: '#336633',
          600: '#336633',
          700: '#2d5529',
          800: '#264426',
          900: '#1f331f',
        },
        
        error: {
          50: '#fff0f0',
          100: '#ffcccc',
          200: '#ff9999',
          300: '#ff6666',
          400: '#cc3333',
          500: '#993333',
          600: '#993333',
          700: '#802929',
          800: '#661f1f',
          900: '#4d1616',
        },
        
        success: {
          50: '#f0fff0',
          100: '#ccf2cc',
          200: '#99e699',
          300: '#66d966',
          400: '#339933',
          500: '#336633',
          600: '#336633',
          700: '#2d5529',
          800: '#264426',
          900: '#1f331f',
        },
        
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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      // Chronic illness accessibility spacing
      spacing: {
        '11': '2.75rem', // 44px - minimum touch target
      },
      
      // Enhanced line heights for readability
      lineHeight: {
        'relaxed': '1.75',
      },
      
      // Animation durations for gentle transitions
      transitionDuration: {
        '250': '250ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
}
