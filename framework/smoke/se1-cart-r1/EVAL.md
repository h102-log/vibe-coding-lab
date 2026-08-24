# EVAL — CartList (담은 항목 목록 컴포넌트)

- SPEC: ./SPEC.md
- 러너: vitest (jsdom + Testing Library, `vitest.config.ts`)

승인: 2026-08-25 사용자 «전건 승인한다. 계속 진행해 완료까지 가라» — 항목별 제시 전에 받은
포괄 승인이므로 승인 열은 `위임`으로 적는다.

S10(`npm run build` 종료 코드 0)은 러너가 아니라 빌드 명령 자체가 판정하므로 평가 항목으로
만들지 않는다. `[MISSING: «작은 버튼»의 정량 기준]`도 jsdom에 레이아웃이 없어 자격 미달이다.

## 1. 평가 항목

| ID | 근거 | 근거 해시 | 무엇을 어떻게 재나 | 테스트 | 승인 |
| --- | --- | --- | --- | --- | --- |
| EV1 | S1 | e65e53ee | 초기 렌더 → `listitem` 역할 요소가 3개 렌더된다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV2 | S2 | eca6465a | 초기 렌더 → 첫 줄에 이름·단가 `12,000원`·수량 `2`·소계 `24,000원`이 모두 렌더된다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV3 | S3 | c0d76819 | 초기 렌더 → 각 줄 안에 `button` 요소가 정확히 2개 렌더된다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV4 | S4 | 294ef27c | 초기 렌더 → 모든 스테퍼 버튼의 `textContent`가 빈 문자열이다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV5 | S5 | 747f13ac | 첫 줄 + 1회 클릭 → 그 줄 수량이 `3`, 소계가 `36,000원`으로 렌더된다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV6 | S6 | 6cc92ea7 | 수량 2인 줄의 − 1회 클릭 → 그 줄 수량이 `1`, 소계가 `12,000원`으로 렌더된다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV7 | S7 | 6d673fe0 | 초기 렌더 → 합계 요소가 목록(`role=list`)보다 DOM 뒤에 있고 `56,000원`으로 렌더된다 | tests/eval/cart-list-total.test.tsx | 위임, 2026-08-25 |
| EV8 | S8 | b7dbc459 | props 없이 `<CartList />` 렌더 → 항목 줄 수가 2 이상 3 이하다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV9 | S9 | 04060131 | `<App />` 렌더 → `role=list` 1개와 합계 요소가 렌더된다 | tests/eval/app.test.tsx | 위임, 2026-08-25 |
| EV10 | S12 | 9502fdfd | 수량 1인 «드리퍼» 줄의 − 1회 클릭 → «드리퍼» 텍스트가 언렌더된다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV11 | S11 | 80ae0942 | 수량 1인 «드리퍼» 줄의 − 1회 클릭 → 합계가 `56,000원`에서 `37,500원`으로 렌더된다 | tests/eval/cart-list-total.test.tsx | 위임, 2026-08-25 |
| EV12 | S13 | d1d8f1f6 | 초기 렌더 → 각 스테퍼 버튼이 `svg[aria-hidden="true"]` 자식을 정확히 1개 갖는다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV13 | I1 | 001a270f | 초기 렌더 → 항목 이름 3개 각각에 대해 «{이름} 수량 증가»·«{이름} 수량 감소» 접근 가능 이름 버튼이 1개씩 조회된다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV14 | I2 | d4275a37 | Tab 키 2회 → 첫 줄 증가 버튼이 `document.activeElement`다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV15 | I2 | d4275a37 | Tab 2회로 포커스한 증가 버튼에 Enter 입력 → 그 줄 수량이 `3`으로 렌더된다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV16 | I3 | 4e037972 | 수량 1인 줄의 − 클릭 후 → 남은 모든 줄의 수량이 0보다 크고 화면에 음수 수량이 렌더되지 않는다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV17 | I4 | b5cc6952 | 첫 줄 + 1회 클릭 → 합계가 단가만큼 늘어 `68,000원`으로 렌더된다 | tests/eval/cart-list-total.test.tsx | 위임, 2026-08-25 |
| EV18 | I5 | 0bfc709f | 모든 줄을 0으로 내림 → 항목 줄이 0개이고 «담은 항목이 없습니다»가 렌더된다 | tests/eval/cart-list-total.test.tsx | 위임, 2026-08-25 |
| EV19 | I5 | 0bfc709f | 모든 줄을 0으로 내림 → 합계가 `0원`으로 렌더된다 | tests/eval/cart-list-total.test.tsx | 위임, 2026-08-25 |
| EV20 | I6 | 54aae0b8 | 초기 렌더 → 합계와 첫 줄 단가 텍스트가 `/^\d{1,3}(,\d{3})*원$/`에 맞는다 | tests/eval/cart-list-total.test.tsx | 위임, 2026-08-25 |
| EV21 | I8 | e00007c9 | 초기 렌더 → 목록 컨테이너 `tagName`이 `UL`이고 각 줄이 `LI`다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV22 | I9 | d5d88b53 | 초기 렌더 → «합계» 레이블 텍스트가 렌더된다 | tests/eval/cart-list-total.test.tsx | 위임, 2026-08-25 |
| EV23 | I11 | 1b46a13b | 첫 줄 + 1회 클릭 → 둘째 줄의 수량·소계가 클릭 전과 같게 렌더된다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |
| EV24 | I10 | 5a5d979a | 언마운트 후 재렌더 → 첫 줄 수량이 초기값 `2`로 렌더된다 | tests/eval/cart-list.test.tsx | 위임, 2026-08-25 |

## 기각

| EV# | 사유 |
| --- | --- |

## 개정

| EV# | 새 해시 | 사유 | 날짜 |
| --- | --- | --- | --- |
