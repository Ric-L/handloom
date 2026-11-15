import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    cssMinify: false,
    rollupOptions: {
      external: ['fflate', 'html2canvas', 'canvg'],
    },
  },
  server: {
    port: 5173,
  }
})

