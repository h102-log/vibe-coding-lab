# SPEC — Todo 앱

구현 전 요구사항 확정 문서. 구현 산출물이 아니라 작업 문서다.

근거 표기:
- `[계약 §…]` — 과제로 주어진 «Todo 앱 — 구현 계약 (얇은 판)»
- `[AC-0n]` — `npm run test:ac` 실행 출력에 나온 인수 테스트 이름 (테스트 파일은 열지 않았다)
- `[추론]` — 계약도 테스트 이름도 답을 주지 않아 내가 정한 것

---

## 1. 명시된 것

### 1.1 스택·구조

- S-01 `npm run build`는 `tsc -b && vite build`로 타입체크와 빌드를 모두 통과한다. [계약 §커맨드, package.json]
- S-02 앱의 진입점은 `src/App.tsx`의 default export 컴포넌트다. [계약 §고정된 것]
- S-03 구현 파일은 `src/App.tsx`와 그 아래 새로 만드는 파일뿐이다. `tests/ac/**`, `package.json`의 `build`·`test:ac`, `tsconfig.app.json`의 `"strict": true`는 수정하지 않는다. [계약 §고정된 것]
- S-04 `src/App.css`·`src/index.css`를 수정하지 않고, 새 스타일 파일도 만들지 않는다. [계약 §범위 밖]
- S-05 React + TypeScript 외의 프레임워크·상태관리 라이브러리를 새로 도입하지 않는다. [계약 §고정된 것]

### 1.2 DOM 계약

- S-06 화면에는 `data-testid="todo-input"`인 새 항목 입력창이 항상 1개 있다. [계약 §DOM 계약]
- S-07 항목 하나는 `data-testid="todo-item"`인 엘리먼트 1개로 렌더되고, 개수는 0개 이상이다. [계약 §DOM 계약]
- S-08 각 항목 안에는 `todo-title`(제목 텍스트), `todo-toggle`(완료 체크박스), `todo-delete`(삭제 버튼)가 각각 1개씩 있다. [계약 §DOM 계약]
- S-09 화면에는 `todo-count`(미완료 개수 표시)가 있다. [계약 §DOM 계약]
- S-10 화면에는 `filter-all`·`filter-active`·`filter-completed` 세 필터 버튼이 있다. [계약 §DOM 계약]

### 1.3 동작 (인수 테스트 이름이 정한 것)

- S-11 입력창에 제목을 입력하고 Enter를 누르면 항목이 정확히 1개 추가되고, 그 항목의 `todo-title` 텍스트는 입력한 제목과 같다. [AC-01]
- S-12 항목이 추가된 직후 `todo-input`의 값은 빈 문자열이다. [AC-01]
- S-13 공백만 있는 입력으로 Enter를 눌러도 항목은 추가되지 않는다. [AC-02]
- S-14 공백만 있는 입력을 거부한 뒤에도 유효한 입력으로는 항목이 추가된다(입력 거부가 이후 추가를 막지 않는다). [AC-02]
- S-15 `todo-toggle`을 클릭하면 그 항목은 완료 상태가 되고, 다시 클릭하면 미완료로 돌아온다. [AC-03]
- S-16 `todo-delete`를 클릭하면 그 항목만 목록에서 사라지고, 남은 항목들은 원래의 상대 순서를 유지한다. [AC-04]
- S-17 `todo-count`가 나타내는 수는 완료되지 않은 항목의 개수이며, 추가·토글·삭제에 따라 갱신된다. [AC-05]
- S-18 `filter-all`을 누르면 모든 항목이, `filter-active`를 누르면 미완료 항목만, `filter-completed`를 누르면 완료 항목만 `todo-item`으로 렌더된다. [AC-06]
- S-19 컴포넌트를 언마운트한 뒤 다시 마운트해도 항목 목록과 각 항목의 완료 여부가 그대로 복원되며, 그 저장 매체는 `localStorage`다. [AC-07]
- S-20 `todo-input`, `todo-toggle`, `todo-delete`는 각각 비어 있지 않은 접근 가능한 이름(accessible name)을 노출한다. [AC-08]

### 1.4 범위 밖 — 만들지 않는다

- S-21 로그인·계정, 서버 API·DB, 배포, 인라인 제목 편집, 드래그 정렬, 전체 완료 토글, 완료 일괄 삭제, 마감일·우선순위·태그·검색, 다크모드, 애니메이션, 다국어(한국어 단일), SEO 메타태그를 구현하지 않는다. [계약 §범위 밖]

---

## 2. 명시되지 않은 것

계약과 테스트 이름이 침묵하는 지점. 각 항목은 근거 대신 `[추론]`을 단다.

### 2.1 추가(add)의 세부 — S-11~S-14가 참이 되려면 추가로 정해져야 하는 것

- U-01 추가를 트리거하는 조작은 `todo-input`에서의 Enter 키다. 별도의 "추가" 버튼은 두지 않는다. [추론 — 계약의 testid 표에 추가 버튼이 없고, AC-01이 Enter만 언급한다]
- U-02 Enter 처리는 `keydown` 이벤트에서 한다. 폼 submit에 의존하지 않으므로, 입력창이 `<form>` 안에 있든 없든 동일하게 동작한다. [추론 — `fireEvent.keyDown`과 `user-event`의 `{enter}` 양쪽 모두에서 동작해야 하므로]
- U-03 저장되는 제목은 입력값의 앞뒤 공백을 제거한 문자열이다. 가운데 공백은 보존한다. [추론 — S-13의 "공백만 있는 입력"을 판정하려면 trim 기준이 필요하다]
- U-04 트림한 결과가 빈 문자열이면 항목을 추가하지 않는다. [추론 — S-13의 판정 기준]
- U-05 Enter를 누르면 항목 추가 여부와 무관하게 `todo-input`의 값은 빈 문자열이 된다(공백만 입력한 경우에도 입력창을 비운다). [추론 — 계약은 거부 시 입력창 처리를 정하지 않는다. 값을 남기면 다음 입력이 앞의 공백과 이어붙어 제목이 오염될 수 있으므로 비우는 쪽을 택한다]
- U-06 새 항목은 목록의 **맨 뒤**에 추가된다. [추론 — AC-04가 "3개 중 2번째"를 지목하므로 추가 순서와 렌더 순서가 일치해야 한다. 맨 앞 추가여도 순서 자체는 정의되지만, 입력 순서 = 표시 순서가 덜 놀랍다]
- U-07 제목이 이미 존재하는 항목과 같아도 별개의 항목으로 추가된다(중복 허용). [추론]
- U-08 입력 길이에 상한을 두지 않는다. [추론]
- U-09 한국어 IME 조합 중에 발생한 Enter(`isComposing === true`)는 추가로 처리하지 않는다. [추론 — 한국어 단일 로케일 앱에서 조합 확정용 Enter가 항목을 추가하면 안 된다]

### 2.2 항목의 정체성과 순서

- U-10 각 항목은 목록 안에서 유일한 숫자 id를 가지며, 토글·삭제는 id로 대상을 지목한다(제목이나 인덱스로 지목하지 않는다). [추론 — U-07의 중복 제목 허용과 필터링된 목록에서의 인덱스 어긋남 때문에 필요하다]
- U-11 id는 "현재 목록의 최대 id + 1"로 만든다. 난수·시각을 쓰지 않으므로 같은 조작열은 항상 같은 id를 만든다. [추론]
- U-12 토글·삭제·필터 전환은 나머지 항목의 상대 순서를 바꾸지 않는다. 완료된 항목도 목록에서 자리를 옮기지 않는다. [추론 — 계약은 완료 항목의 재정렬을 요구하지 않는다]

### 2.3 `todo-count`의 표시 형식

- U-13 `data-testid="todo-count"` 엘리먼트의 텍스트는 미완료 개수 숫자 **그 자체**이며(예: `2`), 다른 문자·다른 숫자를 포함하지 않는다. 설명 문구("남은 항목", "개")는 그 엘리먼트 **바깥**에 둔다. [추론 — 계약이 문구를 정하지 않았으므로 테스트는 문구에 의존할 수 없다. 숫자만 담으면 완전일치·정규식·숫자추출 어느 방식으로 검사해도 통과한다]
- U-14 `todo-count`가 세는 대상은 현재 필터로 걸러진 목록이 아니라 **전체 목록의 미완료 항목**이다. 필터를 바꿔도 이 수는 변하지 않는다. [추론 — S-17의 "완료되지 않은 항목의 개수"를 필터와 독립으로 읽는다]
- U-15 항목이 0개일 때도 `todo-count`는 렌더되며 텍스트는 `0`이다. [추론 — S-09는 조건부 렌더를 허용하지 않는다]

### 2.4 필터

- U-16 초기 필터는 `all`이다. [추론]
- U-17 필터 선택 상태는 저장하지 않는다. 다시 마운트하면 항상 `all`로 시작한다. [추론 — S-19가 복원 대상으로 지정한 것은 항목과 완료 여부뿐이다]
- U-18 세 필터 버튼은 항목이 0개일 때도 항상 렌더된다. [추론 — S-10은 조건부 렌더를 허용하지 않는다]
- U-19 현재 선택된 필터 버튼은 `aria-pressed="true"`로 표시한다. [추론 — 어느 필터가 켜져 있는지 화면에서 판별 가능해야 한다]
- U-20 필터 결과가 0개면 `todo-item`이 0개 렌더된다. 이때 별도의 안내 문구를 두지 않는다. [추론]
- U-21 표시 중인 항목을 삭제하거나 토글해서 그 항목이 현재 필터에서 벗어나도, 필터 선택은 그대로 유지된다. [추론]

### 2.5 영속성 — S-19가 참이 되려면 추가로 정해져야 하는 것

- U-22 저장 키는 `"todos"`다. [추론 — 계약이 키를 정하지 않았다. 인수 테스트가 특정 키를 직접 읽는다면 이 값이 틀릴 수 있고, 그때는 `test:ac` 출력을 근거로 좁힌다]
- U-23 저장 형식은 `{ id: number, title: string, done: boolean }` 객체의 배열을 `JSON.stringify`한 문자열이다. [추론]
- U-24 저장은 항목 목록이 바뀔 때마다 일어난다(추가·토글·삭제 직후 `localStorage`에 반영된다). 언마운트 시점에만 저장하지 않는다. [추론 — 언마운트 없이 새로고침해도 남아야 한다]
- U-25 복원은 첫 렌더의 state 초기화 시점에 일어난다. 즉 첫 렌더부터 저장된 항목이 화면에 있다(effect로 뒤늦게 채우지 않는다). [추론]
- U-26 저장된 값이 없거나, JSON으로 파싱되지 않거나, 배열이 아니면 빈 목록으로 시작한다(예외를 던지지 않는다). [추론]
- U-27 배열 안에 U-23의 형태를 만족하지 않는 원소가 섞여 있으면 그 원소만 버리고 나머지는 복원한다. [추론]
- U-28 `localStorage` 접근 자체가 예외를 던지는 환경(비활성화·용량 초과)에서도 앱은 렌더에 실패하지 않는다. 읽기 실패는 빈 목록으로, 쓰기 실패는 무시로 처리한다. [추론]

### 2.6 접근 가능한 이름 — S-20이 참이 되려면 추가로 정해져야 하는 것

- U-29 세 요소 모두 `aria-label` 속성으로 이름을 제공한다. [추론 — `aria-label`은 accessible name 계산에서 최우선이라, 계산 방식(dom-accessibility-api / 속성 직접 읽기 / role 질의) 어느 쪽이든 비어 있지 않은 이름이 나온다]
- U-30 `todo-input`의 이름은 `"할 일 입력"`으로 고정한다. [추론]
- U-31 `todo-toggle`·`todo-delete`의 이름은 항목 제목을 포함한다(예: `"우유 사기 완료"`, `"우유 사기 삭제"`). 항목이 여러 개일 때 이름만으로 구분된다. [추론]
- U-32 `todo-toggle`은 `<input type="checkbox">`이고 `checked` 속성이 완료 여부와 일치한다. [추론 — 계약이 "완료 체크박스"라고 부르므로 role은 checkbox여야 하고, 상태 검사는 `.checked`로 이뤄질 수 있다]
- U-33 `todo-delete`는 `<button type="button">`이다. [추론 — 폼 안에 있게 되더라도 submit으로 오작동하지 않도록]

### 2.7 흐름을 따라가며 나온 나머지 갈림길

- U-34 앱은 페이지 제목 역할의 정적 텍스트(`<h1>할 일</h1>`)를 렌더한다. 이는 어떤 testid도 갖지 않는다. [추론]
- U-35 `todo-title` 엘리먼트의 텍스트는 제목 문자열뿐이다. 완료 표시·순번·아이콘 등 다른 텍스트를 그 안에 넣지 않는다. [추론 — S-11이 제목과의 정확한 일치를 요구한다]
- U-36 완료 상태를 나타내는 시각적 표현(취소선 등)을 추가하지 않는다. 상태는 체크박스의 `checked`로만 드러난다. [추론 — 계약 §범위 밖이 CSS 작업을 금지한다]
- U-37 `todo-input`에는 `placeholder`를 둔다(이름 계산이 `aria-label`을 못 쓰는 경우의 예비 이름이기도 하다). [추론]

### 남은 미결

- ~~[MISSING: 인수 테스트가 `localStorage`의 특정 키를 직접 읽는지 여부]~~ — U-22(`"todos"`)로 구현한 상태에서 AC-07이 통과했으므로 이 갈림길은 해소됐다. 다만 "테스트가 키를 직접 읽지 않는다"가 증명된 것은 아니다.

---

## 3. 완료 전 대조

각 문장을 참으로 만드는 코드의 위치를 지목한다. 지목하지 못하면 그 문장은 구현되지 않은 것이다.
아래 줄 번호는 구현 완료 후 파일을 다시 읽어 대조한 실제 위치다.

| # | 위치 | 판정 |
|---|---|---|
| S-01 | — | `npm run build` 통과 (tsc -b + vite build) ✓ |
| S-02 | `src/App.tsx:12` `export default function App()` | ✓ |
| S-03 | `git status`: `M src/App.tsx`, `?? src/todos.ts`, `?? SPEC.md`뿐. `tests/`·`package.json`·`tsconfig.app.json` 미변경 | ✓ |
| S-04 | `src/App.css`·`src/index.css` 미변경(위 `git status`), 새 스타일 파일 없음, `src/App.tsx`에 CSS import 없음 | ✓ |
| S-05 | `src/App.tsx:1-10` — 외부 import는 `react`뿐, 나머지는 로컬 `./todos.ts`. `package.json` 의존성 미변경 | ✓ |
| S-06 | `src/App.tsx:48` `data-testid="todo-input"` (`47-54` input, 항상 렌더) | ✓ |
| S-07 | `src/App.tsx:57` `data-testid="todo-item"` — `56` `shown.map`의 `<li>` | ✓ |
| S-08 | toggle `src/App.tsx:60` / title `65` / delete `68` — 모두 `57`의 `<li>` 안, 항목당 1개 | ✓ |
| S-09 | `src/App.tsx:78` `data-testid="todo-count"` | ✓ |
| S-10 | `src/App.tsx:83` `filter-all`, `91` `filter-active`, `99` `filter-completed` | ✓ |
| S-11 | `src/App.tsx:24-32` `submit` → `31`에서 1개 append; 제목은 `65`에서 그대로 렌더 | ✓ |
| S-12 | `src/App.tsx:29` `setDraft('')` + `51` `value={draft}` (제어 컴포넌트) | ✓ |
| S-13 | `src/App.tsx:28` `draft.trim()` → `30` `if (title === '') return` (`31`에 도달하지 않음) | ✓ |
| S-14 | `src/App.tsx:30`의 조기 반환은 `todos`를 건드리지 않으므로 다음 Enter가 `31`로 정상 진행 | ✓ |
| S-15 | `src/App.tsx:34-38` `toggle`의 `done: !todo.done` + `62` `checked={todo.done}` + `63` `onChange` | ✓ |
| S-16 | `src/App.tsx:40-42` `prev.filter(todo => todo.id !== id)` — 해당 id만 빠지고 배열 순서 보존 | ✓ |
| S-17 | `src/todos.ts:51-53` `remainingCount` + `src/App.tsx:22`, `78` | ✓ |
| S-18 | `src/todos.ts:45-49` `visibleTodos` + `src/App.tsx:21`, `56` | ✓ |
| S-19 | `src/todos.ts:21-31` `loadTodos` / `33-39` `saveTodos` / `src/App.tsx:13`(복원), `17-19`(저장) | ✓ |
| S-20 | `src/App.tsx:49`(input), `61`(toggle), `69`(delete) `aria-label` — 셋 다 비어 있지 않음 | ✓ |
| S-21 | `src/App.tsx` 전체 108줄에 해당 기능 코드 없음 (편집·정렬·일괄토글·검색·테마·i18n 전무) | ✓ |
| U-01 | `src/App.tsx:53` `onKeyDown={submit}`; 파일 전체에 추가 버튼 없음(버튼은 `66` 삭제, `81/89/97` 필터뿐) | ✓ |
| U-02 | `src/App.tsx:24` `KeyboardEvent<HTMLInputElement>` 핸들러; `<form>` 엘리먼트 없음 | ✓ |
| U-03 | `src/App.tsx:28` `draft.trim()` | ✓ |
| U-04 | `src/App.tsx:30` `if (title === '') return` | ✓ |
| U-05 | `src/App.tsx:29`(`setDraft('')`)가 `30`(빈 제목 반환)보다 앞줄 — 거부 시에도 입력창이 비워진다 | ✓ |
| U-06 | `src/App.tsx:31` `[...prev, {...}]` — 맨 뒤 append | ✓ |
| U-07 | `src/App.tsx:31`에 중복 검사 없음 | ✓ |
| U-08 | `src/App.tsx:47-54`에 `maxLength` 없음 | ✓ |
| U-09 | `src/App.tsx:26` `if (event.nativeEvent.isComposing) return` | ✓ |
| U-10 | `src/todos.ts:1-5` `Todo.id`; `src/App.tsx:36`, `41` id 비교 (제목·인덱스 미사용) | ✓ |
| U-11 | `src/todos.ts:41-43` `nextId` = max + 1, 난수·시각 미사용 | ✓ |
| U-12 | `src/App.tsx:34-42` — `map`/`filter`만 사용, `sort` 호출 없음 | ✓ |
| U-13 | `src/App.tsx:78` — `<span data-testid="todo-count">{remaining}</span>` 안에 숫자뿐, "남은 항목"·"개"는 span 바깥 | ✓ |
| U-14 | `src/App.tsx:22` `remainingCount(todos)` — `shown`이 아니라 `todos` | ✓ |
| U-15 | `src/App.tsx:77-79` 조건부 렌더 아님; `remaining`은 0이면 `0` 렌더 | ✓ |
| U-16 | `src/App.tsx:15` `useState<Filter>('all')` | ✓ |
| U-17 | `src/App.tsx:18` `saveTodos(todos)` — 인자가 `todos`뿐. `filter`를 저장/복원하는 코드 없음 | ✓ |
| U-18 | `src/App.tsx:80-105` `<nav>` 조건부 렌더 아님 | ✓ |
| U-19 | `src/App.tsx:84`, `92`, `100` `aria-pressed={filter === ...}` | ✓ |
| U-20 | `src/App.tsx:56-75` — `shown`이 빈 배열이면 `<li>` 0개, 빈 상태 문구 없음 | ✓ |
| U-21 | `src/App.tsx:34-42` `toggle`/`remove`가 `setFilter`를 호출하지 않음 | ✓ |
| U-22 | `src/todos.ts:9` `const STORAGE_KEY = 'todos'` | ✓ AC-07 통과 |
| U-23 | `src/todos.ts:1-5` 타입 + `35` `JSON.stringify(todos)` | ✓ |
| U-24 | `src/App.tsx:17-19` `useEffect(..., [todos])` — `todos` 변경 시마다 저장 | ✓ |
| U-25 | `src/App.tsx:13` `useState<Todo[]>(loadTodos)` — lazy initializer, 첫 렌더에 반영 | ✓ |
| U-26 | `src/todos.ts:24`(값 없음), `26`(비배열), `28-30`(파싱 예외) → 모두 `[]` | ✓ |
| U-27 | `src/todos.ts:27` `parsed.filter(isTodo)` + `11-19` `isTodo` | ✓ |
| U-28 | `src/todos.ts:22-30` 읽기 try/catch → `[]`, `34-38` 쓰기 try/catch → 무시 | ✓ |
| U-29 | `src/App.tsx:49`, `61`, `69` `aria-label` | ✓ |
| U-30 | `src/App.tsx:49` `aria-label="할 일 입력"` | ✓ |
| U-31 | `src/App.tsx:61` `` `${todo.title} 완료` ``, `69` `` `${todo.title} 삭제` `` | ✓ |
| U-32 | `src/App.tsx:58-62` `type="checkbox"` + `checked={todo.done}` | ✓ |
| U-33 | `src/App.tsx:67` `type="button"` | ✓ |
| U-34 | `src/App.tsx:46` `<h1>할 일</h1>` — testid 없음 | ✓ |
| U-35 | `src/App.tsx:65` `<span data-testid="todo-title">{todo.title}</span>` — 자식이 제목뿐 | ✓ |
| U-36 | `src/App.tsx` 전체에 `className`·`style` 속성 없음 | ✓ |
| U-37 | `src/App.tsx:50` `placeholder="할 일을 입력하고 Enter"` | ✓ |

기각한 문장: 없음. 구현되지 않은 채 남은 문장: 없음.

검증 실행 결과 — `npm run test:ac`: 8 passed (8) / `npm run build`: 성공.
