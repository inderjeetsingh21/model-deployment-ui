import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.FRONTEND_PORT || '3000'),
      proxy: {
        '/api': {
          target: `http://localhost:${env.BACKEND_PORT || '8000'}`,
          changeOrigin: true,
        },
        '/ws': {
          target: `ws://localhost:${env.BACKEND_PORT || '8000'}`,
          ws: true,
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  }
})
