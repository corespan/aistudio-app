/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL

  if (!apiTarget) {
    throw new Error(
      'VITE_API_URL is missing! Create a .env file with VITE_API_URL=http://[HOST]:[PORT]',
    )
  }

  // Forward BROWSER from .env so Vite's server.open uses it.
  if (env.BROWSER && !process.env.BROWSER) {
    process.env.BROWSER = env.BROWSER
  }

  return {
    plugins: [
      react({
        babel: {
          plugins: [
            ['babel-plugin-react-compiler', { compilationMode: 'annotation', target: '19' }],
          ],
        },
      }),
    ],
    server: {
      host: true,
      open: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        // The backend exposes its health probe at the root (`/health`), outside
        // the `/api/v1` namespace, so it needs its own proxy entry.
        '/health': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    optimizeDeps: {
      include: ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers'],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.ts',
      coverage: {
        reporter: ['text', 'json', 'html'],
      },
    },
  }
})
