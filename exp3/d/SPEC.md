# SPEC — Todo 앱 요구사항 확정

작업 문서. 구현 산출물이 아니다.
근거 표기: `[계약 §<절>]` = 과제로 주어진 «Todo 앱 — 구현 계약 (얇은 판)», `[CHANGE]` = 계약보다 우선하는 변경 요구,
`[추론]` = 계약·변경 요구가 침묵하여 내가 정한 것, `[AC 출력]` = `npm run test:ac` 실행 결과로 확인한 것(테스트 파일은 열지 않았다).

**변경 요구(2차)**: "항목 제목을 더블클릭하면 그 자리에서 편집할 수 있게 하라. 편집 입력창의 testid는 `todo-edit`,
Enter로 확정하고 Escape로 취소한다. 다른 요구사항은 그대로다."
이 요구는 계약의 «범위 밖» 목록보다 우선하므로 이전 판의 S-15("인라인 제목 편집이 없다")는 **폐기**되고 S-20~S-23으로 대체된다.
그 외 문장은 전부 유효하다.

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
- S-10. 각 `todo-item` 안에는 `todo-toggle`, `todo-delete`가 각각 1개씩 있고, **편집 중이 아닌** 항목에는 `todo-title`도 1개 있다. [계약 §DOM 계약 표 + CHANGE — 편집 중인 항목의 제목 자리는 U-49에 따라 `todo-edit`이 차지한다]
- S-11. `data-testid="todo-count"`인 요소가 정확히 1개 있고, 미완료 항목 개수를 표시한다. [계약 §DOM 계약 표]
- S-12. `filter-all`, `filter-active`, `filter-completed`인 요소가 각각 정확히 1개 있다. [계약 §DOM 계약 표]
- S-13. 위 9개 testid는 항목 수가 0일 때에도(항목에 종속된 4개 제외) 존재한다. [계약 §DOM 계약 표 — 0..n은 `todo-item`에만 붙어 있음]

### 1.3 범위 밖 (없어야 한다)

- S-14. 로그인·계정 UI, 서버 API·DB 호출, 배포 설정이 없다. [계약 §범위 밖]
- ~~S-15. 제목을 화면에서 편집하는 수단(더블클릭 인라인 편집 등)이 없다.~~ **폐기** — [CHANGE]가 계약의 «범위 밖»보다 우선한다. S-20~S-23으로 대체.
- S-16. 드래그 정렬, 전체 완료 토글, 완료 일괄 삭제 UI가 없다. [계약 §범위 밖]
- S-17. 마감일·우선순위·태그·검색 입력이 없다. [계약 §범위 밖]
- S-18. 다크모드·테마 전환 UI, 애니메이션, 다국어 전환이 없다. 문구는 한국어 단일 로케일이다. [계약 §범위 밖]
- S-19. SEO 메타태그를 추가하지 않는다. [계약 §범위 밖]

### 1.4 제목 인라인 편집 (변경 요구)

- S-20. `todo-title`을 더블클릭하면 그 항목 **자리에** `data-testid="todo-edit"`인 편집 입력창이 나타난다. [CHANGE]
- S-21. 편집 입력창에서 Enter를 누르면 편집 내용이 확정되어 그 항목의 제목이 입력값이 된다. [CHANGE]
- S-22. 편집 입력창에서 Escape를 누르면 편집이 취소되고 제목은 편집 전 값 그대로다. [CHANGE]
- S-23. 편집 기능 외의 요구(§DOM 계약 표의 9개 testid, §범위 밖의 나머지 항목, §고정된 것, 기존 S·U 문장)는 변경 전과 동일하게 유지된다. [CHANGE — "다른 요구사항은 그대로다"]

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

### 2.8 제목 인라인 편집이 침묵하는 것 (S-20~S-22가 참이 되려면 무엇이 더 정해져야 하는가)

변경 요구는 세 문장뿐이다 — 더블클릭으로 연다, testid는 `todo-edit`, Enter 확정 / Escape 취소.
"연다 → 고친다 → 끝낸다"는 흐름을 처음부터 끝까지 따라가면 갈림길은 아래와 같다.

**여는 지점 (S-20)**

- U-47. `todo-edit`은 `<input type="text">`이고, 열린 직후 `value`는 그 항목의 **현재 저장된 제목과 정확히 같다**(따옴표·공백을 덧붙이지 않는다). [추론]
- U-48. 편집 중이 아니면 `todo-edit`은 DOM에 **0개**이고, 편집 중이면 화면 전체에 **정확히 1개**다. (테스트가 `getByTestId("todo-edit")`를 쓰면 0개·2개 모두 예외가 된다.) [추론]
- U-49. 편집 중인 항목에서는 `todo-title`이 `todo-edit`으로 **대체된다** — 같은 `<li>` 안에서 제목 텍스트 노드가 사라지고 그 자리에 입력창이 온다. 다른 항목의 `todo-title`은 그대로다. (계약이 CSS 수정을 금지하므로 "CSS로 감추기"는 불가능하고, 감추기만 하면 `queryAllByTestId("todo-title")`에 그대로 잡힌다. "그 자리에서 편집"은 대체로 읽는다.) [추론]
- U-50. 편집이 열리면 `todo-edit`에 **포커스**가 가 있고 기존 텍스트는 전체 선택된다. (더블클릭 직후 곧바로 `user.keyboard("{Enter}")`/타이핑을 하는 테스트가 성립하려면 포커스가 필요하다.) [추론]
- U-51. 단일 클릭은 편집을 열지 않는다. `todo-toggle`·`todo-delete`·항목 여백의 더블클릭도 편집을 열지 않는다 — 더블클릭 핸들러는 `todo-title` 요소에만 붙는다. [추론]
- U-52. 완료된 항목도 더블클릭으로 편집할 수 있다. [추론]
- U-53. 편집은 한 번에 한 항목만이다. 편집 중 다른 항목의 제목을 더블클릭하면 편집 대상이 그 항목으로 옮겨가고 `todo-edit`은 여전히 1개다. [추론]

**고치는 동안**

- U-54. 편집 중 타이핑은 `todo-edit`의 `value`만 바꾼다. 확정 전에는 저장된 제목·`todo-count`·항목 순서·완료 상태가 전혀 바뀌지 않는다. [추론]
- U-55. 편집 중에도 그 항목의 `todo-toggle`·`todo-delete`와 다른 모든 항목은 정상 렌더된다. `todo-item` 개수도 변하지 않는다. [추론]
- U-56. 편집 중에도 항목 추가·토글·삭제·필터 버튼은 계속 동작한다(편집이 앱을 잠그지 않는다). [추론]

**끝내는 지점 (S-21, S-22)**

- U-57. Enter로 확정되는 제목은 입력값을 **trim**한 값이다(추가와 같은 규칙 — U-05). [추론]
- U-58. trim 결과가 빈 문자열이면 제목을 바꾸지 않고 **원래 제목을 유지한 채** 편집을 끝낸다. 항목을 삭제하지 않는다. (빈 제목 거부는 U-06과 같은 규칙이고, 삭제 수단은 계약상 `todo-delete` 하나다 — 빈 확정에 삭제를 얹으면 계약에 없는 두 번째 삭제 경로가 생긴다.) [추론]
- U-59. Enter·Escape 어느 쪽이든 편집이 끝나면 `todo-edit`은 DOM에서 사라지고 그 자리에 `todo-title`이 다시 나타난다. [추론]
- U-60. Escape는 타이핑한 초안을 버린다. 취소한 뒤 다시 더블클릭하면 `todo-edit`의 `value`는 원래 제목이다(버린 초안이 남지 않는다). [추론]
- U-61. `todo-edit`이 포커스를 잃으면(다른 곳 클릭 등) Enter와 같이 **확정**한다. (TodoMVC 관례이자, 확정 없이 열린 채 남는 편집 상태를 만들지 않는 쪽이다.) 이미 Enter·Escape로 끝난 뒤 뒤늦게 발생하는 blur는 아무 일도 하지 않는다 — 확정·취소는 멱등이다. [추론]
- U-62. `todo-edit`은 `<form>` 안에 있지 않고 Enter는 keydown 핸들러로만 처리된다. 따라서 편집 중의 Enter는 새 항목을 추가하지 않고, 확정을 두 번 일으키지도 않는다(U-04와 같은 함정). [추론]
- U-63. 한글 조합 중(`isComposing`)인 Enter는 확정으로 치지 않는다(추가 입력과 같은 규칙). [추론]
- U-64. 편집은 항목의 `id`·완료 여부·목록 내 위치를 바꾸지 않는다. 제목만 바뀐다. [추론]
- U-65. 편집에도 제목 중복 검사·길이 제한은 없다(U-10·U-11과 같다). [추론]

**끝난 뒤**

- U-66. 편집으로 바뀐 제목은 저장되어 재마운트 후에도 유지된다(U-34와 같은 경로 — 목록이 바뀌면 저장된다). [추론]
- U-67. 편집 상태(어느 항목을 편집 중인지, 초안 문자열)는 **저장하지 않는다**. 재마운트하면 편집 중이 아니다(`todo-edit` 0개). [추론]
- U-68. 필터가 바뀌면 편집은 **끝난다** — 필터 전환 뒤에 `todo-edit`이 열린 채 남지 않는다. 마우스로 필터 버튼을 클릭한 경우 포커스가 먼저 버튼으로 옮겨가므로 U-61에 따라 **확정**이 앞서고, 그 뒤 필터가 바뀐다(초안이 조용히 버려지지 않는다). 포커스 이동 없이 필터만 바뀌는 경로에서는 편집 상태가 그냥 비워진다. 편집 중이던 항목이 삭제되면 편집도 함께 끝난다 — 사라진 항목의 편집 상태가 남지 않는다. [추론] (§3.2에서 정정한 문장)
- U-69. `todo-edit`에는 한국어 접근성 이름(aria-label)이 있다. 이름 문자열 자체는 테스트가 판정하지 않는다. [추론]

### 2.9 이번 변경에서 AC 출력이 주지 못한 신호

변경 요구를 받은 시점의 `npm run test:ac`는 **8 passed (8)** — 편집 기능을 검사하는 케이스가 없다.
즉 2.8의 문장들은 AC 출력으로 좁힐 수 없고 추론만으로 확정했다. 되돌리기 쉬운 갈림길과 내가 택하지 않은 쪽을 남긴다.

- U-58(빈 제목 확정) — 택하지 않은 쪽: TodoMVC처럼 **항목 삭제**. 계약의 삭제 수단이 `todo-delete` 하나뿐이라 거부 쪽을 골랐다. 뒤집으려면 `commitEdit` 한 곳만 고치면 된다.
- U-61(blur) — 택하지 않은 쪽: blur를 **취소**로 보거나 아무 것도 하지 않기(편집창이 열린 채 유지). Enter/Escape 경로와 독립이라 뒤집어도 S-21·S-22는 그대로다.
- U-49(제목 대체) — 택하지 않은 쪽: `todo-title`을 남긴 채 `todo-edit`을 **덧붙이기**. CSS 금지 조항 때문에 "감추기"가 불가능하다는 점이 결정적이었다.

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

**변경 요구분 (S-20~S-23, U-47~U-69).** 기존 문장의 근거 위치 중 파일이 바뀐 곳은 그대로 유효하다
(`TodoItem.tsx`의 toggle은 `:29-35`, delete는 `:50-57`, title은 `:38-40`으로 줄만 이동했다).

| 문장 | 근거 위치 |
|---|---|
| S-20 | `src/todo/TodoItem.tsx:38` — `todo-title`의 `onDoubleClick` → `src/App.tsx:39` `handleStartEdit` → `src/todo/todoState.ts:61-68` `startEdit` → `src/todo/TodoEdit.tsx:46` `data-testid="todo-edit"` |
| S-21 | `src/todo/TodoEdit.tsx:32-35` — `key === "Enter"` → `onCommit` → `src/App.tsx:42` → `src/todo/todoState.ts:77-94` `commitEdit` |
| S-22 | `src/todo/TodoEdit.tsx:37-40` — `key === "Escape"` → `onCancel` → `src/App.tsx:43` → `src/todo/todoState.ts:96-101` `cancelEdit` |
| S-23 | 위 표의 S-01~S-19·U-01~U-46 근거 위치가 그대로 유효하다. `npm run test:ac` 8/8 유지 (§5) |
| U-47 | `src/todo/TodoEdit.tsx:47-48` — `type="text"`, `value={draft}` / 초기값은 `src/todo/todoState.ts:67` `draft: target.title` |
| U-48 | `src/todo/types.ts:16-19`(`editing`은 단일 값) + `src/todo/TodoList.tsx:37`(id가 일치하는 항목만 초안을 받음) + `src/todo/TodoItem.tsx:36`(초안이 없으면 입력창을 렌더하지 않음) |
| U-49 | `src/todo/TodoItem.tsx:36-49` — 삼항으로 `todo-title` **또는** `TodoEdit` 중 하나만 렌더 |
| U-50 | `src/todo/TodoEdit.tsx:20-24` — 마운트 시 1회 `focus()` + `select()`. 의존성 배열 `[]`이라 타이핑 중 재선택되지 않는다 |
| U-51 | `src/todo/TodoItem.tsx:38` — `onDoubleClick`은 `todo-title` 요소에만. `:29-35`(toggle)·`:50-57`(delete)·`:28`(li)에는 없다 |
| U-52 | `src/todo/todoState.ts:61-68` — `completed` 검사 없음 |
| U-53 | `src/todo/types.ts:16-19` + `src/todo/TodoList.tsx:37` — `editing.id`는 하나뿐이라 새 `startEdit`이 이전 대상을 덮어쓴다 |
| U-54 | `src/todo/todoState.ts:70-75` — `changeEditDraft`는 `editing.draft`만 바꾸고 `todos`를 건드리지 않는다 |
| U-55 | `src/todo/TodoItem.tsx:29-35`·`:50-57` — toggle·delete는 삼항 밖이라 편집 여부와 무관하게 렌더된다 |
| U-56 | `src/App.tsx:33-43` — 추가·토글·삭제·필터 핸들러가 편집 상태와 독립적으로 동작한다 |
| U-57 | `src/todo/todoState.ts:82` — `editing.draft.trim()` |
| U-58 | `src/todo/todoState.ts:83-86` — 빈 문자열이면 `todos`를 그대로 두고 `editing`만 비운다(삭제 경로 없음) |
| U-59 | `src/todo/todoState.ts:85,92,100` — 확정·취소 모두 `editing: null` → `src/todo/TodoItem.tsx:36`이 다시 `todo-title`을 렌더 |
| U-60 | `src/todo/todoState.ts:96-101`(초안째 버림) + `:67`(다시 열 때 저장된 제목에서 시작) |
| U-61 | `src/todo/TodoEdit.tsx:51` — `onBlur={onCommit}` / 멱등성은 `src/todo/todoState.ts:79-81`·`97-99`의 `editing === null` 조기 반환 |
| U-62 | `src/todo/TodoEdit.tsx:44-53` — `<form>` 없이 `<input>` 단독, Enter는 `:32-35` keydown 한 경로뿐이고 `:33`에서 `preventDefault()` |
| U-63 | `src/todo/TodoEdit.tsx:29-31` — `event.nativeEvent.isComposing`이면 조기 반환 |
| U-64 | `src/todo/todoState.ts:89-91` — `map`으로 제자리 치환, `title`만 교체(`id`·`completed`·순서 유지) |
| U-65 | `src/todo/todoState.ts:77-94` — 중복·길이 검사 없음 |
| U-66 | `src/todo/todoState.ts:87-93`이 새 `todos` 배열을 만들고 → `src/App.tsx:26-28`의 저장 효과가 걸린다 |
| U-67 | `src/todo/todoState.ts:16` — 복원 시 `editing: null` / `src/App.tsx:27` — 저장 대상은 `state.todos`뿐 |
| U-68 | `src/todo/todoState.ts:51-54`(`setFilter`가 `editing`을 비움) + `:42-49`(삭제된 항목이 편집 중이면 함께 종료) + `src/todo/TodoEdit.tsx:51`(마우스 클릭 경로에서는 blur 확정이 먼저) |
| U-69 | `src/todo/TodoEdit.tsx:52` — `aria-label="제목 편집"` |

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

**2차 변경(제목 편집)에서 정정한 문장**

- **U-68 (문장 수정).** 처음에는 "필터를 바꾸면 편집이 **취소된다**(초안 버림)"로 적었다.
  자체 테스트에서 이 문장이 U-61(blur 확정)과 정면으로 부딪혔다 — 필터 버튼을 마우스로 클릭하면 포커스가 버튼으로 옮겨가며
  blur가 **먼저** 일어나 초안이 확정되고, 그 뒤에야 `setFilter`가 돈다. 실행 결과: 제목이 `"a"`가 아니라 초안 값이었다.
  두 문장 중 하나를 버려야 했고, U-61을 살렸다 — 사용자가 타이핑한 내용을 필터 클릭 한 번으로 조용히 버리는 쪽이 손실이 크고,
  "바깥을 클릭하면 확정"이라는 규칙에 예외를 파는 구현은 깨지기 쉽다. U-68은 "필터가 바뀌면 편집이 **끝난다**"로 약화했고,
  `setFilter`의 `editing: null`은 포커스 이동이 없는 경로를 위한 안전장치로 남겼다. 자체 테스트가 두 경로를 각각 지킨다.
  절차상으로는 2.8을 쓰는 시점에 "필터 전환"과 "blur"를 각각 다른 문장에서 정하면서 둘이 같은 클릭 한 번에 겹쳐 일어난다는 걸 놓친 것이다.

---

## 4. 검증

- `tests/dev/todo.check.tsx` — 구현 중 만들어 돌린 자체 테스트(**40케이스**, 편집 관련 16케이스 추가). 지우지 않았다.
  각 `it` 제목 앞에 그 케이스가 지키는 문장 번호를 달아 두었다. 실행: `npm run test:dev`.
- **편집 기능은 인수 테스트가 전혀 검사하지 않는다**(§2.9 — 변경 전후 모두 8케이스). 그래서 S-20~S-22와 U-47~U-69는
  이 파일이 유일한 검증 수단이다. 특히 추론으로만 정한 갈림길을 케이스로 고정해 두었다.
  - S-20/U-47/U-48/U-50 — 더블클릭 → `todo-edit` 1개, 현재 제목이 값으로 들어오고 포커스가 잡힌다
  - U-49 — 편집 중인 항목의 `todo-title`이 DOM에서 사라지고 다른 항목은 그대로다
  - U-51 — 단일 클릭·토글 더블클릭·항목 여백 더블클릭은 편집을 열지 않는다
  - S-21/S-22/U-59/U-60 — Enter 확정 / Escape 취소, 둘 다 입력창을 닫고, 취소한 초안은 다시 열어도 남지 않는다
  - U-58 — 빈 제목 확정이 항목을 지우지 않는다(택하지 않은 TodoMVC 동작을 명시적으로 배제)
  - U-61 — blur 확정, 그리고 Escape 뒤의 blur가 초안을 되살리지 않는다(멱등)
  - U-62/U-63 — 편집 중 Enter가 항목을 추가하지 않는다 / 조합 중 Enter는 확정이 아니다
  - U-64/U-65 — 제목을 다른 항목과 같게 바꿔도 두 항목이 계속 구분된다(id 불변)
  - U-66/U-67 — 확정한 제목은 재마운트 후에도 남고, 편집 상태·초안은 남지 않는다
  - U-68 — 필터 전환·항목 삭제 시 편집이 열린 채 남지 않는다(blur 경로와 비-blur 경로 각각)
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
| `npm run test:ac` | Test Files 1 passed (1), Tests **8 passed (8)** — 변경 전후 동일(편집 케이스 없음, §2.9) |
| `npm run build` | `tsc -b && vite build` 성공, `dist/` 생성 |
| `npm run test:dev` | Test Files 1 passed (1), Tests **40 passed (40)** |

## 6. 파일 목록

| 파일 | 역할 |
|---|---|
| `src/App.tsx` | 진입점. 상태 보유, 저장 효과, 하위 컴포넌트 조립 |
| `src/todo/types.ts` | `Todo`·`Filter`·`TodoState` 타입 |
| `src/todo/todoState.ts` | 상태 전이·조회 함수 (추가/토글/삭제/필터/편집 열기·초안·확정·취소/가시 목록/미완료 수) |
| `src/todo/storage.ts` | localStorage 저장·복원과 값 검증 |
| `src/todo/TodoInput.tsx` | `todo-input`, Enter·submit 처리 |
| `src/todo/TodoList.tsx` | 목록 렌더, 빈 목록 문구, 편집 대상 항목에만 초안 전달 |
| `src/todo/TodoItem.tsx` | `todo-item`/`todo-title`/`todo-toggle`/`todo-delete`, 더블클릭 → 편집 열기 |
| `src/todo/TodoEdit.tsx` | `todo-edit`. 포커스·전체 선택, Enter 확정 / Escape 취소 / blur 확정 |
| `src/todo/TodoFilters.tsx` | `filter-all`/`filter-active`/`filter-completed` |
| `src/todo/TodoStatusBar.tsx` | `todo-count` |
| `tests/dev/todo.check.tsx` | 자체 검증 테스트 (§4) |
| `vitest.dev.config.ts` | 자체 검증 전용 러너 설정 |
