import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages - change 'build_wheel' to your repo name
  base: process.env.NODE_ENV === 'production' ? '/build_wheel/' : '/',
  server: {
    port: 4500,
  },
})
