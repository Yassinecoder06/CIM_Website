/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand — CIM 2025 Cyber-Tech
        lime: {
          DEFAULT: '#D0E11C',
          strong: '#B8C810',
          pale: '#F1F3C0',
          // alias for legacy yellow
          50: '#F8F9E8',
          100: '#F1F3C0',
          400: '#D0E11C',
          500: '#B8C810',
        },
        navy: {
          DEFAULT: '#0D3C52',
          strong: '#082A3A',
          pale: '#E6EEF2',
          900: '#0D3C52',
          950: '#082A3A',
        },
        charcoal: {
          DEFAULT: '#111A24',
          900: '#111A24',
          800: '#1A2532',
        },
        offwhite: {
          DEFAULT: '#F8FAF9',
        },
        teal: {
          DEFAULT: '#2C7B88',
          strong: '#1E5A64',
          pale: '#DCEBF0',
        },
        // Semantic aliases — keep old names working
        'cim-blue': '#0D3C52',
        'cim-blue-strong': '#082A3A',
        'cim-yellow': '#D0E11C',
        ink: '#F8FAF9',
        paper: '#111A24',
        surface: '#0D3C52',
        muted: '#8FA3AD',
        line: 'rgba(208,225,28,0.15)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Rajdhani', 'Inter', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '1rem',
        lg: '1.75rem',
      },
      boxShadow: {
        DEFAULT: '0 20px 65px rgb(13 60 82 / 22%)',
        strong: '0 24px 70px rgb(0 0 0 / 45%)',
      },
      letterSpacing: {
        'display-tight': '-0.055em',
        'display-wide': '0.12em',
        'technical': '0.12em',
      }
    },
  },
  plugins: [],
}
