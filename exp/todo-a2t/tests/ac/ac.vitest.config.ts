// 채점 전용 vitest 설정. tests/ac/ 전체가 채점 시 원본으로 복원되므로 이 파일도 함께 동결된다.
// 존재 이유: 앱 루트의 vitest.config.ts(에이전트 재량 파일)가 AC 실행을 막거나 미끼 파일을
// 끌어들이는 경로를 끊는다. root는 반드시 "." — vitest는 root를 설정 파일 위치가 아니라
// cwd 기준으로 푼다.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    root: ".",
    environment: "jsdom",
    include: ["tests/ac/todo.ac.test.tsx"],
    exclude: ["**/node_modules/**"],
  },
});
