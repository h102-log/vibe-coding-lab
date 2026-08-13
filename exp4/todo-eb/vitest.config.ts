import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// SPEC.md §4 자체 검증용 설정. tests/ac 의 설정과 무관하며(각자 --config 로 실행),
// npm run build 는 vite.config.ts 만 읽으므로 빌드에 영향을 주지 않는다.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.tsx'],
  },
});
