import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLE=1 npm run build → démo en un seul fichier index.html
export default defineConfig({
  plugins: [vue(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
  test: { environment: 'jsdom' },
} as any)
