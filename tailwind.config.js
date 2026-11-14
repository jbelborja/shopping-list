/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#1A1A2E',
        surface: '#16213E',
        surfaceLight: '#1F2E54',
        accent: '#E94560',
        accentHover: '#D13852',
        textPrimary: '#FFFFFF',
        textSecondary: '#94A3B8',
        borderDark: '#2E3D60',
      },
    },
  },
  plugins: [],
};
