import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// 평가 전용 러너 설정. tsconfig.node.json 의 include 는 vite.config.ts 뿐이라
// 이 파일과 tests/ 는 `tsc -b`(npm run build) 의 타입체크 대상이 아니다.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
