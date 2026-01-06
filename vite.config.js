// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Version plugin to inject build version/timestamp into HTML
const versionPlugin = () => {
  return {
    name: 'version-plugin',
    transformIndexHtml(html) {
      const timestamp = new Date().toISOString();
      const version = process.env.npm_package_version || '1.0.0';
      const buildTime = new Date().getTime();
      
      // Inject version meta tags
      const versionMeta = `    <meta name="app-version" content="${version}" />\n    <meta name="build-time" content="${buildTime}" />\n    <meta name="build-timestamp" content="${timestamp}" />`;
      
      // Inject before closing head tag
      return html.replace(
        '</head>',
        `${versionMeta}\n  </head>`
      );
    },
  };
};

export default defineConfig({
  base: '/',
  plugins: [react(), versionPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
  optimizeDeps: {
    // exclude modules that may try to access outside folders
    exclude: ['resolve'],
  },
});
