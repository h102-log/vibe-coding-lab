import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // globals: Testing Library 의 afterEach 자동 cleanup 이 전역 훅을 필요로 한다.
    globals: true,
    include: ['src/**/*.test.tsx'],
  },
})
