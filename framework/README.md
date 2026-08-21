# specgate

구현 전에 `SPEC.md`를 강제하고, 완료 전에 그 문장들의 구현 위치 대조를 강제하는 Claude Code 플러그인.

**다른 점은 하나다 — 문안이 제안이 아니라 훅으로 차단된다.** spec-kit 계열은 템플릿과 슬래시
커맨드를 주지만 지키지 않아도 아무 일이 일어나지 않는다(fail-open). 여기서는 `SPEC.md` 없이
`src/*.ts`를 쓰려 하면 Write가 **거부**되고, SPEC 문장 중 구현 위치를 지목하지 못한 것이 남아
있으면 **완료 선언이 막힌다**.

실측(2026-08-16, sonnet · `acceptEdits` · $0.36): 빈 프로젝트에 «인사 함수 하나» 요청 →
`src/greet.ts` **미생성** · `permission_denials` 1건 · 에이전트는 우회하지 않고 사용자에게 되물었다.

> 이건 스펙 기반 개발(SDD)을 강제하는 프로젝트 차원의 하드 게이트라서 **제가 우회할 수 없고** …
> — 차단당한 에이전트의 응답 원문

## 설치

```
/plugin marketplace add C:\Users\bhy99\proj\proj3
/plugin install specgate@proj3
```

Node 18+ 가 필요하다(다른 의존성은 없다).

**설치한 뒤 세션을 재시작한다.** 훅은 세션 시작 시점에 로드되므로 **설치한 그 세션에는 걸리지 않는다**
— 2026-08-17 실측: 설치 직후 같은 세션에서 `SPEC.md` 없이 `src/a.ts`가 그대로 생성됐고, 재시작 후
같은 요청이 정상 차단됐다. 설치했는데 안 막히면 이것부터 의심한다.

**플러그인을 고친 뒤에도 재설치가 필요하다.** 설치 시 `~/.claude/plugins/cache/`로 복사본이 들어가고
**원본 변경을 따라오지 않는다**(같은 날 실측 — 원본을 고쳐도 캐시본 mtime이 그대로였다).

## 무엇이 들어오나

| | |
|---|---|
| 스킬 `sdd` | 구현 전 `SPEC.md` 작성 절차 — 명시된 것(§1) · 침묵 지점(§2) · 완료 전 대조(§3) |
| 스킬 `tdd` | 구현 중 만든 자체 테스트를 지우지 않고 자산으로 남기는 절차 |
| 커맨드 `/spec` | `SPEC.md`를 쓰거나, 있으면 검사기를 돌려 남은 갭을 보고 |
| 커맨드 `/spec delta` | 기존 코드 수정용 델타 1장(`SPEC.delta.md`) — 완료 시 `SPEC.md`에 자동 병합 |
| 훅 `PreToolUse` | 구현 소스를 **새로** 쓰기 직전(`Write`만) — SPEC 부재 · C1~C3 위반이면 차단 |
| 훅 `Stop` | 완료 선언 직전 — C4(문장 지목) · C5(`선택 대기` 재확인) 위반이면 차단 |

**델타가 있으면 델타가 활성 문서다.** `SPEC.delta.md`가 살아 있는 동안 훅은 본 `SPEC.md`의
C 검사를 하지 않고 D 검사로 갈아탄다 — pre에서 D1·D2, 완료 전에 D1~D5. 전건 통과하면 Stop이
**그 자리에서 병합하고 델타를 지운다**(사람이 `merge`를 칠 필요가 없다). 병합이 실패하면
델타는 남고, 복구는 `spec-delta.mjs merge`를 손으로 돌리는 것이다.

**`Edit`은 막지 않는다.** SPEC이 필요한 시점은 «새 기능을 시작할 때»이고, 기존 파일 한 줄
고치는 데까지 10범주 점검표를 요구하면 첫날에 꺼버리게 된다. 대가는 «빈 파일을 만들고
Edit으로 채우는» 우회가 열려 있다는 것이다 — 아래 한계 참조.

## 검사 5종

전부 `skills/sdd/SKILL.md`에 근거가 있고, 전부 결정론적이다(같은 입력 → 같은 답, LLM 판단 없음).

| | 검사 | 시점 |
|---|---|---|
| C1 | `[추론]` 표기가 있는가 | 구현 전 |
| C2 | 점검표 10범주 · 상태가 `Clear`/`Partial`/`Missing`인가 | 구현 전 |
| C3 | 미확정표가 6열인가 | 구현 전 |
| C4 | §1·§2 문장이 완료 전 대조에서 전건 지목됐는가 | 완료 전 |
| C5 | `선택 대기` 항목이 재확인 목록에 전건 올랐는가 | 완료 전 |

`## 4. 아카이브` 절은 **다섯 검사의 분모에서 통째로 빠진다**(C1의 `[추론]` 계수만 예외 —
접힌 SPEC에서 C1이 위양성으로 pre를 막지 않게 원문으로 센다). 안 빼면 «구현이 끝나 접는 행위»가
곧 C4 위반이 되어 정리된 SPEC이 Stop에서 막힌다. 접힌 자리에 `선택 대기`가 섞이면 경고
(`SG1010`)가 하나 붙는다 — 미확정은 아카이브 자격이 없다. 대가: 접힌 절은 검사기 시야 밖이라
**ID 재사용 충돌을 기계가 못 잡는다**(«최대 번호 +1» 규약은 템플릿 주석 1줄뿐이다).

값어치는 집합 차인 **C4·C5**고 나머지는 세는 것이다. C4·C5가 재는 것은 «지목의 내용»이 아니라
**«ID를 다시 적었는가»**다 — 빈 셀·«구현 안 함»도 통과한다. 위치 표기(`파일:줄`)가 없는 지목은
위반이 아니라 **경고**로 나온다(«실행 확인»·«부재로 충족»처럼 위치가 없어도 정당한 지목이 실물에 있다).

## 델타 검사 5종

`SPEC.delta.md`에 걸리는 자매 검사. 근거는 `delta-template.md`이고 성질은 위와 같다(전부 정적).

| | 검사 | 시점 |
|---|---|---|
| D1 | `## ADDED` `## MODIFIED` `## REMOVED` 3절이 다 있는가(빈 절 허용) | 구현 전 |
| D2 | MODIFIED 항목에 대상 `` `파일:심볼` ``이 있는가 | 구현 전 |
| D3 | ID가 S/I/U인가 · 본 SPEC과 번호가 충돌하는가 — 전부 **경고** | — |
| D4 | ADDED(S·I)·MODIFIED가 `## 대조`에서 전건 지목됐는가 | 완료 전 |
| D5 | REMOVED가 지목한 ID가 본 SPEC에 실존하는가 | 완료 전 |

D2가 강제하는 것은 «구현 전 열거»라는 **행위**이지 열거의 완전성이 아니다 — 고쳐야 할 함수를
에이전트가 빠뜨리면 게이트도 모른다. D4는 C4와 같은 한계를 상속한다.

## 직접 돌리기

```bash
node framework/spec-verify.mjs SPEC.md          # exit 0 위반없음 / 1 위반있음 / 2 파일없음
node framework/spec-verify.mjs SPEC.md --json
node framework/spec-verify.mjs --selftest       # 픽스처 6장 + 아카이브 인라인 3건
node framework/specprobe.mjs SPEC.md            # 볼륨 계측 — 센다. 판정을 종료 코드에 싣지 않는다(0 고정)
node framework/specprobe.mjs --selftest         # 볼륨·회귀 4건
node framework/spec-delta.mjs verify SPEC.delta.md   # D1~D5. merge로 바꾸면 손으로 병합한다
node framework/spec-delta.mjs --selftest        # 검사 9건 + 병합 10건
node framework/hooks/spec-gate.mjs --selftest   # 게이트 분기 23건 대조
node framework/spec-interview.mjs stats         # 침묵 인터뷰 3택 집계 — 기록은 /spec 문안이 한다
node framework/spec-interview.mjs --selftest    # 기록·집계 12건 대조
node framework/spec-anchor.mjs record SPEC.md   # §3 지목의 실존·줄 범위 확인 → SPEC.anchors.json
node framework/spec-anchor.mjs drift  SPEC.md   # 앵커 대조 missing/stale/modified. exit 1 = 다시 읽을 문장이 있다
node framework/spec-anchor.mjs --selftest       # record 7건 + drift 8건
node framework/specgate.mjs verify SPEC.md      # 위 검사들을 SG 번호 + 힌트 한 줄로. CI는 이 줄만 있으면 된다
node framework/specgate.mjs verify SPEC.md --json    # ruleId·severity·loc·hint — 에이전트·CI 계약
node framework/specgate.mjs delta SPEC.delta.md # 같은 포맷으로 D1~D5. base는 델타 옆 SPEC.md
node framework/specgate.mjs drift SPEC.md       # 같은 포맷으로 앵커 3범주 + A4 경고
node framework/specgate.mjs --selftest          # 룰 매핑·mute·로그 22건 대조
```

`specgate`는 **검사를 하나도 재구현하지 않는다** — 위 도구들의 결과에 번호와 정적 힌트를 입힐
뿐이고, 검출력은 한 건도 늘지 않는다. 번호는 `SG1001~1010`(C1~C5) · `SG1011~1015`(D1~D5) ·
`SG1021~1027`(앵커 A1~A4 · 드리프트 missing/stale/modified) · `SG1000`(SPEC 부재)이고, 훅 stderr도
같은 한 줄 포맷을 쓴다. 프로젝트 루트에 `.specgate.json`을 두면 `{"mute":["SG1006"]}`으로
**Warning만** 끌 수 있다 — Error는 mute되지 않는다.

`drift`에서만 `--json`의 `loc.file`이 SPEC이 아니라 **코드 파일**을 가리킨다 — 고칠 대상이 코드이기
때문이다. `spec-anchor record`는 specgate에 **없다**: 이 CLI는 읽기 전용 판정만 감싸고 record는
`SPEC.anchors.json`을 쓴다. 그래서 A1~A3(SG1021~1023)은 번호는 있어도 `spec-anchor record`로만 나온다.

`spec-anchor`는 **어떤 훅에도 걸려 있지 않다** — 명시 실행 전용이고, 안 돌리면 아무것도 실증되지
않는다. `drift`의 exit 0은 «문장이 아직 참»이 아니라 «앵커 스팬이 그대로»라는 뜻이다.

## 한계 (알려진 것)

- 훅은 `Write`만 잡는다. **Bash로 파일을 만들거나, 빈 파일을 만든 뒤 `Edit`으로 채우면 우회된다**
  — 셸과 Edit까지 막으면 위양성이 커진다. 이 게이트는 «작정한 우회»가 아니라 «그냥 시작해버리는 것»을 막는다.
- `bypassPermissions` 모드에서는 PreToolUse 차단이 무력화된다. `acceptEdits`에서는 실제로 막는다(실측).
- 문장 ID(`S1`·`I2` 형태)가 없는 SPEC은 C4가 «판정 불가»로 빠진다 — 위반이 아니라 경고다.
- 게이트 대상 확장자는 `hooks/spec-gate.mjs`의 `SRC`에 하드코딩돼 있다. 설정으로 빼지 않았다.
- **델타 분기는 본 SPEC 요구를 약화시키는 통로다.** 게이트는 새 기능과 수정을 구별하지 못하므로,
  새 기능을 «수정»으로 위장하면 10범주 점검표 대신 델타 1장으로 pre를 통과할 수 있다.
- **볼륨(`specprobe`)은 아무것도 막지 않는다.** 임계값을 아는 도구가 아직 없고(판정은 KF4 R4의
  `.specgate.json` 몫), 문장 수·표 행수는 읽기 부담의 **대리 지표**다 — 길이·밀도·난도는 재지 않는다.
  «아카이브» 이름의 타용도 절은 오마스킹된다. `archiveCandidates`에는 근거 위치 위양성이 있다
  (정의 줄의 «(근거: 문서:줄)»만으로 후보에 오른다) — 사람 승인이 뒤에 있어 실해는 제한적이다.
- 자동 병합의 안전망은 «병합이 검사 위반을 늘리지 않았는가» 하나뿐이고, 그건 **검사가 보는 것만**
  지킨다 — 문장이 엉뚱한 절에 놓이는 것은 위반이 아니다. 되돌리는 수단은 git이다.

## 선택 대기

| # | 항목 | 적용한 기본값 | 대안 | 상태 | 번복 조건 |
|---|---|---|---|---|---|
| 1 | 플러그인 이름 | `specgate` | `spec-first` · `sdd-gate` | **확정** (2026-08-16) | — |
| 2 | 게이트 대상 도구 | `Write`만 | `Write\|Edit` · 규모 임계값 · 경로 선언 | **확정** (2026-08-16) | 빈 파일+Edit 우회가 실제로 관측되면 |
| 3 | 플러그인 루트 | `framework/` (실험 자산과 동거) | 별도 디렉터리로 분리 후 복사 | 선택 대기 | 외부 배포 시 |
| 4 | 게이트 대상 확장자 | 주요 언어 19종 하드코딩 | 설정 파일로 노출 | 선택 대기 | 오차단 발생 시 |
| 5 | 델타 병합 시점·주체 | Stop 훅이 D 전건 통과 시 자동 병합 | 에이전트가 `merge`를 명시 실행 · 지연 병합 | 선택 대기 | 자동 병합이 `SPEC.md`를 망가뜨린 사건 1건 |
| 6 | 병합 성공 알림 | 로그 1줄만(에이전트에겐 조용) | stderr로 «병합됨» 1줄 통지 | 선택 대기 | 에이전트가 병합 사실을 몰라 SPEC을 다시 쓰는 사건 1건 |
