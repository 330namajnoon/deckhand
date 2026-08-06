import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // El build se sirve desde el backend en http://localhost:4000/dist
  base: '/dist/',
  plugins: [react()],
})
