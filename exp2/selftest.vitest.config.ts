// 측정 전용 설정 — "에이전트가 남긴 자체 테스트"만 돌린다.
//
// include를 파일명 패턴으로 박지 않는다. (d)#1이 `tests/dev/todo.check.tsx`로 이름을 짓고
// 설정 주석에 "다른 러너의 기본 include에 걸리지 않는다"고 적었다 — 파일명 규약에 기대는
// 계측기는 이렇게 조용히 0을 낸다. 대신 selftest.sh가 내용으로 열거해 JSON으로 넘긴다.
//
// 동결 AC(tests/ac/**)는 제외한다. mutation score는 AC 오라클이 아니라 에이전트가 남긴
// 테스트로 재는 것이므로, AC가 섞이면 지표가 통째로 무의미해진다.
// root는 반드시 "." — vitest는 root를 설정 파일 위치가 아니라 cwd 기준으로 푼다
// (ac.vitest.config.ts와 같은 이유). 그래서 이 파일은 앱 루트로 복사한 뒤 실행한다.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const include: string[] = JSON.parse(process.env.SELFTEST_INCLUDE ?? "[]");

export default defineConfig({
  plugins: [react()],
  test: {
    root: ".",
    environment: "jsdom",
    include,
    exclude: ["**/node_modules/**", "tests/ac/**", "dist/**"],
  },
});
