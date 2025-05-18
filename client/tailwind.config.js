/** @type {import('tailwindcss').Config} */
// For v3, using ES Module syntax if "type": "module" is in package.json
export default {
  content: [
    "./index.html", // Path to your main HTML file
    "./src/**/*.{js,ts,jsx,tsx}", // Paths to all your component files
  ],
  theme: {
    extend: {
      // You can extend the default Tailwind theme here.
      // For example:
      // fontFamily: {
      //   sans: ['Inter', 'sans-serif'],
      // },
      // colors: {
      //   'custom-blue': '#1fb6ff',
      // },
    },
  },
  plugins: [
    // Add any Tailwind CSS plugins here if you need them.
    // Examples:
    // require('@tailwindcss/forms'), // If using require, ensure your setup supports it or use import for ESM compatible plugins
    // For plugins that are ESM compatible, you might import them at the top:
    // import formsPlugin from '@tailwindcss/forms';
    // And then add: formsPlugin,
  ],
}
