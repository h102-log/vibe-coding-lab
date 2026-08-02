import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// SPEC.md §4의 자체 검증 전용 설정. tests/ac/** 와 무관하고,
// tsconfig.node.json 이 vite.config.ts 만 include 하므로 `npm run build` 에도 영향이 없다.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.tsx'],
  },
});
