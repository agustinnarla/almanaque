/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // `npm run test:coverage` (Spec 049). Thresholds are a floor: the
    // coverage reached, rounded down; they only go up.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__tests__/**', 'src/test/**', 'src/main.tsx', 'src/**/*.d.ts'],
      reporter: ['text-summary', 'html', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: 96,
        branches: 83,
        functions: 96,
        lines: 96,
      },
    },
  },
})
