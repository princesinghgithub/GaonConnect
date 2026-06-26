
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',
      
      devOptions: {
        enabled: false
      },

      // Service Worker ko fast update ke liye
      workbox: {
        cleanupOutdatedCaches: true,
        sourcemap: true,
        
        // API aur assets ko cache karne ke liye strategies
        runtimeCaching: [
          {
            // Images ko cache karein
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // API calls ko cache karein (agar hai to)
            urlPattern: /^https:\/\/api\.goanconnect\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },

      manifest: {
        name: 'GaonConnect',
        short_name: 'GaonConnect',
        description: 'GaonConnect - Apni Gaadi, Apni Seva. Book bike, auto, car, tractor aur other vehicles for your village/rural area.',

        start_url: '/',
        scope: '/',
        
        display: 'standalone',
        orientation: 'portrait-primary',
        
        theme_color: '#FF6B35',           // ✅ Goa theme color (sunset orange)
        background_color: '#ffffff',

        // ✅ Categories add kiye
        categories: ['business', 'lifestyle', 'social'],

        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'           // ✅ Android adaptive icons ke liye
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],

        // ✅ Screenshots add kar sakte hain (optional)
        // screenshots: [
        //   {
        //     src: '/screenshots/home.png',
        //     sizes: '1080x1920',
        //     type: 'image/png'
        //   }
        // ]
      },

      // ✅ Additional files jo cache mein include karni hain
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt']
    })
  ]
})