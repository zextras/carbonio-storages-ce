import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/test/**/*Test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000
  },
});
