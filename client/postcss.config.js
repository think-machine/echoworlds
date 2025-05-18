// client/postcss.config.js
// Using ES Module syntax if "type": "module" is in package.json
export default {
  plugins: {
    tailwindcss: {}, // This shorthand should still work; it resolves to the tailwindcss package
    autoprefixer: {}, // This shorthand should still work; it resolves to the autoprefixer package
    // Add other PostCSS plugins here if needed
  },
}
