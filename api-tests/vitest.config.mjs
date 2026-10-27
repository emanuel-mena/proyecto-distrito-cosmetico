import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['api-tests/**/*.test.mjs'],
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 180_000,
    reporters: ['verbose', ['junit', { outputFile: 'reports/api/junit.xml' }]],
  },
});
