/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D9488",
          light: "#F0FDF4",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        surface: "#FFFFFF",
        background: "#F4F6FA",
        accent: "#F97316",
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
        },
        border: "#E2E8F0",
      },
      fontFamily: {
        inter: ["Inter"],
      },
    },
  },
  plugins: [],
}
