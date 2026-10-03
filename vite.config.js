import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appName = env.VITE_APP_NAME || 'Automate Era';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: `${appName} — Clinic Management`,
          short_name: appName,
          description: 'Appointments, patient records, daily sheets and stock for clinics and hospitals.',
          theme_color: '#1D4ED8',
          background_color: '#0F2D5E',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
          runtimeCaching: [
            // Patient data is never cached on the device
            { urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
          ],
        },
      }),
    ],
    server: {
      port: 5173,
      host: true, // reachable from your phone on the same Wi-Fi
      proxy: {
        '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:5000', changeOrigin: true },
      },
    },
    preview: {
      port: 4173,
      host: true,
      proxy: {
        '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:5000', changeOrigin: true },
      },
    },
  };
});
