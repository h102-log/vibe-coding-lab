# SPEC — Todo 앱

구현 전 요구사항 확정 문서. 산출물이 아니라 작업 문서다.
근거 위치는 `계약 §<절>`로 표기한다. 계약 = 과제로 주어진 「Todo 앱 — 구현 계약 (얇은 판)」.

---

## 1. 명시된 것

계약에서 직접 읽어낼 수 있는 요구.

### 1.1 스택·진입점

- S-01. 앱은 Vite + React + TypeScript로 구현되며, 다른 프레임워크를 도입하지 않는다. — 계약 §고정된 것
- S-02. `src/App.tsx`는 컴포넌트를 default export 한다. — 계약 §고정된 것
- S-03. `src/App.tsx` 아래의 파일 분할·상태 관리 방식은 임의로 정해도 계약 위반이 아니다. — 계약 §고정된 것
- S-04. `tests/ac/**`의 파일은 읽기·수정·삭제·이동되지 않는다 (실행만 한다). — 계약 §고정된 것
- S-05. `package.json`의 `build`·`test:ac` 스크립트 문자열이 변경되지 않는다. — 계약 §고정된 것
- S-06. `tsconfig.app.json`의 `"strict": true`가 유지된다. — 계약 §고정된 것
- S-07. `src/App.css`와 `src/index.css`의 내용이 변경되지 않고, 새 스타일 파일이 추가되지 않는다. — 계약 §범위 밖
- S-08. `npm run test:ac`가 종료 코드 0으로 끝난다. — 과제 §완료 조건
- S-09. `npm run build`(= `tsc -b && vite build`)가 종료 코드 0으로 끝난다. — 과제 §완료 조건

### 1.2 DOM 계약

렌더된 화면에서 다음 `data-testid`를 가진 요소를 찾을 수 있다. — 계약 §DOM 계약

- S-10. `todo-input`: 새 항목 입력창.
- S-11. `todo-item`: 항목 하나. 개수는 0..n.
- S-12. `todo-title`: 항목 제목 텍스트.
- S-13. `todo-toggle`: 완료 체크박스.
- S-14. `todo-delete`: 항목 삭제 버튼.
- S-15. `todo-count`: 미완료 개수 표시.
- S-16. `filter-all` / `filter-active` / `filter-completed`: 각각 전체·미완료·완료 필터 버튼.
- S-17. 위 속성을 제외한 마크업 구조·클래스명·태그는 임의로 정해도 계약 위반이 아니다.

### 1.3 범위 밖 (구현하지 않는다)

- S-18. 다음 기능은 코드에 존재하지 않는다: 로그인·계정, 서버 API·DB, 배포 설정,
  인라인 제목 편집(더블클릭 수정), 드래그 정렬, 전체 완료 토글, 완료 일괄 삭제,
  마감일·우선순위·태그·검색, 다크모드·테마 전환, 애니메이션, 다국어(한국어 단일 로케일), SEO 메타태그.
  — 계약 §범위 밖

---

## 2. 명시되지 않은 것

계약이 침묵하는 지점. 계약 §DOM 계약이 "동작의 세부는 이 문서에 적혀 있지 않다"고 명시하므로,
아래 항목은 전부 인수 테스트 출력으로 검증·수정되어야 하는 **잠정 확정**이다.

### 2.1 초기 상태

- U-01. 앱을 처음 렌더하면 `todo-item`이 0개다 (시드 데이터 없음). `[추론]`
- U-02. 앱을 처음 렌더하면 `todo-input`의 value는 빈 문자열이다. `[추론]`
- U-03. 앱을 처음 렌더하면 선택된 필터는 '전체'다. `[추론]`
- U-04. `todo-count`·`filter-all`·`filter-active`·`filter-completed`는 항목이 0개일 때도 렌더된다.
  `[추론]` — 근거: 테스트가 항목 추가 전에 이 요소들을 조회할 수 있고, 조건부 렌더는 그때 실패한다.

### 2.2 항목 추가

- U-05. `todo-input`에 포커스가 있는 상태에서 Enter 키를 누르면 항목이 추가된다. `[추론]`
  — 근거: 계약의 testid 표에 추가 버튼이 없으므로, 테스트가 항목을 추가할 수단은 입력창 Enter뿐이다.
- U-06. `todo-input`을 감싼 form의 submit 이벤트로도 항목이 추가된다. `[추론]`
- U-07. 하나의 Enter 입력은 항목을 1개만 추가한다 (keydown 처리와 form submit이 중복 실행되지 않는다). `[추론]`
- U-08. 추가되는 항목의 제목은 입력값의 앞뒤 공백을 제거한 문자열이다. `[추론]`
- U-09. 입력값이 공백만으로 이루어졌거나 비어 있으면 항목이 추가되지 않는다. `[추론]`
- U-10. 항목 추가를 시도하면 성공 여부와 무관하게 `todo-input`의 value가 빈 문자열이 된다. `[추론]`
  — 근거: 실패 시 잔여 문자열이 남으면 다음 입력의 제목을 오염시킨다.
- U-11. 이미 같은 제목의 항목이 있어도 추가된다 (중복 허용). `[추론]`
- U-12. 새 항목은 목록의 **끝**에 붙는다. 즉 a, b, c 순으로 추가하면 `todo-title`의 순서는 a, b, c다. `[추론]`
  — 근거: 계약은 정렬을 규정하지 않는다. 추가 순서 = 표시 순서가 기본 가정이다. **테스트로 검증할 최우선 항목.**
- U-13. 새로 추가된 항목은 미완료 상태다. `[추론]`
- U-14. 현재 필터가 '완료'인 상태에서 항목을 추가해도 필터는 바뀌지 않는다. `[추론]`
- U-15. 입력 길이 상한은 두지 않는다. `[MISSING: 입력 길이 상한]` — 계약에 근거가 없어 제한하지 않는 쪽을 택한다.

### 2.3 완료 토글

- U-16. `todo-toggle`은 `<input type="checkbox">`이고, 그 `checked`가 해당 항목의 완료 상태와 같다. `[추론]`
  — 근거: 계약이 "완료 체크박스"라고 부르므로 테스트가 `checked`를 읽을 수 있다.
- U-17. `todo-toggle`을 클릭하면 해당 항목의 완료 상태가 반전된다 (미완료→완료, 완료→미완료 양방향). `[추론]`
- U-18. 토글은 해당 항목에만 영향을 준다. 다른 항목의 완료 상태는 변하지 않는다. `[추론]`
- U-19. 토글해도 항목의 목록 내 순서는 변하지 않는다. `[추론]`

### 2.4 삭제

- U-20. `todo-delete`를 클릭하면 해당 항목만 목록에서 사라지고, 나머지 항목의 상대 순서는 유지된다. `[추론]`
- U-21. 모든 항목을 삭제하면 `todo-item`은 0개가 되고 앱은 예외 없이 렌더된다. `[추론]`

### 2.5 필터

- U-22. `filter-all`을 클릭하면 모든 항목이 `todo-item`으로 렌더된다. `[추론]`
- U-23. `filter-active`를 클릭하면 미완료 항목만 `todo-item`으로 렌더된다. `[추론]`
- U-24. `filter-completed`를 클릭하면 완료 항목만 `todo-item`으로 렌더된다. `[추론]`
- U-25. 필터는 화면에 그려지는 항목만 거른다. 필터 전환으로 항목이 삭제되거나 완료 상태가 바뀌지 않는다. `[추론]`
- U-26. 필터에 걸러진 항목은 DOM에서 제거된다 (숨김 처리로 `todo-item`을 남겨두지 않는다). `[추론]`
  — 근거: 테스트는 `todo-item` 개수로 필터를 판정할 수밖에 없다.
- U-27. 선택된 필터 버튼은 `aria-pressed="true"`를 갖는다. `[추론]`
  — 계약에 선택 표시 수단이 없으므로 임의로 정한다. 테스트가 이를 요구하지 않아도 무해하다.
- U-28. 필터 버튼은 클릭 후에도 계속 렌더된다 (disabled로 만들지 않는다). `[추론]`

### 2.6 개수 표시

- U-29. `todo-count`의 textContent는 **미완료 항목 개수의 십진수 표기뿐**이다 (예: `2`). `[추론]`
  — 근거: 계약이 문구를 규정하지 않는다. 숫자만 두면 완전일치·부분일치·정규식 어느 판정에도 걸린다.
  **테스트로 검증할 우선 항목.**
- U-30. `todo-count`가 세는 대상은 현재 필터와 무관하게 전체 항목 중 미완료 항목이다. `[추론]`
- U-31. 항목이 0개면 `todo-count`는 `0`이다. `[추론]`
- U-32. 항목 추가·토글·삭제 후 `todo-count`는 즉시 갱신된다. `[추론]`

### 2.7 구조·기타

- U-33. 각 `todo-item`은 자신의 `todo-title`·`todo-toggle`·`todo-delete`를 정확히 1개씩 포함한다. `[추론]`
  — 근거: 테스트가 `within(item)`으로 조회하거나 전역 `queryAllByTestId`의 인덱스를 항목 인덱스와 맞출 수 있다.
- U-34. `todo-title`의 textContent는 제목 문자열과 정확히 같다 (번호·아이콘 등 부가 텍스트를 넣지 않는다). `[추론]`
- U-35. ~~항목 상태는 메모리에만 둔다. localStorage 등 브라우저 저장소를 쓰지 않는다.~~
  **반증됨 — 근거: AC-07 출력.** 아래 U-35a로 대체한다.
- U-35a. 앱을 언마운트한 뒤 다시 마운트하면 직전의 항목 목록과 각 항목의 완료 상태가 그대로 복원된다.
  즉 상태는 브라우저 저장소에 영속화된다. — 근거: `npm run test:ac`의 AC-07 출력
  (`cleanup(); render(<App />); expect(titles()).toEqual(["A","B"]); expect(toggleOf(0).checked).toBe(true)`).
  → 최초 추론이 정확히 반대였다. 계약의 "서버 API·DB 범위 밖"을 영속화 불필요로 넘겨짚은 것이 원인이다.
- U-36. 각 항목은 렌더 간에 안정적인 고유 key를 갖는다. `[추론]`
  복원된 항목의 id와 새로 만든 항목의 id도 서로 겹치지 않는다.
- U-37. 제목의 특수문자·HTML 문자열은 마크업으로 해석되지 않고 텍스트로 표시된다. `[추론]`
- U-38. `todo-input`은 공백이 아닌 문자를 포함한 접근성 이름(accessible name)을 갖는다.
  — 근거: `npm run test:ac`의 AC-08 출력 (`getByRole("textbox", { name: /\S/ })`).
  → placeholder는 접근성 이름으로 계산되지 않는다. 2번 목록에서 접근성을 아예 빠뜨렸던 항목이다.
- U-39. 선택된 필터는 영속화하지 않는다. 재마운트 시 필터는 '전체'로 돌아간다. `[추론]`
  — 근거: U-35a가 요구하는 것은 항목뿐이다. 필터까지 복원하면 재마운트 직후 보이는 항목 수가 달라질 수 있다.
- U-40. 저장소를 쓸 수 없거나 저장된 값이 깨져 있어도 앱은 예외 없이 빈 목록으로 렌더된다. `[추론]`

---

## 3. 완료 전 대조

1·2번의 각 문장에 대해 그것을 참으로 만드는 코드의 위치를 지목한다.
지목하지 못한 문장은 구현되지 않은 것으로 본다.

### 3.1 스택·진입점·제약

| 문장 | 코드 위치 | 확인 |
|---|---|---|
| S-01 | `package.json` 의존성 미변경, 구현은 `.tsx`/`.ts`만 | ✅ |
| S-02 | `src/App.tsx:6` `export default function App()` | ✅ |
| S-03 | `src/todo/` 7개 파일로 분할, 상태는 `useTodos` 훅 | ✅ |
| S-04 | `tests/ac/**`를 한 번도 열지 않음. 사용한 것은 `npm run test:ac` 실행 출력뿐 | ✅ |
| S-05 | `package.json:8-9` 원본 그대로 (mtime 미변경) | ✅ |
| S-06 | `tsconfig.app.json:20` `"strict": true` | ✅ |
| S-07 | `src/App.css`·`src/index.css` mtime 미변경, `src/todo/`에 스타일 파일 없음 | ✅ |
| S-08 | `npm run test:ac` → `Tests 8 passed (8)` | ✅ |
| S-09 | `npm run build` → `tsc -b` 통과 + `built in 317ms` | ✅ |

### 3.2 DOM 계약

| 문장 | 코드 위치 | 확인 |
|---|---|---|
| S-10 `todo-input` | `src/todo/TodoInput.tsx:32` | ✅ |
| S-11 `todo-item` | `src/todo/TodoItem.tsx:11` | ✅ |
| S-12 `todo-title` | `src/todo/TodoItem.tsx:20` | ✅ |
| S-13 `todo-toggle` | `src/todo/TodoItem.tsx:13` | ✅ |
| S-14 `todo-delete` | `src/todo/TodoItem.tsx:25` | ✅ |
| S-15 `todo-count` | `src/App.tsx:14` | ✅ |
| S-16 필터 3종 | `src/todo/FilterBar.tsx:4-6` (testId) + `:20` (부여) | ✅ |
| S-17 | 마크업은 `main`/`form`/`ul`/`li`/`footer`로 임의 구성 | ✅ |
| S-18 범위 밖 미구현 | 7개 파일 전체에 편집·정렬·전체완료·일괄삭제·마감일·테마·i18n 코드 없음 | ✅ |

### 3.3 초기 상태·추가

| 문장 | 코드 위치 | 확인 |
|---|---|---|
| U-01 초기 0개 | `useTodos.ts:27` + `storage.ts:19` (미저장 시 `[]`) | ✅ |
| U-02 입력창 빈 값 | `TodoInput.tsx:9` | ✅ |
| U-03 기본 필터 '전체' | `useTodos.ts:28` | ✅ |
| U-04 count·필터 항상 렌더 | `App.tsx:14-15` (조건부 렌더 아님) | ✅ |
| U-05 Enter로 추가 | `TodoInput.tsx:22-27` | ✅ |
| U-06 form submit으로 추가 | `TodoInput.tsx:17-20, 30` | ✅ |
| U-07 Enter 1회 = 1개 | `TodoInput.tsx:25` `event.preventDefault()`로 암묵적 submit 차단 | ✅ |
| U-08 제목 trim | `TodoInput.tsx:12`, `useTodos.ts:37` (이중 방어) | ✅ |
| U-09 공백만 → 추가 안 함 | `TodoInput.tsx:14`, `useTodos.ts:38` | ✅ |
| U-10 시도 후 입력창 비움 | `TodoInput.tsx:13` (`if`보다 앞) | ✅ |
| U-11 중복 허용 | `useTodos.ts:41` 중복 검사 없음 | ✅ |
| U-12 끝에 추가 | `useTodos.ts:41` `[...prev, {...}]` | ✅ AC-07이 `["A","B"]` 순서를 요구해 실증됨 |
| U-13 새 항목 미완료 | `useTodos.ts:41` `done: false` | ✅ |
| U-14 추가가 필터를 안 바꿈 | `useTodos.ts:36-42` `setFilter` 호출 없음 | ✅ |
| U-15 길이 상한 없음 | `TodoInput.tsx:31-39` `maxLength` 없음 | ✅ (기각 아님, 무제한으로 확정) |

### 3.4 토글·삭제·필터·개수

| 문장 | 코드 위치 | 확인 |
|---|---|---|
| U-16 checkbox + checked | `TodoItem.tsx:13-15` | ✅ |
| U-17 양방향 반전 | `useTodos.ts:46` `!todo.done` | ✅ |
| U-18 해당 항목만 | `useTodos.ts:46` `todo.id === id` 분기 | ✅ |
| U-19 순서 불변 | `useTodos.ts:46` `map`은 순서를 보존 | ✅ |
| U-20 해당 항목만 삭제 | `useTodos.ts:51` `filter` | ✅ |
| U-21 전부 삭제 후 렌더 | `TodoList.tsx:14` 빈 배열 `map` | ✅ |
| U-22 전체 필터 | `useTodos.ts:13-14` | ✅ |
| U-23 미완료 필터 | `useTodos.ts:9-10` | ✅ |
| U-24 완료 필터 | `useTodos.ts:11-12` | ✅ |
| U-25 필터는 비파괴적 | `useTodos.ts:7-16` 순수 함수, `todos` 미변경 | ✅ |
| U-26 걸러진 항목은 DOM에서 제거 | `TodoList.tsx:14` `visibleTodos`만 렌더 | ✅ |
| U-27 `aria-pressed` | `FilterBar.tsx:22` | ✅ |
| U-28 disabled 아님 | `FilterBar.tsx:18-25` | ✅ |
| U-29 숫자만 | `App.tsx:14` `{remainingCount}`가 유일한 자식 | ✅ |
| U-30 필터와 무관 | `useTodos.ts:55-58` `visibleTodos`가 아니라 `todos`를 셈 | ✅ |
| U-31 0개면 `0` | `useTodos.ts:56` reduce 초깃값 `0` | ✅ |
| U-32 즉시 갱신 | `useTodos.ts:55-58` `todos` 파생값 | ✅ |

### 3.5 구조·영속화·접근성

| 문장 | 코드 위치 | 확인 |
|---|---|---|
| U-33 항목당 1개씩 | `TodoItem.tsx:11-27` | ✅ |
| U-34 제목 텍스트만 | `TodoItem.tsx:22` `{todo.title}`가 유일한 자식 | ✅ |
| U-35a 재마운트 후 복원 | `storage.ts:17-36` + `useTodos.ts:27`(로드), `:32-34`(저장) | ✅ AC-07 통과 |
| U-36 고유·안정 key | `TodoList.tsx:15` `key={todo.id}`, id 생성 `useTodos.ts:39-40`, 복원분과의 충돌 방지 `useTodos.ts:19-24, 30` | ✅ |
| U-37 텍스트 이스케이프 | `TodoItem.tsx:22` JSX 보간 (`dangerouslySetInnerHTML` 미사용) | ✅ |
| U-38 접근성 이름 | `TodoInput.tsx:35` `aria-label="새 할 일"` | ✅ AC-08 통과 |
| U-39 필터는 비영속 | `useTodos.ts:28` 저장/복원 대상 아님 | ✅ |
| U-40 저장소 실패 내성 | `storage.ts:17-27`(try/catch + 배열·형태 검증), `:30-36` | ✅ |

### 3.6 남은 것

- 기각한 문장: 없음.
- 구현하지 못한 문장: 없음.
- `[MISSING]`으로 남았던 U-15(입력 길이 상한)는 "상한 없음"으로 확정했다. 계약에도 인수 테스트에도 근거가 없다.
- 잘못 추론했다가 인수 테스트 출력으로 바로잡은 문장: U-35(→U-35a), U-38(누락분 추가).
