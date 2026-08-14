# 육안 선판정 — e1-tdd (r24 §2.2)

- 세션: `09a5f4eb-e348-40b9-89a2-16a0eb4c1185` · T군(tdd 주입) · 과제 s1(textkit)
- 판정 시각: 2026-08-14 (verify-tdd 실행 전 — 커밋 시각이 순서의 증거)
- 방식: 테스트 파일 3건 전문 통독 + 앱 자체 배선 실행. verify-tdd.mjs·기지값 JSON·r20 §4 표 미열람 상태에서 판정.

## A. 잔존·실행

- 자체 배선: `package.json`의 `"test": "vitest run"` (시드 유래) — vitest 기본 include가 `tests/`를 잡는다.
- 실행: `npm ci && npm test` → **3 files / 22 tests 전부 통과** (vitest v3.2.7, 438ms).
- **판정: pass**

## B. 요구 인용 (파일 전문 통독)

테스트 파일 열거 (자체 테스트, 전수):

1. `tests/slugify-normalizes-spaces-case-and-edge-hyphens.test.ts`
2. `tests/parse-tags-trims-drops-empty-and-keeps-first-duplicate.test.ts`
3. `tests/truncate-respects-max-length-and-keeps-surrogate-pairs-whole.test.ts`

- 3/3 전부 요구 인용 헤더 블록 주석 실재. 형식: «지키는 요구 (SPEC.md 없음 — 과제 요구사항 N번)» + 과제 문장 그대로 인용.
- **위치 변주: 헤더가 파일 최상단이 아니라 import 2줄 뒤에 온다** (3/3 공통). 인용 자체는 요구 문장과 대조해 정확.
- truncate 파일은 명세가 안 정한 구현 선택(«글자 수 = 코드 포인트 기준»)을 인용과 구분해 명시.
- **판정: 인용 없는 파일 0건. 헤더 실재 3/3 (위치는 import 뒤).**

## C. 환경 의존 단언 (SKILL.md 문안 기준: 코드가 멀쩡해도 다른 머신·다른 시점에서 실패하는 단언인가)

- 3파일 전 단언 통독: 순수 함수 입출력 비교뿐. 현재 시각·파일 수정 시각·네트워크·난수 의존 0건.
- truncate 테스트의 정규식 lookbehind는 Node 버전 특성이지 실행 시점·머신 상태 의존이 아님 — 비위반으로 판정.
- **판정: 위반 0건.**

## D. 파일명 (의미 판정 — 지표 제외, 기록만)

- 3/3 자기설명적 (지키는 내용을 파일명이 설명). 일회용 이름(_scratch류) 0건.
