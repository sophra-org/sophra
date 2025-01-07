import { defineConfig } from 'vitest/config';
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        '**/*.tsx',
        '**/__mocks__/**',
        'node_modules/**',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
      ]
    }
  }
}) 