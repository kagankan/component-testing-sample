import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    
    projects: [
      {
        test: {
          name: 'jsdom',
          include: ['**/*.vitest.test.tsx'],
          globals: true, // global: true にしないと、 testing-library/jest-dom 内部の参照が失敗する
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'browser',
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }],
          },
          include: ['**/*.vitest-browser.test.tsx'],
        },
      },
    ],
  },
})