import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// SPEC.md의 문장을 검증하는 자체 테스트 설정. tests/ac/** 와는 무관하며 인수 테스트를 건드리지 않는다.
// 실행: npx vitest run --config tests/spec/spec.vitest.config.ts
export default defineConfig({
  root: fileURLToPath(new URL('../..', import.meta.url)),
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/spec/**/*.test.tsx'],
  },
});
