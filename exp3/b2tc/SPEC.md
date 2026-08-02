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
9. 앱은 로그인·서버 API·DB·~~인라인 제목 편집~~·드래그 정렬·전체완료 토글·완료 일괄 삭제·마감일·우선순위·태그·검색·테마 전환·애니메이션·다국어·SEO 메타태그 중 어느 것도 렌더하거나 수행하지 않는다. [계약 §범위 밖]
    **개정(2026-08-02): 인라인 제목 편집은 제외한다.** 변경 요구가 범위 밖 목록보다 우선하므로
    더블클릭 인라인 편집은 이제 **구현해야 하는 것**이다(§1-C). 나머지 범위 밖 항목은 그대로다. [변경 요구 §규칙]
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

## 1-C. 명시된 것 — 변경 요구(인라인 제목 편집)

변경 요구 원문: "항목 제목을 더블클릭하면 그 자리에서 편집할 수 있게 하라. 편집 입력창의 testid는
todo-edit, Enter로 확정하고 Escape로 취소한다. 다른 요구사항은 그대로다."

54. 어떤 항목의 `todo-title`을 더블클릭하면 앱은 그 항목의 제목을 고칠 수 있는 입력창을 그 항목 자리에 렌더한다. [변경 요구 1문]
55. 그 편집 입력창은 `data-testid="todo-edit"`를 가진다. [변경 요구 2문]
56. 편집 입력창에서 Enter를 누르면 앱은 편집을 확정한다 — 그 항목의 `todo-title` 텍스트가 입력창의 값이 된다. [변경 요구 2문]
57. 편집 입력창에서 Escape를 누르면 앱은 편집을 취소한다 — 그 항목의 `todo-title` 텍스트가 편집 전 값 그대로 남는다. [변경 요구 2문]
58. §1·§2의 나머지 문장(추가·토글·삭제·카운트·필터·저장·접근성 이름)은 변경 전과 같은 판정 결과를 유지한다. [변경 요구 3문 "다른 요구사항은 그대로다"]

---

## 2-C. 명시되지 않은 것 — 변경 요구

54~57이 참이 되려면 추가로 정해져야 하는 것, 편집 흐름을 처음부터 끝까지 따라갈 때의 갈림길,
그리고 없으면 "편집이 된다"고 부를 수 없는 항목. 변경 요구는 네 문장뿐이고 아래는 전부 침묵한다.

### 2-C.1 편집 모드 진입 (54·55에서 파생)

59. 어떤 항목도 편집 중이 아니면 `todo-edit`은 DOM에 0개다. [추론]
60. 편집 중이면 `todo-edit`은 화면 전체에 정확히 1개다 — 두 항목을 동시에 편집할 수 없다. [추론]
61. 편집을 시작하면 `todo-edit`의 초기 값은 그 항목의 현재 제목과 정확히 같다. [추론]
62. 편집 중인 항목의 `todo-title`은 렌더되지 않는다. 입력창이 제목 "자리"를 차지하므로,
    그 항목에 대해 `todo-title`과 `todo-edit`이 동시에 존재하지 않는다. [추론]
    (근거: 변경 요구의 "그 자리에서". 반대 선택(제목을 남긴 채 입력창을 덧붙임)도 54를 만족시키지만,
    "그 자리"라는 말이 자리를 **대체**한다는 읽기를 지지한다.)
63. 편집 중에도 그 항목의 `todo-toggle`과 `todo-delete`는 계속 존재한다(다른 항목을 세는 인덱스가 어긋나지 않는다). [추론]
64. 편집 중에도 `todo-item` 개수, 다른 항목의 `todo-title`, `todo-count`, 필터 버튼 3개는 변하지 않는다. [추론]
65. 편집 입력창은 마운트될 때 포커스를 받는다(더블클릭 직후 키보드 입력이 그 입력창으로 간다). [추론]
66. 완료된 항목의 제목도 더블클릭으로 편집할 수 있다(변경 요구가 미완료 항목으로 한정하지 않는다). [추론]
67. 편집 중에 다른 항목의 `todo-title`을 더블클릭하면 편집 대상이 그 항목으로 옮겨가고,
    이전 항목의 편집은 확정되지 않는다(제목이 그대로 남는다). §60을 지키기 위한 결과다. [추론]
68. 더블클릭 처리기는 `todo-title` 엘리먼트에 붙는다 — 변경 요구가 지정한 방아쇠가 "항목 제목"이므로,
    `todo-item` 전체가 아니라 제목만 방아쇠다. 그 결과 `todo-toggle`이나 `todo-delete`를 두 번 클릭해도
    편집 모드로 들어가지 않는다. [추론]
    (확인: `user-event` v14는 `user.click()` 두 번을 dblclick으로 합성하지 않는다 — 임시 하네스로
    체크박스 위 dblclick 발생 횟수를 세어 0을 확인했다. 즉 항목 전체에 붙였어도 이 경로로 깨지진
    않았겠지만, 지정된 방아쇠대로 제목에만 붙인다.)

### 2-C.2 확정 (56에서 파생)

69. Enter로 확정하면 앱은 입력값의 앞뒤 공백을 제거한 값을 제목으로 저장한다(§19와 같은 규칙). [추론]
70. 확정값이 빈 문자열이거나 공백뿐이면 앱은 제목을 바꾸지 않고 편집만 끝낸다 — 항목은 삭제되지 않고
    원래 제목이 남는다(§20이 "빈 제목은 만들지 않는다"를 이미 정했고, 삭제는 `todo-delete`의 몫이다). [추론]
    (비고: TodoMVC 관례는 빈 값 확정 시 항목을 삭제한다. 계약도 변경 요구도 삭제를 말하지 않으므로
    파괴적이지 않은 쪽을 택했다.)
71. Enter 확정 후 편집 모드가 끝난다 — `todo-edit`은 0개가 되고 그 항목의 `todo-title`이 새 제목으로 다시 렌더된다. [추론]
72. 확정은 그 항목의 완료 상태·목록 내 위치·식별자를 바꾸지 않고, 다른 항목의 제목도 바꾸지 않는다. [추론]
73. 확정 후 `todo-count`의 수는 변하지 않는다(제목 변경은 미완료 개수와 무관하다). [추론]
74. 확정된 제목은 저장소에 반영되어, 언마운트 후 다시 마운트해도 새 제목으로 복원된다(§45'). [추론]
75. 편집 입력창의 Enter 키다운은 기본 동작을 취소한다 — Enter 한 번이 추가 폼 제출로 이어져
    새 항목이 생기지 않는다(§18과 같은 이유). [추론]
76. 제목을 고치지 않고 Enter를 눌러도(값이 그대로) 앱은 오류 없이 편집만 끝내고 제목은 그대로다. [추론]

### 2-C.3 취소 (57에서 파생)

77. Escape로 취소하면 편집 모드가 끝난다 — `todo-edit`은 0개가 되고 원래 제목의 `todo-title`이 다시 렌더된다. [추론]
78. 취소된 편집 내용은 버려진다 — 같은 항목을 다시 더블클릭하면 `todo-edit`의 값은 버려진 초안이 아니라
    현재(=편집 전) 제목이다. [추론]
79. 취소는 목록·완료 상태·`todo-count`·선택된 필터를 바꾸지 않고, 저장소 내용도 바꾸지 않는다. [추론]

### 2-C.4 그 밖의 갈림길

80. Enter·Escape 이외의 키는 편집을 끝내지 않는다(입력만 반영된다). [추론]
81. 편집 입력창이 포커스를 잃어도(blur) 앱은 확정도 취소도 하지 않는다 — 변경 요구가 정한 종료 경로는
    Enter와 Escape 둘뿐이다. 편집창이 영영 남지는 않는다: 다른 제목 더블클릭(§67), 그 항목 삭제(§82),
    필터 변경(§83)이 편집을 끝낸다. [추론]
82. 편집 중인 항목을 삭제하면 편집 상태도 함께 사라진다 — 이후 추가되는 새 항목이 편집 모드로 렌더되지 않는다
    (식별자는 §46a에 따라 재사용될 수 있으므로 명시적으로 지운다). [추론]
83. 필터를 바꾸면 편집이 끝난다 — 화면에서 사라진 항목의 편집창이 필터를 되돌렸을 때 되살아나지 않는다. [추론]
84. 편집 중에도 `todo-input`으로 새 항목을 추가할 수 있고, 추가는 편집 중인 항목에 영향을 주지 않는다. [추론]
85. `todo-edit`은 `<input type="text">`이고 공백이 아닌 접근 가능한 이름을 가진다(§50·§51과 같은 규칙). [추론]
86. 편집 관련 코드는 `src/` 아래 `src/App.tsx`에서 도달 가능한 파일에만 있고, CSS 파일은 추가·수정하지 않는다. [계약 §범위 밖 + §고정된 것]

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
| 5 | `src/todo/TodoList.tsx:35-45` (`visibleTodos(...).map`), `src/todo/TodoItem.tsx:24` | |
| 6 | `src/todo/TodoItem.tsx:26`(toggle), `41`(title), `45`(delete) | 편집 중인 항목만 §62에 따라 `todo-title` 자리에 `todo-edit`이 온다 |
| 7 | `src/todo/TodoItem.tsx:27-28` (`type="checkbox"`, `checked={todo.completed}`) | |
| 8 | `src/todo/TodoItem.tsx:45-47` (`onClick={() => onDelete(todo.id)}`) | |
| 9 | 인라인 제목 편집은 §9 개정에 따라 구현했다(§1-C). 나머지 범위 밖 기능의 코드는 없음 — `src/todo/`는 입력·목록·항목·편집입력·카운트·필터 6개 컴포넌트와 상태·저장·타입 3개 모듈뿐 | |
| 10 | `src/App.css`·`src/index.css` 미변경, 새 스타일 파일 없음(`TodoEditInput.tsx` 포함해 `src/todo/*`에 CSS import 없음) | |
| 11 | `tests/ac/**` 미변경 — `npm run test:ac`로 실행만 함. 편집 동작 검증은 별도 `tmp-verify/` 하네스에서 했고 확인 후 삭제했다 | |
| 12 | `package.json`·`tsconfig.app.json` 미변경 | |
| 13 | 변경 후 `npm run test:ac` → `Tests 8 passed (8)` | 실행 확인 |
| 14 | 변경 후 `npm run build` → `tsc -b && vite build` 종료 코드 0 | 실행 확인 |
| 15 | `TodoInput.tsx:39,40,44`, `TodoItem.tsx:29,46`, `TodoEditInput.tsx:37`, `TodoCount.tsx:6`, `FilterBar.tsx:4-6`, `App.tsx:24` — 전부 한국어 | |
| 16 | `src/todo/TodoInput.tsx:26-30` (`key === 'Enter'` → `commit()`) | [런타임 확인] |
| 17 | `src/todo/TodoInput.tsx:19-22, 33` (`<form onSubmit>`), 제출 버튼 `44` | [런타임 확인] |
| 18 | `src/todo/TodoInput.tsx:28` (`event.preventDefault()`) | [런타임 확인] |
| 19 | `src/todo/useTodos.ts:22` (`title.trim()`) | [런타임 확인] |
| 20 | `src/todo/useTodos.ts:23` (`if (trimmed === '') return`) | [런타임 확인] |
| 21 | `src/todo/TodoInput.tsx:15-16` (`setDraft('')` + DOM value 초기화, 거부 시에도 실행) | [런타임 확인] |
| 22 | `src/todo/useTodos.ts:24` (`[...prev, newTodo]`) | AC-07이 `["A","B"]` 순서 요구 |
| 23 | `src/todo/useTodos.ts:21-25`에 중복 검사 없음 | [런타임 확인] |
| 24 | `src/todo/TodoItem.tsx:41-43` (`{todo.title}` 단독) | |
| 25 | `src/todo/TodoItem.tsx:27-28` | |
| 26 | `src/todo/useTodos.ts:27-31` (`completed: !todo.completed`) | |
| 27 | `src/todo/useTodos.ts:29` (`todo.id === id ? ... : todo`) | [런타임 확인] |
| 28 | `src/todo/useTodos.ts:29` (`map` — 위치 보존) | [런타임 확인] |
| 29 | `src/todo/useTodos.ts:36` (`filter((todo) => todo.id !== id)`) | [런타임 확인] |
| 30 | `src/App.tsx:25,36,37` — 목록 길이와 무관하게 항상 렌더 | [런타임 확인] |
| 31 | `src/todo/useTodos.ts:60` (`todos.filter(!completed).length` — 전체 배열 기준), `src/App.tsx:36` | [런타임 확인] |
| 32 | 같은 줄 (빈 배열 → `0`), `TodoCount.tsx:6`이 `0개 남음` 출력 | [런타임 확인] |
| 33 | 같은 줄 (`activeCount`가 `todos`에서 매 렌더 파생) | [런타임 확인] |
| 34 | 같은 줄 | [런타임 확인] |
| 35 | `src/todo/TodoCount.tsx:6` (`{count}개 남음`) | |
| 36 | 해소 — `"{n}개 남음"`으로 `test:ac` 8/8 통과 | |
| 37 | `src/todo/useTodos.ts:12` (`useState<Filter>('all')`), `TodoList.tsx:20` (`all` → 원본 반환) | |
| 38 | `src/todo/TodoList.tsx:18` — 렌더 목록 자체를 줄이므로 숨긴 항목은 DOM에 없음 | [런타임 확인] |
| 39 | `src/todo/TodoList.tsx:19` | [런타임 확인] |
| 40 | `src/todo/TodoList.tsx:20` | [런타임 확인] |
| 41 | `src/todo/TodoList.tsx:17-21`은 파생 계산만 — `todos` 배열 미변형 | [런타임 확인] |
| 42 | `src/App.tsx:36`이 `activeCount`만 참조(필터 미참조) | [런타임 확인] |
| 43 | `src/todo/useTodos.ts:27-37` — toggle/remove가 `filter` 상태를 건드리지 않음 | [런타임 확인] |
| 44 | `src/todo/FilterBar.tsx:18-26`에 `disabled` 없음 | |
| 45' | `src/todo/useTodos.ts:11` (`useState(loadTodos)`) + `17-19` (`useEffect`→`saveTodos`), `src/todo/storage.ts:16-36` | AC-07 통과 + [런타임 확인] |
| 45a | `src/todo/storage.ts:19,21,25-27` (null·비배열·파싱 실패 → `[]`), `5-13` (항목 단위 검증) | [런타임 확인] |
| 45b | `src/todo/storage.ts:17,31` (`try`/`catch`로 감싼 접근) | |
| 45c | `src/todo/useTodos.ts:12` — `filter`는 저장/복원 대상이 아님 | |
| 46 | `src/todo/types.ts:2` (`id`), `useTodos.ts:24,29,36,57` — 토글·삭제·편집 확정 전부 id로만 지목 | [런타임 확인] |
| 46a | `src/todo/useTodos.ts:6-8` (`nextIdFor` = 현재 목록 최대 id + 1) | |
| 47 | 상태 변경은 전부 이벤트 핸들러(`useTodos.ts:21-58`), `nextIdFor`는 순수 함수라 updater 이중 호출에도 같은 결과 | |
| 48 | `npm run build` 통과. `import type` 사용: `TodoItem.tsx:1`, `TodoEditInput.tsx:2`, `TodoList.tsx:1`, `FilterBar.tsx:1`, `useTodos.ts:3`, `storage.ts:1`, `TodoInput.tsx:2`. enum·파라미터 프로퍼티 없음 | 실행 확인 |
| 49 | 추가 파일: `src/todo/{types.ts,storage.ts,useTodos.ts,TodoInput.tsx,TodoItem.tsx,TodoEditInput.tsx,TodoList.tsx,FilterBar.tsx,TodoCount.tsx}` — 모두 `src/App.tsx`에서 도달(`App→TodoList→TodoItem→TodoEditInput`) | |
| 50 | `src/todo/TodoInput.tsx:39` (`aria-label="할 일 입력"`) | AC-08 통과 |
| 51 | `src/todo/TodoItem.tsx:29` (`aria-label={\`${todo.title} 완료\`}`) | AC-08 통과 |
| 52 | `src/todo/TodoItem.tsx:45-47` (버튼 텍스트 "삭제") | |
| 53 | `src/todo/FilterBar.tsx:25` (`{label}`), 라벨 정의 `4-6` | |
| 54 | `src/todo/TodoItem.tsx:41` (`onDoubleClick`) → `useTodos.ts:44-46` (`startEditing`) → `TodoItem.tsx:34-39`가 그 항목 자리에 `TodoEditInput`을 렌더 | [런타임 확인: `fireEvent.doubleClick`·`user.dblClick` 양쪽] |
| 55 | `src/todo/TodoEditInput.tsx:33` (`data-testid="todo-edit"`) | [런타임 확인] |
| 56 | `TodoEditInput.tsx:17-22` (Enter → `onCommit`), `TodoItem.tsx:37`, `useTodos.ts:52-57` (`title: trimmed`) | [런타임 확인] |
| 57 | `TodoEditInput.tsx:24-27` (Escape → `onCancel`), `useTodos.ts:48-50` | [런타임 확인: `Escape`·`Esc` 양쪽] |
| 58 | 하네스 마지막 케이스에서 추가·트림·빈값 거부·입력창 비움·카운트·필터 3종·삭제를 재확인 + `npm run test:ac` 8/8 | [런타임 확인] |
| 59 | `TodoList.tsx:39` (`editing={todo.id === editingId}`), `useTodos.ts:14` (초기값 `null`) | [런타임 확인] |
| 60 | `useTodos.ts:14` — 편집 대상이 단일 `editingId`라 두 개가 될 수 없다 | [런타임 확인] |
| 61 | `TodoItem.tsx:36` (`initialTitle={todo.title}`), `TodoEditInput.tsx:13` (`useState(initialTitle)`) | [런타임 확인] |
| 62 | `TodoItem.tsx:34-44` — 삼항의 양쪽이라 한 항목에 `todo-title`과 `todo-edit`이 동시에 있을 수 없다 | [런타임 확인] |
| 63 | `TodoItem.tsx:25-31`(toggle), `45-47`(delete) — 삼항 밖이라 편집 중에도 남는다 | [런타임 확인] |
| 64 | `TodoList.tsx:35` (항목 목록 자체는 불변), `App.tsx:36-37` | [런타임 확인] |
| 65 | `TodoEditInput.tsx:36` (`autoFocus`) | [런타임 확인: `document.activeElement`가 `todo-edit`] |
| 66 | `TodoItem.tsx:41`의 `onDoubleClick`은 `todo.completed`를 보지 않는다 | [런타임 확인: 완료 항목 편집 후 checked 유지] |
| 67 | `useTodos.ts:44-46` — `setEditingId(id)`는 대상을 덮어쓸 뿐 확정 경로를 타지 않는다 | [런타임 확인] |
| 68 | `TodoItem.tsx:41` — 처리기가 `todo-title` span에만 있다 | [런타임 확인: 체크박스 연속 클릭 시 dblclick 0회, 편집 미시작] |
| 69 | `useTodos.ts:54` (`title.trim()`) | [런타임 확인] |
| 70 | `useTodos.ts:56` (`if (trimmed === '') return`) — 목록을 갱신하지 않고 반환하므로 제목·항목 모두 그대로 | [런타임 확인: `"   "`·`""` 양쪽] |
| 71 | `useTodos.ts:53` (`setEditingId(null)`이 먼저 실행), `TodoItem.tsx:40-44` | [런타임 확인] |
| 72 | `useTodos.ts:57` — `map`으로 `title`만 교체하므로 `id`·`completed`·위치·다른 항목이 보존된다 | [런타임 확인] |
| 73 | `useTodos.ts:60` — `activeCount`는 `completed`만 센다 | [런타임 확인] |
| 74 | `useTodos.ts:17-19`의 `useEffect`가 `todos` 변경을 저장한다 | [런타임 확인: 언마운트 후 재마운트 시 새 제목·완료 상태 복원] |
| 75 | `TodoEditInput.tsx:19` (`event.preventDefault()`) | [런타임 확인: 확정 후 항목 수 불변] |
| 76 | `useTodos.ts:52-57` — 값이 같아도 편집만 끝난다 | [런타임 확인] |
| 77 | `useTodos.ts:48-50` (`setEditingId(null)`), `TodoItem.tsx:40-44` | [런타임 확인] |
| 78 | `TodoEditInput.tsx:13` — 초안은 컴포넌트 지역 상태라 언마운트와 함께 사라진다 | [런타임 확인: 재편집 시 값이 원래 제목] |
| 79 | `useTodos.ts:48-50`은 `todos`를 건드리지 않아 저장 `useEffect`가 발화하지 않는다 | [런타임 확인: 취소 후 재마운트해도 원래 제목] |
| 80 | `TodoEditInput.tsx:16-28` — Enter·Escape(·Esc) 외의 키는 아무 분기도 타지 않는다 | [런타임 확인] |
| 81 | `TodoEditInput.tsx:30-40`에 `onBlur` 없음 | [런타임 확인: blur 후에도 편집 유지] |
| 82 | `useTodos.ts:35` — 삭제 대상이 편집 중이면 `editingId`를 지운다 | [런타임 확인: 삭제 후 id가 재사용돼도 편집 모드로 뜨지 않음] |
| 83 | `useTodos.ts:39-42` (`setFilter`가 `setEditingId(null)`) | [런타임 확인] |
| 84 | `App.tsx:25`의 `TodoInput`은 편집 상태와 무관하게 렌더된다 | [런타임 확인] |
| 85 | `TodoEditInput.tsx:34`(`type="text"`), `37`(`aria-label="할 일 제목 수정"`) | [런타임 확인: 이름 있는 textbox 목록에 포함] |
| 86 | 추가 파일은 `src/todo/TodoEditInput.tsx` 하나이고 `App.tsx`에서 도달. CSS 파일은 추가·수정 없음 | |

미구현으로 남은 문장 없음. 기각한 문장은 #45 하나이며 사유는 §2.6에 적었다.
§9는 변경 요구가 범위 밖 목록보다 우선한다는 규칙에 따라 개정했다(인라인 제목 편집을 제외).
