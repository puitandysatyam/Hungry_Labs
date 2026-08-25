import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Removed vueDevTools import that was missing in package.json

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // vueDevTools(), // Removed from plugins array
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    // We add proxy to dodge CORS if Backblaze is being stubborn!
    proxy: {
      '/b2api': {
        target: 'https://s3.us-east-005.backblazeb2.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/b2api/, ''),
        secure: false
      }
    }
  }
})