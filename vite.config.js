import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build inside current project folder
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'build_temp', // relative to project root
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html', // relative path
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
});
