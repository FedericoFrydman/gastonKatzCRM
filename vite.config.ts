import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/auth': path.resolve(__dirname, './src/domains/auth'),
      '@/events': path.resolve(__dirname, './src/domains/events'),
      '@/places': path.resolve(__dirname, './src/domains/places'),
      '@/calendar': path.resolve(__dirname, './src/domains/calendar'),
      '@/economics': path.resolve(__dirname, './src/domains/economics'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/lib': path.resolve(__dirname, './src/lib'),
    },
  },
  build: {
    target: 'ES2020',
  },
})
