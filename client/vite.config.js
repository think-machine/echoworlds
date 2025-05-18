import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), // The Vite React plugin enables React-specific features like Fast Refresh.
  ],
  // No specific Tailwind CSS configuration is needed here
  // if you have a postcss.config.js file in your project root (client folder).
  // Vite will automatically use it.
});
