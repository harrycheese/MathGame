import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon-180x180.png',
        'pwa-64x64.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon-512x512.png'
      ],
      manifest: {
        id: '/',
        name: 'Six-7',
        short_name: 'Six-7',
        description: 'Speed Math Survival Challenge',
        start_url: '/',
        scope: '/',
        dir: 'ltr',
        categories: ['games', 'puzzle', 'education'],
        theme_color: '#030712', // match bg-gray-950
        background_color: '#030712',
        display: 'standalone',
        display_override: ['standalone', 'window-controls-overlay'],
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshot-survival.png',
            sizes: '475x879',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Speed Math Survival Mode'
          },
          {
            src: 'screenshot-profile.png',
            sizes: '476x894',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Career Analytics & Stats'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallbackDenylist: [/^\/\.well-known\//, /^\/privacy\.html$/, /^\/delete-account\.html$/]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/analytics'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'canvas-confetti'],
        }
      }
    }
  }
})
