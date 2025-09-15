import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Check if SSL certificates exist
const keyPath = path.resolve(__dirname, 'localhost-key.pem')
const certPath = path.resolve(__dirname, 'localhost.pem')
const hasSSL = fs.existsSync(keyPath) && fs.existsSync(certPath)

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow access from any host
    strictPort: false,
    https: false, // Temporarily disable HTTPS for tunneling
    allowedHosts: [
      'localhost',
      '.trycloudflare.com',
      '.loca.lt'
    ],
    headers: {
      // Allow iframe embedding for Teams
      'X-Frame-Options': 'SAMEORIGIN',
      // More permissive CSP for Teams
      'Content-Security-Policy': "frame-ancestors 'self' https://*.teams.microsoft.com https://*.teams.office.com https://*.skype.com https://*.microsoft.com https://*.office.com"
    }
  },
  build: {
    outDir: 'build',
    sourcemap: true
  }
})