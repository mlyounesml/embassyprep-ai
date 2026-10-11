import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base './' keeps asset paths relative so the build works on GitHub Pages
// whether served from root or /<repo>/ subpath.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});
