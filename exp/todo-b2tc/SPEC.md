# SPEC — Todo 앱 (구현 전 확정)

작업 문서. 산출물이 아니다. 근거 위치는 `[계약 §...]`, 추론은 `[추론]`으로 단다.

---

## 1. 명시된 것

계약 문서에서 직접 읽어낼 수 있는 요구.

1. 앱을 빌드할 때 `src/App.tsx`의 default export 컴포넌트가 화면 전체의 진입점이 된다. [계약 §고정된 것 > 구현 진입점]
2. 앱이 렌더될 때 `data-testid="todo-input"`인 엘리먼트가 정확히 1개 존재한다. [계약 §DOM 계약 표]
3. 앱이 렌더될 때 `filter-all`, `filter-active`, `filter-completed` 각각이 정확히 1개 존재한다. [계약 §DOM 계약 표]
4. 앱이 렌더될 때 `todo-count`가 정확히 1개 존재하고 미완료 개수를 표시한다. [계약 §DOM 계약 표]
5. 항목이 n개 표시될 때 `todo-item`은 n개 존재한다(n은 0 이상). [계약 §DOM 계약 표 "0..n개"]
6. `todo-item` 하나에 대해 그 안에 `todo-title`, `todo-toggle`, `todo-delete`가 각각 1개씩 존재한다. [계약 §DOM 계약 표]
7. `todo-toggle`은 완료 상태를 나타내는 체크박스다. [계약 §DOM 계약 표 "완료 체크박스"]
8. `todo-delete`는 항목을 삭제하는 버튼이다. [계약 §DOM 계약 표 "항목 삭제 버튼"]
9. 앱은 로그인·서버 API·DB·인라인 제목 편집·드래그 정렬·전체완료 토글·완료 일괄 삭제·마감일·우선순위·태그·검색·테마 전환·애니메이션·다국어·SEO 메타태그 중 어느 것도 렌더하거나 수행하지 않는다. [계약 §범위 밖]
10. 저장소의 `src/App.css`와 `src/index.css`는 구현 전후로 내용이 동일하고, 새 스타일 파일은 추가되지 않는다. [계약 §범위 밖 > CSS·스타일 작업]
11. `tests/ac/**`의 파일은 구현 전후로 내용이 동일하다(실행만 한다). [계약 §고정된 것]
12. `package.json`의 `build`·`test:ac` 스크립트와 `tsconfig.app.json`의 `"strict": true`는 변경되지 않는다. [계약 §고정된 것]
13. `npm run test:ac`를 실행하면 종료 코드 0으로 끝난다. [계약 §완료 조건]
14. `npm run build`를 실행하면 타입 에러 없이 종료 코드 0으로 끝난다. [계약 §완료 조건]
15. 화면에 표시되는 문구는 한국어 단일 로케일이다. [계약 §범위 밖 "다국어(한국어 단일 로케일)"]

---

## 2. 명시되지 않은 것

계약은 "동작의 세부는 이 문서에 적혀 있지 않다"고 명시한다. 아래는 1번 문장이 참이 되기 위해
추가로 정해져야 하는 것, 사용 흐름의 갈림길, 그리고 없으면 완성이라 부를 수 없는 항목이다.
값은 인수 테스트 출력으로 좁힌다.

### 2.1 추가 흐름

16. `todo-input`에 텍스트를 입력하고 Enter 키를 누르면 앱은 그 텍스트를 제목으로 하는 항목을 목록에 추가한다. [추론]
17. 추가 폼의 제출(submit 이벤트)이 발생하면 앱은 Enter와 동일하게 항목을 추가한다. [추론]
18. Enter 키다운 처리 시 앱은 기본 동작을 취소하여, 한 번의 Enter로 항목이 두 번 추가되지 않는다. [추론]
19. 항목이 추가될 때 앱은 입력 문자열의 앞뒤 공백을 제거한 값을 제목으로 저장한다. [추론]
20. 입력값이 공백만으로 이루어져 있거나 비어 있을 때 Enter를 눌러도 앱은 항목을 추가하지 않는다(`todo-item` 개수가 변하지 않는다). [추론]
21. 제출이 처리된 뒤 앱은 `todo-input`의 값을 빈 문자열로 만든다. 추가가 거부된 경우에도 동일하다(다음 입력이 이전 잔여 문자열과 섞이지 않도록). [추론]
22. 항목이 추가될 때 앱은 그것을 목록의 **마지막**에 놓는다. 따라서 "a", "b" 순으로 추가하면 `todo-title` 텍스트는 위에서부터 ["a", "b"]다. [추론]
23. 이미 같은 제목의 항목이 있어도 앱은 추가를 거부하지 않는다(중복 허용). [추론]
24. `todo-title`의 텍스트는 저장된 제목과 정확히 같다(접두·접미 장식 문자를 붙이지 않는다). [추론]

### 2.2 완료 토글

25. `todo-toggle`은 `<input type="checkbox">`이고, 해당 항목이 완료 상태일 때 checked, 미완료일 때 unchecked다. [추론]
26. 미완료 항목의 `todo-toggle`을 클릭하면 그 항목은 완료가 되고, 완료 항목의 것을 클릭하면 미완료가 된다. [추론]
27. 한 항목을 토글해도 다른 항목의 완료 상태는 바뀌지 않는다. [추론]
28. 토글은 항목의 목록 내 위치를 바꾸지 않는다. [추론]

### 2.3 삭제

29. 어떤 항목의 `todo-delete`를 클릭하면 그 항목만 목록에서 사라지고 나머지 항목의 상대 순서는 유지된다. [추론]
30. 마지막 항목을 삭제하면 `todo-item`은 0개가 되고, 그때도 `todo-input`·`todo-count`·필터 버튼 3개는 계속 존재한다. [추론]

### 2.4 카운트

31. `todo-count`는 완료되지 않은 항목의 개수를 표시하며, 현재 선택된 필터와 무관하게 전체 목록 기준으로 센다. [추론]
32. 항목이 0개일 때 `todo-count`는 0을 표시한다. [추론]
33. 항목을 완료로 토글하면 `todo-count`의 수는 1 감소하고, 미완료로 되돌리면 1 증가한다. [추론]
34. 미완료 항목을 삭제하면 `todo-count`의 수는 1 감소하고, 완료 항목을 삭제하면 변하지 않는다. [추론]
35. `todo-count`의 텍스트에는 그 개수가 아라비아 숫자로 포함된다. [추론]
36. [MISSING: `todo-count`의 정확한 문구 형식] — 계약은 형식을 정하지 않는다. 인수 테스트가 정한다.
    초기 구현값은 `"{n}개 남음"`으로 두고, `npm run test:ac` 출력이 다른 형식을 요구하면 그 출력에 맞춘다.
    (2026-08-02 확정: 테스트는 숫자 부분만 요구했고 `"{n}개 남음"`으로 통과. §3-35 참조)

### 2.5 필터

37. 첫 렌더 시 선택된 필터는 "전체"이고, 모든 항목이 `todo-item`으로 렌더된다. [추론]
38. `filter-active`를 클릭하면 미완료 항목만 `todo-item`으로 렌더되고 완료 항목은 DOM에서 제거된다(CSS로 숨기지 않는다 — `queryAllByTestId`가 세므로). [추론]
39. `filter-completed`를 클릭하면 완료 항목만 `todo-item`으로 렌더된다. [추론]
40. `filter-all`을 클릭하면 완료·미완료 모든 항목이 다시 렌더된다. [추론]
41. 필터를 바꿔도 항목의 제목·완료 상태·순서는 바뀌지 않는다. [추론]
42. 필터를 바꿔도 `todo-count`의 수는 바뀌지 않는다. [추론]
43. 현재 필터에서 화면에 보이는 항목을 삭제하거나 토글해도 선택된 필터는 그대로 유지된다. [추론]
44. 필터 버튼 3개는 항상 클릭 가능한 `<button>`이며 disabled가 되지 않는다(선택된 필터 버튼 포함). [추론]

### 2.6 상태·수명

45. ~~앱은 항목을 브라우저 저장소에 저장하지 않는다.~~ **기각 — 추론이 틀렸다.**
    `npm run test:ac`의 AC-07은 `cleanup()` 후 `render(<App />)`하고 `titles()`가 `["A","B"]`,
    `toggleOf(0).checked`가 `true`이기를 요구한다. [test:ac AC-07 실패 출력, 2026-08-02]
    → **45'. 항목을 추가·토글·삭제한 뒤 컴포넌트를 언마운트하고 다시 마운트하면,
    앱은 같은 제목·같은 완료 상태·같은 순서의 목록을 복원한다.** [test:ac AC-07 출력]
45a. 저장된 값이 없거나 JSON으로 파싱되지 않거나 배열이 아니면, 앱은 예외를 던지지 않고 빈 목록으로 시작한다. [추론]
45b. 저장소 접근이 실패하는 환경(접근 차단·용량 초과)에서도 앱은 렌더와 추가·토글·삭제를 계속 수행한다. [추론]
45c. 선택된 필터는 저장하지 않는다. 다시 마운트하면 필터는 "전체"다(§37 유지). [추론]
46. 각 항목은 제목과 무관한 고유 식별자를 가지며, 제목이 같은 두 항목도 개별적으로 토글·삭제된다. [추론]
46a. 복원된 목록에 새 항목을 추가해도 식별자는 기존 항목과 충돌하지 않는다. [추론]
47. 앱은 React `StrictMode`에서 이중 렌더되어도 항목을 중복 추가하지 않는다(추가는 이벤트 핸들러에서만 일어나고, 식별자 계산은 순수 함수다). [추론]

### 2.8 접근성 이름

계약의 DOM 표는 `data-testid`만 규정하지만, AC-08은 role+name으로도 같은 엘리먼트를 찾는다.
[test:ac AC-08 실패 출력, 2026-08-02: `getAllByRole("textbox", { name: /\S/ })`가 `todo-input`을,
`getAllByRole("checkbox", { name: /\S/ })`가 `todo-toggle`을 포함해야 한다]

50. `todo-input`은 공백이 아닌 접근 가능한 이름을 가진다(placeholder만으로는 이름이 계산되지 않으므로 `aria-label`을 준다). [test:ac AC-08 출력]
51. 각 `todo-toggle`은 공백이 아닌 접근 가능한 이름을 가진다. [test:ac AC-08 출력]
52. `todo-delete`는 버튼 텍스트("삭제")로 공백이 아닌 이름을 가진다. [추론]
53. 필터 버튼 3개는 각각 버튼 텍스트("전체"/"미완료"/"완료")로 공백이 아닌 이름을 가진다. [추론]

### 2.7 타입·빌드

48. 구현 파일은 `tsconfig.app.json`의 `strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly` 아래에서 오류 없이 컴파일된다(타입 전용 import는 `import type`, enum·파라미터 프로퍼티 사용 금지). [추론]
49. 구현이 추가하는 파일은 모두 `src/` 아래에 있고 `src/App.tsx`에서 도달 가능하다. [계약 §고정된 것 + 추론]

---

## 3. 완료 전 대조

1·2번의 문장을 하나씩 읽고, 그것을 참으로 만드는 코드의 파일·줄을 지목한 결과.
줄 번호는 최종 구현 기준. 확인 방법이 "코드 지목"만으로 부족한 문장은
임시 vitest 하네스(`tmp-verify/`, 확인 후 삭제)로 실제 실행해 확인했고 `[런타임 확인]`을 달았다.

| # | 위치 | 비고 |
|---|---|---|
| 1 | `src/App.tsx:7` (`export default function App`) | |
| 2 | `src/todo/TodoInput.tsx:36` | |
| 3 | `src/todo/FilterBar.tsx:3-7`(3종) + `21` (`data-testid={\`filter-${key}\`}`) | |
| 4 | `src/todo/TodoCount.tsx:6` | |
| 5 | `src/todo/TodoList.tsx:22-24` (`visibleTodos(...).map`), `src/todo/TodoItem.tsx:11` | |
| 6 | `src/todo/TodoItem.tsx:13`(toggle), `19`(title), `20`(delete) | |
| 7 | `src/todo/TodoItem.tsx:14-15` (`type="checkbox"`, `checked={todo.completed}`) | |
| 8 | `src/todo/TodoItem.tsx:20-22` (`onClick={() => onDelete(todo.id)}`) | |
| 9 | 범위 밖 기능의 코드 없음 — `src/todo/`는 입력·목록·항목·카운트·필터 5개 파일뿐 | |
| 10 | `src/App.css`·`src/index.css` 미변경, 새 스타일 파일 없음(`src/todo/*`에 CSS import 없음) | |
| 11 | `tests/ac/**` 미변경 — `npm run test:ac` 실행만 함 | |
| 12 | `package.json`·`tsconfig.app.json` 미변경 | |
| 13 | `npm run test:ac` → `Tests 8 passed (8)`, 연속 2회 동일 | 실행 확인 |
| 14 | `npm run build` → `tsc -b && vite build` 종료 코드 0 | 실행 확인 |
| 15 | `TodoInput.tsx:39,40,44`, `TodoItem.tsx:16,21`, `TodoCount.tsx:6`, `FilterBar.tsx:4-6`, `App.tsx:12` — 전부 한국어 | |
| 16 | `src/todo/TodoInput.tsx:26-30` (`key === 'Enter'` → `commit()`) | [런타임 확인] |
| 17 | `src/todo/TodoInput.tsx:19-22, 33` (`<form onSubmit>`), 제출 버튼 `44` | [런타임 확인] |
| 18 | `src/todo/TodoInput.tsx:28` (`event.preventDefault()`) — `change`+`keyDown(Enter)`로도 항목이 1개만 생김 | [런타임 확인] |
| 19 | `src/todo/useTodos.ts:20` (`title.trim()`) — `"  x  "` → `"x"` | [런타임 확인] |
| 20 | `src/todo/useTodos.ts:21` (`if (trimmed === '') return`) | [런타임 확인] |
| 21 | `src/todo/TodoInput.tsx:15-16` (`setDraft('')` + DOM value 초기화, 거부 시에도 실행) | [런타임 확인] |
| 22 | `src/todo/useTodos.ts:22` (`[...prev, newTodo]`) | AC-07이 `["A","B"]` 순서 요구 |
| 23 | `src/todo/useTodos.ts:19-23`에 중복 검사 없음 — 같은 제목 2개가 각각 남음 | [런타임 확인] |
| 24 | `src/todo/TodoItem.tsx:19` (`{todo.title}` 단독) | |
| 25 | `src/todo/TodoItem.tsx:14-15` | |
| 26 | `src/todo/useTodos.ts:25-29` (`completed: !todo.completed`) | |
| 27 | `src/todo/useTodos.ts:27` (`todo.id === id ? ... : todo`) | [런타임 확인] |
| 28 | `src/todo/useTodos.ts:27` (`map` — 위치 보존) | [런타임 확인] |
| 29 | `src/todo/useTodos.ts:32` (`filter((todo) => todo.id !== id)`) | [런타임 확인] |
| 30 | `src/App.tsx:13,15,16` — 목록 길이와 무관하게 항상 렌더 | [런타임 확인] |
| 31 | `src/todo/useTodos.ts:35` (`todos.filter(!completed).length` — 전체 배열 기준), `src/App.tsx:15` | [런타임 확인] |
| 32 | 같은 줄 (빈 배열 → `0`), `TodoCount.tsx:6`이 `0개 남음` 출력 | [런타임 확인] |
| 33 | 같은 줄 (`activeCount`가 `todos`에서 매 렌더 파생) | [런타임 확인] |
| 34 | 같은 줄 | [런타임 확인] |
| 35 | `src/todo/TodoCount.tsx:6` (`{count}개 남음`) | |
| 36 | 해소 — `"{n}개 남음"`으로 `test:ac` 8/8 통과. 형식 재조정 불필요 | |
| 37 | `src/todo/useTodos.ts:12` (`useState<Filter>('all')`), `TodoList.tsx:16` (`all` → 원본 반환) | |
| 38 | `src/todo/TodoList.tsx:14` — 렌더 목록 자체를 줄이므로 숨긴 항목은 DOM에 없음 | [런타임 확인] |
| 39 | `src/todo/TodoList.tsx:15` | [런타임 확인] |
| 40 | `src/todo/TodoList.tsx:16` | [런타임 확인] |
| 41 | `src/todo/TodoList.tsx:13-17`은 파생 계산만 — `todos` 배열 미변형 | [런타임 확인] |
| 42 | `src/App.tsx:15`가 `activeCount`만 참조(필터 미참조) | [런타임 확인] |
| 43 | `src/todo/useTodos.ts:25-33` — toggle/remove가 `filter` 상태를 건드리지 않음 | [런타임 확인] |
| 44 | `src/todo/FilterBar.tsx:18-26`에 `disabled` 없음 | |
| 45' | `src/todo/useTodos.ts:11` (`useState(loadTodos)`) + `15-17` (`useEffect`→`saveTodos`), `src/todo/storage.ts:16-36` | AC-07 통과 + [런타임 확인] |
| 45a | `src/todo/storage.ts:19,21,25-27` (null·비배열·파싱 실패 → `[]`), `5-13` (항목 단위 검증) | [런타임 확인: `'{not json'` 저장 후 마운트 → 0개] |
| 45b | `src/todo/storage.ts:17,31` (`try`/`catch`로 감싼 접근) | |
| 45c | `src/todo/useTodos.ts:12` — `filter`는 저장/복원 대상이 아님 | |
| 46 | `src/todo/types.ts:2` (`id`), `useTodos.ts:22,27,32` (id로만 지목) | [런타임 확인] |
| 46a | `src/todo/useTodos.ts:6-8` (`nextIdFor` = 현재 목록 최대 id + 1, 복원된 목록에도 적용) | |
| 47 | 상태 변경은 전부 이벤트 핸들러(`useTodos.ts:19-33`), `nextIdFor`는 순수 함수라 updater 이중 호출에도 같은 결과 | |
| 48 | `npm run build` 통과. `import type` 사용: `TodoItem.tsx:1`, `TodoList.tsx:1`, `FilterBar.tsx:1`, `useTodos.ts:3`, `storage.ts:1`, `TodoInput.tsx:2`. enum·파라미터 프로퍼티 없음 | 실행 확인 |
| 49 | 추가 파일: `src/todo/{types.ts,storage.ts,useTodos.ts,TodoInput.tsx,TodoItem.tsx,TodoList.tsx,FilterBar.tsx,TodoCount.tsx}` — 모두 `src/App.tsx:1-5`에서 도달 | |
| 50 | `src/todo/TodoInput.tsx:39` (`aria-label="할 일 입력"`) | AC-08 통과 |
| 51 | `src/todo/TodoItem.tsx:16` (`aria-label={\`${todo.title} 완료\`}`) | AC-08 통과 |
| 52 | `src/todo/TodoItem.tsx:21` (버튼 텍스트 "삭제") | |
| 53 | `src/todo/FilterBar.tsx:25` (`{label}`), 라벨 정의 `4-6` | |

미구현으로 남은 문장 없음. 기각한 문장은 #45 하나이며 사유는 §2.6에 적었다.
