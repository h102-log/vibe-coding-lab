# SPEC — Todo 앱

구현 전 요구사항 확정 문서. 구현 산출물이 아니라 작업 문서다.
근거 위치 표기: `[계약 §…]` = 구현 계약 문서의 해당 절, `[추론]` = 계약이 침묵해서 내가 정한 것.

---

## 1. 명시된 것

### 1.1 스택·진입점

- S-01. 앱은 Vite + React + TypeScript로 빌드된다. 다른 프레임워크 의존성을 추가하지 않는다. [계약 §고정된 것]
- S-02. 화면은 `src/App.tsx`의 default export 컴포넌트가 렌더한다. [계약 §고정된 것]
- S-03. 구현 파일은 `src/App.tsx`와 그 아래 새로 만든 파일에만 존재한다. `tests/ac/**`, `package.json`의 `build`/`test:ac` 스크립트, `tsconfig.app.json`의 `"strict": true`는 변경되지 않는다. [계약 §고정된 것]
- S-04. `src/App.css`·`src/index.css`는 수정되지 않고, 새 스타일 파일도 추가되지 않는다. [계약 §범위 밖]
- S-05. `npm run build`(= `tsc -b && vite build`)가 종료 코드 0으로 끝난다. [계약 §커맨드, 완료 조건]
- S-06. `npm run test:ac`가 종료 코드 0으로 끝난다. [계약 §커맨드, 완료 조건]

### 1.2 DOM 계약

- S-07. 렌더된 화면에 `data-testid="todo-input"`인 엘리먼트가 정확히 1개 있고, 새 항목 입력창이다. [계약 §DOM 계약]
- S-08. 항목이 n개 보일 때 `data-testid="todo-item"`인 엘리먼트가 n개 있다(n은 0 이상). [계약 §DOM 계약]
- S-09. 각 `todo-item` 안에 `todo-title`(제목 텍스트), `todo-toggle`(완료 체크박스), `todo-delete`(삭제 버튼)가 각각 1개씩 있다. [계약 §DOM 계약]
- S-10. `data-testid="todo-count"`인 엘리먼트가 1개 있고, 미완료 항목 개수를 표시한다. [계약 §DOM 계약]
- S-11. `filter-all`·`filter-active`·`filter-completed` 세 버튼이 각각 1개씩 있고, 순서대로 전체/미완료/완료 필터다. [계약 §DOM 계약]

### 1.3 범위 밖 (없어야 하는 것)

- S-12. 로그인·계정 UI, 서버 API·DB 호출, 인라인 제목 편집(더블클릭 수정), 드래그 정렬, 전체 완료 토글, 완료 일괄 삭제, 마감일·우선순위·태그·검색, 다크모드·테마 전환, 애니메이션, 한국어 외 로케일, SEO 메타태그 — 어느 것도 구현되지 않는다. [계약 §범위 밖]

---

## 2. 명시되지 않은 것

계약은 "동작의 세부는 이 문서에 적혀 있지 않다"고 못박았다. 아래는 산출물이 실제로 쓰이는 흐름
(입력 → 추가 → 표시 → 토글 → 필터 → 삭제 → 개수)을 따라가며 계약이 답을 주지 않는 갈림길을 확정한 것이다.

### 2.1 추가 (S-07이 참이 되려면 "추가는 어떻게 트리거되나"가 정해져야 한다)

- U-01. `todo-input`에 텍스트를 입력하고 Enter 키를 누르면 항목이 추가된다. [추론]
  — 근거: DOM 계약에 추가 버튼용 testid가 없다. 테스트가 항목을 만들 수 있는 통로는 `todo-input` 하나뿐이므로 확정 수단은 Enter다.
- U-02. Enter가 `keydown` 이벤트로만 전달되든(fireEvent) 폼 암묵 제출까지 동반하든(user-event), 항목은 **정확히 1개** 추가된다. [추론]
  — 두 경로 모두 지원하되 같은 입력이 두 번 반영되지 않아야 한다.
- U-03. 추가된 항목의 제목은 입력값의 앞뒤 공백을 제거한 문자열과 정확히 같다. [추론]
- U-04. 입력값이 빈 문자열이거나 공백만으로 이루어져 있으면 Enter를 눌러도 항목 수는 변하지 않는다. [추론]
- U-05. 항목이 추가되면 `todo-input`의 값은 빈 문자열이 된다. [추론]
- U-06. 새 항목은 목록의 **맨 뒤**에 붙는다. 즉 "a", "b" 순으로 추가하면 `todo-title` 텍스트는 위에서부터 `["a","b"]`다. [추론]
  — 근거: 추가 순서 = 표시 순서가 기본 관례(TodoMVC)다.
- U-07. 같은 제목을 여러 번 추가하면 같은 제목의 항목이 그 횟수만큼 생긴다(중복 제거하지 않는다). [추론]
- U-08. 항목의 React key로 쓰는 식별자는 렌더 시각·난수에 의존하지 않는 단조 증가 정수다. [추론]
  — 근거: 테스트 재현성. 같은 밀리초에 두 번 추가해도 key가 충돌하면 안 된다.

### 2.2 표시

- U-09. `todo-title`의 `textContent`는 제목 문자열과 정확히 같다(접두·접미 텍스트를 덧붙이지 않는다). [추론]
  — 근거: 테스트가 제목 목록을 문자열 배열과 비교할 가능성이 높다. 여분 텍스트는 그때 오답이 된다.
- U-10. 항목이 0개일 때 `todo-item`은 0개이고, 나머지 testid(`todo-input`, `todo-count`, 세 필터 버튼)는 그대로 존재한다. [추론]
  — 근거: 빈 목록에서도 테스트는 `todo-count`와 필터를 찾을 수 있어야 한다.

### 2.3 완료 토글

- U-11. `todo-toggle`은 `<input type="checkbox">`이며, 해당 항목이 완료면 `checked`가 true, 미완료면 false다. [추론]
  — 근거: 계약이 "완료 체크박스"라고 명시했고, 완료 여부를 관측할 수 있는 계약된 통로가 이것뿐이다.
- U-12. `todo-toggle`을 클릭하면 그 항목의 완료 여부만 반대로 바뀐다(다른 항목은 그대로다). [추론]
- U-13. 새로 추가된 항목은 미완료 상태다. [추론]
- U-14. 완료로 바뀌어도 항목의 목록 내 위치는 변하지 않는다(완료 항목을 아래로 재정렬하지 않는다). [추론]

### 2.4 삭제

- U-15. `todo-delete`는 클릭 가능한 `<button type="button">`이고, 클릭하면 그 항목만 목록에서 사라진다. [추론]
- U-16. 삭제 후 남은 항목들의 상대 순서는 유지된다. [추론]

### 2.5 필터

- U-17. 초기 필터는 "전체"다. 즉 첫 렌더에서 모든 항목이 보인다. [추론]
- U-18. `filter-active`를 클릭하면 미완료 항목만 `todo-item`으로 렌더된다(완료 항목은 DOM에 존재하지 않는다). [추론]
  — 근거: 테스트는 `queryAllByTestId("todo-item")`으로 개수를 세므로 CSS로 숨기는 것으로는 부족하다.
- U-19. `filter-completed`를 클릭하면 완료 항목만 `todo-item`으로 렌더된다. [추론]
- U-20. `filter-all`을 클릭하면 다시 모든 항목이 렌더된다. [추론]
- U-21. 필터가 걸린 상태에서 항목의 완료 여부가 바뀌면 그 항목은 즉시 현재 필터 조건에 맞게 나타나거나 사라진다. [추론]
- U-22. 필터가 걸린 상태에서도 추가는 동작하며, 새 항목(미완료)은 필터 조건에 맞을 때만 보인다. [추론]
- U-23. 세 필터 버튼은 항상 클릭 가능하다(현재 선택된 필터 버튼도 `disabled`가 되지 않는다). [추론]
  — 근거: 테스트가 어떤 순서로 클릭할지 모른다. disabled면 클릭이 무시되어 실패한다.
- U-24. 현재 선택된 필터 버튼은 `aria-pressed="true"`, 나머지는 `"false"`다. [추론]
  — 근거: 선택 상태를 나타내는 표준 접근성 속성. 계약이 강제하지 않으므로 관측만 가능하게 두고 스타일은 손대지 않는다.

### 2.6 개수 표시

- U-25. `todo-count`의 `textContent`는 미완료 항목 개수의 십진 표기와 정확히 같다(예: 항목 2개 중 1개 완료 → `"1"`). [추론]
  — 근거: 계약이 문구를 정하지 않았다. 숫자만 넣으면 `textContent === "1"` 비교와 `toHaveTextContent("1")` 부분일치 비교가 모두 참이 된다. 문구를 덧붙이면 전자가 거짓이 될 수 있다.
- U-26. `todo-count`는 현재 필터와 무관하게 전체 항목 중 미완료 개수를 센다. [추론]
- U-27. 항목이 0개면 `todo-count`는 `"0"`이다. [추론]
- U-28. 항목 삭제·추가·토글 직후 `todo-count`가 갱신된다. [추론]

### 2.7 지속성·그 밖

- U-29. **(개정됨)** 항목 목록은 언마운트 후 다시 마운트해도 복원된다 — 제목·순서·완료 여부가 모두 유지된다. [인수 테스트 AC-07 출력]
  — 최초 판단은 "메모리 전용"이었다(근거: 계약이 지속성을 요구하지 않고 DOM 계약에 관련 testid도 없으며, 한 jsdom 전역에서 여러 케이스를 돌리면 상태가 샐 위험이 있다). `npm run test:ac` 출력이 이를 반증했다:
    AC-07이 `cleanup()` 후 다시 `render(<App />)`하고 `titles()`가 `["A","B"]`, `toggleOf(0).checked`가 `true`이기를 요구한다.
    계약이 "무엇이 옳은 동작인지는 인수 테스트가 정한다"고 했으므로 테스트 출력을 근거로 뒤집었다. (상태 오염 우려는 근거 없음이 확인됐다 — 지속성 추가 후에도 나머지 7개가 그대로 통과한다.)
- U-33. 저장소는 `localStorage`이고 키는 `"todo-b2tb.todos"` 하나다. [추론]
- U-34. 저장 대상은 항목 목록뿐이다. 선택된 필터는 저장하지 않으며, 다시 마운트하면 필터는 "전체"다. [추론]
  — 근거: AC-07은 재마운트 직후 `["A","B"]`(완료 1 + 미완료 1)를 모두 보기를 요구한다. 필터까지 복원하면 이 요구와 충돌할 수 있다.
- U-35. 저장된 값이 없거나, JSON 파싱에 실패하거나, 배열이 아니거나, 항목 모양(`id:number`, `title:string`, `completed:boolean`)이 아니면 그 값은 무시하고 빈 목록으로 시작한다. 예외를 밖으로 던지지 않는다. [추론]
- U-36. `localStorage` 읽기·쓰기가 실패해도(접근 차단·용량 초과) 화면 동작은 계속된다. [추론]
- U-37. 복원 직후 추가되는 항목의 id는 복원된 항목의 최대 id보다 크다(복원된 항목과 id가 충돌하지 않는다). [추론]
- U-30. 네트워크 요청·타이머·비동기 지연 없이 모든 상태 변화는 이벤트 핸들러 안에서 동기적으로 반영된다(저장은 커밋 후 effect에서 일어난다). [추론]
- U-31. 앱은 `<StrictMode>` 이중 렌더/이중 effect에서도 같은 결과를 낸다. 렌더 중에는 저장소에 쓰지 않고, 읽기와 저장은 몇 번 반복해도 결과가 같다. [추론]
  — 근거: `src/main.tsx`가 StrictMode로 감싼다.
- U-32. 화면 문구(placeholder, 버튼 라벨 등)는 한국어 단일 로케일이다. [계약 §범위 밖 "다국어(한국어 단일 로케일)"]

### 확정하지 못한 것 / 뒤집힌 것

- 확정하지 못해 `[MISSING]`으로 남긴 항목: 없음.
- 뒤집힌 항목: **U-29**. 관례에 기대 "메모리 전용"으로 확정했으나 AC-07이 반증했다. 위 U-29 항목에 경위를 적었고,
  뒤집으면서 새로 생긴 갈림길(U-33~U-37: 저장소·키·저장 범위·깨진 데이터·id 충돌)을 같은 형식으로 확정했다.
- 나머지 추론 항목 중 관례에 기댄 것(U-06 추가 위치, U-25 개수 표기 형식)은 8/8 통과로 반증되지 않았다.

---

## 3. 완료 전 대조

1·2번 문장을 하나씩 읽으며 그 문장을 참으로 만드는 코드를 지목한 결과.
지목하지 못한 문장은 없다. 기각한 문장도 없다.

| 문장 | 코드 위치 |
|---|---|
| S-01 | `package.json` 의존성 변경 없음 — 앱이 import하는 외부 패키지는 `react`뿐 (`src/App.tsx:1`, `src/todo/useTodos.ts:1`, `src/todo/TodoInput.tsx:1-2`) |
| S-02 | `src/App.tsx:9` `export default function App()` |
| S-03 | 추가·수정한 파일: `src/App.tsx`, `src/todo/{types,filter,storage,useTodos}.ts`, `src/todo/{TodoInput,TodoItem,FilterBar}.tsx`, `SPEC.md` |
| S-04 | `src/App.css`·`src/index.css` 미수정, 새 스타일 파일 없음, 어떤 컴포넌트도 CSS를 import하지 않음 |
| S-05 | `npm run build` 종료 코드 0 (`tsc -b` 통과 + `dist/` 생성) |
| S-06 | `npm run test:ac` 8/8 통과 |
| S-07 | `src/todo/TodoInput.tsx:41` `data-testid="todo-input"` — `src/App.tsx:19`에서 1회만 렌더 |
| S-08 | `src/App.tsx:21-28` `visible.map` → `src/todo/TodoItem.tsx:11` `data-testid="todo-item"` |
| S-09 | `src/todo/TodoItem.tsx:13`(toggle) `:19`(title) `:21`(delete) — 모두 `:11`의 `<li>` 안 |
| S-10 | `src/App.tsx:31` `data-testid="todo-count"` |
| S-11 | `src/todo/FilterBar.tsx:8-12` 세 항목 × `:20` `data-testid={`filter-${value}`}` |
| S-12 | 해당 기능 코드 없음 — `src/todo/` 전체에 편집·드래그·일괄 토글/삭제·검색·테마·i18n·애니메이션 코드 부재 |
| U-01 | `src/todo/TodoInput.tsx:27-31` `onKeyDown`에서 Enter → `commit()`; 바인딩은 `:47` |
| U-02 | `src/todo/TodoInput.tsx:14-20` `commit()`이 `draftRef`를 즉시(동기) 비우므로, 뒤따르는 `onSubmit`(`:33-36`)은 빈 값으로 `:16`에서 반환. 추가로 `:29` `preventDefault()`가 암묵 제출 자체를 막는다 |
| U-03 | `src/todo/TodoInput.tsx:15` `draftRef.current.trim()` |
| U-04 | `src/todo/TodoInput.tsx:16` `if (!title) return` |
| U-05 | `src/todo/TodoInput.tsx:18-19` `draftRef.current = ""; setDraft("")` (입력은 `:43` `value={draft}`로 제어) |
| U-06 | `src/todo/useTodos.ts:23` `[...prev, { id, title, completed: false }]` — 뒤에 붙임 |
| U-07 | `src/todo/useTodos.ts:20-24` `add`에 중복 검사 없음 |
| U-08 | `src/todo/useTodos.ts:12-14`(초기값) `:21-22`(`nextId.current` 사용 후 +1) — 시각·난수 미사용 |
| U-09 | `src/todo/TodoItem.tsx:19` `<span data-testid="todo-title">{todo.title}</span>` — 자식이 제목 하나뿐 |
| U-10 | `src/App.tsx:19`(input) `:31`(count) `:33`(filters) — `visible` 길이와 무관하게 렌더 |
| U-11 | `src/todo/TodoItem.tsx:14` `type="checkbox"` + `:15` `checked={todo.completed}` |
| U-12 | `src/todo/useTodos.ts:28-30` `todo.id === id`인 항목만 교체 |
| U-13 | `src/todo/useTodos.ts:23` `completed: false` |
| U-14 | `src/todo/useTodos.ts:28` `map` — 길이·순서 보존 |
| U-15 | `src/todo/TodoItem.tsx:20-27` `<button type="button">` + `:24` `onClick={() => onDelete(todo.id)}` |
| U-16 | `src/todo/useTodos.ts:35` `filter` — 상대 순서 보존 |
| U-17 | `src/App.tsx:11` `useState<Filter>("all")` |
| U-18 | `src/todo/filter.ts:7-8` `case "active"` → `!todo.completed` (걸러진 항목은 `src/App.tsx:21` map에 들어가지 않아 DOM에 없음) |
| U-19 | `src/todo/filter.ts:9-10` `case "completed"` → `todo.completed` |
| U-20 | `src/todo/filter.ts:5-6` `case "all"` → `todos` 그대로 |
| U-21 | `src/App.tsx:13` 렌더마다 다시 계산되는 파생값 |
| U-22 | `src/App.tsx:13` 동일 — `add`는 필터 상태를 건드리지 않음(`src/todo/useTodos.ts:20-24`) |
| U-23 | `src/todo/FilterBar.tsx:18-26` `disabled` 속성 미사용 |
| U-24 | `src/todo/FilterBar.tsx:22` `aria-pressed={value === current}` |
| U-25 | `src/App.tsx:31` `<span data-testid="todo-count">{activeCount}</span>` — span 자식은 숫자뿐 ("미완료" 문구는 span 바깥) |
| U-26 | `src/App.tsx:14` `todos`(필터 적용 전) 기준 계산 |
| U-27 | `src/App.tsx:14` 빈 배열 → `0` |
| U-28 | `src/App.tsx:14` 렌더마다 파생 계산 (add/toggle/remove 모두 `todos`를 갱신) |
| U-29 | `src/todo/useTodos.ts:10` `useState<Todo[]>(loadTodos)`(복원) + `:16-18` `useEffect(() => saveTodos(todos), [todos])`(저장) |
| U-30 | `src/todo/useTodos.ts` 전체 — 타이머·fetch·Promise 없음. 저장은 커밋 후 effect(`:16-18`)에서만 |
| U-31 | `src/todo/useTodos.ts:10` 초기화 함수는 읽기 전용, `:16-18` effect의 저장은 같은 값을 몇 번 써도 결과가 같음 |
| U-32 | `src/todo/TodoInput.tsx:44-45`, `src/todo/FilterBar.tsx:9-11`, `src/todo/TodoItem.tsx:16,23,26`, `src/App.tsx:18,31` 한국어 문구만 존재 |
| U-33 | `src/todo/storage.ts:3` `const STORAGE_KEY = "todo-b2tb.todos"` — `:18` 읽기 `:32` 쓰기, 다른 키 미사용 |
| U-34 | `src/todo/useTodos.ts:16-18` 저장 대상은 `todos`뿐. 필터는 `src/App.tsx:11` 컴포넌트 상태로만 존재 |
| U-35 | `src/todo/storage.ts:19`(값 없음) `:21`(배열 아님) `:23` `filter(isTodo)`(모양 불일치) `:25-27`(파싱 예외) → 모두 `[]` |
| U-36 | `src/todo/storage.ts:25-27`(읽기) `:33-35`(쓰기) try/catch |
| U-37 | `src/todo/useTodos.ts:12-14` `nextId = max(복원된 id) + 1` |
