import { defineConfig } from 'vitest/config';

const frameworkLogPrefixes = ['isCommonEvent', 'isSQSEvent', '[CommonEventFramework]'];

export default defineConfig({
  test: {
    name: 'backend',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/support/globalSetup.ts'],
    setupFiles: ['tests/support/testEnvironment.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
    onConsoleLog(message) {
      return !frameworkLogPrefixes.some((prefix) => message.startsWith(prefix));
    },
  },
});
