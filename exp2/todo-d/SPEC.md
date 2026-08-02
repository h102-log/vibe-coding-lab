# SPEC — Todo 앱 요구사항 확정

작업 문서. 구현 산출물이 아니다.
근거 표기: `[계약 §<절>]` = 과제로 주어진 «Todo 앱 — 구현 계약 (얇은 판)», `[추론]` = 계약이 침묵하여 내가 정한 것,
`[AC 출력]` = `npm run test:ac` 실행 결과로 확인한 것(테스트 파일은 열지 않았다).

---

## 1. 명시된 것

### 1.1 구조·빌드

- S-01. `src/App.tsx`는 컴포넌트를 default export 하고, 앱 화면 전체는 그 컴포넌트를 렌더한 결과다. [계약 §고정된 것 — 구현 진입점]
- S-02. 프로젝트는 Vite + React + TypeScript로 빌드되며, 다른 프레임워크 런타임 의존성이 추가되어 있지 않다. [계약 §고정된 것 — 스택]
- S-03. `npm run build`(= `tsc -b && vite build`)가 종료 코드 0으로 끝난다. [계약 §완료 조건, §커맨드]
- S-04. `npm run test:ac`가 종료 코드 0으로 끝난다. [계약 §완료 조건]
- S-05. `tsconfig.app.json`의 `"strict": true`, `package.json`의 `build`·`test:ac` 스크립트 문자열이 저장소 초기 상태와 동일하다. [계약 §고정된 것]
- S-06. `tests/ac/**` 아래 파일들의 내용이 저장소 초기 상태와 동일하다(읽지도 않는다). [계약 §고정된 것]
- S-07. `src/App.css`·`src/index.css`의 내용이 초기 상태와 동일하고, 새로 추가된 스타일시트 파일이 없다. [계약 §범위 밖 — CSS·스타일 작업]

### 1.2 DOM 계약

- S-08. 화면에 `data-testid="todo-input"`인 요소가 정확히 1개 있다. [계약 §DOM 계약 표]
- S-09. `data-testid="todo-item"`인 요소는 0개 이상이며, 각각이 항목 하나에 대응한다. [계약 §DOM 계약 표 — "항목 하나 (0..n개)"]
- S-10. 각 `todo-item` 안에는 `todo-title`, `todo-toggle`, `todo-delete`가 각각 1개씩 있다. [계약 §DOM 계약 표]
- S-11. `data-testid="todo-count"`인 요소가 정확히 1개 있고, 미완료 항목 개수를 표시한다. [계약 §DOM 계약 표]
- S-12. `filter-all`, `filter-active`, `filter-completed`인 요소가 각각 정확히 1개 있다. [계약 §DOM 계약 표]
- S-13. 위 9개 testid는 항목 수가 0일 때에도(항목에 종속된 4개 제외) 존재한다. [계약 §DOM 계약 표 — 0..n은 `todo-item`에만 붙어 있음]

### 1.3 범위 밖 (없어야 한다)

- S-14. 로그인·계정 UI, 서버 API·DB 호출, 배포 설정이 없다. [계약 §범위 밖]
- S-15. 제목을 화면에서 편집하는 수단(더블클릭 인라인 편집 등)이 없다. [계약 §범위 밖]
- S-16. 드래그 정렬, 전체 완료 토글, 완료 일괄 삭제 UI가 없다. [계약 §범위 밖]
- S-17. 마감일·우선순위·태그·검색 입력이 없다. [계약 §범위 밖]
- S-18. 다크모드·테마 전환 UI, 애니메이션, 다국어 전환이 없다. 문구는 한국어 단일 로케일이다. [계약 §범위 밖]
- S-19. SEO 메타태그를 추가하지 않는다. [계약 §범위 밖]

---

## 2. 명시되지 않은 것

계약은 "동작의 세부는 이 문서에 적혀 있지 않다"고 스스로 밝힌다. 아래는 1번의 각 문장이 참이 되려면 추가로 정해져야 하는 것,
그리고 "입력 → 추가 → 토글/삭제 → 필터 → 개수 → 다시 열기"라는 사용 흐름을 처음부터 끝까지 따라가며 만난 갈림길이다.

### 2.1 항목 추가 (S-08이 참이 되려면 무엇이 더 정해져야 하는가)

- U-01. `todo-input`은 `<input type="text">`이고, 사용자가 타이핑한 문자열이 그 `value`에 반영된다. [추론]
- U-02. `todo-input`에 포커스가 있는 상태에서 Enter 키가 눌리면 항목 추가가 시도된다. (계약의 testid 표에 "추가 버튼"이 없다 → 테스트가 클릭할 수 있는 추가 수단은 Enter뿐이다.) [추론]
- U-03. `todo-input`을 감싼 `<form>`의 submit 이벤트로도 동일한 추가가 일어난다. (`fireEvent.submit` / 암묵적 submit 경로 대비) [추론]
- U-04. Enter 처리는 항목을 정확히 1개만 추가한다. keydown 경로와 form submit 경로가 같은 Enter 입력에서 둘 다 실행되어 2개가 추가되는 일은 없다. [추론]
- U-05. 추가되는 제목은 입력 문자열의 앞뒤 공백을 제거(trim)한 값이다. [추론]
- U-06. trim 결과가 빈 문자열이면 항목이 추가되지 않는다(공백만 입력한 경우 포함). 이때 `todo-item` 개수는 변하지 않는다. [추론]
- U-07. Enter 처리 후 `todo-input`의 값은 빈 문자열이 된다. 추가가 성공한 경우든 U-06으로 거부된 경우든 같다(거부된 공백 문자열이 입력창에 남아 다음 입력과 이어붙는 일이 없다). [추론]
- U-08. 추가가 거부되어도 앱은 오류 상태로 잠기지 않고, 바로 다음 정상 입력이 항목을 만든다. [추론]
- U-09. 새 항목은 기존 목록의 **맨 뒤**에 붙는다. 즉 "a", "b"를 순서대로 추가하면 `todo-title` 텍스트는 위에서부터 `["a", "b"]`다. [추론]
- U-10. 같은 제목을 두 번 추가하면 별개의 항목 2개가 된다(중복 거부하지 않는다). [추론]
- U-11. 제목 길이 상한이나 허용 문자 제한은 없다. trim 후 비어 있지 않기만 하면 추가된다. [추론]
- U-12. 새 항목의 초기 완료 상태는 미완료다. [추론]
- U-13. 각 항목은 목록 안에서 유일한 식별자를 가지며, 제목이 같아도 서로 다르다. 식별자 생성에 `Date.now()`나 난수를 쓰지 않고 단조 증가 카운터를 쓴다(같은 밀리초에 연속 추가해도 충돌하지 않게). [추론]

### 2.2 항목 표시

- U-14. `todo-title`의 텍스트는 저장된 제목과 정확히 같다(접두사·접미사·따옴표를 붙이지 않는다). [추론]
- U-15. `todo-toggle`은 `<input type="checkbox">`이고, `checked`가 그 항목의 완료 여부와 같다. (테스트가 `toBeChecked()` / `user.click`을 쓸 수 있는 유일하게 안전한 형태) [추론]
- U-16. `todo-delete`는 `<button type="button">`이다. (form 문맥에서 클릭이 submit으로 새 항목을 추가하는 부작용이 없어야 한다) [추론]
- U-17. `todo-toggle`을 클릭하면 그 항목의 완료 여부가 반대로 바뀌고, 다른 항목은 영향을 받지 않는다. [추론]
- U-18. `todo-delete`를 클릭하면 그 항목만 목록에서 사라지고, 나머지 항목의 상대 순서는 유지된다. [추론]
- U-19. 항목의 완료 여부가 바뀌어도 목록 안의 위치는 바뀌지 않는다(완료 항목을 아래로 내리는 재정렬을 하지 않는다). [추론]

### 2.3 필터 (계약은 버튼 3개가 있다고만 말하고, 그 결과를 말하지 않는다)

- U-20. 필터의 초기값은 "전체"다. [추론]
- U-21. 필터 버튼들은 `<button type="button">`이고 클릭하면 현재 필터가 그 값으로 바뀐다. [추론]
- U-22. 필터가 "전체"일 때 렌더되는 `todo-item`은 모든 항목이다. [추론]
- U-23. 필터가 "미완료"일 때 렌더되는 `todo-item`은 완료되지 않은 항목뿐이다(완료 항목은 DOM에서 제거된다 — 숨기기만 하는 CSS 방식은 `queryAllByTestId`에 잡히므로 금지). [추론]
- U-24. 필터가 "완료"일 때 렌더되는 `todo-item`은 완료된 항목뿐이다. [추론]
- U-25. 필터가 걸린 상태에서 항목을 토글하면, 그 항목이 현재 필터 조건에서 벗어난 경우 즉시 목록에서 사라진다. [추론]
- U-26. 필터가 걸린 상태에서 항목을 추가해도 필터는 유지되며, 새 항목은 필터 조건에 맞을 때만 보인다. [추론]
- U-27. 필터 상태에서 삭제한 항목은 필터를 "전체"로 되돌려도 다시 나타나지 않는다(삭제는 전역이다). [추론]
- U-28. 필터를 바꿔도 항목의 완료 상태·제목·개수는 변하지 않는다. [추론]
- U-29. 현재 선택된 필터 버튼은 `aria-pressed="true"`, 나머지는 `"false"`를 갖는다. (계약이 강제하지 않지만 선택 상태를 DOM에서 판정 가능하게 만든다) [추론]

### 2.4 개수 (S-11의 "미완료 개수 표시"는 형식을 말하지 않는다)

- U-30. `todo-count` 요소의 텍스트는 **숫자만**으로 이루어진다. 예: 항목이 없으면 `"0"`, 미완료가 2개면 `"2"`. (설명 문구를 그 요소 안에 넣으면 "텍스트가 정확히 N"을 요구하는 단언에서 실패한다. 숫자만 넣으면 정확 일치·부분 일치·숫자 추출 어느 방식에도 견딘다. 설명 문구는 `todo-count` **바깥** 형제 노드에 둔다.) [추론]
- U-31. `todo-count`가 세는 것은 **완료되지 않은** 항목 수다(완료 항목 수나 전체 항목 수가 아니다). [추론]
- U-32. `todo-count`는 현재 필터와 무관하게 전체 항목 중 미완료 개수를 센다(필터가 "완료"여도 미완료 개수를 보여준다). [추론]
- U-33. 항목을 토글·추가·삭제하면 `todo-count`가 같은 렌더에서 갱신된다. 완료 항목을 삭제하면 개수는 그대로다. [추론]

### 2.5 상태의 수명

- U-34. 항목 목록(제목·완료 여부·순서)은 `App`을 언마운트한 뒤 다시 렌더해도 그대로 남는다. [AC 출력 — AC-07이 `cleanup()` 후 재렌더에서 `["A","B"]`와 완료 상태를 요구했다. §3.2 참조]
- U-41. 저장 매체는 `localStorage`, 키는 `"todos"`, 값은 항목 배열의 JSON이다. (인수 테스트가 케이스 사이에 저장소를 비우므로 항목이 다음 케이스로 새지 않는다 — 8케이스 전부 통과로 확인) [AC 출력 + 추론]
- U-42. 필터는 저장하지 않는다. 다시 마운트하면 필터는 "전체"다. [추론]
- U-43. 입력창에 타이핑 중이던 문자열은 저장하지 않는다. 다시 마운트하면 빈 문자열이다. [추론]
- U-44. 저장값이 JSON이 아니거나, 배열이 아니거나, 항목 모양(`id: number`, `title: string`, `completed: boolean`)이 아니면 빈 목록으로 시작하고 예외를 던지지 않는다. 이후 조작도 정상 동작한다. [추론]
- U-45. 복원된 목록에 이어 추가하는 항목의 식별자는 복원된 최대 식별자 + 1부터 시작해 기존 식별자와 겹치지 않는다(겹치면 토글·삭제가 엉뚱한 항목을 건드린다). [추론]
- U-46. `localStorage` 접근이 실패하는 환경(저장소 없음·권한 차단·용량 초과)에서도 화면 동작은 그대로다. [추론]
- U-35. 저장된 값이 없으면 앱은 항목 0개, 필터 "전체", 입력 빈 문자열로 시작한다. [추론]
- U-36. 네트워크 요청·타이머·비동기 초기화가 없어 렌더 직후 동기적으로 위 상태가 관측된다(저장 효과는 화면 상태를 되돌리지 않는다). [추론]

### 2.6 계약이 "범위 밖"이라 말하지 않았지만 없으면 완성이라 부를 수 없는 것

- U-37. `npm run dev`로 띄웠을 때 마우스만으로 추가가 가능하도록 form 안에 submit 버튼이 하나 있다. 이 버튼에는 계약 표에 없는 testid를 붙이지 않으며, 있어도 U-04를 깨지 않는다. [추론]
- U-38. `todo-input`, 토글, 삭제, 필터 버튼에는 한국어 접근성 이름(placeholder / aria-label)이 있다. 이름 문자열 자체는 테스트가 판정하지 않는다. [추론]
- U-39. 항목이 0개일 때에도 `todo-count`와 필터 버튼 3개는 렌더되며, 빈 목록임을 알리는 문구는 `todo-item`이 아닌 요소로 표시한다. [추론]
- U-40. `src/index.css`·`src/App.css`를 수정하지 않으므로 App은 `App.css`를 import하지 않고, 인라인 `style` 속성이나 새 CSS 파일로 모양을 만들지 않는다. [추론]

### 2.7 근거로 정할 수 없었던 것 (해소 결과)

- ~~[MISSING: 인수 테스트가 `todo-count`에 요구하는 정확한 텍스트 형식]~~ → U-30("숫자만")으로 8케이스 통과. 반증되지 않아 확정.
- ~~[MISSING: 인수 테스트가 기대하는 항목 정렬 방향]~~ → U-09("뒤에 붙임")으로 8케이스 통과. 반증되지 않아 확정.

---

## 3. 완료 전 대조

1·2번의 문장을 하나씩 읽으며, 그 문장을 참으로 만드는 코드의 위치를 지목했다.

| 문장 | 근거 위치 |
|---|---|
| S-01 | `src/App.tsx:18` — `export default function App` |
| S-02 | `package.json:12-29` 의존성 미변경, 패키지 추가 설치 없음 |
| S-03 | §5 실행 기록 — `npm run build` 종료 코드 0 |
| S-04 | §5 실행 기록 — `npm run test:ac` 8/8 통과 |
| S-05 | `package.json:8-9`(build·test:ac), `tsconfig.app.json:20`(`"strict": true`) 미수정. 추가한 것은 `package.json:10`의 `test:dev` 한 줄뿐 |
| S-06 | `tests/ac/**` 미접근 — 실행만 함 |
| S-07 | `src/App.css`·`src/index.css` 미수정, 새 스타일 파일 없음 |
| S-08 | `src/todo/TodoInput.tsx:34` — `data-testid="todo-input"`, 렌더 지점은 `src/App.tsx:40` 한 곳 |
| S-09 | `src/todo/TodoItem.tsx:11` — `<li data-testid="todo-item">`, 항목당 1개 (`TodoList.tsx:18-25`) |
| S-10 | `src/todo/TodoItem.tsx:13`(toggle) `:19`(title) `:21`(delete) — 각 `<li>` 안에 1개씩 |
| S-11 | `src/todo/TodoStatusBar.tsx:9` — `data-testid="todo-count"`, 렌더 지점은 `src/App.tsx:41` 한 곳 |
| S-12 | `src/todo/TodoFilters.tsx:8-12`의 `FILTER_BUTTONS` 3개 → `:20`에서 각각 1개씩 생성 |
| S-13 | `src/App.tsx:40-42` — 입력·상태바·필터는 항목 수와 무관하게 항상 렌더 |
| S-14 | `src/todo/**`에 fetch·인증·DB 호출 0건 (저장은 `storage.ts`의 localStorage뿐) |
| S-15 | `src/todo/TodoItem.tsx:19` — 제목은 `<span>` 텍스트, 편집 핸들러 없음 |
| S-16 | `src/todo/TodoFilters.tsx:8-12` — 버튼은 필터 3개뿐. 드래그 핸들러·전체 토글·일괄 삭제 없음 |
| S-17 | `src/todo/types.ts:3-7` — `Todo`는 `id`/`title`/`completed`뿐. 검색 입력 없음 |
| S-18 | 테마·애니메이션·로케일 전환 코드 없음. 문구는 한국어 고정 (`TodoInput.tsx:39-42`, `TodoFilters.tsx:9-11`, `TodoList.tsx:13`, `TodoStatusBar.tsx:10`) |
| S-19 | `index.html` 미수정 |
| U-01 | `src/todo/TodoInput.tsx:33-41` — `type="text"`, `value={draft}`, `onChange` |
| U-02 | `src/todo/TodoInput.tsx:23-29` — `handleKeyDown`에서 `key === "Enter"` |
| U-03 | `src/todo/TodoInput.tsx:32` — `<form onSubmit={handleSubmit}>`, 핸들러 `:16-19` |
| U-04 | `src/todo/TodoInput.tsx:27` — keydown에서 `preventDefault()`로 암묵적 submit을 차단한 뒤 `commit()` 1회 |
| U-05 | `src/todo/todoState.ts:20` — `rawTitle.trim()` |
| U-06 | `src/todo/todoState.ts:21-23` — `if (title === "") return state` |
| U-07 | `src/todo/TodoInput.tsx:11-14` — `commit()`이 성공·거부와 무관하게 `setDraft("")` |
| U-08 | `src/todo/TodoInput.tsx:11-14` + `todoState.ts:22` — 거부는 같은 상태 객체 반환, 예외 경로 없음 |
| U-09 | `src/todo/todoState.ts:27` — `todos: [...state.todos, todo]` |
| U-10 | `src/todo/todoState.ts:19-30` — 제목 중복 검사 없음, 항상 새 `id` |
| U-11 | `src/todo/todoState.ts:21` — 검사는 빈 문자열 하나뿐 |
| U-12 | `src/todo/todoState.ts:24` — `completed: false` |
| U-13 | `src/todo/todoState.ts:24,28` — `id: state.nextId` / `nextId: state.nextId + 1`. 시계·난수 미사용 |
| U-14 | `src/todo/TodoItem.tsx:19` — `{todo.title}`만 렌더 |
| U-15 | `src/todo/TodoItem.tsx:12-18` — `type="checkbox"`, `checked={todo.completed}` |
| U-16 | `src/todo/TodoItem.tsx:22` — `type="button"` |
| U-17 | `src/todo/todoState.ts:32-39` — 해당 `id`만 `completed` 반전, 나머지는 원본 참조 유지 |
| U-18 | `src/todo/todoState.ts:41-46` — `filter`로 해당 `id`만 제거, 순서 보존 |
| U-19 | `src/todo/todoState.ts:35-37` — `map`으로 제자리 치환, 재정렬 없음 |
| U-20 | `src/todo/todoState.ts:14` — `filter: "all"` |
| U-21 | `src/todo/TodoFilters.tsx:18-26` — `type="button"` + `onClick` |
| U-22 | `src/todo/todoState.ts:54-55` — `case "all": return todos` |
| U-23 | `src/todo/todoState.ts:56-57` + `TodoList.tsx:18` — 걸러진 배열만 `map` → DOM에 없음 |
| U-24 | `src/todo/todoState.ts:58-59` |
| U-25 | `src/App.tsx:34` — `visibleTodos`를 매 렌더 `state.todos`·`state.filter`에서 재계산 |
| U-26 | `src/todo/todoState.ts:25-29` — `...state` 스프레드가 `filter`를 보존 |
| U-27 | `src/todo/todoState.ts:41-46` — 삭제는 `state.todos` 원본에서 제거 |
| U-28 | `src/todo/todoState.ts:48-50` — `setFilter`는 `filter`만 교체 |
| U-29 | `src/todo/TodoFilters.tsx:22` — `aria-pressed={filter === button.value}` |
| U-30 | `src/todo/TodoStatusBar.tsx:9` — `<span data-testid="todo-count">{activeCount}</span>`, 설명 문구 "개 남음"은 `:10`의 형제 노드 |
| U-31 | `src/todo/todoState.ts:63-65` — `!todo.completed` 개수 |
| U-32 | `src/App.tsx:35` — `countActive(state.todos)`에 필터 미적용 목록 전달 |
| U-33 | `src/App.tsx:34-35` — 매 렌더 재계산 |
| U-34 | `src/App.tsx:22-24` — `state.todos` 변경 시 `saveTodos`; 복원은 `src/todo/todoState.ts:8-17` + `src/todo/storage.ts:22-43` |
| U-41 | `src/todo/storage.ts:8` — `STORAGE_KEY = "todos"`; 쓰기 `:47`, 읽기 `:24` |
| U-42 | `src/App.tsx:23` — 저장 대상은 `state.todos`뿐 / `src/todo/todoState.ts:14` — 복원 시 항상 `"all"` |
| U-43 | `src/todo/TodoInput.tsx:9` — `draft`는 컴포넌트 지역 상태, 저장 코드 없음 |
| U-44 | `src/todo/storage.ts:29-31`(배열 아님) `:33-39`(항목 모양 검사) `:40-42`(파싱 예외) — 전부 `[]` 반환 |
| U-45 | `src/todo/todoState.ts:10-15` — `maxId + 1`부터 시작 |
| U-46 | `src/todo/storage.ts:23,40,46,48` — `try/catch` + `globalThis.localStorage?.` |
| U-35 | `src/todo/todoState.ts:12-16` + `storage.ts:25-27` + `TodoInput.tsx:9` |
| U-36 | `src/App.tsx` — `useEffect`는 저장용 `:22-24` 하나뿐이고 상태를 되돌리지 않음. 타이머·fetch 없음 |
| U-37 | `src/todo/TodoInput.tsx:42` — `<button type="submit">추가</button>`, testid 없음 |
| U-38 | `TodoInput.tsx:39-40` / `TodoItem.tsx:17,24` / `TodoFilters.tsx:9-11` |
| U-39 | `src/App.tsx:40-42` + `src/todo/TodoList.tsx:12-14` — 빈 목록 문구는 `<p>`, `todo-item` 아님 |
| U-40 | `src/App.tsx`·`src/todo/**` — `style` 속성 0건, CSS import 0건 |

### 3.1 기각한 문장

없음. 1·2번의 모든 문장에 대응하는 코드를 지목했다.

### 3.2 대조·구현 중 정정한 문장

- **U-34 (뒤집힘).** 최초 스펙에서 나는 "목록을 저장하지 않는다 — 언마운트 후 다시 렌더하면 0개로 시작한다"고 적었다.
  근거는 "인수 테스트가 케이스마다 새로 렌더하므로 저장하면 앞 케이스가 새어 들어간다"는 추론이었다.
  `npm run test:ac` 출력에서 AC-07이 `cleanup()` 후 재렌더에서 `["A","B"]`와 완료 상태 유지를 요구하며 실패했다(7 passed / 1 failed).
  → 영속성은 **요구사항**이다. localStorage 저장·복원을 추가했고(U-41~U-46), 인수 테스트가 케이스 사이에 저장소를 비우기 때문에
  내가 걱정한 누수는 일어나지 않는다(8/8 통과로 확인). 뒤집힌 것은 추론의 결론이지 절차가 아니다 —
  "저장소를 쓸지 말지"가 계약이 침묵하는 갈림길이라는 판단 자체는 맞았고, 그래서 실패 지점을 한 번에 찾을 수 있었다.
- **U-04 (보강).** 최초 구현은 form submit만 두었다. jsdom의 암묵적 submit에 기대는 형태여서 `fireEvent.keyDown(Enter)` 경로를 놓친다고 보고
  keydown 처리를 추가했다. 두 경로가 겹쳐 항목이 2개 추가되지 않도록 keydown에서 `preventDefault()`한다 (`TodoInput.tsx:27`).
  자체 테스트가 두 경로를 각각 지킨다.
- **U-07 (문장 수정).** 처음에는 "추가되면 입력창이 빈다"까지만 적었다. 거부된 경우를 정하지 않은 빈칸이었으므로
  "성공·거부와 무관하게 빈다"로 확정했다 — 공백 문자열이 남아 다음 입력과 이어붙는 경로를 없애기 위해서다.

---

## 4. 검증

- `tests/dev/todo.check.tsx` — 구현 중 만들어 돌린 자체 테스트(20케이스). 지우지 않았다.
  각 `it` 제목 앞에 그 케이스가 지키는 문장 번호를 달아 두었다. 실행: `npm run test:dev`.
- 인수 테스트가 검사하지 않을 수도 있는 다음 문장을 특히 이 파일이 지킨다.
  - U-04 — Enter 한 번이 항목 두 개를 만들지 않는다 (`user.type` 경로와 `fireEvent.keyDown` 경로를 따로 검사)
  - U-13/U-45 — 제목이 같은 항목의 개별 삭제, 재마운트 후 추가한 항목의 식별자 비충돌
  - U-32 — `todo-count`가 필터와 무관하게 전체 기준을 센다
  - U-44 — 저장값이 깨졌을 때(JSON 아님 / 모양 불일치) 빈 목록으로 시작하고 계속 동작한다
- 격리: `vitest.dev.config.ts`가 `tests/dev/**/*.check.tsx`만 포함한다. 파일명에 `.test.`·`.spec.`을 쓰지 않아
  다른 러너의 기본 include에도 걸리지 않는다 — `npm run test:ac`는 여전히 테스트 파일 1개(8케이스)만 돌린다.
  `tsconfig.app.json`의 `include`는 `src`뿐이라 이 파일은 `npm run build`의 타입체크 대상도 아니다.

## 5. 실행 기록

| 커맨드 | 결과 |
|---|---|
| `npm run test:ac` | Test Files 1 passed (1), Tests **8 passed (8)** — AC-01 … AC-08 |
| `npm run build` | `tsc -b && vite build` 성공, `dist/` 생성 |
| `npm run test:dev` | Test Files 1 passed (1), Tests **20 passed (20)** |

## 6. 파일 목록

| 파일 | 역할 |
|---|---|
| `src/App.tsx` | 진입점. 상태 보유, 저장 효과, 하위 컴포넌트 조립 |
| `src/todo/types.ts` | `Todo`·`Filter`·`TodoState` 타입 |
| `src/todo/todoState.ts` | 상태 전이·조회 함수 (추가/토글/삭제/필터/가시 목록/미완료 수) |
| `src/todo/storage.ts` | localStorage 저장·복원과 값 검증 |
| `src/todo/TodoInput.tsx` | `todo-input`, Enter·submit 처리 |
| `src/todo/TodoList.tsx` | 목록 렌더, 빈 목록 문구 |
| `src/todo/TodoItem.tsx` | `todo-item`/`todo-title`/`todo-toggle`/`todo-delete` |
| `src/todo/TodoFilters.tsx` | `filter-all`/`filter-active`/`filter-completed` |
| `src/todo/TodoStatusBar.tsx` | `todo-count` |
| `tests/dev/todo.check.tsx` | 자체 검증 테스트 (§4) |
| `vitest.dev.config.ts` | 자체 검증 전용 러너 설정 |
