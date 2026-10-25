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
        dark: {
          bg: "#080808",
          card: "#121212",
          elevated: "#181818",
          surface: "#1F1F1F",
          border: "rgba(255, 255, 255, 0.08)",
          borderHover: "rgba(255, 255, 255, 0.18)",
          text: "#F5F5F7",
          muted: "#86868B",
          subtle: "#52525B",
        },
        neon: {
          green: "#00E575",
          greenGlow: "rgba(0, 229, 117, 0.15)",
          red: "#FF3B30",
          amber: "#FFB020",
          blue: "#38BDF8",
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'Inter'",
          "system-ui",
          "sans-serif"
        ],
        mono: [
          "'SF Mono'",
          "'JetBrains Mono'",
          "'Roboto Mono'",
          "monospace"
        ]
      },
      boxShadow: {
        'matte': '0 8px 30px rgba(0, 0, 0, 0.7)',
        'neon': '0 0 25px rgba(0, 229, 117, 0.25)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
