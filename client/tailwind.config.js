/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080808", // Deep dark background
        surface: "#121212",    // Card background
        primary: {
          DEFAULT: "#FF5722", // CodeRabbit Orange
          foreground: "#ffffff",
          glow: "rgba(255, 87, 34, 0.4)",
        },
        secondary: {
          DEFAULT: "#1F1F1F",
          foreground: "#A1A1A1",
        },
        accent: {
          DEFAULT: "#2A2A2A",
          foreground: "#FFFFFF",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "glow-pulse": "glow-pulse 3s infinite",
        "grid-scroll": "grid-scroll 20s linear infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(255, 87, 34, 0.2)" },
          "50%": { boxShadow: "0 0 20px rgba(255, 87, 34, 0.6)" },
        },
        "grid-scroll": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "50px 50px" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        }
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)",
      }
    },
  },
  plugins: [],
}
