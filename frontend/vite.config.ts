import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Security headers applied to the Vite dev and preview servers.
// In production, equivalent headers must be set by the web server (nginx, CDN, etc.).
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: SECURITY_HEADERS,
  },
  preview: {
    headers: SECURITY_HEADERS,
  },
})
