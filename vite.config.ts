import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves a project site from https://<user>.github.io/<repo>/, so every
// asset URL needs the repo name in front of it. Override with BASE_PATH=/ when serving
// from a user/org site or a custom domain.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/meme/',
  plugins: [react()],
})
