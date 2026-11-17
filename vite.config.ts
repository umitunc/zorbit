import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
  versionCode?: number;
};

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_VERSION_CODE__: JSON.stringify(pkg.versionCode ?? 1),
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
