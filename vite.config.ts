import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves at https://<user>.github.io/<repo>/
// Set BASE_URL when building for GitHub Pages (e.g. in CI)
export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [react()],
})
