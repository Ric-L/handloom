/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Newsreader"', "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        ivory: {
          DEFAULT: "#F5EFE3",
          light: "#FAF6EE",
          subtle: "#EDE3D2",
        },
        khaki: {
          DEFAULT: "#D9C5A3",
          soft: "#E9DEC8",
          dark: "#BFA67B",
        },
        terracotta: {
          DEFAULT: "#8B5E3C",
          hover: "#734C30",
          light: "#F3EAE2",
          dark: "#5E3D26",
        },
        olive: {
          DEFAULT: "#5C6B45",
          hover: "#4A5737",
          light: "#EEF2E7",
          dark: "#3E492D",
        },
        earth: {
          DEFAULT: "#3B3028",
          dark: "#2A211B",
          muted: "#6E5D50",
          light: "#8D7B6D",
        },
        primary: {
          DEFAULT: "#8B5E3C",
          50: "#FAF6F1",
          100: "#F3E8DC",
          200: "#E4D0BA",
          300: "#D9C5A3",
          400: "#B5855E",
          500: "#9E6E49",
          600: "#8B5E3C",
          700: "#734C30",
          800: "#5A3B25",
          900: "#3B3028",
          950: "#2A211B",
        },
        accent: {
          DEFAULT: "#5C6B45",
          50: "#F4F7EF",
          100: "#E7EDDC",
          500: "#6F8055",
          600: "#5C6B45",
          700: "#4A5737",
        },
      },
    }
  },
  plugins: []
}
