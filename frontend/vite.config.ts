import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('maplibre-gl') || id.includes('react-map-gl')) return 'maps'
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('dompurify')) return 'pdf'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('recharts')) return 'charts'
          return undefined
        },
      },
    },
  },
})
