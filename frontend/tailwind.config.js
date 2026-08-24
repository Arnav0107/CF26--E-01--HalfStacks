/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // New Palette: White + Maroon + Soft Blue
        "maroon": {
          DEFAULT: "#7A1028",
          dark: "#5E0B1D",
          light: "#9E1C38",
          50: "#FDF2F4",
          100: "#FCE7EB",
          500: "#7A1028",
          600: "#5E0B1D",
          700: "#450714",
        },
        "navy": {
          DEFAULT: "#172A63",
          deep: "#0F1C42",
          light: "#253E85",
          text: "#172A63",
        },
        "blue": {
          primary: "#1677E8",
          light: "#8DB7F5",
          pale: "#EAF2FC",
          50: "#F0F6FE",
          100: "#EAF2FC",
          500: "#1677E8",
          600: "#125EC0",
        },
        "neutral": {
          offwhite: "#FAF9F7",
          white: "#FFFFFF",
          softgray: "#E5E7EB",
          border: "#E2E8F0",
          textslate: "#5E6B8A",
        },
        
        // Backward-compatible design system tokens mapped to the new White/Maroon/Blue theme
        "primary": "#7A1028",
        "primary-container": "#7A1028",
        "secondary": "#5E6B8A",
        "surface": "#FFFFFF",
        "surface-dim": "#FAF9F7",
        "surface-bright": "#FFFFFF",
        "surface-container": "#FFFFFF",
        "surface-container-low": "#FAF9F7",
        "surface-container-high": "#F1F5F9",
        "on-surface": "#172A63",
        "on-surface-variant": "#5E6B8A",
        "outline": "#8DB7F5",
        "outline-variant": "#E2E8F0",
        "abyssal-void": "#FAF9F7",
        "oceanic-slate": "#5E6B8A",
        "biolume-glow": "rgba(22, 119, 232, 0.15)",
        
        // Brand mappings
        brand: {
          50: "#FDF2F4",
          100: "#FCE7EB",
          400: "#9E1C38",
          500: "#7A1028",
          600: "#5E0B1D",
          700: "#450714",
        },
        dark: {
          950: "#FFFFFF",
          900: "#FAF9F7",
          850: "#F8FAFC",
          800: "#FFFFFF",
          700: "#F1F5F9",
          650: "#E2E8F0",
          600: "#CBD5E1",
        }
      },
      fontFamily: {
        sans: ['Inter', 'Raleway', 'sans-serif'],
        mono: ['Geist Mono', 'Courier New', 'monospace'],
        brand: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'Raleway', 'sans-serif'],
        'mono-data': ['Geist Mono', 'monospace'],
      },
      boxShadow: {
        'clean': '0 4px 20px -2px rgba(23, 42, 99, 0.05), 0 2px 6px -1px rgba(23, 42, 99, 0.03)',
        'clean-hover': '0 10px 25px -3px rgba(23, 42, 99, 0.08), 0 4px 10px -2px rgba(23, 42, 99, 0.04)',
        'clean-card': '0 2px 12px 0 rgba(23, 42, 99, 0.04)',
        'glow-blue': '0 0 25px rgba(22, 119, 232, 0.2)',
        'glow-maroon': '0 0 25px rgba(122, 16, 40, 0.2)',
      }
    },
  },
  plugins: [],
}
