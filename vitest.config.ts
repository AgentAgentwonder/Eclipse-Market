import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@tauri-apps/api/tauri': path.resolve(__dirname, 'tests/mocks/tauri.ts'),
      '@tauri-apps/api/event': path.resolve(__dirname, 'tests/mocks/tauri-event.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
