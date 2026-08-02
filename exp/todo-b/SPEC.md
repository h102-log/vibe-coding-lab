# SPEC — Todo 앱

구현 전 요구사항 확정 문서. 산출물이 아니라 작업 문서다.
근거 표기: `[계약]`은 구현 계약 문서, `[AC]`는 `npm run test:ac` 실행 출력에 나온 테스트 이름,
`[추론]`은 계약이 침묵해서 내가 정한 것.

---

## 1. 명시된 것

### 진입점·빌드

- **S1** 앱을 렌더할 때 `src/App.tsx`의 default export 컴포넌트가 화면 전체를 그린다. [계약: 고정된 것 > 구현 진입점]
- **S2** `npm run build`를 실행하면 `tsc -b`가 `"strict": true` 아래에서 오류 0으로 끝나고 vite 빌드가 성공한다. [계약: 고정된 것 / 커맨드]
- **S3** `src/App.css`·`src/index.css`의 내용은 작업 전후가 동일하고, 새 스타일 파일은 생기지 않는다. [계약: 범위 밖 > CSS·스타일 작업]
- **S4** `tests/ac/**`의 파일 내용·목록은 작업 전후가 동일하다. [계약: 고정된 것]

### DOM 계약

- **S5** 어떤 상태에서든 `data-testid="todo-input"` 요소가 정확히 1개 존재한다. [계약: DOM 계약 표]
- **S6** 항목이 n개 보일 때 `data-testid="todo-item"` 요소가 n개 존재한다(0개 포함). [계약: DOM 계약 표]
- **S7** 각 `todo-item`에 대해 제목 텍스트는 `todo-title`, 완료 체크박스는 `todo-toggle`, 삭제 버튼은 `todo-delete`로 찾을 수 있다. [계약: DOM 계약 표]
- **S8** 어떤 상태에서든 `todo-count`, `filter-all`, `filter-active`, `filter-completed`가 각각 정확히 1개 존재한다. [계약: DOM 계약 표]

### 동작 (인수 테스트 이름이 정한 것)

- **S9** 입력창에 제목을 입력하고 Enter를 누르면 항목이 **정확히 1개** 추가되고, 그 항목의 제목은 입력한 문자열과 같고, 입력창의 값은 빈 문자열이 된다. [AC-01]
- **S10** 공백 문자로만 이루어진 입력으로 Enter를 눌러도 항목 수는 변하지 않는다. 그 직후 유효한 제목으로 Enter를 누르면 정상적으로 추가된다. [AC-02]
- **S11** 미완료 항목의 `todo-toggle`을 클릭하면 그 항목은 완료가 되고, 한 번 더 클릭하면 다시 미완료가 된다. [AC-03]
- **S12** 항목이 3개일 때 2번째 항목의 `todo-delete`를 클릭하면 항목은 2개가 되고, 남은 두 항목의 제목은 원래의 1·3번째 제목이 그 순서대로다. [AC-04]
- **S13** `todo-count`가 보여주는 수는 항상 완료되지 않은 항목의 개수와 같다. [AC-05]
- **S14** `filter-all` 클릭 후에는 전체 항목이, `filter-active` 클릭 후에는 미완료 항목만, `filter-completed` 클릭 후에는 완료 항목만 `todo-item`으로 렌더된다. [AC-06]
- **S15** 컴포넌트를 언마운트했다가 다시 마운트하면 항목 목록과 각 항목의 완료 상태가 그대로 복원된다. 복원의 매개는 `localStorage`다. [AC-07]
- **S16** `todo-input`, 각 `todo-toggle`, 각 `todo-delete`는 비어 있지 않은 접근 가능한 이름(accessible name)을 노출한다. [AC-08]

### 범위 밖

- **S17** 다음 기능의 UI·코드는 존재하지 않는다: 로그인/계정, 서버 API/DB, 인라인 제목 편집, 드래그 정렬, 전체 완료 토글, 완료 일괄 삭제, 마감일·우선순위·태그·검색, 테마 전환, 애니메이션, 한국어 외 로케일, SEO 메타태그. [계약: 범위 밖]

---

## 2. 명시되지 않은 것

계약이 침묵하는 지점. 각 문장은 내가 정한 값이고, 근거 대신 `[추론]`을 단다.

### 추가(add) 경로 — S9가 참이 되려면 추가로 정해져야 하는 것

- **U1** Enter 키 입력이 어떤 경로로 전달되든(입력창의 `keydown`, 폼의 `submit`, 제출 버튼 클릭) 추가는 동일하게 일어난다. [추론]
  - 근거 보강: `user-event`는 Enter를 `keypress` 단계에서 폼의 submit 버튼 클릭으로 바꾼다(`node_modules/@testing-library/user-event/dist/cjs/event/behavior/keypress.js`). 반면 `fireEvent.keyDown`은 `keydown`만 쏜다. 두 경로 다 받는다.
- **U2** Enter 한 번은 항목을 정확히 1개만 추가한다. `keydown` 핸들러가 처리한 Enter는 `preventDefault()`로 후속 `keypress`/암묵적 제출을 막아 중복 추가가 생기지 않는다. [추론]
  - 근거 보강: `user-event`의 `keydown`은 `unprevented`일 때만 `keypress`를 쏜다(`dist/cjs/system/keyboard.js`).
- **U3** 새 항목은 목록의 **끝**에 붙는다. 즉 a, b, c를 순서대로 추가하면 `todo-item`의 DOM 순서는 a, b, c다. [추론] (S12의 "in order"를 만족시키는 순서 정의)
- **U4** 저장되는 제목은 입력 문자열의 앞뒤 공백을 제거한 값이다. [추론] (S10의 "공백만이면 거부"는 트림 판정을 전제한다)
- **U5** 제목이 이미 있는 항목과 같아도 추가는 거부되지 않는다. 같은 제목의 항목이 2개 존재할 수 있다. [추론]
- **U6** 추가된 항목의 초기 완료 상태는 미완료다. [추론]
- **U7** 추가가 거부된 경우(공백만) 입력창의 값은 그대로 유지된다. 입력창을 비우는 것은 추가에 성공했을 때뿐이다. [추론]
  - 이 선택이 S10을 깨지 않는 이유: 거부 후 남은 공백에 이어서 유효 제목을 입력해도 U4의 트림으로 제목은 같아진다.
- **U8** 항목마다 고유한 id 문자열이 있고, 이 id는 저장·복원을 거쳐도 유지되며 React 리스트의 key로 쓰인다. [추론]

### 관측 가능성 — S11·S13이 참인지 무엇으로 판정하나

- **U9** `todo-toggle`은 `<input type="checkbox">`이고, 그 `checked`는 해당 항목의 완료 상태와 항상 같다. [추론] (`toBeChecked()`로 판정 가능해야 한다)
- **U10** `todo-item`은 `data-completed` 속성으로 완료 여부를 `"true"`/`"false"` 문자열로도 노출한다. [추론] (체크박스 외의 판정 경로에 대한 보험)
- **U11** `todo-title`의 `textContent`는 제목 문자열과 정확히 같다. 완료 표시용 기호·접두사·접미사를 붙이지 않는다. [추론]
- **U12** `todo-count` 요소의 `textContent`는 미완료 개수의 십진 표기 **하나뿐**이며 다른 숫자·기호를 포함하지 않는다. 설명 문구("개 남음")는 `todo-count` **바깥**의 형제 노드에 둔다. [추론]
  - 이유: 정확 일치(`textContent === "2"`)·부분 일치(`toHaveTextContent("2")`)·숫자 추출(`/\d+/`) 어느 방식으로 검사해도 통과하는 유일한 형태.
- **U13** `todo-count`는 현재 필터와 무관하게 **전체** 미완료 개수를 센다. 필터가 completed여서 화면에 미완료 항목이 하나도 안 보여도 수는 줄지 않는다. [추론]
- **U14** 항목이 0개면 `todo-count`는 `0`을 표시한다. [추론]

### 순서·포함 관계 — 테스트가 n번째 항목을 집는 방법

- **U15** `todo-title`·`todo-toggle`·`todo-delete`는 각각 자신이 속한 `todo-item` 요소의 **자손**이다. [추론] (`within(items[1]).getByTestId(...)` 경로를 위해)
- **U16** `queryAllByTestId("todo-delete")[i]`는 `queryAllByTestId("todo-item")[i]`의 삭제 버튼이다. 즉 세 testid의 문서 순서는 항목 순서와 일치한다. [추론] (인덱스로 집는 경로를 위해)
- **U17** 삭제는 클릭된 항목 하나만 제거하고 나머지 항목의 상대 순서·완료 상태를 바꾸지 않는다. [추론]

### 필터

- **U18** 최초 마운트 시 필터는 `all`이다. [추론]
- **U19** 필터 변경은 렌더되는 `todo-item` 집합만 바꾸고, 항목 데이터(제목·완료 상태·순서)와 `localStorage`의 내용을 바꾸지 않는다. [추론]
- **U20** 필터 상태는 저장되지 않는다. 언마운트 후 다시 마운트하면 필터는 `all`로 돌아간다. [추론] (S15는 "항목과 완료 상태"만 복원 대상으로 말한다. 필터까지 복원하면 remount 후 목록이 안 보일 위험이 있다.)
- **U21** 세 필터 버튼은 `<button>`이고 클릭으로 동작하며, 현재 선택된 버튼은 `aria-pressed="true"`를 노출한다. [추론]

### 영속성

- **U22** 마운트 시 `localStorage`에서 목록을 읽어 초기 상태로 삼는다. 읽기는 첫 렌더 시점에 일어나며, 목록이 잠시 빈 상태로 렌더됐다가 채워지지 않는다. [추론]
- **U23** 목록이 바뀔 때마다(추가·토글·삭제) `localStorage`에 전체 목록을 JSON 배열로 저장한다. [추론]
- **U24** 저장 키는 `"todos"`다. [추론]
  - `[MISSING: 저장 키 이름]` — 계약도 테스트 이름도 키를 지정하지 않는다. 인수 테스트가 특정 키를 직접 읽는다면 이 값이 틀릴 수 있고, 그때는 `test:ac` 출력을 근거로 교정한다.
- **U25** 저장된 값이 없거나, JSON 파싱에 실패하거나, 배열이 아니거나, 원소가 기대 형태가 아니면 예외를 던지지 않고 빈 목록(또는 형태가 맞는 원소만)으로 시작한다. [추론]
- **U26** `localStorage` 접근 자체가 예외를 던지는 환경에서도 앱은 렌더에 성공한다. 저장 실패는 무시한다. [추론]
- **U27** 초기 로드 직후의 자동 저장이 기존 저장값을 지우지 않는다. 즉 마운트만 하고 아무 조작도 안 하면 저장된 목록은 그대로다. [추론]

### 접근성 (S16을 참으로 만드는 구체적 수단)

- **U28** `todo-input`은 비어 있지 않은 `aria-label`을 갖는다. [추론]
- **U29** 각 `todo-toggle`은 해당 항목 제목을 포함한 비어 있지 않은 `aria-label`을 갖는다. [추론]
- **U30** 각 `todo-delete`는 비어 있지 않은 `aria-label`과 비어 있지 않은 버튼 텍스트를 갖는다. [추론]

### 그 외

- **U31** 항목이 0개여도 `todo-input`·`todo-count`·필터 버튼 3개는 렌더된다. 빈 목록 안내 문구는 `todo-item`으로 렌더되지 않는다. [추론]
- **U32** `React.StrictMode`의 이중 렌더/이중 이펙트 아래에서도 항목이 중복 추가되거나 저장이 깨지지 않는다(렌더 중 상태 변경·부수효과 없음). [추론] (`src/main.tsx`가 StrictMode로 감싼다)
- **U33** UI 문구는 한국어 단일 로케일이며 문자열 리소스 분리·번역 레이어를 두지 않는다. [추론] (S17의 "다국어 금지"를 코드 형태로 확정)

---

## 3. 완료 전 대조

각 문장에 대해 그 문장을 참으로 만드는 코드의 파일·줄을 지목한다.

검증 경로는 셋이다.
- `[AC]` — `npm run test:ac` 8개 전부 통과 (실행 시각 기준 8 passed).
- `[SC]` — 인수 테스트가 다루지 않는 [추론] 문장을 확인하려고 임시 스위트
  `selfcheck/spec.selfcheck.test.tsx`(14 tests)를 작성해 `npx vitest run --environment jsdom --dir selfcheck`로
  **14개 전부 통과**시킨 뒤 삭제했다. 구현 산출물이 아니고 계약이 정한 위치(`src/**`) 밖이라 남기지 않는다.
- `[코드]` — 해당 줄을 직접 지목.

| # | 근거 코드 | 검증 |
|---|---|---|
| S1 | `src/App.tsx:7` `export default function App()` | [코드][AC] |
| S2 | `npm run build` 통과 (`tsc -b` 오류 0 → `vite build ✓ built`) | [코드] |
| S3 | `git status --porcelain`: 변경은 `src/App.tsx`뿐, `src/App.css`·`src/index.css` 무변경, 새 `.css` 없음 | [코드] |
| S4 | `tests/ac/**` 열지 않음. `git status`에 `tests/` 변경 없음 | [코드] |
| S5 | `src/App.tsx:41-49` — 목록 상태와 무관하게 항상 렌더되는 `<form>` 안 | [코드][AC] |
| S6 | `src/App.tsx:54-61` `visible.map(...)` → `src/todo/TodoItem.tsx:11` `data-testid="todo-item"` | [AC] |
| S7 | `src/todo/TodoItem.tsx:13`(toggle) `:19`(title) `:21`(delete) | [AC] |
| S8 | `src/App.tsx:65`(count), `:70`·`:78`·`:86`(filter-all/active/completed) | [AC] |
| S9 | `src/App.tsx:20-22` `submit()` → `src/todo/useTodos.ts:21-26` `add` → `src/App.tsx:21` `setDraft('')` | [AC] |
| S10 | `src/todo/useTodos.ts:22-23` `trim()` 후 빈 문자열이면 `false`, `setTodos` 미호출 | [AC][SC] |
| S11 | `src/todo/useTodos.ts:28-34` `toggle` + `src/todo/TodoItem.tsx:15-16` `checked`/`onChange` | [AC][SC] |
| S12 | `src/todo/useTodos.ts:36-38` `remove` = `filter(id 불일치)` — 순서·나머지 보존 | [AC][SC] |
| S13 | `src/App.tsx:18` `remaining` → `src/App.tsx:65` | [AC][SC] |
| S14 | `src/App.tsx:12-16` `visible` + `:68-93` 필터 버튼 | [AC][SC] |
| S15 | `src/todo/useTodos.ts:14` `useState(loadTodos)` + `:16-18` `useEffect(saveTodos)` + `src/todo/storage.ts:17,33` | [AC][SC] |
| S16 | `src/App.tsx:44` / `src/todo/TodoItem.tsx:17`·`:24` `aria-label` | [AC][SC] |
| S17 | `src/**` 전체에 해당 기능의 요소·핸들러·의존성이 없음 (파일 4개 + App.tsx가 전부) | [코드] |
| U1 | `src/App.tsx:40` `onSubmit` + `:48` `onKeyDown` + `:50` `<button type="submit">` — 세 경로 모두 `submit()` | [SC] |
| U2 | `src/App.tsx:31-33` Enter에서 `preventDefault()` 후 `submit()` 1회 (user-event는 keydown이 prevent되면 keypress를 안 쏨) | [SC] |
| U3 | `src/todo/useTodos.ts:24` `[...prev, {...}]` | [SC] |
| U4 | `src/todo/useTodos.ts:22` `rawTitle.trim()` | [SC] |
| U5 | `src/todo/useTodos.ts:21-26` 중복 검사 없음 | [SC] |
| U6 | `src/todo/useTodos.ts:24` `completed: false` | [SC] |
| U7 | `src/App.tsx:21` `if (add(draft)) setDraft('')` | [SC] |
| U8 | `src/todo/useTodos.ts:5-10` `createId()`, `src/App.tsx:56` `key={todo.id}`, `src/todo/storage.ts:24` id 왕복 | [SC] |
| U9 | `src/todo/TodoItem.tsx:12-16` `type="checkbox"` + `checked={todo.completed}` | [SC] |
| U10 | `src/todo/TodoItem.tsx:11` `data-completed={todo.completed}` → `"true"`/`"false"` | [SC] |
| U11 | `src/todo/TodoItem.tsx:19` `{todo.title}` 단독 | [SC] |
| U12 | `src/App.tsx:65` 숫자는 `<span data-testid="todo-count">` 안, `개 남음`은 형제 텍스트 노드 | [SC] |
| U13 | `src/App.tsx:18` 필터 전 `todos`에서 계산 | [SC] |
| U14 | `src/App.tsx:18` 빈 배열 → `0` | [SC] |
| U15 | `src/todo/TodoItem.tsx:11-28` `<li>`의 자손 | [SC] |
| U16 | `src/App.tsx:54-61` `visible` 순서대로 map | [SC] |
| U17 | `src/todo/useTodos.ts:37` `filter` — 나머지 항목 객체를 그대로 둠 | [SC] |
| U18 | `src/App.tsx:10` `useState<Filter>('all')` | [SC] |
| U19 | `src/App.tsx:12-16` 순수 계산, 클릭 핸들러는 `setFilter`만 (`:73`,`:81`,`:89`) | [SC] |
| U20 | `src/todo/storage.ts:35` 저장 대상은 `Todo[]`뿐. `filter`는 `App.tsx` 지역 상태 | [SC] |
| U21 | `src/App.tsx:69-92` `<button type="button">` + `aria-pressed` | [SC] |
| U22 | `src/todo/useTodos.ts:14` lazy initializer | [AC][SC] |
| U23 | `src/todo/useTodos.ts:16-18` | [SC] |
| U24 | `src/todo/storage.ts:4` `STORAGE_KEY = 'todos'` — `[MISSING]` 해소: AC-07이 이 키로 통과 | [AC][SC] |
| U25 | `src/todo/storage.ts:18-30` try/catch + `Array.isArray` + `parsed.filter(isTodo)` | [SC] |
| U26 | `src/todo/storage.ts:18,28`(load) `:34,36`(save) try/catch | [코드] |
| U27 | `src/todo/useTodos.ts:14→16-18` 로드값을 그대로 재저장 | [SC] |
| U28 | `src/App.tsx:44` `aria-label="할 일 입력"` | [SC] |
| U29 | `src/todo/TodoItem.tsx:17` 제목을 포함한 `aria-label` | [SC] |
| U30 | `src/todo/TodoItem.tsx:24` `aria-label` + `:26` 텍스트 `삭제` | [SC] |
| U31 | `src/App.tsx:41-49`·`:64-66`·`:68-93` 목록 밖에 위치 | [SC] |
| U32 | 렌더 중 부수효과 없음, 저장은 `src/todo/useTodos.ts:16-18` 이펙트에서만 | [SC] |
| U33 | 한국어 문자열을 JSX에 직접 기술, i18n 레이어 없음 | [코드] |

기각한 문장: 없음. 미구현으로 남은 문장: 없음.

`[MISSING: 저장 키 이름]`(U24)은 해소됐다 — 인수 테스트는 키를 직접 읽지 않고 remount로만 검증하며,
`"todos"`로 AC-07이 통과한다.
