import { fileURLToPath, URL } from 'node:url'
import { resolve, dirname } from 'node:path'
import fs from 'fs'

import { defineConfig, loadEnv } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { compression } from 'vite-plugin-compression2'
import vue from '@vitejs/plugin-vue'
import vueRouter from 'vue-router/vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import tailwindcss from '@tailwindcss/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const isVendor = (id: string) => id.includes('node_modules')
const isPrimeVue = (id: string) => id.includes('prime')
const isVue = (id: string) => id.includes('vue')
const isVueUse = (id: string) => id.includes('vueuse')
const isAdmin = (id: string) => id.includes('admin')
const isStore = (id: string) => id.includes('stores')

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks(id) {
            if (!isVendor(id)) {
              if (isStore(id)) {
                return 'stores'
              }
              if (isAdmin(id)) {
                return 'admin'
              }
              return null
            }

            if (isPrimeVue(id)) {
              return 'prime'
            }

            if (isVueUse(id)) {
              return 'vueuse'
            }

            if (isVue(id)) {
              return 'vue'
            }

            return 'vendor'
          },
          entryFileNames: () => {
            return 'assets/[name]-[hash].js'
          },
        },
      },
    },
    plugins: [
      tsconfigPaths({
        // Use local `app/tsconfig.json` to avoid parsing errors when repo root tsconfig.json is absent
        projects: [resolve(__dirname, './tsconfig.json')],
      }),
      VueI18nPlugin({
        include: resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**'),
      }),
      vueRouter({
        importMode: 'async',
      }),
      vue(),
      vueDevTools(),
      Components({
        resolvers: [PrimeVueResolver()],
      }),
      tailwindcss(),
      visualizer({ open: false, template: 'raw-data' }),
      compression({
        algorithms: ['gzip', 'brotliCompress'],
        threshold: 1024,
        deleteOriginalAssets: false,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@app/*': resolve(__dirname, '../../app/src/*'),
      },
    },
    server:
      command === 'serve'
        ? {
            https: {
              key: fs.readFileSync('./localhost-key.pem'),
              cert: fs.readFileSync('./localhost.pem'),
            },
            host: 'localhost',
            port: 5205,
            strictPort: true,
            proxy: {
              '/api': {
                target: env.VITE_API_PROXY_URL,
                changeOrigin: true,
                secure: false,
              },
            },
          }
        : undefined,
  }
})
