import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.vitest.test.tsx'],
    globals: true, // global: true にしないと、 testing-library/jest-dom 内部の参照が失敗する
  },
})