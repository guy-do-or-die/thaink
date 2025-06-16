import path from 'path'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { defineConfig } from 'vite'
import { terserOptions } from './config'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),
  ],

  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '~': path.resolve(__dirname, './'),
    },
  },
})
