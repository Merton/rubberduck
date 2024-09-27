import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Enable TypeScript support
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Add any other configuration options you need
  },
})