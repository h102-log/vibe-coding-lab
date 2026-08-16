import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 자체 테스트 실행 환경 (SPEC.md I17)
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.tsx'],
  },
})
