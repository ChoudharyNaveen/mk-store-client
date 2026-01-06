// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // use '/' if deployed at root domain, or '/subfolder/' if in a subdirectory
});
