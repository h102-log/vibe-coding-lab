# SPEC — Todo 앱 요구사항 확정

작업 문서다. 구현 산출물이 아니다.
근거 위치가 `[계약 §…]`인 문장은 계약서에서 읽어낸 것, `[추론]`인 문장은 계약이 침묵해서 내가 정한 것이다.

---

## 1. 명시된 것

- **S1** 앱의 진입 컴포넌트는 `src/App.tsx`의 default export이고, 렌더하면 아래 요소들을 가진 화면을 그린다. [계약 §고정된 것 — 구현 진입점]
- **S2** 화면에 `data-testid="todo-input"` 요소가 있다. [계약 §DOM 계약 표 1행]
- **S3** 항목은 0개 이상이고, 항목 하나는 `data-testid="todo-item"` 요소 하나로 렌더된다. [계약 §DOM 계약 표 2행]
- **S4** 각 `todo-item` 안에 제목 텍스트 `todo-title`, 완료 체크박스 `todo-toggle`, 삭제 버튼 `todo-delete`가 하나씩 있다. [계약 §DOM 계약 표 3·4·5행]
- **S5** `data-testid="todo-count"` 요소가 미완료 개수를 표시한다. [계약 §DOM 계약 표 6행]
- **S6** `filter-all`·`filter-active`·`filter-completed` 세 필터 버튼이 화면에 있다. [계약 §DOM 계약 표 7·8·9행]
- **S7** 스택은 Vite + React + TypeScript 하나뿐이다. 다른 프레임워크를 런타임 의존성으로 추가하지 않는다. [계약 §고정된 것 — 스택]
- **S8** `tests/ac/**`는 읽기·수정·삭제·이동되지 않는다. 실행만 한다. [계약 §고정된 것]
- **S9** `package.json`의 `build`·`test:ac` 스크립트와 `tsconfig.app.json`의 `"strict": true`는 그대로다. [계약 §고정된 것]
- **S10** `src/App.css`·`src/index.css`를 수정하지 않고, 새 스타일 파일도 만들지 않는다. [계약 §범위 밖 — CSS·스타일 작업]
- **S11** 다음은 구현하지 않는다: 로그인·계정, 서버 API·DB, 배포, 인라인 제목 편집(더블클릭 수정), 드래그 정렬, 전체 완료 토글, 완료 일괄 삭제, 마감일·우선순위·태그·검색, 다크모드·테마 전환, 애니메이션, 다국어, SEO 메타태그. [계약 §범위 밖]
- **S12** `npm run test:ac`가 종료코드 0으로 끝난다. [계약 §완료 조건]
- **S13** `npm run build`가 종료코드 0으로 끝난다(타입체크 포함). [계약 §완료 조건]

---

## 2. 명시되지 않은 것

계약은 DOM에 무엇이 **있어야 하는지**만 적었고, 그것들이 **어떻게 움직이는지**는 거의 적지 않았다.
아래는 흐름(입력 → 추가 → 토글 → 필터 → 삭제)을 처음부터 끝까지 따라가며 계약이 답을 주지 않는 갈림길을 적은 것이다.

### 추가

- **U1** `todo-input`에 공백 아닌 문자를 넣고 Enter를 누르면 `todo-item`이 정확히 1개 늘어난다. [추론]
  — 계약의 testid 표에 '추가 버튼'이 없다. 테스트는 표의 testid로만 화면을 찾으므로 추가 트리거는 입력창의 Enter뿐이다.
- **U2** 추가되는 제목은 입력 문자열의 앞뒤 공백을 제거한 값이다. [추론]
- **U3** 입력이 비었거나 공백뿐일 때 Enter를 눌러도 항목은 늘지 않는다. [추론]
- **U4** Enter를 누른 뒤 `todo-input`의 값은 빈 문자열이다. 추가 성공 여부와 무관하다. [추론]
  — 연속 입력이 이어붙지 않으려면 필요하다.
- **U5** 새 항목은 목록 맨 뒤에 붙는다. n번 추가하면 `todo-item` 순서는 입력 순서와 같다. [추론]
- **U6** 새 항목은 미완료로 시작한다. [추론]
- **U7** 같은 제목을 두 번 추가하면 서로 다른 항목 2개가 된다. [추론]
- **U8** 문자를 입력하는 동안에는(Enter 없이) 항목이 늘지 않는다. [추론]
- **U9** 입력창이 form 안에 있어 submit이 일어나는 경우에도 한 번의 Enter로 항목은 1개만 추가된다. [추론]
  — Enter를 keydown과 submit 양쪽에서 처리하면 중복 추가가 생길 수 있는 지점이다.

### 토글

- **U10** `todo-toggle`은 `<input type="checkbox">`이고 `checked`가 그 항목의 완료 여부와 같다. [추론]
- **U11** `todo-toggle`을 클릭하면 그 항목의 완료 여부만 반전되고 다른 항목은 그대로다. [추론]
- **U12** 완료 여부가 바뀌어도 `todo-title`의 텍스트는 제목과 정확히 같다. 장식 문자를 덧붙이지 않는다. [추론]
- **U13** 완료 여부가 바뀌어도 항목의 목록 내 위치는 바뀌지 않는다. [추론]

### 삭제

- **U14** `todo-delete`를 누르면 그 항목만 사라지고 나머지의 상대 순서는 유지된다. [추론]
- **U15** 삭제에 확인 절차가 없다. 클릭 즉시 사라진다. [추론]

### 개수

- **U16** `todo-count`의 텍스트는 미완료 개수의 십진 표기와 **정확히** 같다. 다른 문자를 포함하지 않는다. [추론]
  — 계약이 문구 형식을 정하지 않았다. 어떤 비교 방식(정확 일치·부분 일치·정규식)으로 검사해도 참인 최소 표기를 택한다. 사람이 읽을 단위 문구("개 남음")는 `todo-count` **밖의** 별도 요소에 둔다.
- **U17** `todo-count`가 세는 대상은 현재 필터와 무관하게 전체 항목 중 미완료인 것이다. [추론]
- **U18** 항목이 없으면 `todo-count`는 `0`이다. [추론]
- **U19** 추가·토글·삭제 직후 `todo-count`는 즉시 갱신된다. [추론]

### 필터

- **U20** 초기 필터는 '전체'다. 최초 렌더에서 모든 항목이 보인다. [추론]
- **U21** `filter-active`를 누르면 미완료 항목만 `todo-item`으로 렌더된다. [추론]
- **U22** `filter-completed`를 누르면 완료 항목만 렌더된다. [추론]
- **U23** `filter-all`을 누르면 모든 항목이 원래 순서로 렌더된다. [추론]
- **U24** 필터는 렌더 대상만 바꾸고 항목 데이터를 지우지 않는다. [추론]
- **U25** 필터가 걸린 상태에서 토글해 조건을 벗어난 항목은 즉시 목록에서 사라진다. [추론]
- **U26** 필터가 걸린 상태에서도 Enter 추가는 성공하고, 전체 필터로 돌아오면 그 항목이 보인다. [추론]
- **U27** 세 필터 버튼은 어느 시점에도 `disabled`가 아니고 같은 버튼을 반복해 눌러도 된다. [추론]
- **U28** 필터가 걸린 상태의 `todo-delete`는 그 항목을 목록 전체에서 제거한다. [추론]

### 나머지

- **U29** 항목은 브라우저 저장소에 보관된다. 앱을 언마운트했다가 다시 마운트하면 제목·순서·완료 여부가 그대로 복원된다. [AC-07 실행 출력]
  — 처음에 "저장하지 않는다"로 정했다가 뒤집은 문장이다. 계약은 '서버 API·DB'만 범위 밖으로 적었고 localStorage에는 침묵한다. 요구가 없다고 보고 저장을 빼는 쪽으로 정했는데, `npm run test:ac`의 AC-07이 `cleanup()` 후 재렌더에서 `["A","B"]`와 토글 상태를 기대하며 실패했다. 계약이 침묵한 지점을 인수 테스트가 메우는 경우이므로, 실행 출력을 근거로 문장을 반대로 확정한다.
- **U39** 저장 키와 직렬화 형식은 자유다. 저장된 값이 없거나 JSON이 깨졌거나 항목 모양이 아니면 빈 목록으로 시작하고 예외를 던지지 않는다. [추론]
- **U40** 필터 선택은 저장하지 않는다. 다시 마운트하면 '전체'다. [추론]
  — 저장하면 이전 실행에서 고른 필터 때문에 처음 화면에서 항목이 안 보일 수 있다. 계약이 요구하지 않았다.
- **U41** 복원된 항목의 id와 복원 후 새로 추가한 항목의 id는 겹치지 않는다. [추론]
  — 저장을 넣으면서 생긴 갈림길이다. id 카운터가 0에서 다시 시작하면 새 항목이 복원된 항목과 같은 id를 받는다.
- **U42** 저장이 실패해도(용량 초과·저장소 차단) 추가·토글·삭제 화면 동작은 계속된다. [추론]
- **U30** 제목에 HTML처럼 보이는 문자열이 들어와도 텍스트 그대로 표시된다. [추론]
- **U31** 제목 길이에 상한을 두지 않는다. [추론]
- **U32** `todo-title`·`todo-toggle`·`todo-delete`는 각각 자기 항목의 `todo-item` 요소 **안**에 있다. [추론]
  — 테스트가 `within(item)`으로 찾을 수 있어야 한다.
- **U33** 화면 전체에서 모아 얻은 `todo-title`·`todo-toggle`·`todo-delete`의 순서는 `todo-item`의 순서와 같다. [추론]
- **U34** 제목이 같은 항목도 서로 독립적으로 토글·삭제된다. [추론]
  — 리스트 key를 제목이나 인덱스로 잡으면 깨지는 지점이다.
- **U35** `todo-delete`와 필터 버튼은 `type="button"`이라 폼 제출을 유발하지 않는다. [추론]
- **U36** UI 문구는 한국어 하나뿐이다. 로케일 전환 수단이 없다. [추론]
- **U37** 한글 IME 조합 중에 눌린 Enter(`isComposing`)로는 항목이 추가되지 않는다. [추론]
- **U38** 렌더는 순수하다. `StrictMode`의 이중 렌더에서도 항목이 중복 추가되지 않는다. [추론]

### 근거로 정하지 못한 것

- **[MISSING: 선택된 필터의 시각적 표기]** 계약이 CSS 파일 수정과 새 스타일 파일을 금지했고 화면 모양을 평가에서 뺐다. '지금 어떤 필터인지'를 사람 눈에 어떻게 보일지는 근거로 정할 수 없다. 기계가 읽는 `aria-pressed`만 단다.
- **[MISSING: 항목이 0개일 때의 안내 문구]** 문안을 정할 근거가 없다. 넣지 않는다.

---

## 3. 완료 전 대조

§1·§2의 문장을 하나씩 읽으며 그 문장을 참으로 만드는 코드를 지목한다.

### §1

| 문장 | 코드 |
|---|---|
| S1 진입 컴포넌트 | `src/App.tsx:9` (`export default function App`) |
| S2 `todo-input` | `src/todos/TodoInput.tsx:35`, 화면에 한 번만 붙는다 — `src/App.tsx:20` |
| S3 `todo-item` 0..n | `src/App.tsx:23-26` (`visible.map`) → `src/todos/TodoItem.tsx:12` |
| S4 항목 안의 세 요소 | `src/todos/TodoItem.tsx:14`(toggle)·`21`(title)·`22`(delete) |
| S5 `todo-count` | `src/App.tsx:31`, 세는 함수는 `src/todos/model.ts:57` |
| S6 필터 버튼 3개 | `src/todos/FilterBar.tsx:9-11`(testid 목록)·`18-28`(렌더) |
| S7 스택 그대로 | 새 런타임 의존성을 넣지 않았다. `package.json:13-16`의 `dependencies`는 `react`·`react-dom`뿐 |
| S8 `tests/ac/**` 미수정 | 이 세션에서 연 적 없다. 실행만 했다. 두 파일은 그대로 있다 |
| S9 스크립트·strict | `package.json:8-9`, `tsconfig.app.json:20`. `test:spec`만 새로 넣었고(`package.json:10`) 기존 줄은 건드리지 않았다 |
| S10 CSS 미수정 | `src/App.css`·`src/index.css`를 열지도 쓰지도 않았다. 새 스타일 파일 없음 — `src` 아래 스타일 파일은 그 둘뿐 |
| S11 범위 밖 미구현 | 편집·정렬·일괄처리·테마·검색·서버 호출 코드가 어느 파일에도 없다. 화면 요소는 입력창 1·항목별 3·필터 3이 전부(`TodoInput.tsx`·`TodoItem.tsx`·`FilterBar.tsx`) |
| S12 `npm run test:ac` | 실행 결과 8/8 통과 |
| S13 `npm run build` | 실행 결과 `tsc -b && vite build` 성공 |

### §2

| 문장 | 코드 |
|---|---|
| U1 Enter로 1개 추가 | `src/todos/TodoInput.tsx:17-24` → `useTodos.ts:16-18` → `model.ts:28-32` |
| U2 앞뒤 공백 제거 | `src/todos/model.ts:29` |
| U3 빈 값·공백은 무시 | `src/todos/model.ts:30` |
| U4 Enter 뒤 입력창 비움 | `src/todos/TodoInput.tsx:14` (성공 여부와 무관하게 `submit()` 안에서 지운다) |
| U5 맨 뒤에 붙음 | `src/todos/model.ts:31` (`[...todos, new]`) |
| U6 미완료로 시작 | `src/todos/model.ts:31` (`done: false`) |
| U7 같은 제목 2개 | `src/todos/model.ts:31` — 제목으로 거르지 않는다. id는 `model.ts:17-25`에서 따로 발급 |
| U8 Enter 없이는 안 늘어남 | `src/todos/TodoInput.tsx:18` (`key !== 'Enter'`면 반환), 입력은 `40`에서 값만 바꾼다 |
| U9 중복 추가 없음 | `src/todos/TodoInput.tsx:22` (`preventDefault`가 암묵적 제출을 막는다) + `27-30` (제출 경로 단일화) |
| U10 체크박스와 checked | `src/todos/TodoItem.tsx:15-16` |
| U11 그 항목만 반전 | `src/todos/model.ts:36` |
| U12 제목 텍스트 불변 | `src/todos/TodoItem.tsx:21` — 완료 여부를 텍스트에 섞지 않는다 |
| U13 위치 불변 | `src/todos/model.ts:36` (`map`이라 순서가 그대로다) |
| U14 그 항목만 삭제 | `src/todos/model.ts:41` |
| U15 확인 절차 없음 | `src/todos/TodoItem.tsx:22` — `onClick`이 곧장 삭제를 부른다 |
| U16 숫자만 | `src/App.tsx:31`, 단위 문구는 바깥 요소 `src/App.tsx:32` |
| U17 필터 무관 전체 기준 | `src/App.tsx:31` — `visible`이 아니라 `todos`를 센다. 함수는 `model.ts:57-59` |
| U18 0개면 `0` | `src/todos/model.ts:58` (빈 배열의 길이) |
| U19 즉시 갱신 | `src/App.tsx:31` — 렌더 때마다 상태에서 다시 계산한다 |
| U20 초기 필터 전체 | `src/App.tsx:12` |
| U21 미완료만 | `src/todos/model.ts:47-48` |
| U22 완료만 | `src/todos/model.ts:49-50` |
| U23 전체·원래 순서 | `src/todos/model.ts:51-52` |
| U24 데이터 보존 | `src/App.tsx:14` — 원본 `todos`는 두고 표시용 목록만 만든다 |
| U25 조건 벗어나면 사라짐 | `src/App.tsx:14` + `23` — 상태가 바뀌면 다시 걸러 렌더한다 |
| U26 필터 중에도 추가 성공 | `src/App.tsx:20` — 추가는 필터와 무관하게 전체 목록에 붙는다 |
| U27 disabled 아님 | `src/todos/FilterBar.tsx:18-28` — `disabled` 속성을 주지 않는다 |
| U28 필터 중 삭제는 전체에서 제거 | `src/todos/model.ts:41` — id로 지운다. 표시 여부와 무관 |
| U29 저장·복원 | `src/todos/useTodos.ts:8`(복원)·`11-13`(저장), `src/todos/storage.ts:17-30`·`33-39` |
| U30 텍스트 그대로 | `src/todos/TodoItem.tsx:21` — JSX 자식이라 React가 이스케이프한다 |
| U31 길이 상한 없음 | `src/todos/TodoInput.tsx:34-42` — `maxLength`가 없다. `model.ts:28-32`도 길이를 보지 않는다 |
| U32 항목 안에 있음 | `src/todos/TodoItem.tsx:12-25` — 세 요소가 모두 `<li data-testid="todo-item">`의 자식이다 |
| U33 순서 일치 | `src/App.tsx:23-26` — 한 번의 `map`이 항목과 그 안의 요소를 함께 만든다 |
| U34 같은 제목도 독립 | `src/App.tsx:25`(key=id) + `src/todos/model.ts:17-25`(id 발급) |
| U35 `type="button"` | `src/todos/TodoItem.tsx:22`, `src/todos/FilterBar.tsx:21` |
| U36 한국어 하나 | 문구는 `App.tsx:18,32`·`TodoItem.tsx:23`·`FilterBar.tsx:9-11`·`TodoInput.tsx:38-39`에 한국어로 직접 적혀 있고 로케일 전환 코드가 없다 |
| U37 IME Enter 무시 | `src/todos/TodoInput.tsx:20` |
| U38 StrictMode 중복 없음 | `src/todos/useTodos.ts:16-26` — updater가 순수하다. id도 `model.ts:17`에서 목록으로부터 계산하므로 두 번 불러도 같다 |
| U39 깨진 저장값 | `src/todos/storage.ts:20`(없음)·`22`(배열 아님)·`24`(항목 모양 아님)·`26-29`(파싱 실패) |
| U40 필터는 저장 안 함 | `src/App.tsx:12` — 필터는 `useState`에만 있고 `storage.ts`는 `todos`만 다룬다 |
| U41 id 충돌 없음 | `src/todos/model.ts:17-25` — 복원된 항목을 포함한 현재 목록의 최댓값 다음을 쓴다 |
| U42 저장 실패해도 동작 | `src/todos/storage.ts:34-38` |
| MISSING 필터 표기 | `src/todos/FilterBar.tsx:23` — `aria-pressed`만 단다 |
| MISSING 빈 목록 문구 | 넣지 않았다. `src/App.tsx:22-27`에 목록 외 문구가 없다 |

기각한 문장은 없다. 처음에 정했다가 뒤집은 문장이 하나 있다(U29) — 근거와 경위는 그 항목에 적었다.

---

## 4. 검증

`tests/spec/spec.test.tsx` — 위 문장들을 옮긴 테스트(58개). `npm run test:spec`으로 실행한다.
테스트 이름 앞에 문장 번호를 달아 어느 문장을 지키는지 표시했다.

옮기지 못한 문장은 **S8·S10의 '수정하지 않았음' 부분**, **S12·S13**, **S11 중 배포·SEO 메타태그**뿐이고,
각각의 이유는 그 파일 머리말에 적었다. 나머지 문장은 전부 테스트가 있다.

테스트가 실제로 무언가를 잡는지 확인하려고 구현을 두 군데 일부러 망가뜨려 봤다.
`TodoInput.tsx`의 IME 검사를 빼면 U37이, `preventDefault()`를 빼면 U9가 실패한다 — 확인 후 되돌렸다.
(U9는 처음에 통과만 확인했을 때 통과했는데, 망가뜨려도 여전히 통과해서 테스트를 다시 썼다.
지금은 암묵적 제출을 막는 동작 자체를 본다.)

실행 결과 — `npm run test:ac` 8/8, `npm run test:spec` 58/58, `npm run build` 성공.
