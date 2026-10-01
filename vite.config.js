import { defineConfig } from 'vite'
import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (mode === 'production' && !env.VITE_API_URL?.trim()) {
    throw new Error('Set VITE_API_URL to the backend origin before building for production.')
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 3000,
      open: false,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true
        },
        '/socket.io': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          ws: true
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true
        }
      }
    }
  }
})
