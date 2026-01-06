import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'node:path';

/**
 * Cross-platform root
 * (works on Windows, Linux, macOS, IIS, Docker)
 */
const rootDir = process.cwd();
const srcDir = path.resolve(rootDir, 'src');

/**
 * Inline version plugin
 */
const versionPlugin = (): Plugin => ({
  name: 'version-plugin',
  transformIndexHtml(html) {
    const version = process.env.npm_package_version ?? '1.0.0';
    const buildTime = Date.now();
    const timestamp = new Date().toISOString();

    return html.replace(
      '</head>',
      `    <meta name="app-version" content="${version}" />
    <meta name="build-time" content="${buildTime}" />
    <meta name="build-timestamp" content="${timestamp}" />
  </head>`
    );
  },
});

export default defineConfig({
  /**
   * 🔒 Lock Vite inside project directory
   */
  root: rootDir,

  /**
   * 🔐 Prevent filesystem traversal
   */
  server: {
    fs: {
      strict: true,
      allow: [rootDir],
    },
  },

  plugins: [react(), versionPlugin()],

  resolve: {
    alias: {
      '@': srcDir,
    },
  },

  build: {
    outDir: path.resolve(rootDir, 'dist'),
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',

    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',

        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name?.split('.').pop()?.toLowerCase();

          if (ext && /png|jpe?g|svg|gif|tiff|bmp|ico/.test(ext)) {
            return 'assets/images/[name]-[hash][extname]';
          }

          if (ext && /woff2?|eot|ttf|otf/.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }

          return 'assets/[name]-[hash][extname]';
        },

        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
          ],
          redux: ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
});
