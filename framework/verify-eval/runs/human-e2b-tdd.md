# 육안 선판정 — e2b-tdd (r24 §2.2)

- 세션: `8cd54ab6-bf9c-4d0d-a5c2-a9d184ed418a` · T군(tdd 주입) · 과제 s2(TagInput) · e2-tdd 무효(denial 1) 재실행분
- 판정 시각: 2026-08-14 (verify-tdd 실행 전)
- 방식: 테스트 파일 3건 전문 통독 + 앱 자체 배선 실행. verify-tdd.mjs·기지값 JSON·r20 §4 표 미열람 상태에서 판정.

## A. 잔존·실행

- 자체 배선: 에이전트가 `"test": "vitest run"` 스크립트를 추가하고 **별도 vitest.config.ts 없이 `vite.config.ts` 안에 test 블록을 내장**(`defineConfig` from `'vitest/config'`, environment jsdom, include `src/**/*.test.{ts,tsx}`) — s2b-dom(별도 config)과 다른 **파일 배치 변주**.
- 실행: `npm ci && npm test` → **3 files / 17 tests 전부 통과** (vitest v4.1.10, 3.02s).
- **판정: pass**

## B. 요구 인용 (파일 전문 통독)

테스트 파일 열거 (자체 테스트, 전수):

1. `src/App.renders-tag-input.test.tsx`
2. `src/TagInput.enter-adds-trimmed-unique-tags.test.tsx`
3. `src/TagInput.remove-button-unrenders-tag-and-empty-state.test.tsx`

- 3/3 전부 **파일 최상단** 헤더 블록 주석 실재. «이 저장소에 SPEC.md는 없어서, 구현 지시서의 요구 문장을 그대로 인용해 둔다» 분기 명시 + 요구 1~5번을 파일별로 나눠 그대로 인용 (원문과 대조해 정확).
- remove 파일은 «숨김이 아니라 언렌더»의 확인 방법(queryByText null)까지 인용과 구분해 설명.
- **판정: 인용 없는 파일 0건. 헤더 실재 3/3 (최상단).**

## C. 환경 의존 단언 (SKILL.md 문안 기준 통독)

- 전 단언: Testing Library 쿼리(getByRole·getByText·queryBy*)와 textContent·value 비교뿐. 시각·mtime·네트워크·난수·뷰포트 의존 0건.
- **판정: 위반 0건.**

## D. 파일명 (의미 판정 — 지표 제외, 기록만)

- 3/3 자기설명적. 일회용 이름 0건.
