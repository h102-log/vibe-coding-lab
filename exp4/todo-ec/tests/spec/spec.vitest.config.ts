import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// SPEC.md §4의 검증 테스트 전용 설정. tests/ac 쪽 설정은 건드리지 않는다.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/spec/**/*.test.tsx'],
  },
});
