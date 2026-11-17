import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { env: { DATABASE_FILE: ':memory:', DISABLE_SYNC: '1', NODE_ENV: 'test' }, fileParallelism: false },
});
