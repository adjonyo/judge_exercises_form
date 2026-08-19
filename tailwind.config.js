/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        surface: '#1e1e2e',
        'surface-light': '#2a2a3e',
        bg: '#11111b',
      },
    },
  },
  plugins: [],
}
