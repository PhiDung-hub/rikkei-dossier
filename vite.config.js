import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// On GitHub Pages project sites the app is served from /<repo>/, so assets must
// resolve under that base. CI sets BASE_PATH=/<repo>/ ; locally it defaults to '/'.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [svelte()],
  build: { target: 'es2022' },
});
