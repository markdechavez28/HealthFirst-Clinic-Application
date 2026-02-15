import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { allowedHosts: ['https://cylinder-myself-traveler-adams.trycloudflare.com'] }
})
