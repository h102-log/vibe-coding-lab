import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// 자체 테스트 전용 설정. tests/ac/** 와 겹치지 않는다.
// 파일명에 .test./.spec. 을 쓰지 않아 다른 러너의 기본 include 에도 걸리지 않는다.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/dev/**/*.check.tsx"],
  },
});
