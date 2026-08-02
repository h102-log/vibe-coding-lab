import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// SPEC.md §4용 자체 테스트 설정. tests/ac/** 는 건드리지 않는다.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/dev/**/*.spec.tsx'],
  },
})
