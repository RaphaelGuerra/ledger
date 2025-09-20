import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/**/*.test.js', 'src/lib/**/__tests__/**/*.test.js'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})

