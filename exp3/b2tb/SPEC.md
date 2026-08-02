# SPEC — Todo 앱

구현 전 요구사항 확정 문서. 구현 산출물이 아니라 작업 문서다.
근거 위치 표기: `[계약 §…]` = 구현 계약 문서의 해당 절, `[추론]` = 계약이 침묵해서 내가 정한 것,
`[CHANGE]` = 변경 요구 문장에서 직접 읽히는 것.

**변경 이력**: 인라인 제목 편집(더블클릭 수정)이 «변경 요구»로 추가됐다. 변경 요구는 계약의 «범위 밖» 목록보다
우선하므로 S-12에서 해당 항목을 뺐다(§1.3). 새 요구는 §1.4(명시된 것)·§2.8(명시되지 않은 것)에 있다.

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

- S-12. **(개정됨)** 로그인·계정 UI, 서버 API·DB 호출, 드래그 정렬, 전체 완료 토글, 완료 일괄 삭제, 마감일·우선순위·태그·검색, 다크모드·테마 전환, 애니메이션, 한국어 외 로케일, SEO 메타태그 — 어느 것도 구현되지 않는다. [계약 §범위 밖]
  — 원문의 "인라인 제목 편집(더블클릭 수정)"은 «변경 요구»가 이를 뒤집었고 변경 요구가 «범위 밖»보다 우선하므로 목록에서 뺐다. 그 대신 §1.4가 적용된다.
- S-13. `src/App.css`·`src/index.css`는 이번 변경에서도 수정되지 않고, 편집 UI를 위한 새 스타일 파일도 추가되지 않는다. [계약 §범위 밖 "CSS·스타일 작업"]
  — 변경 요구가 뒤집은 것은 «인라인 편집» 한 항목뿐이다. "그 외 계약은 그대로다"이므로 CSS 금지는 살아 있다.

### 1.4 [CHANGE] 인라인 제목 편집

- C-01. `todo-title` 엘리먼트에 더블클릭(`dblclick`) 이벤트가 발생하면 그 항목은 편집 상태가 된다. [CHANGE]
- C-02. 편집 상태인 항목 안에는 `data-testid="todo-edit"`인 입력창이 렌더된다. [CHANGE]
- C-03. 편집 상태는 "그 자리에서" 이뤄진다 — `todo-edit`은 편집 대상 항목의 `todo-item` 안에, 원래 제목이 있던 자리에 렌더된다(별도 모달·별도 영역이 아니다). [CHANGE]
- C-04. `todo-edit`에 포커스가 있는 상태에서 Enter 키를 누르면 편집이 **확정**된다 — 그 항목의 제목이 입력창의 값으로 바뀌고 편집 상태가 끝난다. [CHANGE]
- C-05. `todo-edit`에 포커스가 있는 상태에서 Escape 키를 누르면 편집이 **취소**된다 — 그 항목의 제목은 편집 시작 전 값 그대로이고 편집 상태가 끝난다. [CHANGE]
- C-06. 변경 요구가 건드리지 않은 요구(추가·표시·토글·삭제·필터·개수·지속성)는 그대로 유지된다. [CHANGE "다른 요구사항은 그대로다"]

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

### 2.8 [CHANGE] 인라인 제목 편집이 침묵하는 지점

변경 요구는 네 문장(더블클릭 진입 / testid `todo-edit` / Enter 확정 / Escape 취소)뿐이다.
아래는 ① C-01~C-05가 참이 되려면 추가로 정해져야 하는 것, ② 편집 흐름(진입 → 타이핑 → 확정·취소 → 이탈)을
끝까지 따라가며 만난 갈림길, ③ 없으면 이 기능이 완성됐다고 부를 수 없는 항목을 확정한 것이다.

#### 진입 (C-01이 참이 되려면 "무엇이 편집 대상이고, 진입 전후로 무엇이 바뀌나"가 정해져야 한다)

- E-01. 더블클릭 핸들러는 `todo-title` 엘리먼트에만 달린다. `todo-item`(행 전체)·`todo-toggle`·`todo-delete` 더블클릭으로는 편집 상태가 되지 않는다. [추론]
  — 근거: 변경 요구가 "항목 제목을 더블클릭하면"이라고 대상을 제목으로 특정했다. 행 전체에 달면 삭제 버튼 더블클릭이 편집을 여는 부작용이 생긴다.
- E-02. 편집 상태인 항목에서는 `todo-title`이 렌더되지 않는다 — `todo-edit`이 그 자리를 **대체**한다(같은 항목에 제목 텍스트와 편집 입력창이 동시에 존재하지 않는다). [추론]
  — 근거: C-03의 "그 자리에서". TodoMVC 관례도 label을 input으로 교체한다. 이 때문에 편집 중인 항목 한 개에 한해 S-09의 "각 항목에 `todo-title` 1개"가 성립하지 않는다 — 변경 요구가 계약보다 우선하므로 의도된 예외다.
- E-03. 편집 중에도 그 항목의 `todo-toggle`과 `todo-delete`는 그대로 렌더된다. `todo-item` 개수도 변하지 않는다. [추론]
  — 근거: 변경 요구가 교체를 지시한 것은 제목뿐이다. 항목 수·토글·삭제까지 사라지면 C-06(다른 요구사항 유지)을 깬다.
- E-04. 편집 상태인 항목은 최대 1개다. 편집 중에 다른 항목의 제목을 더블클릭하면 편집 대상이 그 항목으로 옮겨가고, 화면에 `todo-edit`은 여전히 1개다. [추론]
- E-05. 편집 상태가 아닐 때 `todo-edit`은 DOM에 존재하지 않는다(개수 0). 첫 렌더에서도 0이다. [추론]
  — 근거: 테스트가 `queryByTestId("todo-edit")`로 편집 종료를 판정할 통로가 이것뿐이다.
- E-06. `todo-edit`의 초기 값은 편집 시작 시점의 그 항목 제목과 정확히 같다. [추론]
- E-07. `todo-edit`은 마운트되면 포커스를 받는다. [추론]
  — 근거: 변경 요구가 Enter·Escape를 **키 입력**으로 규정했다. 포커스가 없으면 키 이벤트가 입력창에 오지 않아 C-04·C-05가 성립하지 않는다.
- E-08. 완료된 항목의 제목을 더블클릭해도 똑같이 편집 상태가 된다(완료 여부는 편집 가능성을 제한하지 않는다). [추론]
- E-09. 편집 진입은 목록·완료 여부·개수·필터를 바꾸지 않는다. 진입만으로는 `todo-count`도 저장소 내용도 변하지 않는다. [추론]

#### 타이핑

- E-10. `todo-edit`은 제어 컴포넌트다 — 입력한 문자가 즉시 `value`에 반영되고, `user.type`·`fireEvent.change` 어느 경로로도 값이 바뀐다. [추론]
- E-11. 편집 중 `todo-edit`의 값을 바꿔도 확정 전에는 `todo-title`·`todo-count`·저장소가 바뀌지 않는다(편집 중 값은 임시 상태다). [추론]

#### 확정 (C-04)

- E-12. 확정되는 제목은 입력값의 앞뒤 공백을 제거한 문자열이다. [추론]
  — 근거: 추가 경로(U-03)와 같은 규칙. 같은 앱에서 제목이 만들어지는 두 경로가 다르게 굴면 안 된다.
- E-13. 확정 후 그 항목의 `todo-title` 텍스트는 확정된 제목과 정확히 같고, `todo-edit`은 DOM에서 사라진다. [추론]
- E-14. 확정은 그 항목의 **제목만** 바꾼다 — 완료 여부, 목록 내 위치, id, 다른 항목은 그대로다. [추론]
- E-15. 확정으로 항목이 추가되거나 삭제되지 않는다(`todo-item` 개수 불변). [추론]
- E-16. 값을 바꾸지 않고 Enter를 눌러도 제목은 그대로이고 편집 상태만 끝난다(오류 없음). [추론]
- E-17. **입력값이 빈 문자열이거나 공백뿐이면 Enter는 제목을 바꾸지 않는다 — 원래 제목을 유지한 채 편집 상태만 끝난다(항목을 삭제하지 않는다).** [추론]
  — 근거: ⑴ 이 앱은 이미 "빈 입력은 아무 일도 하지 않는다"를 추가 경로에서 확정했다(U-04). 제목을 만드는 두 경로의 규칙을 일치시킨다.
    ⑵ 변경 요구는 Enter를 "확정"으로만 규정했다. 확정할 내용이 없으면 확정할 것도 없다.
    ⑶ 계약의 «범위 밖»은 "완료 일괄 삭제"를 금지할 만큼 삭제 기능에 보수적이다. 명시되지 않은 삭제 경로를 새로 만드는 쪽이 더 큰 가정이다.
  — **대안이 있었음을 명시한다**: TodoMVC 관례는 빈 제목 확정 시 항목을 삭제한다. 이 갈림길은 변경 요구로 판정할 수 없다. 인수 테스트가 삭제를 요구하면 이 문장을 뒤집는다(U-29를 뒤집었던 것과 같은 근거로).
- E-18. Enter는 `keydown`에서 처리한다. [추론]
  — 근거: `fireEvent.keyDown`·`user.keyboard("{Enter}")`·`user.type("...{Enter}")` 모두가 통과하는 유일한 지점.
- E-19. 편집 중 Enter가 새 항목을 추가하지 않는다 — `todo-edit`은 `todo-input`의 `<form>` 바깥(항목 `<li>` 안)에 있어 폼 제출로 이어지지 않는다. [추론]
- E-20. 확정된 제목은 저장소에 반영되어, 언마운트 후 다시 마운트하면 바뀐 제목이 보인다. [추론]
  — 근거: U-29의 지속성 요구는 제목에도 적용된다. 저장은 `todos`가 바뀔 때 일어나므로 제목 변경도 같은 경로를 탄다.

#### 취소 (C-05)

- E-21. Escape는 `keydown`에서 처리하고, `event.key`가 `"Escape"`인 경우를 인식한다(구형 `"Esc"`도 같이 받는다). [추론]
- E-22. 취소 후 그 항목의 `todo-title` 텍스트는 편집 시작 전 제목과 정확히 같다 — 편집 중 입력한 값은 버려진다. [추론]
- E-23. 취소 후 `todo-edit`은 DOM에서 사라진다. [추론]
- E-24. 취소는 목록·완료 여부·개수·저장소를 바꾸지 않는다. [추론]
- E-25. 취소한 뒤 같은 제목을 다시 더블클릭하면 `todo-edit`의 값은 다시 **원래 제목**이다(버려진 편집 값이 되살아나지 않는다). [추론]

#### 이탈 — 계약도 변경 요구도 언급하지 않은 경로

- E-26. `todo-edit`이 포커스를 잃으면(blur) 편집은 **확정**된다(E-12·E-17과 같은 규칙을 따른다). [추론]
  — 근거: TodoMVC 관례. 편집 입력창이 화면에 남은 채 포커스만 없는 상태를 만들면, 다른 항목을 조작하는 동안 `todo-edit`이 계속 존재해 E-05를 관측 불가능하게 만든다.
- E-27. Enter·Escape로 편집이 끝난 뒤 뒤따르는 blur가 같은 편집을 **다시** 처리하지 않는다(확정·취소는 편집 1회당 정확히 1번만 일어난다). [추론]
  — 근거: 입력창이 언마운트될 때 blur가 뒤늦게 오면 Escape로 버린 값이 되살아나 E-22를 깰 수 있다.
- E-28. 편집 중인 항목이 사라져도(삭제되거나 필터에 걸러져도) 오류 없이 편집 상태가 끝나며, 화면에 `todo-edit`이 남지 않는다. [추론]

#### 다른 기능과의 상호작용 (C-06)

- E-29. 편집은 필터를 바꾸지 않고, 편집 중에도 필터 버튼·추가 입력창·다른 항목의 토글/삭제는 정상 동작한다. [추론]
- E-30. 제목 변경은 `todo-count`를 바꾸지 않는다(개수는 완료 여부만 센다). [추론]
- E-31. 편집 상태 자체는 저장되지 않는다 — 다시 마운트하면 어떤 항목도 편집 상태가 아니다(`todo-edit` 0개). [추론]
  — 근거: U-34와 같은 결. 저장 대상은 항목 목록뿐이다.
- E-32. 같은 제목으로 확정해도 중복 검사를 하지 않는다(다른 항목과 제목이 같아져도 그대로 둔다). [추론]
  — 근거: 추가 경로가 중복을 허용한다(U-07).
- E-33. 편집 관련 문구(입력창 `aria-label` 등)는 한국어다. [계약 §범위 밖 "다국어(한국어 단일 로케일)"]
- E-34. 편집 기능을 위해 외부 패키지를 추가하지 않는다(S-01 유지). [추론]

#### 이번 변경에서 판정하지 못한 것

- `[MISSING: 빈 제목 확정의 옳은 동작]` — E-17에 근거를 적어 "원래 제목 유지"로 확정했으나, 변경 요구·계약 어느 쪽도 이 갈림길을 판정하지 않는다. 인수 테스트가 반증하면 뒤집는다.
- `[MISSING: 편집 중 다른 항목 제목을 더블클릭했을 때 이전 편집의 처리]` — E-04(편집 대상 이동) + E-26(blur 확정)의 조합으로 "이전 편집은 확정된다"가 되지만, 이는 두 추론의 부산물이지 근거로 정한 값이 아니다.

### 확정하지 못한 것 / 뒤집힌 것

- 확정하지 못해 `[MISSING]`으로 남긴 항목: 변경 전에는 없었다. 이번 변경에서 2건이 생겼다(§2.8 "이번 변경에서 판정하지 못한 것").
  둘 다 근거로 판정할 수 없어 추론으로 값을 정하고, 무엇을 근거로 정했는지와 반증 시 뒤집을 조건을 함께 적었다.
- 뒤집힌 항목: **U-29**. 관례에 기대 "메모리 전용"으로 확정했으나 AC-07이 반증했다. 위 U-29 항목에 경위를 적었고,
  뒤집으면서 새로 생긴 갈림길(U-33~U-37: 저장소·키·저장 범위·깨진 데이터·id 충돌)을 같은 형식으로 확정했다.
- 나머지 추론 항목 중 관례에 기댄 것(U-06 추가 위치, U-25 개수 표기 형식)은 8/8 통과로 반증되지 않았다.

---

## 3. 완료 전 대조

1·2번 문장을 하나씩 읽으며 그 문장을 참으로 만드는 코드를 지목한 결과.
지목하지 못한 문장은 없다. 기각한 문장도 없다.

**검증 방법**: `npm run test:ac`는 8/8 통과하지만 이 8개는 변경 전 요구만 덮는다(변경 후에도 개수·내용이 그대로였다).
즉 인수 테스트는 §1.4·§2.8을 **판정해 주지 않는다**. 그래서 C-01~C-06·E-01~E-34를 확인할 임시 테스트를 저장소 밖 경로에
따로 만들어 25개 케이스로 돌려 전부 통과시킨 뒤 삭제했다(`user-event` 경로와 `fireEvent` 경로를 모두 포함).
아래 표의 코드 위치는 그 확인을 거친 것이다. `tests/ac/**`는 실행만 했고 열지 않았다.

| 문장 | 코드 위치 |
|---|---|
| S-01 | `package.json` 의존성 변경 없음 — 앱이 import하는 외부 패키지는 `react`뿐 (`src/App.tsx:1`, `src/todo/useTodos.ts:1`, `src/todo/TodoInput.tsx:1-2`, `src/todo/TodoEdit.tsx:1-2`) |
| S-02 | `src/App.tsx:9` `export default function App()` |
| S-03 | 추가·수정한 파일: `src/App.tsx`, `src/todo/{types,filter,storage,useTodos}.ts`, `src/todo/{TodoInput,TodoItem,FilterBar,TodoEdit}.tsx`, `SPEC.md` — 이번 변경에서 새로 만든 것은 `src/todo/TodoEdit.tsx` 하나 |
| S-04 | `src/App.css`·`src/index.css` 미수정, 새 스타일 파일 없음, 어떤 컴포넌트도 CSS를 import하지 않음 |
| S-05 | `npm run build` 종료 코드 0 (`tsc -b` 통과 + `dist/` 생성) |
| S-06 | `npm run test:ac` 8/8 통과 |
| S-07 | `src/todo/TodoInput.tsx:41` `data-testid="todo-input"` — `src/App.tsx:32`에서 1회만 렌더 |
| S-08 | `src/App.tsx:34-45` `visible.map` → `src/todo/TodoItem.tsx:24` `data-testid="todo-item"` |
| S-09 | `src/todo/TodoItem.tsx:26`(toggle) `:41`(title) `:46`(delete) — 모두 `:24`의 `<li>` 안. **단 편집 중인 항목 1개는 `todo-title` 대신 `todo-edit`이 렌더된다 (E-02, 변경 요구가 만든 의도된 예외)** |
| S-10 | `src/App.tsx:48` `data-testid="todo-count"` |
| S-11 | `src/todo/FilterBar.tsx:8-12` 세 항목 × `:20` `data-testid={`filter-${value}`}` |
| S-12 | 해당 기능 코드 없음 — `src/todo/` 전체에 드래그·일괄 토글/삭제·검색·테마·i18n·애니메이션 코드 부재 (인라인 편집은 변경 요구로 목록에서 빠졌다) |
| S-13 | `src/App.css`·`src/index.css` 미수정. `src/todo/TodoEdit.tsx`는 `className`·인라인 스타일·CSS import 없이 `data-testid`와 `aria-label`만 쓴다 (`:62-71`) |
| U-01 | `src/todo/TodoInput.tsx:27-31` `onKeyDown`에서 Enter → `commit()`; 바인딩은 `:47` |
| U-02 | `src/todo/TodoInput.tsx:14-20` `commit()`이 `draftRef`를 즉시(동기) 비우므로, 뒤따르는 `onSubmit`(`:33-36`)은 빈 값으로 `:16`에서 반환. 추가로 `:29` `preventDefault()`가 암묵 제출 자체를 막는다 |
| U-03 | `src/todo/TodoInput.tsx:15` `draftRef.current.trim()` |
| U-04 | `src/todo/TodoInput.tsx:16` `if (!title) return` |
| U-05 | `src/todo/TodoInput.tsx:18-19` `draftRef.current = ""; setDraft("")` (입력은 `:43` `value={draft}`로 제어) |
| U-06 | `src/todo/useTodos.ts:23` `[...prev, { id, title, completed: false }]` — 뒤에 붙임 |
| U-07 | `src/todo/useTodos.ts:20-24` `add`에 중복 검사 없음 |
| U-08 | `src/todo/useTodos.ts:12-14`(초기값) `:21-22`(`nextId.current` 사용 후 +1) — 시각·난수 미사용 |
| U-09 | `src/todo/TodoItem.tsx:41-43` `<span data-testid="todo-title">{todo.title}</span>` — 자식이 제목 하나뿐 |
| U-10 | `src/App.tsx:32`(input) `:48`(count) `:50`(filters) — `visible` 길이와 무관하게 렌더 |
| U-11 | `src/todo/TodoItem.tsx:27` `type="checkbox"` + `:28` `checked={todo.completed}` |
| U-12 | `src/todo/useTodos.ts:28-30` `todo.id === id`인 항목만 교체 |
| U-13 | `src/todo/useTodos.ts:23` `completed: false` |
| U-14 | `src/todo/useTodos.ts:28` `map` — 길이·순서 보존 |
| U-15 | `src/todo/TodoItem.tsx:45-52` `<button type="button">` + `:49` `onClick={() => onDelete(todo.id)}` (→ `src/App.tsx:23-27` `deleteTodo` → `src/todo/useTodos.ts:34-36` `remove`) |
| U-16 | `src/todo/useTodos.ts:35` `filter` — 상대 순서 보존 |
| U-17 | `src/App.tsx:11` `useState<Filter>("all")` |
| U-18 | `src/todo/filter.ts:7-8` `case "active"` → `!todo.completed` (걸러진 항목은 `src/App.tsx:21` map에 들어가지 않아 DOM에 없음) |
| U-19 | `src/todo/filter.ts:9-10` `case "completed"` → `todo.completed` |
| U-20 | `src/todo/filter.ts:5-6` `case "all"` → `todos` 그대로 |
| U-21 | `src/App.tsx:15` 렌더마다 다시 계산되는 파생값 |
| U-22 | `src/App.tsx:15` 동일 — `add`는 필터 상태를 건드리지 않음(`src/todo/useTodos.ts:20-24`) |
| U-23 | `src/todo/FilterBar.tsx:18-26` `disabled` 속성 미사용 |
| U-24 | `src/todo/FilterBar.tsx:22` `aria-pressed={value === current}` |
| U-25 | `src/App.tsx:48` `<span data-testid="todo-count">{activeCount}</span>` — span 자식은 숫자뿐 ("미완료" 문구는 span 바깥) |
| U-26 | `src/App.tsx:16` `todos`(필터 적용 전) 기준 계산 |
| U-27 | `src/App.tsx:16` 빈 배열 → `0` |
| U-28 | `src/App.tsx:16` 렌더마다 파생 계산 (add/toggle/remove/rename 모두 `todos`를 갱신) |
| U-29 | `src/todo/useTodos.ts:10` `useState<Todo[]>(loadTodos)`(복원) + `:16-18` `useEffect(() => saveTodos(todos), [todos])`(저장) |
| U-30 | `src/todo/useTodos.ts` 전체 — 타이머·fetch·Promise 없음. 저장은 커밋 후 effect(`:16-18`)에서만 |
| U-31 | `src/todo/useTodos.ts:10` 초기화 함수는 읽기 전용, `:16-18` effect의 저장은 같은 값을 몇 번 써도 결과가 같음 |
| U-32 | `src/todo/TodoInput.tsx:44-45`, `src/todo/FilterBar.tsx:9-11`, `src/todo/TodoItem.tsx:29,48,51`, `src/todo/TodoEdit.tsx:67`, `src/App.tsx:31,48` 한국어 문구만 존재 |
| U-33 | `src/todo/storage.ts:3` `const STORAGE_KEY = "todo-b2tb.todos"` — `:18` 읽기 `:32` 쓰기, 다른 키 미사용 |
| U-34 | `src/todo/useTodos.ts:16-18` 저장 대상은 `todos`뿐. 필터는 `src/App.tsx:11` 컴포넌트 상태로만 존재 |
| U-35 | `src/todo/storage.ts:19`(값 없음) `:21`(배열 아님) `:23` `filter(isTodo)`(모양 불일치) `:25-27`(파싱 예외) → 모두 `[]` |
| U-36 | `src/todo/storage.ts:25-27`(읽기) `:33-35`(쓰기) try/catch |
| U-37 | `src/todo/useTodos.ts:12-14` `nextId = max(복원된 id) + 1` |

### 3.1 [CHANGE] 인라인 제목 편집 대조

| 문장 | 코드 위치 |
|---|---|
| C-01 | `src/todo/TodoItem.tsx:41` `onDoubleClick={() => onStartEdit(todo.id)}` → `src/App.tsx:41` `onStartEdit={setEditingId}` → `:38` `editing={todo.id === editingId}` |
| C-02 | `src/todo/TodoEdit.tsx:64` `data-testid="todo-edit"` — `src/todo/TodoItem.tsx:34-39`에서 편집 중인 항목에만 렌더 |
| C-03 | `src/todo/TodoItem.tsx:34-44` 삼항의 두 갈래가 같은 자리를 차지하고, 그 자리는 `:24` `<li data-testid="todo-item">` 안 (모달·별도 영역 없음) |
| C-04 | `src/todo/TodoEdit.tsx:50-53` Enter → `settle(commit)` → `:41` `onCommit(next)` → `src/todo/TodoItem.tsx:37` → `src/App.tsx:18-21` `rename(id,title)` + `setEditingId(null)` |
| C-05 | `src/todo/TodoEdit.tsx:55-58` Escape → `settle(onCancel)` → `src/todo/TodoItem.tsx:38` → `src/App.tsx:43` `setEditingId(null)` (제목은 건드리지 않음) |
| C-06 | 위 U-01~U-37 행 전부 재확인됨 + `npm run test:ac` 8/8 유지 (변경 전과 동일) |
| E-01 | `src/todo/TodoItem.tsx:41`에만 `onDoubleClick`. `:24`(li) `:25-31`(toggle) `:45-52`(delete)에는 없음 |
| E-02 | `src/todo/TodoItem.tsx:34-44` — `editing`이 참이면 `TodoEdit`, 거짓이면 `todo-title` span. 두 갈래는 배타적이라 동시에 존재할 수 없음 |
| E-03 | `src/todo/TodoItem.tsx:25-31`(toggle)·`:45-52`(delete)는 삼항 **바깥**이라 편집 중에도 렌더. `todo-item` `<li>`(`:24`)도 그대로 |
| E-04 | `src/App.tsx:13` `editingId`가 단일 값 → `:38` 한 항목만 `editing=true`. 다른 제목 더블클릭은 `:41`에서 값을 덮어씀 |
| E-05 | `src/App.tsx:13` 초기값 `null` → 어떤 항목도 `editing=true`가 아님 → `src/todo/TodoItem.tsx:40-44` span 갈래만 렌더 |
| E-06 | `src/todo/TodoItem.tsx:36` `title={todo.title}` → `src/todo/TodoEdit.tsx:15` `useState(title)` |
| E-07 | `src/todo/TodoEdit.tsx:23-26` 마운트 effect에서 `focus()` |
| E-08 | `src/todo/TodoItem.tsx:41` 더블클릭 핸들러에 `todo.completed` 조건 없음 |
| E-09 | `src/App.tsx:41` `onStartEdit`은 `setEditingId`만 호출 — `setTodos`·`setFilter` 경로 없음 |
| E-10 | `src/todo/TodoEdit.tsx:66` `value={draft}` + `:44-47` `onChange` (제어 컴포넌트) |
| E-11 | `src/todo/TodoEdit.tsx:15-17` 편집 값은 `TodoEdit` 지역 상태·ref. 밖으로 나가는 통로는 `:41` `onCommit` 하나뿐 |
| E-12 | `src/todo/TodoEdit.tsx:35` `draftRef.current.trim()` |
| E-13 | `src/App.tsx:18-21` `rename` 후 `setEditingId(null)` → `:38` `editing=false` → `src/todo/TodoItem.tsx:40-44` span 복귀 |
| E-14 | `src/todo/useTodos.ts:39-43` `{ ...todo, title }` — `completed`·`id` 보존, `map`이라 위치 보존, `todo.id === id`가 아닌 항목은 그대로 |
| E-15 | `src/todo/useTodos.ts:41` `map` — 길이 불변 |
| E-16 | `src/todo/TodoEdit.tsx:15` 초기 `draft`가 원래 제목 → `:35`에서 같은 값이 나와 `:41`이 같은 제목으로 `rename` |
| E-17 | `src/todo/TodoEdit.tsx:36-40` `if (!next) { onCancel(); return; }` — `onCommit` 미호출, 삭제 경로 없음 |
| E-18 | `src/todo/TodoEdit.tsx:49-53` `handleKeyDown`의 `"Enter"` 갈래, 바인딩은 `:69` `onKeyDown` |
| E-19 | `TodoEdit`은 `src/todo/TodoItem.tsx:34-39`을 통해 `<li>`(`:24`) 안에 렌더되고, `src/todo/TodoInput.tsx:39`의 `<form>` 밖이다. 추가로 `src/todo/TodoEdit.tsx:51` `preventDefault()` |
| E-20 | `src/App.tsx:19` `rename` → `src/todo/useTodos.ts:40` `setTodos` → `:16-18` `useEffect(saveTodos)` |
| E-21 | `src/todo/TodoEdit.tsx:55` `event.key === "Escape" \|\| event.key === "Esc"` |
| E-22 | `src/todo/TodoEdit.tsx:57` `settle(onCancel)` — `draft`를 밖으로 내보내지 않고 `:41` `onCommit`도 건너뜀 |
| E-23 | `src/App.tsx:43` `setEditingId(null)` → `:38` `editing=false` → `src/todo/TodoItem.tsx:40-44` |
| E-24 | `src/App.tsx:43`은 `setEditingId`만 호출 — `todos`가 바뀌지 않으므로 `src/todo/useTodos.ts:16-18` effect의 의존성도 그대로 |
| E-25 | `src/todo/TodoItem.tsx:34-44` 편집 종료 시 `TodoEdit`이 언마운트되어 지역 상태가 사라짐 → 재진입 시 `src/todo/TodoEdit.tsx:15`가 다시 `todo.title`로 초기화 |
| E-26 | `src/todo/TodoEdit.tsx:70` `onBlur={() => settle(commit)}` — `:34-42`의 같은 `commit`을 탐 |
| E-27 | `src/todo/TodoEdit.tsx:20` `settled` ref + `:28-32` `settle` 가드 — 첫 확정·취소 이후 호출은 `:29`에서 반환 |
| E-28 | `src/App.tsx:23-27` `deleteTodo`가 삭제 대상이 편집 중이면 `editingId`를 `null`로. 필터로 사라지는 경우는 `:34` `visible.map`에서 빠져 `TodoEdit`이 언마운트됨 |
| E-29 | `src/App.tsx:15`(filter 파생) `:32`(TodoInput) `:50`(FilterBar) — 모두 `editingId`와 무관하게 렌더·동작 |
| E-30 | `src/App.tsx:16` `activeCount`는 `completed`만 셈. `rename`은 `completed`를 건드리지 않음(`src/todo/useTodos.ts:41`) |
| E-31 | `src/App.tsx:13` `editingId`는 컴포넌트 상태일 뿐 — 저장 경로(`src/todo/useTodos.ts:16-18`)의 대상은 `todos`뿐 |
| E-32 | `src/todo/useTodos.ts:39-43` `rename`에 중복 검사 없음 |
| E-33 | `src/todo/TodoEdit.tsx:67` `aria-label="할 일 제목 수정"` |
| E-34 | `src/todo/TodoEdit.tsx:1-2` — `react`만 import |
