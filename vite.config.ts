import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules (works on both Unix and Windows)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve src directory - use relative path to avoid Windows path issues
const srcDir = path.join(__dirname, 'src');

// Inline version plugin to avoid import issues on Windows
const versionPlugin = (): Plugin => {
  return {
    name: 'version-plugin',
    transformIndexHtml(html) {
      const timestamp = new Date().toISOString();
      const version = process.env.npm_package_version || '1.0.0';
      const buildTime = new Date().getTime();
      
      // Inject version meta tag
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
  plugins: [react(), versionPlugin()],
  resolve: {
    alias: {
      '@': srcDir,
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    // Ensure all assets have hashed filenames for cache busting
    rollupOptions: {
      output: {
        // Add hash to all asset filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
});

