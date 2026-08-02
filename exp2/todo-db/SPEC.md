# SPEC — Todo 앱 요구사항 확정

구현 전 작업 문서. 산출물이 아니다.
근거 표기: `[계약 §…]` = 구현 계약 문서, `[파일:줄]` = 저장소 파일, `[추론]` = 계약이 침묵해서 내가 정한 것.

---

## 1. 명시된 것

계약 문서에서 직접 읽어낼 수 있는 요구를, 산출물을 보고 참/거짓을 판정할 수 있는 문장으로 옮긴다.

### 1.1 구조·빌드

- S1. 앱의 진입 컴포넌트는 `src/App.tsx`의 default export이며, 렌더 트리 전체가 그 아래에서 나온다. [계약 §고정된 것]
- S2. 스택은 Vite + React + TypeScript이고, 다른 프레임워크/런타임 의존성을 추가하지 않는다. [계약 §고정된 것]
- S3. `tests/ac/**`의 어떤 파일도 읽거나 수정·삭제·이동하지 않는다. 실행만 한다. [계약 §고정된 것]
- S4. `package.json`의 `build`(`tsc -b && vite build`)와 `test:ac`(`vitest run --config tests/ac/ac.vitest.config.ts`) 스크립트 문자열은 변경되지 않는다. [package.json:8-9]
- S5. `tsconfig.app.json`의 `"strict": true`는 유지되고, `npm run build`가 타입 에러 없이 종료 코드 0으로 끝난다. [tsconfig.app.json:20] [계약 §커맨드]
- S6. `npm run test:ac`가 종료 코드 0으로 끝난다(모든 AC 통과). [과제 §완료 조건]
- S7. `src/App.css`와 `src/index.css`는 수정되지 않고, 새로운 스타일 파일도 추가되지 않는다. [계약 §범위 밖]
- S8. 소스 코드는 `strict` 하에서 `noUnusedLocals`·`noUnusedParameters`·`erasableSyntaxOnly`를 위반하지 않는다. [tsconfig.app.json:21-24]

### 1.2 DOM 계약

- S9. 새 항목 입력창 역할을 하는 엘리먼트가 `data-testid="todo-input"`으로 정확히 하나 존재한다. [계약 §DOM 계약]
- S10. 항목 하나에 대응하는 엘리먼트가 `data-testid="todo-item"`으로 0..n개 존재하며, 개수는 화면에 보여야 할 항목 수와 같다. [계약 §DOM 계약]
- S11. `data-testid="todo-title"` 엘리먼트가 항목의 제목 텍스트를 담는다. [계약 §DOM 계약]
- S12. `data-testid="todo-toggle"` 엘리먼트가 항목의 완료 체크박스다. [계약 §DOM 계약]
- S13. `data-testid="todo-delete"` 엘리먼트가 항목의 삭제 버튼이다. [계약 §DOM 계약]
- S14. `data-testid="todo-count"` 엘리먼트가 미완료 개수를 표시한다. [계약 §DOM 계약]
- S15. `data-testid="filter-all"` / `filter-active"` / `filter-completed"` 엘리먼트가 각각 전체·미완료·완료 필터 버튼이다. [계약 §DOM 계약]

### 1.3 범위 밖 (있으면 위반)

- S16. 인라인 제목 편집(더블클릭 수정), 드래그 정렬, 전체 완료 토글, 완료 일괄 삭제, 마감일·우선순위·태그·검색, 다크모드·테마 전환, 애니메이션, 로그인·계정, 서버 API 호출, 다국어 전환, SEO 메타태그 중 어느 것도 구현되어 있지 않다. [계약 §범위 밖]
- S17. UI 문자열은 한국어 단일 로케일이다. [계약 §범위 밖 "다국어(한국어 단일 로케일)"]

---

## 2. 명시되지 않은 것

계약은 "동작의 세부는 이 문서에 적혀 있지 않다"고 스스로 밝힌다. 즉 **동작 전체가 공백**이다.
아래는 (a) 1번 각 문장이 참이 되려면 추가로 정해져야 하는 것, (b) 입력→렌더까지 흐름을 따라가며 만난 갈림길,
(c) 계약이 범위 밖이라 하지 않았지만 없으면 Todo 앱이라 부를 수 없는 것을 찾은 결과다.

### 2.1 추가 (S9가 참이 되려면 "입력창에 뭘 하면 추가되는가"가 정해져야 한다)

- U1. `todo-input`은 `<input type="text">` 엘리먼트 자신에 testid가 붙고, 값이 `.value`로 읽힌다(래퍼가 아니다). [추론]
- U2. 입력창에 포커스가 있을 때 Enter 키를 누르면 항목이 추가된다. DOM 계약 표에 "추가 버튼" testid가 없으므로 추가 트리거는 Enter다. [추론]
- U3. 입력창을 감싼 `<form>`의 submit 이벤트로도 같은 추가가 일어난다. 단 Enter 경로와 중복 실행되어 항목이 2개 추가되는 일은 없다. [추론]
- U4. 추가되는 제목은 입력값의 앞뒤 공백을 제거(trim)한 문자열이다. 내부 공백은 보존된다. [추론]
- U5. trim 결과가 빈 문자열이면 항목은 추가되지 않는다(개수 변화 0). [추론]
- U6. 추가에 성공하면 입력창의 값은 빈 문자열이 된다. [추론]
- U7. 추가가 거부되면(U5) 입력창의 값은 그대로 유지된다. 남는 값은 공백뿐이고 U4의 trim이 뒤이은 입력을 오염시키지 않는다. [추론]
- U8. 새 항목은 목록의 **끝**에 붙는다. a, b 순으로 추가하면 `todo-title` 텍스트는 `["a", "b"]` 순서로 나온다. [추론]
- U9. 같은 제목을 여러 번 추가할 수 있다(중복 제거 없음). a를 두 번 추가하면 항목은 2개다. [추론]
- U10. 새 항목의 초기 완료 상태는 미완료다. [추론]
- U11. 제목 길이 상한은 없다. [추론]
- U12. 한글 IME 조합 중(`isComposing`)에 눌린 Enter는 추가를 일으키지 않는다. [추론] — 한국어 단일 로케일(S17)에서 실제로 발생하는 오동작.
- U13. 각 항목은 목록 안에서 유일한 식별자를 가지며, 제목이 같아도 서로 다른 항목으로 취급된다(React key 충돌 없음). [추론]

### 2.2 항목 표시 (S10~S13이 참이 되려면 항목 내부 구조가 정해져야 한다)

- U14. `todo-title`, `todo-toggle`, `todo-delete`는 각각 자기 항목의 `todo-item` 엘리먼트의 **자손**이다. `within(item)`으로 찾을 수 있어야 한다. [추론]
- U15. `todo-title`의 `textContent`는 제목 문자열과 **정확히** 같다. 접두·접미 공백이나 상태 표시 문자를 덧붙이지 않는다. [추론]
- U16. `todo-toggle`은 `<input type="checkbox">`이고, `checked` 프로퍼티가 해당 항목의 완료 상태와 항상 일치한다. [추론] — 테스트가 `.checked`로 판정할 수 있는 형태여야 한다(저장소에 jest-dom 매처가 없다: package.json:16-29).
- U17. `todo-toggle`을 클릭하면 해당 항목의 완료 상태가 반전되고, 다른 항목의 상태는 변하지 않는다. [추론]
- U18. `todo-delete`는 `<button type="button">`이고, 클릭하면 해당 항목만 목록에서 사라진다. 나머지 항목의 상대 순서는 유지된다. [추론]
- U19. 완료 여부는 텍스트가 아니라 마크업 속성(체크 상태)으로만 드러난다. 완료 표시를 위해 `todo-title` 텍스트를 바꾸지 않는다. [추론] (U15의 따름)

### 2.3 미완료 개수 (S14가 참이 되려면 "개수"의 대상과 표기가 정해져야 한다)

- U20. `todo-count`는 항목이 0개일 때도 렌더된다(조건부로 숨기지 않는다). [추론]
- U21. `todo-count`의 `textContent`는 **미완료 항목 수를 10진수로 적은 것 하나뿐**이다. 단위·조사·라벨을 붙이지 않는다. [추론] — 계약이 표기를 정하지 않았으므로, `toBe("2")`·`toContain("2")`·`Number(...)` 어느 판정에도 걸리는 형태를 고른다.
- U22. `todo-count`가 세는 대상은 **현재 필터와 무관하게 전체 목록의 미완료 항목**이다. 필터를 바꿔도 값이 변하지 않는다. [추론]
- U23. 모든 항목이 완료되면 `todo-count`는 `0`이다. [추론]
- U24. 항목 추가·완료 토글·삭제 직후 `todo-count`는 즉시 새 값을 보인다. [추론]

### 2.4 필터 (S15가 참이 되려면 선택 상태와 그 효과가 정해져야 한다)

- U25. 초기 필터는 "전체"다. [추론]
- U26. `filter-all` 선택 시 `todo-item`은 전체 항목 수만큼 렌더된다. [추론]
- U27. `filter-active` 선택 시 미완료 항목만 렌더된다. 완료 항목은 **DOM에 존재하지 않는다**(CSS로 숨기는 것이 아니다). [추론] — `queryAllByTestId("todo-item")`이 개수를 세므로 숨김으로는 만족할 수 없다.
- U28. `filter-completed` 선택 시 완료 항목만 렌더된다. 미완료 항목은 DOM에 존재하지 않는다. [추론]
- U29. 필터가 걸린 상태에서 항목을 토글하면 그 항목은 현재 필터 조건에 맞지 않게 된 즉시 화면에서 사라진다. [추론]
- U30. 필터 선택은 추가·토글·삭제 후에도 유지된다. [추론]
- U31. 필터 버튼 3개는 `<button type="button">`이고 항상 렌더되며, 현재 선택된 필터의 버튼도 비활성화되지 않는다(다시 눌러도 안전하다). [추론]
- U32. 현재 선택 상태는 선택된 버튼의 `aria-pressed="true"`, 나머지의 `aria-pressed="false"`로 드러난다. [추론] — 계약이 표시 방법을 정하지 않았고, testid로만 접근 가능한 상태 표현 중 표준적인 것을 고른다.
- U33. 필터가 걸려 있어도 추가는 항상 전체 목록에 반영된다. 새 항목이 현재 필터 조건에 맞지 않으면 화면에는 보이지 않는다. [추론]

### 2.5 지속성·초기 상태 (계약이 범위 밖이라 말하지 않은 항목)

- U34. 저장된 목록이 없으면 앱 최초 렌더 시 항목 목록은 비어 있다(시드 데이터 없음). [추론]
- ~~U35. 상태는 컴포넌트 메모리에만 있고 `localStorage` 등 브라우저 저장소에 쓰지 않는다.~~ **기각됨** — AC-07이 반증했다. §5 참조.
- U36. 앱은 마운트할 때 브라우저 저장소에서 목록을 복원한다. 언마운트 후 다시 렌더하면 직전 목록이 제목·순서·완료 상태 그대로 보인다. [추론+AC-07 출력]
  - 저장값이 없거나, JSON으로 파싱되지 않거나, 배열이 아니면 예외를 던지지 않고 빈 목록으로 시작한다. [추론]
  - 배열 안에 `{id: string, title: string, completed: boolean}` 모양이 아닌 원소가 있으면 그 원소만 버리고 나머지를 복원한다. [추론]
  - 저장소 자체가 없는 환경(`localStorage` 미정의·접근 차단)에서도 앱은 예외 없이 렌더된다. [추론]
- U37. 목록이 바뀌면(추가·토글·삭제) 그 변경이 저장소에 반영된다. [추론]
- U38. 복원된 항목의 id와 이후 새로 만드는 항목의 id는 겹치지 않는다. [추론] — id 카운터는 새로고침 때 0부터 다시 시작하므로 복원 후 보정하지 않으면 React key가 충돌한다. U13이 지속성 하에서도 참이 되기 위한 조건이다.
- U39. 저장 대상은 항목 목록뿐이다. 현재 필터 선택은 저장하지 않으며, 다시 열면 U25대로 "전체"다. [추론]

### 2.6 판정 불가로 남긴 것

- `[MISSING: todo-count의 문구 형식]` — 계약도 상식도 단위 문자열을 정해주지 않는다. U21로 "숫자만"을 택했으나, AC가 특정 문구를 요구하면 그 출력이 유일한 근거다.
- `[MISSING: 필터 선택 상태의 시각적 표현]` — 스타일 작업이 금지(S7)되어 클래스·색으로 표현할 수 없다. U32의 `aria-pressed`로 대신한다.
- `[MISSING: 빈 목록일 때의 안내 문구]` — 있어야 하는지 계약이 말하지 않는다. 없으면 안 되는 항목이 아니라고 보고 넣지 않는다(넣으면 U15/U21과 무관한 텍스트가 늘어 위험만 커진다).

---

## 3. 완료 전 대조

1·2번의 문장을 하나씩 읽으며 그 문장을 참으로 만드는 코드를 지목했다.
지목하지 못한 문장은 U35 하나뿐이고, 그것은 기각 처리했다.

### 3.1 명시된 것

| 문장 | 근거 위치 |
|---|---|
| S1 진입 컴포넌트 | `src/App.tsx:21` (`export default function App`) |
| S2 스택 유지 | `package.json:12-30` — 의존성 추가 없음. 추가 파일은 `.ts`/`.tsx`뿐 |
| S3 `tests/ac/**` 불가침 | 실행만 함(`npm run test:ac`). 열거나 고친 적 없음 |
| S4 스크립트 고정 | `package.json:8`(build), `package.json:9`(test:ac) — 원문 그대로. `:10`의 `test:dev`만 새로 추가 |
| S5 strict + build | `tsconfig.app.json:20` 그대로, `npm run build` 종료 코드 0 |
| S6 AC 통과 | `npm run test:ac` → 8 passed |
| S7 CSS 불가침 | `src/App.css`·`src/index.css` 미수정, 새 스타일 파일 없음(App.tsx는 CSS를 import하지 않는다) |
| S8 lint 옵션 위반 없음 | `tsc -b` 통과 (`noUnusedLocals`/`noUnusedParameters`/`erasableSyntaxOnly` 포함) |
| S9 `todo-input` | `src/App.tsx:73-81` |
| S10 `todo-item` | `src/App.tsx:84-88` → `src/TodoItem.tsx:11` |
| S11 `todo-title` | `src/TodoItem.tsx:21` |
| S12 `todo-toggle` | `src/TodoItem.tsx:13-19` |
| S13 `todo-delete` | `src/TodoItem.tsx:22-29` |
| S14 `todo-count` | `src/App.tsx:91` |
| S15 `filter-*` 3종 | `src/App.tsx:8-12`(테이블) → `src/App.tsx:94-104`(렌더) |
| S16 범위 밖 부재 | `src/App.tsx` 전체(108줄)·`src/TodoItem.tsx` 전체(31줄)에 dblclick 편집·드래그·전체완료·일괄삭제·마감일·태그·검색·테마·애니메이션·로그인·네트워크 호출 코드가 없다 |
| S17 한국어 단일 | `src/App.tsx:9-11,70,79-80`, `src/TodoItem.tsx:18,27-28` — 로케일 분기 없음 |

### 3.2 명시되지 않은 것

| 문장 | 근거 위치 |
|---|---|
| U1 input 자신에 testid | `src/App.tsx:73-76` |
| U2 Enter로 추가 | `src/App.tsx:47-53`, 연결: `:78` |
| U3 form submit + 중복 방지 | `src/App.tsx:42-45`(submit), `:50`(keydown에서 preventDefault → 암묵적 submit 차단), `:72` |
| U4 trim | `src/todos.ts:31-34`, 호출: `src/App.tsx:34` |
| U5 공백 거부 | `src/App.tsx:36` |
| U6 성공 시 입력창 비움 | `src/App.tsx:39` |
| U7 거부 시 입력값 유지 | `src/App.tsx:36` — early return이라 `setDraft`에 닿지 않는다 |
| U8 끝에 추가 | `src/App.tsx:38` (`[...prev, todo]`) |
| U9 중복 허용 | `src/App.tsx:37-38` — 동일 제목 검사 없음 |
| U10 초기 미완료 | `src/todos.ts:16` (`completed: false`) |
| U11 길이 상한 없음 | `src/App.tsx:33-40` — 길이 검사 없음 |
| U12 IME 조합 중 Enter 무시 | `src/App.tsx:51` |
| U13 유일 id | `src/todos.ts:9-17` |
| U14 항목 내부 포함 관계 | `src/TodoItem.tsx:11-30` (`li` 안에 toggle/title/delete) |
| U15 제목 텍스트 정확 일치 | `src/TodoItem.tsx:21` |
| U16 체크박스와 상태 일치 | `src/TodoItem.tsx:13-19` (`checked={todo.completed}`) |
| U17 토글은 자기 항목만 | `src/App.tsx:55-59` |
| U18 삭제는 자기 항목만 | `src/App.tsx:61-63`, `src/TodoItem.tsx:22-29` |
| U19 완료를 텍스트로 표시 안 함 | `src/TodoItem.tsx:21` — 제목 외 텍스트 없음 |
| U20 항상 렌더 | `src/App.tsx:91` — 조건부 렌더 아님 |
| U21 숫자만 | `src/App.tsx:91` (`{remaining}` 단독) |
| U22 필터 무관 | `src/todos.ts:48-51`, 인자: `src/App.tsx:66`(`todos` 전체) |
| U23 전부 완료면 0 | `src/todos.ts:49-50` |
| U24 즉시 갱신 | `src/App.tsx:66` — 렌더마다 재계산 |
| U25 초기 필터 전체 | `src/App.tsx:26` |
| U26 전체 필터 | `src/todos.ts:43-44` |
| U27 미완료 필터(DOM에서 제거) | `src/todos.ts:39-40` → `src/App.tsx:85-87` (걸러진 뒤 map) |
| U28 완료 필터 | `src/todos.ts:41-42` |
| U29 토글 즉시 사라짐 | `src/App.tsx:65` — 렌더마다 재계산 |
| U30 필터 유지 | `src/App.tsx:26` — `addTodo`/`toggleTodo`/`deleteTodo` 어디서도 `setFilter`를 부르지 않는다 |
| U31 선택된 버튼도 클릭 가능 | `src/App.tsx:95-103` — `disabled` 없음 |
| U32 `aria-pressed` | `src/App.tsx:99` |
| U33 필터 무관하게 추가 | `src/App.tsx:38` — `todos`에 넣고 표시는 `:65`가 결정 |
| U34 빈 목록으로 시작 | `src/App.tsx:23`, `src/storage.ts:27,30,32,35` |
| ~~U35~~ | **기각** — AC-07이 반증(§5) |
| U36 복원·손상 내성 | `src/App.tsx:14-19,23`, `src/storage.ts:24-37`(파싱), `:5-13`(원소 검증), `:15-22`(저장소 부재) |
| U37 변경 시 저장 | `src/App.tsx:29-31`, `src/storage.ts:39-48` |
| U38 id 충돌 방지 | `src/todos.ts:23-29`, 호출: `src/App.tsx:17` |
| U39 필터는 저장 안 함 | `src/App.tsx:26` — `filter`는 `saveTodos` 인자에 없다(`:30`) |

### 3.3 `[MISSING]` 처리

- `[MISSING: todo-count 문구 형식]` → U21(숫자만)로 확정. `npm run test:ac` 통과로 이 선택이 AC와 어긋나지 않음을 확인했다.
- `[MISSING: 필터 선택의 시각적 표현]` → 스타일 금지(S7) 하에서 `aria-pressed`(`src/App.tsx:99`)로 대신한다. 색·클래스로는 표현하지 않는다.
- `[MISSING: 빈 목록 안내 문구]` → **기각**. 계약이 요구하지 않고, 넣으면 화면에 testid 계약과 무관한 텍스트만 늘어난다.

---

## 4. 검증

`tests/dev/todo.spec.tsx` (설정: `tests/dev/dev.vitest.config.ts`, 실행: `npm run test:dev`).
§2의 [추론] 문장은 계약이 침묵한 자리라서 근거가 나 자신뿐이다. 나중에 조용히 뒤집히지 않게 28개 테스트로 고정했다.
각 테스트 이름 앞에 그 테스트가 지키는 U번호를 적어두었다.

- 지키는 문장: U2·U3(중복 추가 없음)·U4·U5·U6·U7·U8·U9·U10·U12·U14·U15·U16·U17·U18·U19·U20·U21·U22·U23·U24·U25·U26·U27·U28·U29·U30·U31·U32·U33·U34·U36·U37·U38·U39
- 직접 테스트하지 않은 문장과 이유:
  - U1·U11·U13 — 다른 테스트가 성립하는 전제로 간접 확인된다(값 읽기·긴 제목·key 경고 부재).
  - S1~S8·S16·S17 — 커맨드 실행 결과와 파일 존재 여부로 판정되는 문장이라 런타임 테스트 대상이 아니다.

3개 커맨드 모두 통과:

| 커맨드 | 결과 |
|---|---|
| `npm run test:ac` | 8 passed (8) |
| `npm run build` | tsc + vite build 성공 |
| `npm run test:dev` | 28 passed (28) |

---

## 5. 테스트 출력으로 확정한 것

계약이 "동작의 세부는 인수 테스트가 정한다"고 했으므로, 추론이 어긋난 지점은 출력으로 잡았다.

- **U35(무저장) 기각 → U36~U39 도입.**
  1차 구현(메모리 상태만) 결과 7 passed / 1 failed:

  ```
  FAIL  tests/ac/todo.ac.test.tsx > Todo AC (frozen) > AC-07
  AssertionError: expected [] to deeply equal [ 'A', 'B' ]
      cleanup();
      render(<App />);
      expect(titles()).toEqual(["A", "B"]);
  ```

  언마운트 후 재렌더에서 목록이 유지되기를 요구한다 → 지속성은 범위 안이다.
  계약의 범위 밖 항목은 "서버 API·DB"이므로 서버를 쓰지 않는 브라우저 저장소(`localStorage`)로 구현했다.
  저장 키는 `todo-db.todos.v1` (`src/storage.ts:3`).
- 나머지 7개 AC는 §2의 추론만으로 1차에 통과했다. 특히 U21(`todo-count`를 숫자만으로 표기)과 U8(끝에 추가)은
  계약이 정하지 않은 선택이었지만 AC와 어긋나지 않았다.
