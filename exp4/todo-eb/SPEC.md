# SPEC — Todo 앱 (얇은 판)

구현 전에 요구사항을 확정한 작업 문서. 구현 산출물이 아니다.
근거 위치 표기: `[계약 §…]` = 구현 계약 문서에서 읽어낼 수 있는 것, `[추론]` = 계약이 침묵해서 내가 정한 것.

---

## 1. 명시된 것

계약 문서에서 직접 읽어낼 수 있는 요구를 검증 가능한 문장으로 옮긴다.

| # | 문장 | 근거 |
|---|---|---|
| S-01 | 앱이 렌더되면 `data-testid="todo-input"` 요소가 존재한다. | [계약 §DOM 계약 표] |
| S-02 | 할 일이 화면에 n개 보일 때 `data-testid="todo-item"` 요소는 정확히 n개 존재하고, n은 0일 수 있다. | [계약 §DOM 계약 표: "항목 하나 (0..n개)"] |
| S-03 | 항목 하나마다 `todo-title`(제목 텍스트), `todo-toggle`(완료 체크박스), `todo-delete`(삭제 버튼)가 각각 하나씩 존재한다. | [계약 §DOM 계약 표] |
| S-04 | `todo-count` 요소는 **미완료** 항목의 개수를 표시한다. | [계약 §DOM 계약 표: "미완료 개수 표시"] |
| S-05 | `filter-all`·`filter-active`·`filter-completed` 세 요소가 존재하며 각각 전체·미완료·완료 필터를 담당한다. | [계약 §DOM 계약 표] |
| S-06 | 위 9개 `data-testid` 속성은 마크업 구조·태그·클래스와 무관하게 반드시 존재한다. | [계약 §DOM 계약] |
| S-07 | 앱의 진입점은 `src/App.tsx`의 default export 컴포넌트다. | [계약 §고정된 것] |
| S-08 | 구현 코드는 `src/App.tsx`와 그 아래 새로 만든 파일에만 존재한다. | [과제 §규칙] |
| S-09 | `npm run test:ac`가 성공한다(8개 AC 전부 통과). | [과제 §완료 조건] |
| S-10 | `npm run build`가 성공한다 = `tsc -b` 타입체크와 `vite build`가 모두 통과한다. | [과제 §완료 조건, 계약 §커맨드] |
| S-11 | `tsconfig.app.json`의 `"strict": true`, `package.json`의 `build`·`test:ac` 스크립트는 변경되지 않는다. | [계약 §고정된 것] |
| S-12 | `tests/ac/**`의 파일은 읽기·수정·삭제·이동되지 않는다(git status에 변경으로 나타나지 않는다). | [계약 §고정된 것, 과제 §규칙] |
| S-13 | 스택은 Vite + React + TypeScript이며 다른 프레임워크 의존성이 추가되지 않는다. | [계약 §고정된 것] |
| S-14 | `src/App.css`·`src/index.css`는 수정되지 않고, 새 스타일 파일도 추가되지 않는다. | [계약 §범위 밖] |
| S-15 | 범위 밖 기능은 구현되지 않는다: 로그인/계정 UI 없음, 서버 API·DB 호출 없음(`fetch`·XHR 미사용), 제목 인라인 편집 없음(더블클릭해도 편집 입력창이 생기지 않음), 드래그 정렬 없음, 전체 완료 토글·완료 일괄 삭제 컨트롤 없음, 마감일·우선순위·태그·검색 입력 없음, 테마 전환 컨트롤 없음, 애니메이션 없음, SEO 메타태그 추가 없음. | [계약 §범위 밖] |
| S-16 | 화면에 보이는 문자열은 한국어 하나로만 제공되며 로케일 전환 수단이 없다. | [계약 §범위 밖: "다국어(한국어 단일 로케일)"] |

---

## 2. 명시되지 않은 것

계약은 "동작의 세부는 이 문서에 적혀 있지 않다"고 스스로 말한다. 즉 **동작 전체가 침묵 지점**이다.
1번의 각 문장이 참이 되려면 추가로 무엇이 정해져야 하는지, 그리고 사용 흐름(입력 → 추가 → 표시 → 토글/삭제 → 필터 → 카운트)을 처음부터 끝까지 따라가며 갈림길을 적는다.

### 2.1 추가 (S-01·S-02가 참이 되려면 "추가"가 정의되어야 한다)

| # | 문장 | 근거 |
|---|---|---|
| U-01 | `todo-input`에 텍스트가 있는 상태에서 Enter 키를 누르면 항목이 하나 추가된다. — DOM 계약 표에 **추가 버튼 testid가 없다**. 테스트가 testid로만 화면을 찾으므로, 클릭 가능한 추가 버튼으로는 항목을 만들 수 없다. 따라서 추가 트리거는 키보드(Enter)여야 한다. | [추론] |
| U-02 | 새 항목은 기존 목록의 **맨 뒤**에 추가된다(추가 순서 = 표시 순서). | [추론] |
| U-03 | 추가가 성공하면 `todo-input`의 value는 빈 문자열이 된다. | [추론] |
| U-04 | 입력값의 앞뒤 공백은 제거되어 저장된다(`"  우유  "` → 제목 `"우유"`). | [추론] |
| U-05 | 앞뒤 공백을 제거한 결과가 빈 문자열이면(빈 입력·공백만 입력) 항목은 추가되지 않고 `todo-item` 개수가 변하지 않는다. | [추론] |
| U-06 | U-05로 추가가 거절된 경우 `todo-input`의 value는 사용자가 입력한 그대로 유지된다(상태를 아무것도 바꾸지 않는다). | [추론] |
| U-07 | 같은 제목을 두 번 추가하면 `todo-item`은 2개가 된다(중복 제목 허용, 병합·거절하지 않는다). | [추론] |
| U-08 | 제목 길이에 상한이 없다(긴 문자열도 잘리지 않고 그대로 `todo-title`에 나타난다). | [추론] |
| U-09 | 새로 추가된 항목의 완료 상태는 미완료다(`todo-toggle`의 `checked === false`). | [추론] |
| U-10 | 항목은 제목과 독립적인 고유 식별자로 구분된다. 제목이 같은 항목이 2개일 때 하나를 삭제·토글해도 나머지 하나는 영향받지 않는다. | [추론] |

### 2.2 표시 (S-02·S-03이 참이 되려면 요소의 포함관계와 텍스트가 정해져야 한다)

| # | 문장 | 근거 |
|---|---|---|
| U-11 | `todo-title`의 textContent는 저장된 제목과 **정확히** 같다(번호·불릿·상태표시 등 어떤 접두·접미 문자열도 붙지 않는다). | [추론] |
| U-12 | 한 항목의 `todo-toggle`·`todo-title`·`todo-delete`는 그 항목의 `todo-item` 요소의 **자손**이다(`within(item)`으로 찾을 수 있다). | [추론] |
| U-13 | `todo-item` 요소들의 DOM 순서는 표시 대상 목록의 순서와 같다(`queryAllByTestId` 결과 순서 = 목록 순서). | [추론] |
| U-14 | 항목이 0개여도 `todo-input`·`todo-count`·필터 버튼 3개는 그대로 존재한다(빈 목록에서 화면이 사라지지 않는다). | [추론] |

### 2.3 토글·삭제

| # | 문장 | 근거 |
|---|---|---|
| U-15 | `todo-toggle`은 `input[type="checkbox"]` 요소이고, 그 `checked` 프로퍼티가 해당 항목의 완료 상태와 항상 일치한다. — 계약이 "완료 체크박스"라고 부르므로 텍스트 버튼이 아니라 실제 checkbox여야 `.checked` 관측이 가능하다. | [추론] |
| U-16 | `todo-toggle`을 클릭하면 그 항목의 완료 상태가 반전되고, 한 번 더 클릭하면 원래 상태로 돌아온다. | [추론] |
| U-17 | 한 항목을 토글해도 다른 항목의 완료 상태와 목록 순서는 변하지 않는다. | [추론] |
| U-18 | `todo-delete`는 `button` 요소이고, 클릭하면 그 항목 하나만 목록에서 제거된다. | [추론] |
| U-19 | 삭제 후 남은 항목들의 상대 순서는 보존된다. | [추론] |
| U-20 | 삭제·토글은 확인 대화상자 없이 즉시 반영된다(`window.confirm` 등을 호출하지 않는다). | [추론] |

### 2.4 카운트 (S-04가 참이 되려면 "표시" 형식이 정해져야 한다)

| # | 문장 | 근거 |
|---|---|---|
| U-21 | `todo-count`의 textContent는 미완료 항목 개수의 십진 표기와 **정확히** 같다(예: 항목 2개가 미완료면 `"2"`). — 계약이 형식을 주지 않았다. `"2"`는 정확 일치(`textContent === "2"`)와 부분 일치(`.includes("2")`, `/2/`) 양쪽을 모두 만족하는 유일한 선택이므로 실패 가능한 표면이 가장 작다. **이 문서의 결정 중 가장 위험한 항목**이며, AC 출력이 다른 형식을 요구하면 그 출력을 근거로 뒤집는다. | [추론] |
| U-22 | `todo-count`는 현재 선택된 필터와 **무관하게** 전체 목록의 미완료 개수를 센다(완료 필터를 보고 있어도 숨겨진 미완료 항목이 개수에 포함된다). | [추론] |
| U-23 | 항목이 하나도 없으면 `todo-count`는 `"0"`이다. | [추론] |
| U-24 | 항목을 추가·토글·삭제하면 `todo-count`가 같은 렌더에서 즉시 갱신된다. | [추론] |

### 2.5 필터

| # | 문장 | 근거 |
|---|---|---|
| U-25 | 최초 렌더 시 선택된 필터는 **전체**이며, 모든 항목이 보인다. | [추론] |
| U-26 | `filter-active`를 클릭하면 미완료 항목만 `todo-item`으로 렌더된다(완료 항목은 DOM에서 사라진다). | [추론] |
| U-27 | `filter-completed`를 클릭하면 완료 항목만 렌더된다. | [추론] |
| U-28 | `filter-all`을 클릭하면 완료·미완료가 모두 렌더된다. | [추론] |
| U-29 | 필터 선택은 추가·토글·삭제 후에도 유지된다(어떤 조작도 필터를 자동으로 되돌리지 않는다). | [추론] |
| U-30 | 필터가 걸린 상태에서 항목을 토글해 그 항목이 필터 조건에서 벗어나면 목록에서 즉시 사라진다(예: 미완료 필터에서 항목을 완료로 토글 → `todo-item` 1개 감소). | [추론] |
| U-31 | 필터 버튼 3개는 모두 `button` 요소이고 `disabled`가 아니다(현재 선택된 필터를 다시 클릭해도 오류 없이 동작한다). | [추론] |
| U-32 | 현재 선택된 필터 버튼만 `aria-pressed="true"`이고 나머지 둘은 `"false"`다. — 선택 상태 표시 수단을 계약이 정하지 않았고, CSS 수정이 금지되어 클래스로는 관측되지 않으므로 접근성 속성으로 노출한다. | [추론] |
| U-33 | 필터를 바꿔도 항목의 완료 상태·제목·개수는 변하지 않는다(필터는 표시 대상만 고른다). | [추론] |

### 2.6 상태의 수명 — 계약이 범위 밖으로 명시하지 **않은** 지점

| # | 문장 | 근거 |
|---|---|---|
| U-34 | 상태는 브라우저 로컬 저장소에 유지된다. 항목을 추가·토글한 뒤 컴포넌트를 언마운트하고 다시 렌더하면 목록과 각 항목의 완료 상태가 그대로 복원된다. 선택된 필터는 저장하지 않으므로 다시 마운트하면 전체 필터로 시작한다. | [AC 출력] |
| | **↑ 뒤집힌 결정.** 처음 정한 문장은 "메모리에만 유지한다 = 다시 렌더하면 빈 목록"이었다. 근거는 저장 API가 DOM 계약에 없고, 테스트 간 상태 누수가 오히려 다른 AC를 깨뜨릴 위험이 크다는 것이었다. AC-07 출력이 이를 반증했다: `cleanup(); render(<App />); expect(titles()).toEqual(["A","B"])` → `expected [] to deeply equal [ 'A', 'B' ]`. 따라서 영속 저장을 넣었고, 나머지 7개 AC는 그대로 통과한다(= AC 쪽이 케이스마다 저장소를 비운다). 필터를 저장하지 않는다는 부분도 같은 출력이 근거다 — 재렌더 후 완료 항목 A와 미완료 항목 B가 **둘 다** 보여야 하므로 복원된 필터는 전체여야 한다. | |
| U-37 | 저장된 값이 없거나 JSON으로 파싱되지 않거나 배열이 아니거나 항목의 모양이 다르면, 앱은 예외를 던지지 않고 그 값을 버린 뒤 빈 목록으로 시작한다. | [추론] |
| U-35 | 렌더 함수는 부수효과를 일으키지 않는다. `StrictMode`의 이중 렌더에서도 항목이 중복 생성되거나 id가 어긋나지 않는다(id 발급은 이벤트 핸들러에서만 일어난다). | [추론] |
| U-36 | 앱은 네트워크 요청과 타이머를 사용하지 않는다(테스트가 fake timer 없이도 동기적으로 결과를 관측할 수 있다). | [추론] |

### 2.7 미결

- `[MISSING: 항목 0개일 때의 안내 문구]` — 빈 목록에서 안내 텍스트를 보여줄지, 보여준다면 무슨 문장인지 정할 근거가 계약에 없다. 어떤 testid에도 대응하지 않아 관측되지 않으므로 문구를 넣지 않는 쪽으로 구현하고, 이 침묵을 그대로 남긴다.
- `[MISSING: todo-input의 placeholder 문구]` — 계약은 테스트가 testid로만 화면을 찾는다고 못박아 placeholder는 관측 대상이 아니다. 한국어 문구를 임의로 정하되 요구사항으로 취급하지 않는다.

### 2.8 위험 순위 (AC 출력으로 판별할 것)

계약이 침묵한 항목 중 실제 AC와 어긋날 수 있는 순서와, AC 실행 후의 판정:

1. **U-21** `todo-count` 표기 형식 — 숫자만 vs `"2개 남음"` 류 문장. → **유지**(숫자만으로 8개 AC 통과).
2. **U-02** 추가 위치 — 맨 뒤 vs 맨 앞. → **유지**(맨 뒤).
3. **U-34** 영속 저장 여부. → **뒤집힘**. AC-07이 재마운트 후 복원을 요구했다. §2.6 참조.
4. **U-06** 무효 입력 시 입력창 값 유지 vs 비우기. → **유지**(값 유지).

뒤집을 때는 AC 실패 출력만을 근거로 삼았고, 뒤집힌 문장은 위처럼 원래 문장·반증 출력과 함께 고쳐 적었다.

---

## 3. 완료 전 대조

1·2번의 문장을 하나씩 읽으며 그 문장을 참으로 만드는 코드를 지목한다. 지목하지 못한 문장은 없다.

구현 파일: `src/App.tsx`, `src/todos/types.ts`, `src/todos/storage.ts`, `src/todos/useTodos.ts`, `src/todos/TodoItem.tsx`.

### §1 명시된 것

| # | 코드 위치 |
|---|---|
| S-01 | `src/App.tsx:47-55` — `data-testid="todo-input"` 입력창. |
| S-02 | `src/App.tsx:58-62` 표시 대상만 렌더 + `src/todos/TodoItem.tsx:11` `data-testid="todo-item"`. 목록이 비면 `<ul>`이 비어 0개. |
| S-03 | `src/todos/TodoItem.tsx:12-18`(toggle), `:20`(title), `:21-28`(delete) — 항목마다 하나씩. |
| S-04 | `src/App.tsx:65` 표시 + `src/todos/useTodos.ts:39` 미완료 개수 계산. |
| S-05 | `src/App.tsx:7-11` 필터 정의 + `:67-79` 버튼 3개 렌더. |
| S-06 | 9개 testid 전부: `src/App.tsx:48`(input), `:65`(count), `:72`(filter-\*) / `src/todos/TodoItem.tsx:11,13,20,23`. |
| S-07 | `src/App.tsx:13` `export default function App()`. |
| S-08 | 구현은 `src/App.tsx`와 `src/todos/**` 4개 파일에만 있다. 검사: `src/todo.spec.tsx:65-81`. `src/main.tsx`·`index.html`은 손대지 않았다. |
| S-09 | `npm run test:ac` → `Test Files 1 passed / Tests 8 passed (8)`. |
| S-10 | `npm run build` → `tsc -b` 통과 후 `vite build ✓ built`(dist 산출). |
| S-11 | `package.json`의 `build`·`test:ac` 원문 유지(추가한 것은 `test:spec` 한 줄뿐), `tsconfig.app.json:20` `"strict": true`. 검사: `src/todo.spec.tsx:83-90`. |
| S-12 | `tests/ac/**`를 열지 않았다 — `npm run test:ac`로 실행만 했다. 파일명 목록·수정시각 검사: `src/todo.spec.tsx:92-103`, `:128-142`. |
| S-13 | `package.json` `dependencies`는 `react`·`react-dom` 그대로, 새 의존성 설치 없음. 검사: `src/todo.spec.tsx:105-113`. |
| S-14 | `src/App.css`·`src/index.css` 미변경, 새 스타일 파일 없음, 구현 코드에 `className`·`style` 없음(`src/App.tsx`·`src/todos/TodoItem.tsx` 전체). 검사: `src/todo.spec.tsx:115-126`. |
| S-15 | 범위 밖 기능이 코드에 없다: 편집 핸들러 없음(`src/todos/TodoItem.tsx:20`은 텍스트만 렌더), 드래그 속성 없음, 컨트롤은 필터 3개(`src/App.tsx:67-79`)와 항목별 삭제(`TodoItem.tsx:21-28`)뿐, I/O는 `src/todos/storage.ts`의 로컬 저장소 호출뿐(`fetch`·XHR 없음), 로그인·테마·검색·마감일 UI 없음. 검사: `src/todo.spec.tsx`의 S-15 두 테스트와 U-36 정적 검사. |
| S-16 | 화면 문자열은 `src/App.tsx:8-10,44,51,52`, `src/todos/TodoItem.tsx:17,25,27`의 한국어 리터럴뿐이고 로케일 전환 코드가 없다. 검사: `src/todo.spec.tsx`의 S-16 테스트. |

### §2 명시되지 않은 것

| # | 코드 위치 |
|---|---|
| U-01 | `src/App.tsx:31-35` Enter keydown → `submit()`. `:37-40`은 form 제출 경로(중복 추가는 `:33`의 `preventDefault`로 차단). |
| U-02 | `src/todos/useTodos.ts:24` `[...prev, 새 항목]` — 맨 뒤. |
| U-03 | `src/App.tsx:26` 추가 성공 시 `setDraft('')`. |
| U-04 | `src/todos/useTodos.ts:19` `raw.trim()`. |
| U-05 | `src/todos/useTodos.ts:20` 빈 제목이면 `false` 반환, 상태 변경 없음. |
| U-06 | `src/App.tsx:26` — `add`가 `false`면 `setDraft`를 호출하지 않는다. |
| U-07 | `src/todos/useTodos.ts:22-25` — 중복 제목 검사 자체가 없다. |
| U-08 | `src/todos/useTodos.ts:19-24` — 길이 검사·자르기가 없다. |
| U-09 | `src/todos/useTodos.ts:24` `completed: false`. |
| U-10 | `src/todos/useTodos.ts:23` 제목과 무관한 id 발급, `:31`·`:36` id로만 대상 선택. `src/App.tsx:60` `key={todo.id}`. |
| U-11 | `src/todos/TodoItem.tsx:20` — `<span>`의 자식은 `{todo.title}` 하나뿐. |
| U-12 | `src/todos/TodoItem.tsx:11-29` — 셋 다 `<li data-testid="todo-item">`의 자손. |
| U-13 | `src/App.tsx:59-61` — 배열 순서대로 렌더(정렬·역순 없음). |
| U-14 | `src/App.tsx:47`(input), `:65`(count), `:67-79`(필터) — 목록 길이와 무관하게 항상 렌더. |
| U-15 | `src/todos/TodoItem.tsx:12-18` — `<input type="checkbox" checked={todo.completed}>`(controlled). |
| U-16 | `src/todos/TodoItem.tsx:16` `onChange` → `src/todos/useTodos.ts:29-33` `completed: !completed`. |
| U-17 | `src/todos/useTodos.ts:31` — `map`이 대상 id만 새 객체로 바꾸고 순서·타 항목은 그대로. |
| U-18 | `src/todos/TodoItem.tsx:21-28` `<button>` → `src/todos/useTodos.ts:35-37` 해당 id만 제거. |
| U-19 | `src/todos/useTodos.ts:36` `filter` — 남은 순서 보존. |
| U-20 | 구현 어디에도 `confirm`/`alert` 호출이 없다(`src/todo.spec.tsx` U-36 정적 검사가 이를 고정). |
| U-21 | `src/App.tsx:65` `{remaining}` — 숫자 외 문자열 없음. |
| U-22 | `src/todos/useTodos.ts:39` — `todos`(전체) 기준. `src/App.tsx:14,65`는 `visible`이 아니라 `remaining`을 쓴다. |
| U-23 | `src/todos/useTodos.ts:39` — 빈 목록의 `reduce` 초기값 `0`. |
| U-24 | `src/todos/useTodos.ts:39`가 렌더마다 다시 계산되고 `src/App.tsx:65`가 그 값을 표시한다. |
| U-25 | `src/App.tsx:15` `useState<Filter>('all')` + `:21` 전체는 모두 통과. |
| U-26 | `src/App.tsx:19` `filter === 'active'` → `!todo.completed`. |
| U-27 | `src/App.tsx:20` `filter === 'completed'` → `todo.completed`. |
| U-28 | `src/App.tsx:21` `return true`. |
| U-29 | `src/App.tsx:74` — `setFilter`는 필터 버튼 클릭에서만 호출된다. 추가·토글·삭제 경로(`:25-35`, `useTodos.ts:18-37`)는 필터를 건드리지 않는다. |
| U-30 | `src/App.tsx:18-22` — 렌더마다 최신 `todos`에 필터를 다시 적용한다. |
| U-31 | `src/App.tsx:69-77` — `<button type="button">`, `disabled` 속성 없음. |
| U-32 | `src/App.tsx:73` `aria-pressed={filter === item.key}`. |
| U-33 | `src/App.tsx:18-22` — 필터는 표시 대상만 고르고 `todos`를 바꾸지 않는다. |
| U-34 | `src/todos/useTodos.ts:11` 초기값을 저장소에서 읽고, `:13-15`에서 변경마다 저장한다. `src/todos/storage.ts:16-26`(load)·`:29-35`(save). 필터는 저장하지 않는다(`src/App.tsx:15`의 상태는 저장소와 무관). |
| U-35 | `src/todos/useTodos.ts:22-25` — updater가 순수하고(id를 `prev`에서 계산) 렌더 중 부수효과가 없다. 저장은 `useEffect`(`:13-15`)에서만 한다. |
| U-36 | 구현에 `fetch`·`XMLHttpRequest`·`setTimeout`·`setInterval`이 없다. I/O는 `src/todos/storage.ts`의 동기 호출뿐. |
| U-37 | `src/todos/storage.ts:17-25` — `try/catch` + `Array.isArray` + `:22`의 `filter(isTodo)`(`:5-13`). |

### §2.7 미결의 처리

- `[MISSING: 항목 0개일 때의 안내 문구]` — 문구를 넣지 않았다(`src/App.tsx:58-62`는 빈 `<ul>`만 렌더). 어떤 testid에도 대응하지 않으므로 요구사항으로 확정하지 않은 상태 그대로 둔다.
- `[MISSING: todo-input의 placeholder 문구]` — `src/App.tsx:51`에 한국어 문구를 넣었으나 요구사항으로 취급하지 않으며 테스트로 고정하지 않는다.

## 4. 검증

- 자체 테스트: `src/todo.spec.tsx` (36개). 실행 `npm run test:spec` → `Tests 36 passed (36)`.
  - 설정 `vitest.config.ts`(새 파일), `package.json`에 `test:spec` 스크립트 추가. `tests/ac`의 설정과 실행 경로는 건드리지 않았다.
  - `tsconfig.app.json`이 `src/**/*.spec.*`를 제외하므로 `npm run build`에는 영향이 없다.
- 각 `it` 제목 앞에 그 테스트가 지키는 문장 번호(S-xx/U-xx)를 붙였다. 1·2번의 문장 전부가 옮겨졌고, 옮기지 못한 4건(S-09·S-10, S-12의 내용 비교, S-15/S-16의 전수 증명, §2.7의 MISSING 2건)은 그 이유를 `src/todo.spec.tsx` 파일 머리 주석에 적었다.
- 실행 기록: `npm run test:ac` 8/8 통과, `npm run test:spec` 36/36 통과, `npm run build` 성공.
