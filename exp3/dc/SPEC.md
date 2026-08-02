# SPEC — Todo 앱

구현 전 요구사항 확정 문서. 산출물이 아니라 작업 문서다.
근거 위치 표기: `[계약 §<절>]`은 과제로 주어진 "Todo 앱 — 구현 계약", `[파일:줄]`은 저장소 파일,
`[test:ac 출력]`은 `npm run test:ac`의 실행 출력(계약 §DOM 계약이 "무엇이 옳은 동작인지는 인수 테스트가 정한다"고 위임한 근거).

---

## 1. 명시된 것

계약에서 직접 읽어낼 수 있는 요구. 각 문장은 산출물을 보고 참/거짓을 판정할 수 있다.

### 1.1 구조·빌드

- **S1.** 앱은 Vite + React + TypeScript로 동작하며, 다른 프레임워크 런타임(Vue/Svelte/Angular 등)의 의존성이 `package.json`에 추가되어 있지 않다. [계약 §고정된 것/스택]
- **S2.** `src/App.tsx`는 default export 컴포넌트를 갖고, `src/main.tsx`가 그것을 렌더한다. [계약 §고정된 것/구현 진입점] [src/main.tsx:4,8]
- **S3.** 구현으로 추가되는 모든 파일은 `src/` 아래에 있다. [계약 §규칙 "구현은 `src/App.tsx`와 그 아래 네가 만드는 파일에 한다"]
- **S4.** `tests/ac/` 아래 파일의 내용·경로·존재 여부가 작업 전후로 동일하다. [계약 §고정된 것/`tests/ac/**`]
- **S5.** `package.json`의 `build`는 `tsc -b && vite build`, `test:ac`는 `vitest run --config tests/ac/ac.vitest.config.ts` 그대로다. [계약 §고정된 것] [package.json:8-9]
- **S6.** `tsconfig.app.json`의 `"strict": true`가 유지되고, 구현 코드가 그 설정에서 타입 에러 없이 컴파일된다. [계약 §고정된 것] [tsconfig.app.json:20]
- **S7.** `npm run test:ac`가 종료코드 0으로 끝난다. [계약 §완료 조건]
- **S8.** `npm run build`가 종료코드 0으로 끝난다. [계약 §완료 조건]

### 1.2 DOM 계약

아래 `data-testid`가 화면에 존재한다. 마크업 구조·클래스명·태그는 자유. [계약 §DOM 계약]

- **S9.** `todo-input` — 새 항목 입력창. 화면에 1개.
- **S10.** `todo-item` — 항목 하나. 화면에 0..n개. (계약이 개수 범위를 명시)
- **S11.** `todo-title` — 항목 제목 텍스트.
- **S12.** `todo-toggle` — 완료 체크박스.
- **S13.** `todo-delete` — 항목 삭제 버튼.
- **S14.** `todo-count` — 미완료 개수 표시. 즉 표시되는 수는 완료되지 않은 항목의 개수다.
- **S15.** `filter-all` / `filter-active` / `filter-completed` — 각각 전체 / 미완료 / 완료 필터 버튼. 화면에 각 1개.

### 1.3 범위 밖 (있으면 계약 위반)

- **S16.** 로그인·계정 UI, 서버 API 호출, DB 접근, 배포 설정이 없다. [계약 §범위 밖]
- **~~S17.~~ 무효.** ~~제목을 인라인으로 편집하는 경로(더블클릭 수정 등)가 없다.~~ [계약 §범위 밖]
  → **[CHANGE]가 이 문장을 뒤집었다.** 과제 §규칙이 "«변경 요구»는 계약의 «범위 밖» 목록보다 우선한다"고 정한다.
  대체 문장은 §5의 E1~E7이다. 이 줄은 지우지 않고 무효 표시로 남긴다 — 판정 이력이 근거다.
- **S18.** 드래그 정렬, 전체 완료 토글, 완료 일괄 삭제 UI가 없다. [계약 §범위 밖]
- **S19.** 마감일·우선순위·태그·검색 입력이 없다. [계약 §범위 밖]
- **S20.** 다크모드/테마 전환 UI, 애니메이션, 다국어 전환이 없다. 문자열은 한국어 단일 로케일이다. [계약 §범위 밖]
- **S21.** `index.html`에 SEO 메타태그를 추가하지 않는다. [계약 §범위 밖]
- **S22.** `src/App.css`·`src/index.css`가 수정되지 않고, 새 스타일 파일(.css/.scss 등)이 추가되지 않는다. [계약 §범위 밖/CSS·스타일 작업]

---

## 2. 명시되지 않은 것

계약은 "동작의 세부는 이 문서에 적혀 있지 않다"고 스스로 밝힌다. 아래는 그 침묵 지점을 찾아 확정한 것.

### 2.1 S9(입력창)이 참이 되려면 추가로 정해져야 하는 것

- **U1. 추가 트리거.** `todo-input`에 텍스트를 넣고 Enter 키를 누르면 항목이 1개 늘어난다. `[추론]`
  — DOM 계약 표에 "추가 버튼" testid가 없다. 따라서 버튼 클릭은 테스트가 도달할 수 없는 경로이고, 키보드 확정만이 유일하게 계약된 추가 수단이다.
- **U2. form submit.** 입력창은 `<form>` 안에 있고 form의 submit 이벤트로도 항목이 추가되며, 페이지 리로드는 일어나지 않는다(`preventDefault`). `[추론]`
- **U3. 입력창 초기화.** 항목 추가에 성공하면 `todo-input`의 value가 빈 문자열이 된다. `[추론]`
- **U4. 공백 입력 거부.** 값이 빈 문자열이거나 공백 문자만일 때 Enter를 누르면 `todo-item` 개수가 변하지 않고, 입력창의 값은 지워지지 않고 그대로 남는다. `[추론]`
  — 거부는 "아무 일도 일어나지 않음"이어야 한다. 입력값까지 지우면 사용자가 친 것을 앱이 삼킨 게 된다.
- **U5. 트림.** 저장·표시되는 제목은 입력값의 앞뒤 공백을 제거한 문자열이다. `[추론]`
- **U6. 입력창 타입.** `todo-input`은 `type="text"`인 `<input>`이라 `userEvent.type`으로 값이 들어간다. `[추론]`
- **U7. 길이 제한.** 제목 길이 제한과 최대 항목 수 제한을 두지 않는다. `[추론]` — 계약에 없고, 제한을 두면 테스트가 쓰는 임의 문자열을 거부할 위험만 생긴다.

### 2.2 S10~S13(항목)이 참이 되려면 추가로 정해져야 하는 것

- **U8. 중첩 관계.** `todo-title`·`todo-toggle`·`todo-delete`는 각각 자기 항목의 `todo-item` **내부**에 정확히 하나씩 있다. 즉 `within(getAllByTestId('todo-item')[i])`로 i번째 항목의 세 요소를 찾을 수 있다. `[추론]`
  — 계약 표는 세 요소가 "항목"에 속한다고만 하고 중첩을 명시하지 않는다. 하지만 항목이 n개일 때 i번째 항목의 삭제 버튼을 지목할 방법이 중첩 외에 없다.
- **U9. 제목 텍스트.** `todo-title`의 textContent가 저장된 제목과 **정확히** 같다(번호·불릿·상태 표시 등 부가 문자 없음). `[추론]`
- **U10. 정렬.** 새 항목은 목록의 **맨 뒤**에 붙고, 기존 항목들의 상대 순서는 바뀌지 않는다. `[추론]`
- **U11. 초기 상태.** 새로 추가된 항목의 완료 상태는 false다. `[추론]`
- **U12. 중복 허용.** 같은 제목을 두 번 추가하면 `todo-item`이 2개가 된다. `[추론]`
- **U13. 항목 동일성.** 각 항목은 제목과 무관한 고유 id를 갖고, 토글·삭제는 그 id로 대상을 찾는다. 제목이 같은 두 항목 중 하나를 토글해도 다른 하나의 상태는 변하지 않는다. `[추론]`
- **U14. 토글 요소.** `todo-toggle`은 `type="checkbox"`인 `<input>`이고, `checked`가 그 항목의 완료 상태와 같다(`.checked` / `toBeChecked()`로 판정 가능). `[추론]`
- **U15. 토글 동작.** `todo-toggle`을 클릭하면 그 항목의 완료 상태만 반전되고 다른 항목·필터·입력창 상태는 변하지 않는다. 두 번 클릭하면 원래대로 돌아온다. `[추론]`
- **U16. 삭제 요소.** `todo-delete`는 `<button type="button">`이고, 클릭해도 form이 submit되지 않는다. `[추론]`
  — form 안의 button은 기본 `type="submit"`이다. 명시하지 않으면 삭제 클릭이 항목 추가를 유발할 수 있다.
- **U17. 삭제 동작.** `todo-delete`를 클릭하면 그 항목만 사라지고 나머지 항목의 상대 순서는 유지된다. `[추론]`
- **U18. 접근 가능한 이름.** 삭제 버튼의 접근 가능한 이름은 "삭제", 체크박스의 접근 가능한 이름은 그 항목의 제목이다. `[추론]`

### 2.3 S14(카운트)이 참이 되려면 추가로 정해져야 하는 것

- **U19. 세는 대상.** `todo-count`가 표시하는 수는 완료되지 않은 항목의 개수이며, **현재 필터와 무관하게** 전체 목록을 대상으로 센다. `[추론]`
  — 계약은 "미완료 개수"라고만 한다. 필터가 걸린 상태에서 무엇을 세는지는 침묵.
- **U20. 항상 존재.** 항목이 0개일 때도 `todo-count` 요소는 화면에 존재하며 0을 표시한다(조건부 렌더로 사라지지 않는다). `[추론]`
- **U21. 숫자 표기.** 개수는 아라비아 숫자로 표기하고, `todo-count`의 텍스트에는 그 개수 외의 다른 숫자가 들어가지 않는다. `[추론]`
- **~~[MISSING: `todo-count`의 정확한 문구]~~ → 해소.** 확정 당시 근거가 없었다. `"N개 남음"`으로 구현해 `npm run test:ac` 8케이스가 전부 통과했으므로, 인수 테스트는 이 요소를 부분 문자열/숫자 기준으로 본다. 문구를 `"N"`으로 좁힐 필요가 없다. `[test:ac 출력]`

### 2.4 S15(필터)이 참이 되려면 추가로 정해져야 하는 것

- **U22. 필터 상태.** 필터는 `all` | `active` | `completed` 중 하나이고 초기값은 `all`이다. `[추론]`
- **U23. all.** `filter-all` 클릭 후 렌더되는 `todo-item` 개수는 전체 항목 수와 같다. `[추론]`
- **U24. active.** `filter-active` 클릭 후 렌더되는 `todo-item`은 완료되지 않은 항목뿐이다. `[추론]`
- **U25. completed.** `filter-completed` 클릭 후 렌더되는 `todo-item`은 완료된 항목뿐이다. `[추론]`
- **U26. 숨김 방식.** 필터에서 제외된 항목은 CSS로 감추는 게 아니라 DOM에서 제거된다 — `getAllByTestId('todo-item')`이 아예 잡지 못한다. `[추론]`
  — `queryAllByTestId`는 `display:none` 요소도 잡는다. 감추기만 하면 개수 검사가 실패한다.
- **U27. 필터 유지.** 필터가 걸린 상태에서 항목을 추가/토글/삭제해도 필터 선택은 유지된다. `[추론]`
- **U28. 필터 밖으로 나가기.** `filter-active` 상태에서 어떤 항목의 `todo-toggle`을 클릭하면 그 항목은 목록에서 사라진다. `filter-completed`에서도 마찬가지. `[추론]`
- **U29. 필터 상태에서의 추가.** `filter-completed` 상태에서 새 항목을 추가하면 그 항목은 미완료이므로 화면에 보이지 않지만, 목록에는 들어가 있어 `filter-all`로 전환하면 보인다. `[추론]`
- **U30. 선택 표시.** 현재 선택된 필터 버튼은 `aria-pressed="true"`를 갖고 나머지 둘은 `"false"`를 갖는다. 세 버튼 모두 `<button type="button">`이다. `[추론]`
  — 계약은 선택 상태 표시 방법을 정하지 않았다. 클래스명은 계약상 자유(=테스트가 의존할 수 없음)이므로 접근성 속성으로 확정한다.

### 2.5 흐름 전체를 따라가며 나온, 계약이 답하지 않는 갈림길

- **U31. 새로고침 후 복원(영속성).** 항목 목록과 각 항목의 완료 상태를 `localStorage`에 저장하고, 마운트할 때 복원한다. App을 언마운트했다가 다시 마운트하면 직전 목록과 완료 상태가 그대로 보인다. `[test:ac 출력]`
  — **처음엔 "구현하지 않는다"로 확정했다가 뒤집었다.** 근거: `npm run test:ac`의 AC-07이 `cleanup()` 후 `render(<App />)`을 하고 `titles()`가 `["A","B"]`이길 기대하며 실패했다(`expected [] to deeply equal [ 'A', 'B' ]`). 계약 §DOM 계약이 세부 동작의 판정권을 인수 테스트에 위임했으므로 테스트 출력이 근거가 된다.
  — 애초의 기각 사유(케이스 간 상태 누수로 다른 테스트가 깨진다)는 실행으로 반증됐다. 영속성 구현 후 8케이스가 모두 통과했다.
- **U32. 저장 키·형식.** 저장은 단일 키(`todo-dc.todos`)에 `{id,title,completed}` 배열의 JSON으로 한다. `[추론]`
  — 인수 테스트는 UI로 상태를 만든 뒤 재마운트해 확인하므로(위 실패 출력), 저장소를 직접 들여다보지 않는다. 따라서 키·형식은 자유이고 앱 안에서만 일관되면 된다.
- **U33. 깨진 저장값 방어.** 저장된 값이 없거나, JSON이 아니거나, 배열이 아니거나, 원소 모양이 다르면 빈 목록으로 시작하고 예외를 던지지 않는다. `localStorage` 자체를 쓸 수 없는 환경에서도 앱은 정상 렌더된다. `[추론]`
- **U34. id 충돌 방지.** 복원한 목록에 이어 새 항목을 추가할 때, 새 id는 복원된 어떤 id와도 겹치지 않는다(저장된 최대 id + 1부터 발급). `[추론]`
  — 겹치면 U13이 깨진다: 새 항목을 토글했는데 복원된 옛 항목이 함께 토글된다.
- **U35. 필터는 복원하지 않는다.** 재마운트 후 필터는 항상 `all`이다. `[test:ac 출력]`
  — AC-07은 재마운트 직후 완료 항목 A와 미완료 항목 B가 **둘 다** 보이길 기대한다. 필터까지 복원하면 직전 필터에 따라 이 기대가 깨질 수 있다. 계약도 필터 영속을 요구하지 않는다.
- **U36. 마운트 시 부수효과.** 앱은 마운트될 때 네트워크 요청·타이머·전역 상태 변경을 하지 않는다(저장소 읽기/쓰기는 예외 — U31). 렌더는 동기적이라 `render()` 직후 `getByTestId('todo-input')`이 즉시 잡힌다(로딩 단계 없음). `[추론]`
- **U37. 상태 소유.** 화면 상태는 App 컴포넌트 트리 내부의 React state다. 모듈 스코프 가변 변수에 두지 않는다. `[추론]`
  — 모듈 스코프에 두면 언마운트해도 남아, 무엇이 복원돼서 보이는 건지 판정할 수 없게 된다.
- **U38. StrictMode 이중 렌더 안전성.** 컴포넌트가 두 번 렌더·마운트돼도 항목이 중복 생성되지 않는다. id 발급은 렌더 중이 아니라 이벤트 핸들러 안에서만 일어난다. `[추론]` [src/main.tsx:7]
- **U39. 항목 0개일 때의 화면.** 목록이 비어도 `todo-input`·`todo-count`·필터 버튼 3개는 그대로 존재한다. 빈 상태 안내 문구를 넣더라도 `todo-item`으로 렌더하지 않는다. `[추론]`
- **U40. 텍스트 노드 분할 금지.** `todo-title`·`todo-count` 내부에서 텍스트를 여러 엘리먼트로 쪼개지 않는다(`{count}<span>개</span>` 형태 금지). `[추론]`

### 2.6 계약이 범위 밖이라 하지 않았으나, 없으면 완성이라 부를 수 없는 것

- **U41.** 추가 → 토글 → 삭제 → 필터 전환 4개 조작이 임의의 순서로 섞여도 앱이 예외를 던지지 않고, 화면에 남은 항목과 `todo-count`가 서로 모순되지 않는다(표시된 수 == 완료 안 된 항목 수). `[추론]`
- **U42.** 마지막 항목을 삭제하면 `todo-item`이 0개가 되고 `todo-count`는 0을 표시한다. `[추론]`
- **U43.** 구현 코드가 `noUnusedLocals`/`noUnusedParameters`에 걸리지 않는다 — S8이 이를 직접 강제한다. `[추론]` [tsconfig.app.json:22-23]
- **U44.** 구현 코드는 `verbatimModuleSyntax`·`erasableSyntaxOnly`를 지킨다: 타입 전용 import는 `import type`으로 쓰고, enum·파라미터 프로퍼티를 쓰지 않는다. `[추론]` [tsconfig.app.json:14,23]

---

## 3. 완료 전 대조

§1·§2의 각 문장을 읽고, 그것을 참으로 만드는 코드를 지목했다. "있을 것이다"가 아니라 파일·줄이다.

| # | 지목 위치 | 확인 |
|---|---|---|
| S1 | `package.json` 무변경(mtime 16:43, 작업 시작 시각) | ✅ |
| S2 | `src/App.tsx:10` `export default function App()` | ✅ |
| S3 | 추가 파일: `src/todo/{types.ts,filter.ts,storage.ts,TodoInput.tsx,TodoItem.tsx,TodoCount.tsx,FilterBar.tsx,todo.invariant.test.tsx}` — 전부 `src/` 아래 | ✅ |
| S4 | `tests/ac/*` mtime 16:43 그대로. 열지 않았고 실행만 했다 | ✅ |
| S5 | `package.json:8-9` 무변경 | ✅ |
| S6 | `tsconfig.app.json:20` 무변경 + `npm run build` 통과 | ✅ |
| S7 | `npm run test:ac` → **8 passed (8)** | ✅ |
| S8 | `npm run build` → `tsc -b && vite build` exit 0 | ✅ |
| S9 | `src/todo/TodoInput.tsx:26` `data-testid="todo-input"` (App 트리에 1개) | ✅ |
| S10 | `src/todo/TodoItem.tsx:12` `<li data-testid="todo-item">` | ✅ |
| S11 | `src/todo/TodoItem.tsx:20` `data-testid="todo-title"` | ✅ |
| S12 | `src/todo/TodoItem.tsx:14` `data-testid="todo-toggle"` | ✅ |
| S13 | `src/todo/TodoItem.tsx:21` `data-testid="todo-delete"` | ✅ |
| S14 | `src/todo/TodoCount.tsx:7` `data-testid="todo-count"` ← `src/App.tsx:36` activeCount | ✅ |
| S15 | `src/todo/FilterBar.tsx:9-11` FILTERS → `:21` `data-testid={f.testId}` | ✅ |
| S16 | `src/` 전체에 `fetch`/`XMLHttpRequest`/`axios` 0건 (grep) | ✅ |
| S17 | `TodoItem.tsx:20` 제목은 `<span>` 텍스트뿐 — dblclick/편집 핸들러 없음 | ✅ |
| S18 | 전체 완료·일괄 삭제·드래그 핸들러 없음. 버튼은 `todo-delete`와 필터 3개가 전부 | ✅ |
| S19 | 입력은 `todo-input` 하나뿐(`TodoInput.tsx:25-32`) | ✅ |
| S20 | 문자열: "할 일 목록"/"삭제"/"전체"/"미완료"/"완료"/"N개 남음"/placeholder — 한국어 단일. 테마·애니메이션·i18n 코드 0건 | ✅ |
| S21 | `index.html` mtime 16:43 무변경 | ✅ |
| S22 | `src/App.css`·`src/index.css` mtime 16:43 무변경. `src/`에 새 `.css` 0개 (grep: `.css` 참조는 기존 `main.tsx:3` 하나뿐) | ✅ |
| U1 | `TodoInput.tsx:24` `<form onSubmit>` → `:15-21` handleSubmit → `App.tsx:21` addTodo | ✅ |
| U2 | `TodoInput.tsx:16` `e.preventDefault()` | ✅ |
| U3 | `TodoInput.tsx:20` `setValue('')` — 성공 경로에서만 | ✅ |
| U4 | `TodoInput.tsx:18` `if (!title) return;` — `setValue` 전에 반환하므로 입력값 유지 | ✅ |
| U5 | `TodoInput.tsx:17` `value.trim()` | ✅ |
| U6 | `TodoInput.tsx:27` `type="text"` | ✅ |
| U7 | maxLength·개수 상한 코드 없음 | ✅ |
| U8 | `TodoItem.tsx:12-24` — `<li>` 안에 toggle(:13)·title(:20)·delete(:21) 각 1개 | ✅ |
| U9 | `TodoItem.tsx:20` `{todo.title}` 단일 표현식 | ✅ |
| U10 | `App.tsx:23` `[...prev, todo]` | ✅ |
| U11 | `App.tsx:22` `completed: false` | ✅ |
| U12 | 중복 검사 코드 없음 | ✅ |
| U13 | `App.tsx:22` `id: nextId.current++`, `:28`·`:32` `t.id === id` / `t.id !== id` | ✅ |
| U14 | `TodoItem.tsx:15-16` `type="checkbox" checked={todo.completed}` | ✅ |
| U15 | `App.tsx:28` 대상만 `{...t, completed: !t.completed}`, 나머지는 `t` 그대로 | ✅ |
| U16 | `TodoItem.tsx:21` `type="button"`. 게다가 form(`TodoInput.tsx:24`) 바깥이다 | ✅ |
| U17 | `App.tsx:32` `filter(...)` — 순서 보존 | ✅ |
| U18 | `TodoItem.tsx:17` `aria-label={todo.title}`, `:22` 버튼 텍스트 "삭제" | ✅ |
| U19 | `App.tsx:36` `todos.filter(...)` — `visible`이 아니라 `todos` 기준 | ✅ |
| U20 | `App.tsx:47` `<TodoCount>`가 조건 없이 렌더 | ✅ |
| U21 | `TodoCount.tsx:7` `` {`${count}개 남음`} `` — 다른 숫자 없음 | ✅ |
| U22 | `App.tsx:12` `useState<Filter>('all')` | ✅ |
| U23 | `src/todo/filter.ts:6-7` `case 'all': return todos` | ✅ |
| U24 | `filter.ts:8-9` `!t.completed` | ✅ |
| U25 | `filter.ts:10-11` `t.completed` | ✅ |
| U26 | `App.tsx:43` `visible.map(...)` — 제외분은 렌더 자체를 안 함 | ✅ |
| U27 | `App.tsx:21-33` 어떤 핸들러도 `setFilter`를 호출하지 않음 | ✅ |
| U28 | U26 + `filter.ts:8` 재평가 | ✅ |
| U29 | `App.tsx:23` addTodo는 `todos`에 넣고, `:35` `visible`은 파생값 | ✅ |
| U30 | `FilterBar.tsx:23` `aria-pressed={f.value === current}`, `:22` `type="button"` | ✅ |
| U31 | `App.tsx:11` `useState<Todo[]>(loadTodos)` + `:16-18` `useEffect(() => saveTodos(todos), [todos])`; `src/todo/storage.ts:12-23,25-32` | ✅ |
| U32 | `storage.ts:3` `STORAGE_KEY`, `:27` `JSON.stringify(todos)` | ✅ |
| U33 | `storage.ts:14-21` (`!raw` / `Array.isArray` / `filter(isTodo)`) + `:22` `catch { return [] }`, `:28-30` 쓰기 catch | ✅ |
| U34 | `storage.ts:35-37` `nextIdFrom` ← `App.tsx:13-14` | ✅ |
| U35 | `App.tsx:12` — filter는 저장·복원 대상이 아님(주석 명시) | ✅ |
| U36 | `src/`에 `fetch`/`setTimeout`/`setInterval`/`requestAnimationFrame` 0건 (grep). effect는 `App.tsx:16-18` 저장 하나뿐 | ✅ |
| U37 | 상태는 `App.tsx:11-13`의 `useState`/`useRef`뿐. 모듈 스코프 가변 변수 없음(`FILTERS`는 const 리터럴) | ✅ |
| U38 | `App.tsx:22` id 발급이 이벤트 핸들러 `addTodo` 안에서만 일어남 | ✅ |
| U39 | `App.tsx:41,47,48` — 입력·카운트·필터가 목록 유무와 무관하게 렌더 | ✅ |
| U40 | `TodoCount.tsx:7`, `TodoItem.tsx:20` — 각각 단일 텍스트 노드 | ✅ |
| U41 | `todo.invariant.test.tsx` "U41 — 추가·토글·삭제·필터를 섞어도…" 케이스 | ✅ |
| U42 | `todo.invariant.test.tsx` "U42 — 마지막 항목을 지우면…" 케이스 | ✅ |
| U43 | `npm run build` 통과 (`tsconfig.app.json:22-23`이 강제) | ✅ |
| U44 | `types.ts`는 `type`만 사용(enum 0건), `App.tsx:2`·`TodoInput.tsx:2`·`TodoItem.tsx:1`·`FilterBar.tsx:1`·`filter.ts:1`·`storage.ts:1` 전부 `import type` | ✅ |

### 판정 결과

- **기각한 문장 없음.** §1·§2의 모든 문장에 대해 그것을 참으로 만드는 코드를 지목했다. 존재하지 않을 것을 요구하는 문장(S16~S22, U7, U12)은 해당 코드가 없음을 grep·mtime으로 확인했다.
- **뒤집은 문장 1개: U31(영속성).** 최초 확정은 "구현하지 않는다"였고, 근거는 "테스트 간 상태 누수 위험"이라는 추론이었다. `npm run test:ac`의 AC-07 실패 출력이 이를 반증했다. 추론이 계약보다 앞설 수 없다는 게 이 항목의 교훈이고, 뒤집은 이력을 지우지 않고 §2.5에 남겼다.
- **해소한 MISSING 1개:** `todo-count`의 정확한 문구(§2.3). 실행 출력으로 "부분 문자열 검사"임이 확인돼 `"N개 남음"`으로 확정.

---

## 4. 검증

`src/todo/todo.invariant.test.tsx` — 구현 중 작성해 돌린 자체 테스트. **20 케이스 전부 통과.**
각 `test` 이름 앞에 그 케이스가 지키는 §2 문장 번호를 적었다. 인수 테스트가 검사하지 않을 수도 있는
U4(공백 거부 시 입력값 유지), U12/U13(동명 항목 독립), U16(삭제가 submit 아님), U19(필터 무관 카운트),
U27/U29(필터 유지·필터 상태 추가), U33(깨진 저장값), U34(복원 후 id 충돌), U41/U42(불변식)를 다룬다.

실행:

```
npx vitest run --config vitest.impl.config.ts
```

`vitest.impl.config.ts`는 이 자체 테스트 전용 설정이다. `tests/ac/**`와 무관하고,
`tsconfig.node.json:22`가 `vite.config.ts`만 include하며 `tsconfig.app.json:27`이 `src/**/*.test.*`를 제외하므로
`npm run build`에 영향을 주지 않는다(빌드 통과로 확인).

---
---

# [CHANGE] 인라인 제목 편집

> 변경 요구 원문: "항목 제목을 더블클릭하면 그 자리에서 편집할 수 있게 하라.
> 편집 입력창의 testid는 todo-edit, Enter로 확정하고 Escape로 취소한다. 다른 요구사항은 그대로다."

**작업 시작 시점의 근거 상태.** 변경 전 `npm run test:ac`는 **8 passed (8)** 이다.
편집 기능이 전혀 없는 코드에서 인수 테스트가 전부 통과하므로, **인수 테스트는 편집 동작을 판정해 주지 않는다.**
§2에서 `todo-count` 문구·영속성을 실행 출력으로 좁혔던 방법을 여기서는 쓸 수 없다.
즉 이 변경에서 근거는 CHANGE 원문 4개 문장뿐이고, 나머지는 전부 §6에서 내가 확정해야 한다.
**이 변경은 §1보다 §2가 훨씬 무거운 경우다.**

---

## 5. 명시된 것 (CHANGE)

- **E1.** `todo-title`을 더블클릭하면 그 항목이 편집 상태가 되고, `data-testid="todo-edit"`인 입력창이 화면에 나타난다. [CHANGE]
- **E2.** 그 편집 입력창의 testid는 정확히 `todo-edit`이다. [CHANGE]
- **E3.** 편집 중 Enter를 누르면 확정된다 — 그 항목의 제목이 편집 입력창의 값이 되고 편집 상태가 끝난다. [CHANGE]
- **E4.** 편집 중 Escape를 누르면 취소된다 — 그 항목의 제목이 편집 전 값 그대로이고 편집 상태가 끝난다. [CHANGE]
- **E5.** 편집은 "그 자리에서" 일어난다 — `todo-edit`은 그 항목의 `todo-item` **내부**에 렌더된다(별도 모달·별도 페이지·목록 밖 입력창이 아니다). [CHANGE "그 자리에서"]
- **E6.** CHANGE 이전 계약의 나머지 요구는 그대로 유효하다 — S1~S16, S18~S22, U1~U44가 변경 후에도 참이다. [CHANGE "다른 요구사항은 그대로다"]
- **E7.** S17(인라인 편집 경로 없음)만 무효다. [과제 §규칙 "«변경 요구»는 계약의 «범위 밖» 목록보다 우선한다"]
  — 범위 밖 목록의 나머지 항목(드래그 정렬, 전체 완료 토글, 일괄 삭제 …)은 여전히 금지다. 우선하는 것은 **더블클릭 인라인 편집 한 줄**뿐이다.

---

## 6. 명시되지 않은 것 (CHANGE)

CHANGE 원문은 네 문장이다. 그 네 문장이 참이 되려면 아래가 추가로 정해져야 한다.

### 6.1 E1(더블클릭 진입)이 참이 되려면

- **X1. 제목과 입력창의 교체.** 편집 상태인 항목에서 `todo-title`은 DOM에서 **제거**되고 그 자리에 `todo-edit`이 렌더된다. 그 항목 안의 `todo-title`은 0개, `todo-edit`은 1개다. `[추론]`
  — 제목이 `todo-title`과 `todo-edit` 두 곳에 동시에 있으면 "이 항목의 제목이 무엇인가"를 `todo-title`로 판정할 수 없게 된다. CSS로 감추는 것은 U26과 같은 이유로 무의미하다(testing-library는 `display:none`도 잡는다).
- **X2. 초기값.** `todo-edit`의 초기 value는 편집 시작 시점의 그 항목 제목과 정확히 같다. `[추론]` — "새로 쓰기"가 아니라 "편집"이므로.
- **X3. 자동 포커스.** 편집 상태 진입과 동시에 `todo-edit`이 포커스를 갖는다(`document.activeElement === todo-edit`). `[추론]`
  — 대상을 지정하지 않는 `userEvent.keyboard('{Enter}')`·`{Escape}`는 포커스된 요소로 간다. 자동 포커스가 없으면 E3·E4가 **도달할 수 없는 경로**가 된다. U1이 "추가 버튼 testid가 없으니 Enter가 유일한 경로"라고 판정한 것과 같은 구조의 추론이다.
- **X4. 캐럿 위치.** 포커스 시 캐럿은 값의 **끝**에 놓이고, 텍스트를 전체 선택하지 않는다. `[추론]`
  — 전체 선택 상태면 `userEvent.type(edit, 'X')`가 append가 아니라 치환이 되어, 같은 조작이 다른 결과를 낸다.
- **X5. 동시 편집 없음.** 화면 전체에서 `todo-edit`은 최대 1개다. `[추론]`
- **X6. 평상시 부재.** 편집 중이 아니면 화면에 `todo-edit`이 존재하지 않는다(0개). `[추론]`
- **X7. 단일 클릭 무효.** `todo-title`을 한 번만 클릭해서는 편집이 시작되지 않는다. `[추론]` — 계약이 지정한 진입 조작은 더블클릭뿐이다.
- **X8. 진입점은 제목뿐.** 더블클릭 핸들러는 `todo-title`에 있다. `todo-toggle`·`todo-delete`를 더블클릭해도 편집이 시작되지 않는다. `[추론]`
  — `todo-item` 전체에 걸면 삭제 버튼 더블클릭이 편집을 유발한다.
- **X9. 편집 중 항목 구조.** 편집 중에도 그 항목의 `todo-toggle`·`todo-delete`는 `todo-item` 안에 하나씩 그대로 있다. 즉 U8은 편집 중에도 참이다(`todo-title`만 `todo-edit`으로 교체된다). `[추론]`
- **X10. 편집 대상 이동.** 편집 중에 다른 항목의 제목을 더블클릭하면 편집 대상이 그 항목으로 옮겨가고, 이전 항목의 편집 내용은 버려진다(이전 항목 제목 불변). `[추론]`
  — 계약이 명시한 확정 경로는 Enter뿐(E3)이다. 편집 대상 이동이 확정을 대신해서는 안 된다.
- **X11. 입력 요소.** `todo-edit`은 `type="text"`인 `<input>`이라 `userEvent.type`·`userEvent.clear`가 동작한다. `[추론]`

### 6.2 E3(Enter 확정)이 참이 되려면

- **X12. 트림.** 확정되는 제목은 `todo-edit` 값의 앞뒤 공백을 제거한 문자열이다. `[추론]` — 추가 경로(U5)와 같은 규칙이어야 한다.
- **X13. 반영.** 확정 후 그 항목의 `todo-title` textContent가 새 제목과 **정확히** 같다(U9는 편집 후에도 참). `[추론]`
- **X14. 부작용 없음.** 확정은 그 항목의 id·완료 상태·목록 내 위치를 바꾸지 않고, 다른 항목을 건드리지 않으며, `todo-item` 개수를 바꾸지 않는다. `[추론]`
- **X15. 카운트 불변.** 확정으로 `todo-count`가 변하지 않는다(완료 상태를 건드리지 않으므로). `[추론]`
- **X16. Enter가 항목을 추가하지 않는다.** 편집 중 Enter는 새 `todo-item`을 만들지 않는다. `todo-edit`은 `todo-input`의 `<form>` 바깥에 있고, Enter는 keydown 핸들러로만 처리한다. `[추론]`
  — U16과 같은 함정이다. 편집 입력창을 form으로 감싸거나 form 안에 두면 Enter가 submit을 타고 항목 추가로 이어진다.
- **X17. 빈 값 확정.** 값이 비었거나 공백뿐일 때 Enter를 누르면 **제목을 바꾸지 않고, 항목을 지우지도 않고, 편집 상태만 끝낸다**(= Escape와 같은 결과). `[추론]`
  — 계약은 빈 제목의 의미에 침묵한다. 세 후보를 비교했다.
  (a) 항목 삭제(TodoMVC 관례): `todo-item` 개수가 변해 U41(카운트·목록 무모순)과 충돌할 여지가 가장 크다.
  (b) 빈 제목으로 확정: U9(제목 텍스트 == 저장된 제목)가 공허해지고 U4(공백 거부)와 정면으로 어긋난다.
  (c) 제목 불변 + 편집 종료: 위 둘을 모두 피한다. → (c)를 택한다.
  — "편집 상태를 유지한다"는 변형도 검토했다(U4의 "입력값을 남긴다"와 대응). 그러면 `todo-title`이 계속 없어서 "제목이 안 바뀌었다"를 확인할 방법이 사라진다. 그래서 종료 쪽으로 정했다.
- **X18. 변화 없는 확정.** 값이 원래 제목과 같아도 정상 확정된다(편집 종료, 제목 그대로). `[추론]`
- **X19. 제한 없음.** 제목 길이 상한·중복 제목 금지를 두지 않는다(U7·U12의 연장). `[추론]`

### 6.3 E4(Escape 취소)가 참이 되려면

- **X20. 복원.** 취소 후 그 항목의 `todo-title`이 다시 나타나고 textContent가 편집 전 제목과 같다. `[추론]`
- **X21. 초안 폐기.** 취소된 편집 내용은 남지 않는다 — 같은 항목을 다시 더블클릭하면 `todo-edit`의 값은 취소 직전의 초안이 아니라 **현재 제목**이다. `[추론]`
- **X22. 편집 중이 아닐 때의 Escape.** 편집 중이 아닐 때 Escape를 눌러도 아무 일도 일어나지 않는다. 특히 `todo-input`에 친 값이 지워지지 않는다. `[추론]`
  — 전역 키 핸들러를 달면 이 문장이 깨진다. 그래서 키 처리는 `todo-edit` 안에서만 한다.
- **X23. 키 판정.** 키는 `event.key`의 값 `'Enter'`·`'Escape'`로 판정한다(`keyCode`·`which` 아님). `[추론]` — `userEvent`의 `{Enter}`/`{Escape}`가 보내는 값이다.

### 6.4 흐름을 처음부터 끝까지 따라가며 나온 갈림길

- **X24. blur는 취소다.** 편집 입력창이 포커스를 잃으면 편집 상태가 끝나고 제목은 그대로다(확정하지 않는다). `[추론]`
  — 계약이 확정 경로로 명시한 것은 Enter **하나뿐**이다(E3). blur를 확정으로 삼으면 계약에 없는 두 번째 확정 경로가 생긴다. 반대로 blur에 아무 반응도 하지 않으면, 다른 항목을 조작한 뒤에도 편집창이 화면에 남아 X5·X6이 깨진다. 취소가 두 제약을 모두 만족하는 유일한 선택이다.
- **X25. 편집 중 대상이 사라질 때.** 편집 중인 항목이 화면에서 사라지는 조작(그 항목 삭제, 필터 전환)이 일어나면 편집 상태도 끝나고 `todo-edit`은 0개가 된다. 나중에 그 항목이 다시 보이더라도 편집 상태로 되살아나지 않는다. `[추론]`
- **X26. 편집은 필터를 바꾸지 않는다.** 편집 진입·확정·취소가 현재 선택된 필터를 바꾸지 않는다(U27의 연장). `[추론]`
- **X27. 편집 결과의 영속성.** 확정된 제목은 저장되어, 재마운트 후에도 새 제목으로 복원된다(U31의 연장). `[추론]`
- **X28. 편집 상태는 복원하지 않는다.** 재마운트 직후 `todo-edit`은 0개다(U35와 같은 이유 — 편집은 화면 상태이지 저장 대상이 아니다). `[추론]`
- **X29. 상태 소유.** 편집 상태(어느 항목을 편집 중인가, 초안 텍스트)는 App 트리 안의 React state다. 모듈 스코프에 두지 않는다(U37의 연장). `[추론]`
- **X30. 값의 단일성.** `todo-edit`의 값은 input의 `value` 하나다 — 텍스트를 여러 엘리먼트로 쪼개 담지 않는다(U40의 연장). `[추론]`
- **X31. 접근 가능한 이름.** `todo-edit`에 접근 가능한 이름을 준다(`aria-label`). 한국어 단일 로케일을 지킨다(U18·S20의 연장). `[추론]`
- **X32. 더블클릭의 부작용.** 더블클릭은 편집 진입 외에 앱 상태를 바꾸지 않는다 — 특히 완료 상태를 토글하거나 항목을 지우지 않는다. `[추론]`
- **[MISSING: IME 조합 중 Enter의 확정 여부].** 한국어 입력에서 조합 확정 Enter와 편집 확정 Enter가 겹친다(`isComposing`). 실제 브라우저에서만 재현되고 jsdom/`userEvent`는 조합 이벤트를 보내지 않아 **산출물을 보고 판정할 수 없다.** 판정 가능한 문장으로 만들 근거가 없으므로 빈칸 대신 이 표시를 남긴다. 현재 구현은 `isComposing`을 보지 않는다(= 조합 중 Enter도 확정으로 취급).

### 6.5 계약이 범위 밖이라 하지 않았으나, 없으면 완성이라 부를 수 없는 것

- **X33.** 추가·토글·삭제·필터·**편집** 5개 조작이 임의 순서로 섞여도 예외가 나지 않고, `todo-count`가 표시하는 수와 화면의 미완료 항목 수가 어긋나지 않는다(U41의 확장). `[추론]`
- **X34.** 편집 관련 코드가 `strict`·`noUnusedLocals`·`erasableSyntaxOnly`를 지켜 `npm run build`가 통과한다(S8·U43·U44의 연장). `[추론]`
- **X35.** 편집 UI를 CSS 없이 구현한다 — `src/App.css`·`src/index.css`를 고치지 않고 새 스타일 파일도 만들지 않는다(S22 유지). `[추론]`
- **X36.** 변경 후에도 `npm run test:ac`가 여전히 8케이스 전부 통과한다 — 편집 기능 추가가 기존 동작을 깨지 않는다. `[계약 §완료 조건]`

---

## 7. 완료 전 대조 (CHANGE)

§5·§6의 문장을 하나씩 읽고, 그것을 참으로 만드는 코드를 **파일·줄로 지목**했다.
추가·수정한 파일은 `src/todo/TodoEdit.tsx`(신규), `src/todo/TodoItem.tsx`, `src/App.tsx`,
`src/todo/todo.invariant.test.tsx`(검증) 넷이다.

| # | 지목 위치 | 확인 |
|---|---|---|
| E1 | `TodoItem.tsx:44` `onDoubleClick={() => onStartEdit(todo.id)}` → `App.tsx:38-40` `startEdit` → `App.tsx:72` `editing={todo.id === editingId}` → `TodoEdit.tsx:47` | ✅ |
| E2 | `TodoEdit.tsx:47` `data-testid="todo-edit"` | ✅ |
| E3 | `TodoEdit.tsx:30-36` `if (e.key === 'Enter')` → `App.tsx:43-46` `commitEdit` | ✅ |
| E4 | `TodoEdit.tsx:38-41` `if (e.key === 'Escape')` → `App.tsx:48-50` `cancelEdit` | ✅ |
| E5 | `TodoItem.tsx:28-51` — `<TodoEdit>`(:37-41)가 `<li data-testid="todo-item">`(:28) 내부. 모달·목록 밖 입력창 아님 | ✅ |
| E6 | `npm run test:ac` **8 passed** + 자체 테스트 **41 passed**(기존 20 + 신규 21). S16~S22는 §3 대조 그대로(아래 X35·mtime) | ✅ |
| E7 | 추가된 UI는 `todo-edit` 하나뿐. 드래그·전체완료·일괄삭제·마감일·테마 코드 0건(버튼은 여전히 `todo-delete` + 필터 3개) | ✅ |
| X1 | `TodoItem.tsx:36-47` 삼항 — `editing`이면 `TodoEdit`(:37-41), 아니면 `todo-title` span(:44-46). 두 분기는 배타적이라 동시에 존재할 수 없다 | ✅ |
| X2 | `TodoItem.tsx:38` `initialTitle={todo.title}` → `TodoEdit.tsx:15` `useState(initialTitle)` | ✅ |
| X3 | `TodoEdit.tsx:20-26` `el.focus()` (마운트 시 1회) | ✅ |
| X4 | `TodoEdit.tsx:24-25` `setSelectionRange(end, end)` — `select()`를 쓰지 않는다 | ✅ |
| X5 | `App.tsx:14` `editingId`가 단일 값 → `:72`에서 최대 한 항목만 `editing=true` | ✅ |
| X6 | `TodoItem.tsx:36` — `editing`이 false면 `TodoEdit` 자체가 렌더되지 않는다 | ✅ |
| X7 | `TodoItem.tsx:44` — `onDoubleClick`만 있고 `onClick` 핸들러가 없다 | ✅ |
| X8 | `TodoItem.tsx:44` — 핸들러가 title span에만. toggle(`:29-35`)·delete(`:48-50`)엔 없다 | ✅ |
| X9 | `TodoItem.tsx:29-35`(toggle)·`:48-50`(delete)가 삼항 **밖**에 있어 편집 중에도 렌더된다 | ✅ |
| X10 | `App.tsx:38-40` `setEditingId(id)` 대입 — 이전 대상은 자동으로 편집 해제되고, 언마운트로 초안(`TodoEdit.tsx:15`)이 사라진다 | ✅ |
| X11 | `TodoEdit.tsx:48` `type="text"` | ✅ |
| X12 | `TodoEdit.tsx:32` `draft.trim()` | ✅ |
| X13 | `App.tsx:44` `t.id === id ? { ...t, title } : t` — id로 대상 하나만 | ✅ |
| X14 | `App.tsx:44` `map` + 스프레드 — 길이·순서 불변, `completed`·`id`는 스프레드로 보존 | ✅ |
| X15 | `App.tsx:60` `activeCount`는 `completed`만 본다. `commitEdit`(`:43-46`)은 `completed`를 건드리지 않는다 | ✅ |
| X16 | `TodoEdit.tsx:31` `e.preventDefault()` + `TodoEdit`은 `TodoInput.tsx:24`의 `<form>` **바깥**(App 트리상 형제) | ✅ |
| X17 | `TodoEdit.tsx:33-35` `if (title) onCommit(title); else onCancel();` | ✅ |
| X18 | `TodoEdit.tsx:34` — 값이 원래와 같아도 `onCommit` 경로를 탄다 | ✅ |
| X19 | `maxLength`·중복 제목 검사 코드 없음 | ✅ |
| X20 | `App.tsx:48-50` `cancelEdit`은 `setTodos`를 부르지 않는다 → `TodoItem.tsx:44-46` span 복귀 | ✅ |
| X21 | `TodoEdit.tsx:15` `draft`가 컴포넌트 로컬 state — 편집 종료 = 언마운트 = 초안 소멸 | ✅ |
| X22 | 키 핸들러는 `TodoEdit.tsx:52` 하나뿐. `document`/`window` 리스너 0건 — 전역 Escape 경로가 없다 | ✅ |
| X23 | `TodoEdit.tsx:30,38` `e.key === 'Enter'` / `'Escape'` | ✅ |
| X24 | `TodoEdit.tsx:53` `onBlur={onCancel}` — `onCommit`이 아니다 | ✅ |
| X25 | `App.tsx:35`(삭제 시 정리)·`:54-57`(필터 전환 시 정리)·`:72`(보이는 항목에서만 파생) | ✅ |
| X26 | `App.tsx:38-50` — `startEdit`·`commitEdit`·`cancelEdit` 어느 것도 `setFilter`를 부르지 않는다 | ✅ |
| X27 | `App.tsx:44` `setTodos` → `:18-20` `useEffect(saveTodos, [todos])` | ✅ |
| X28 | `App.tsx:14` 초기값 `null`. `storage.ts`는 `todos`만 저장하므로 편집 상태는 복원 대상이 아니다 | ✅ |
| X29 | `App.tsx:14` `useState` + `TodoEdit.tsx:15` `useState` — 모듈 스코프 가변 변수 없음 | ✅ |
| X30 | `TodoEdit.tsx:49` `value={draft}` — 값은 input 하나에 담긴다 | ✅ |
| X31 | `TodoEdit.tsx:50` `aria-label="제목 편집"` (한국어 단일 로케일) | ✅ |
| X32 | `TodoItem.tsx:44` — `onDoubleClick`이 `onStartEdit`만 호출한다 | ✅ |
| X33 | `todo.invariant.test.tsx` "X33 — 추가·토글·삭제·필터·편집을 섞어도…" | ✅ |
| X34 | `npm run build` → `tsc -b && vite build` exit 0 | ✅ |
| X35 | `src/App.css`·`src/index.css` mtime 20:51(작업 시작 시각) 그대로. `src` 아래 `.css`는 여전히 그 둘뿐이고 `.scss` 0개 | ✅ |
| X36 | `npm run test:ac` → **8 passed (8)**, exit 0 | ✅ |

### 판정 결과

- **기각한 문장 없음.** §5·§6의 모든 문장에 대해 그것을 참으로 만드는 코드를 지목했다.
  존재하지 않을 것을 요구하는 문장(X6·X7·X19·X22·X35)은 해당 코드가 **없음**을 확인해 지목을 대신했다.
- **미해소 1개:** `[MISSING: IME 조합 중 Enter의 확정 여부]`(§6.4). 판정 가능한 산출물 기준을 만들 수 없어 빈칸 대신 남겼다.
  현재 구현은 `isComposing`을 보지 않는다(`TodoEdit.tsx:30`) — 이것이 이 항목의 현재 상태이지 확정된 요구는 아니다.
- **고정 대상 무변경 재확인:** `tests/ac/*`·`package.json`·`tsconfig.app.json`·`index.html`·`src/main.tsx` mtime 20:51 그대로.
  `tests/ac/**`는 `npm run test:ac`로 **실행만** 했고 열지 않았다.

---

## 8. 검증 (CHANGE)

`src/todo/todo.invariant.test.tsx`에 편집 케이스 **21개**를 추가했다(기존 20개와 합쳐 **41 passed**).
지우지 말아야 할 파일이므로 기존 케이스는 그대로 두고 4개 `describe`를 덧붙였다.
각 `test` 이름 앞에 그 케이스가 지키는 §5·§6 문장 번호를 적었다.

| describe | 지키는 문장 |
|---|---|
| 편집 — 진입 | E1·E2·E5·X1~X10 (교체·초기값·자동 포커스·캐럿 위치·단일 클릭 무효·진입점·대상 이동) |
| 편집 — 확정(Enter) | E3·X12~X18 (트림·반영·부작용 없음·카운트 불변·**Enter가 항목을 추가하지 않음**·빈 값 처리) |
| 편집 — 취소(Escape) | E4·X20~X22·X24 (제목 복원·초안 폐기·편집 중이 아닐 때의 Escape·**blur는 취소**) |
| 편집 — 다른 요구사항과의 관계 | X25~X28·X33 (대상 소멸·필터 유지·영속성·편집 상태 비복원·5조작 혼합 불변식) |

인수 테스트가 편집 동작을 전혀 판정하지 않으므로(§CHANGE 머리말), **이 파일이 편집 기능의 유일한 회귀 방어선이다.**

실행:

```
npx vitest run --config vitest.impl.config.ts
```
