import type { Plugin } from 'vite';

/**
 * Vite plugin to inject build version/timestamp into HTML
 * This helps with cache busting and version tracking
 */
export function versionPlugin(): Plugin {
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
}

