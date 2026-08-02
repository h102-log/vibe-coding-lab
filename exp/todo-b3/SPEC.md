# SPEC — Todo 앱 요구사항 확정

작업 문서. 구현 산출물이 아니다.
근거 위치는 «구현 계약» 문서의 절 이름으로 표기한다.

---

## 1. 명시된 것

계약에서 직접 읽어낼 수 있는 요구를 검증 가능한 문장으로 옮긴다.

### 1.1 스택·진입점

- S1. 앱은 Vite + React + TypeScript로 동작하며, 다른 프레임워크 런타임을 도입하지 않는다. — «고정된 것»
- S2. `src/App.tsx`는 컴포넌트를 default export 하고, 앱의 화면 전체는 그 컴포넌트를 렌더링해서 만들어진다. — «고정된 것»
- S3. `npm run build`(= `tsc -b && vite build`)가 종료 코드 0으로 끝난다. — «커맨드», «완료 조건»
- S4. `tsconfig.app.json`의 `"strict": true`, `noUnusedLocals`, `noUnusedParameters`를 켠 상태에서 타입 오류 없이 컴파일된다. — «고정된 것», tsconfig.app.json
- S5. `npm run test:ac`가 종료 코드 0으로 끝난다. — «완료 조건»
- S6. `tests/ac/**`, `package.json`의 `build`·`test:ac` 스크립트, `tsconfig.app.json`의 `"strict": true`는 이 작업 후에도 커밋 전 상태와 바이트 단위로 동일하다. — «고정된 것»
- S7. `src/App.css`, `src/index.css`의 내용은 변경되지 않고, 새 스타일 파일(.css/.scss 등)이 추가되지 않는다. — «범위 밖 / CSS·스타일 작업»

### 1.2 DOM 계약

아래 문장들은 모두 «DOM 계약 (data-testid)» 표가 근거다.

- S8. 새 항목을 입력하는 요소가 화면에 정확히 1개 있고 `data-testid="todo-input"`을 갖는다.
- S9. 항목 하나를 감싸는 요소가 `data-testid="todo-item"`을 갖고, 표시되는 항목 수만큼(0..n) 존재한다.
- S10. 각 `todo-item` 안에 항목 제목 텍스트를 담은 `data-testid="todo-title"` 요소가 정확히 1개 있다.
- S11. 각 `todo-item` 안에 완료 상태를 나타내는 체크박스 `data-testid="todo-toggle"`이 정확히 1개 있다.
- S12. 각 `todo-item` 안에 그 항목을 삭제하는 버튼 `data-testid="todo-delete"`가 정확히 1개 있다.
- S13. 미완료 항목 개수를 표시하는 요소가 정확히 1개 있고 `data-testid="todo-count"`를 갖는다.
- S14. 필터 버튼 3개가 각각 `data-testid="filter-all"`, `filter-active`, `filter-completed`를 갖고 항상 화면에 있다.

### 1.3 범위 밖 (구현하지 않음이 요구사항이다)

- S15. 로그인·계정, 서버 API·DB 호출, 배포 설정이 코드에 없다. — «범위 밖»
- S16. 제목을 인라인으로 편집하는 수단(더블클릭 수정 등)이 없다. — «범위 밖»
- S17. 드래그 정렬, 전체 완료 토글, 완료 일괄 삭제 기능이 없다. — «범위 밖»
- S18. 마감일·우선순위·태그·검색, 다크모드·테마 전환, 애니메이션, 다국어(한국어 외 로케일), SEO 메타태그가 없다. — «범위 밖»

---

## 2. 명시되지 않은 것

계약은 "동작의 세부는 이 문서에 적혀 있지 않다"고 스스로 밝혔다.
아래는 계약이 침묵하는 지점을 세 방향으로 훑어 확정한 것이다. 근거는 전부 `[추론]`이다.

### 2.1 S8(입력창)이 참이 되려면 추가로 정해져야 하는 것 — 항목 추가 경로

- U1. `todo-input`은 텍스트 입력 요소이며, 입력한 문자열이 그대로 값으로 반영된다. `[추론]`
- U2. `todo-input`에 포커스가 있는 상태에서 Enter 키를 누르면 항목이 추가된다. `[추론]`
  — 근거 보강: DOM 계약 표에 "추가 버튼" testid가 없다. 테스트가 항목을 만들 수 있는 경로는 입력창에서의 Enter뿐이다.
- U3. 항목 추가는 (a) 입력창에서의 Enter 키다운, (b) 폼 submit 이벤트 — 두 경로 모두로 발생하며, 한 번의 Enter가 항목을 2개 만들지는 않는다. `[추론]`
  — 테스트가 `fireEvent.keyDown`을 쓰는지 `userEvent.keyboard('{Enter}')`(암묵적 폼 submit)를 쓰는지 계약이 말하지 않으므로 양쪽을 모두 받는다.
- U4. 항목이 추가되면 `todo-input`의 값은 빈 문자열이 된다. `[추론]`
- U5. 입력값의 앞뒤 공백은 제거되어 제목으로 저장된다. `[추론]`
- U6. 입력값이 비었거나 공백뿐이면 항목이 추가되지 않고 항목 개수·미완료 개수가 변하지 않는다. `[추론]`
- U7. 이미 같은 제목의 항목이 있어도 추가는 거부되지 않는다(중복 허용). `[추론]`
  — 계약에 중복 금지 요구가 없고, 금지하면 통과하던 테스트를 깰 위험이 더 크다.
- U8. 새 항목은 목록의 **맨 뒤**에 추가된다. 기존 항목의 상대 순서는 바뀌지 않는다. `[추론]`
  — 계약이 순서를 말하지 않는다. 추가 순서 = 표시 순서가 기본값이다. 테스트 출력이 반대를 가리키면 뒤집는다.

### 2.2 S9~S12(항목)이 참이 되려면 추가로 정해져야 하는 것

- U9. 각 항목은 제목과 별개로 고유 식별자를 갖고, 제목이 같은 두 항목도 서로 다른 항목으로 취급된다. `[추론]`
- U10. `todo-title`의 텍스트 내용은 저장된 제목 문자열과 정확히 같다(접두·접미 장식 없음). `[추론]`
- U11. `todo-toggle`은 `<input type="checkbox">`이고, `checked` 속성이 그 항목의 완료 여부와 항상 일치한다. `[추론]`
  — 테스트가 `toBeChecked()`를 쓸 수 있는 형태여야 한다.
- U12. `todo-toggle`을 클릭하면 그 항목의 완료 여부가 반전되고, **다른 항목의 상태와 목록 순서는 변하지 않는다**. `[추론]`
- U13. 항목의 초기 완료 여부는 미완료다. `[추론]`
- U14. `todo-delete`를 클릭하면 그 항목만 목록에서 사라지고 나머지 항목의 상대 순서는 유지된다. `[추론]`
- U15. `todo-delete`는 `<button type="button">`이며, 폼 안에 있더라도 클릭이 폼 submit(=항목 추가)을 일으키지 않는다. `[추론]`

### 2.3 S13(미완료 개수)이 참이 되려면 추가로 정해져야 하는 것

- U16. `todo-count`의 텍스트에는 미완료(완료되지 않은) 항목 개수가 아라비아 숫자로 포함된다. `[추론]`
- U17. `todo-count`가 세는 대상은 **현재 필터로 걸러진 목록이 아니라 전체 목록**의 미완료 항목이다. `[추론]`
  — 필터는 보기(view)일 뿐이라는 해석. 계약이 `todo-count`를 필터와 묶어 설명하지 않았다.
- U18. 항목이 하나도 없으면 `todo-count`는 `0`을 표시한다(요소 자체는 계속 존재한다). `[추론]`
- U19. `todo-count`의 텍스트는 숫자 외 장식을 포함하지 않는다(값이 2이면 정확히 `2`). `[추론]`
  — 테스트가 `textContent`를 정확히 비교할 가능성과 부분 문자열로 비교할 가능성이 둘 다 있다. 숫자만 두면 두 경우 모두 통과한다. 테스트 출력이 특정 문구(예: "N개 남음")를 요구하면 그때 좁힌다.

### 2.4 S14(필터)가 참이 되려면 추가로 정해져야 하는 것

- U20. 앱을 처음 렌더링했을 때 활성 필터는 "전체"다. `[추론]`
- U21. `filter-all`이 활성일 때 렌더링되는 `todo-item`의 개수는 전체 항목 수와 같다. `[추론]`
- U22. `filter-active`를 클릭하면 완료되지 않은 항목만 `todo-item`으로 렌더링된다. `[추론]`
- U23. `filter-completed`를 클릭하면 완료된 항목만 `todo-item`으로 렌더링된다. `[추론]`
- U24. 필터에서 제외된 항목은 CSS로 숨기는 것이 아니라 DOM에 렌더링되지 않는다. `[추론]`
  — 테스트는 `getAllByTestId('todo-item')`으로 센다. 숨김 처리는 개수가 줄지 않아 실패한다.
- U25. 필터가 걸린 상태에서 항목의 완료 여부를 토글하면, 그 항목은 현재 필터 조건에 맞는지 여부에 따라 즉시 목록에서 사라지거나 나타난다. `[추론]`
- U26. 필터를 바꿔도 항목 데이터(제목·완료 여부·순서)는 변하지 않는다. `[추론]`
- U27. 필터가 걸린 상태에서 항목을 추가하면 항목은 전체 목록에 추가되며, 현재 필터 조건에 맞을 때만 화면에 보인다. `[추론]`
- U28. 세 필터 버튼은 `<button type="button">`이며, 현재 활성 필터인 버튼은 `aria-pressed="true"`, 나머지는 `"false"`를 갖는다. `[추론]`
  — 계약은 활성 표시 방법을 규정하지 않는다. 클래스명은 계약상 자유이므로 테스트가 의존할 수 없고, `aria-pressed`가 가장 표준적인 표현이다. 어느 쪽이든 개수 기반 테스트를 깨지 않는다.

### 2.5 사용 흐름을 처음부터 끝까지 따라가며 나온 갈림길

- U29. 앱을 처음 렌더링했을 때 항목은 0개이며 시드 데이터가 없다. `[추론]`
- ~~U30. 앱은 상태를 브라우저 저장소(localStorage 등)에 저장하지 않는다.~~ **반증됨.**
  — 최초 잠정 확정 근거: 계약의 «범위 밖»은 "서버 API·DB"만 적었고 localStorage는 침묵한다. 지속성을 넣으면
  앞 테스트가 만든 항목이 다음 테스트로 새어 들어갈 위험이 있다고 보아 넣지 않는 쪽을 골랐다.
  — 반증: `npm run test:ac`의 AC-07이 "items and done state survive a remount, via localStorage"로 실패했다.
  즉 이 항목은 계약 문서가 침묵했을 뿐 **요구사항이었다**. 아래 U30'으로 대체한다.
- U30'. 항목 목록(제목·완료 여부·순서)은 `localStorage`에 저장되고, 컴포넌트를 언마운트한 뒤 다시 마운트하면
  마지막 상태가 그대로 복원된다. `[추론 — AC-07 출력으로 확정]`
- U38. 저장소에 값이 없거나, JSON으로 파싱되지 않거나, 배열이 아니거나, 항목 모양(id·title·completed)에
  맞지 않는 원소가 섞여 있으면, 앱은 예외를 던지지 않고 파싱 가능한 항목만(하나도 없으면 빈 목록으로) 시작한다. `[추론]`
- U39. 목록이 바뀔 때마다(추가·토글·삭제) 저장소의 값이 새 목록으로 갱신된다. 필터 변경은 목록을 바꾸지 않는다. `[추론]`
- U40. 저장소에서 복원한 뒤 새로 추가하는 항목의 id는 복원된 어떤 항목의 id와도 겹치지 않는다. `[추론]`
  — 겹치면 토글·삭제가 엉뚱한 항목에 적용된다. U9가 복원 경로에서도 참이어야 한다는 요구다.
- U41. `localStorage` 접근이 실패해도(비활성·quota 초과) 앱은 예외를 던지지 않고 화면 상태로 계속 동작한다. `[추론]`
- U31. 앱은 항목 수·완료 상태와 무관하게 예외를 던지지 않고, 목록이 비어도 `todo-input`·`todo-count`·필터 버튼 3개는 계속 렌더링된다. `[추론]`
- U32. 앱은 React `StrictMode`(개발 시 이펙트·렌더 2회 실행) 아래에서도 항목이 중복 생성되지 않는다 — 상태 변경은 이벤트 핸들러에서만 일어나고 렌더 중 부수효과가 없다. `[추론]`
  — `src/main.tsx`가 `<StrictMode>`로 감싼다.

### 2.6 계약이 "범위 밖"이라 적지 않았지만 없으면 완성이라 부를 수 없는 것

- U33. 한국어 UI 문구(라벨·버튼 텍스트·placeholder)가 제공된다. 단, 테스트가 찾는 것은 `data-testid`뿐이므로 문구는 자유롭게 정한다. `[추론]`
- U34. 입력창과 필터 버튼은 스크린리더가 용도를 알 수 있도록 접근 가능한 이름을 갖는다(`aria-label` 또는 보이는 텍스트). `[추론]`
- U35. 각 `todo-toggle` 체크박스는 자기 항목 제목과 연결된 접근 가능한 이름을 갖는다. `[추론]`
- U36. 목록은 `<ul>/<li>` 같은 목록 시맨틱으로 표현되고, React 리스트 렌더링에 항목 고유 id를 key로 쓴다. `[추론]`
- U37. 앱은 `src/App.tsx` 하나 또는 그 아래 새로 만든 파일들로 구성되며, 기존 `src/main.tsx`·`index.html`을 수정하지 않아도 동작한다. `[추론]`

### 2.7 근거로 확정하지 못한 것

- ~~`[MISSING: todo-count의 정확한 문구]`~~ — **해소.** U19(숫자만)로 8/8 통과. 문구를 요구하는 테스트는 없다.
- ~~`[MISSING: 새 항목의 삽입 위치]`~~ — **해소.** U8(맨 뒤)로 통과. AC-07이 추가 순서대로 `["A", "B"]`를 기대한다.
- ~~`[MISSING: 상태 지속성 요구 여부]`~~ — **해소.** 요구된다. U30' 참조.

---

## 3. 완료 전 대조

1·2번의 각 문장을 읽으며 그 문장을 참으로 만드는 코드 위치를 지목한다.
지목하지 못하면 구현되지 않은 것으로 본다.

검증 실행 결과: `npm run test:ac` → 8 passed (8), `npm run build` → 종료 코드 0.

### 1번 대조

| 문장 | 코드 위치 |
|---|---|
| S1 스택 유지 | `package.json` 무변경 (git status), `src/App.tsx:1` react import |
| S2 default export | `src/App.tsx:20` |
| S3 build 성공 | `npm run build` 종료 코드 0 (vite build 완료) |
| S4 strict 타입체크 | `npm run build`의 `tsc -b` 통과 |
| S5 test:ac 성공 | `npm run test:ac` 8 passed |
| S6 동결 파일 무변경 | `git status --porcelain -- tests package.json tsconfig.app.json` → 0줄 |
| S7 CSS 무변경·추가 없음 | `git status`가 `src/App.css`·`src/index.css` 무변경, `src/**/*.css`는 그 2개뿐 |
| S8 todo-input | `src/App.tsx:65` |
| S9 todo-item 0..n | `src/App.tsx:78` (`visible.map`, 77) |
| S10 todo-title | `src/App.tsx:86` |
| S11 todo-toggle | `src/App.tsx:80` |
| S12 todo-delete | `src/App.tsx:88` |
| S13 todo-count | `src/App.tsx:100` |
| S14 필터 3버튼 | `src/App.tsx:104-114`, 목록 `src/App.tsx:14-18` |
| S15 로그인·서버 없음 | `src/App.tsx`·`todos.ts`·`storage.ts`에 fetch/auth 식별자 0건 (grep) |
| S16 인라인 편집 없음 | `onDoubleClick`/`dblclick` 핸들러 0건 (grep) |
| S17 드래그·일괄토글·일괄삭제 없음 | `onDrag`/`toggleAll`/`clearCompleted` 0건 (grep) |
| S18 마감일·테마·i18n 등 없음 | 해당 식별자 0건 (grep); `Todo` 필드는 id·title·completed뿐 (`src/todos.ts:1-5`) |

### 2번 대조

| 문장 | 코드 위치 |
|---|---|
| U1 텍스트 입력 반영 | `src/App.tsx:66-68` |
| U2 Enter로 추가 | `src/App.tsx:50-54` |
| U3 keydown·submit 양쪽, 중복 추가 없음 | `src/App.tsx:43-46`(submit) + `50-54`(keydown에서 `preventDefault`로 암묵적 submit 차단) |
| U4 추가 후 입력창 비움 | `src/App.tsx:39` |
| U5 앞뒤 공백 제거 | `src/todos.ts:12-15` `normalizeTitle` |
| U6 공백뿐이면 추가 안 함 | `src/todos.ts:14`(null 반환) + `src/App.tsx:35`(early return) |
| U7 중복 제목 허용 | `src/todos.ts:18-20` `addTodo`에 중복 검사 없음 |
| U8 맨 뒤에 추가 | `src/todos.ts:19` `[...todos, {...}]` |
| U9 고유 id | `src/App.tsx:37-38` (`nextId` 증가 후 사용), `src/todos.ts:2` |
| U10 제목 텍스트 동일 | `src/App.tsx:86` (`{todo.title}` 단독) |
| U11 checkbox·checked 일치 | `src/App.tsx:81-82` |
| U12 토글은 해당 항목만·순서 유지 | `src/todos.ts:23-27` `map` |
| U13 초기 미완료 | `src/todos.ts:19` `completed: false` |
| U14 삭제는 해당 항목만·순서 유지 | `src/todos.ts:30-32` `filter` |
| U15 삭제 버튼이 submit 유발 안 함 | `src/App.tsx:89` `type="button"` |
| U16 미완료 개수 숫자 표시 | `src/App.tsx:57, 100` |
| U17 필터 아닌 전체 기준 | `src/App.tsx:57` — 인자가 `visible`이 아니라 `todos` |
| U18 빈 목록이면 0 | `src/todos.ts:47-49` (`reduce` 초기값 0) + `src/App.tsx:100` |
| U19 숫자 외 장식 없음 | `src/App.tsx:100` |
| U20 기본 필터 all | `src/App.tsx:24` |
| U21 all = 전체 | `src/todos.ts:42-43` |
| U22 active = 미완료만 | `src/todos.ts:36-37` |
| U23 completed = 완료만 | `src/todos.ts:38-39` |
| U24 제외 항목은 DOM에 없음 | `src/App.tsx:77` (`visible.map`, CSS 숨김 아님) |
| U25 토글 시 즉시 반영 | `src/App.tsx:56` (렌더마다 파생) |
| U26 필터 변경이 데이터 불변 | `src/App.tsx:110` (`setFilter`만 호출), `src/todos.ts:34-45`(비파괴) |
| U27 필터 중 추가 | `src/App.tsx:38`(전체 목록에 추가) + `56`(표시는 필터 적용) |
| U28 활성 필터 aria-pressed | `src/App.tsx:109` |
| U29 초기 0개(시드 없음) | `src/App.tsx:22` + `src/storage.ts:22-23`(빈 저장소 → `[]`) |
| U30' localStorage 지속·복원 | 저장 `src/App.tsx:28-30` → `src/storage.ts:37-44`; 복원 `src/App.tsx:22` → `src/storage.ts:19-33` |
| U38 깨진 저장값 방어 | `src/storage.ts:20-32` (`try/catch`, `Array.isArray`, `filter(isTodo)`), `isTodo` `src/storage.ts:5-14` |
| U39 변경 시마다 저장 | `src/App.tsx:28-30` (`useEffect` 의존성 `[todos]`) |
| U40 복원 후 id 미충돌 | `src/storage.ts:47-53` `nextIdSeed` + `src/App.tsx:25` |
| U41 저장소 실패해도 동작 | `src/storage.ts:20·31`(load catch), `38·41`(save catch) |
| U31 목록 비어도 UI 유지 | `src/App.tsx:63-74, 99-101, 103-115` (모두 `visible.map` 바깥) |
| U32 StrictMode 중복 없음 | 상태 변경은 이벤트 핸들러(`src/App.tsx:33-54, 83, 90, 110`)에서만; 유일한 이펙트(`28-30`)는 저장만 하며 멱등 |
| U33 한국어 문구 | `src/App.tsx:15-17, 61, 70, 73, 93` |
| U34 입력·필터 접근 가능한 이름 | `src/App.tsx:71`(aria-label), `112`(버튼 텍스트) |
| U35 체크박스 이름 | `src/App.tsx:84` |
| U36 목록 시맨틱·key | `src/App.tsx:76-97`, key는 `78` |
| U37 main.tsx·index.html 무수정 | `git status --porcelain -- src/main.tsx index.html` → 0줄 |

### 기각한 문장

없다. 1·2번의 모든 문장에 대해 코드 위치를 지목했고, 반증된 U30은 삭제가 아니라 U30'으로 대체해 구현했다.
