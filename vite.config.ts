import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El endpoint interno de Chess.com (callback) no tiene CORS, así que el
// navegador no puede llamarlo directamente. Este proxy del server de Vite lo
// reenvía desde el mismo origen. Funciona en `dev` y `preview`; en un build
// estático haría falta un proxy propio (Fase 2).
const chesscomProxy = {
  '/cc-callback': {
    target: 'https://www.chess.com',
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/cc-callback/, '/callback'),
    headers: {
      // UA de navegador para que el endpoint responda con normalidad.
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    },
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { proxy: chesscomProxy },
  preview: { proxy: chesscomProxy },
})
