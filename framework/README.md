# specgate

구현 전에 `SPEC.md`를 강제하고, 완료 전에 그 문장들의 구현 위치 대조를 강제하는 Claude Code 플러그인.

**다른 점은 둘이다.** ① **문안이 제안이 아니라 훅으로 차단된다** — spec-kit 계열은 템플릿과
슬래시 커맨드를 주지만 지키지 않아도 아무 일이 일어나지 않는다(fail-open — 헌법 Article III도
테스트 선실패 확인을 «명령»할 뿐 강제 기계가 없다). 여기서는 `SPEC.md` 없이 `src/*.ts`를 쓰려
하면 Write가 **거부**되고, 구현 위치를 지목하지 못한 문장이 남아 있으면 **완료 선언이 막힌다**.
② **차단 판정에 LLM이 없다** — 같은 PreToolUse 지점에서 차단하는 tdd-guard(2.3k★, 2026-08-24
기준)는 차단 판정을 모델에 맡기고 자체 릴리스 노트가 간헐적 오차단을 인정한다(v1.6.9
«intermittent false blocks» — 공식 후속 Probity도 간판 룰 enforceTdd는 «Uses an AI validator»).
여기 게이트는 전부 정적 검사라 같은 입력에 항상 같은 답이 나오고, 판단이 필요한 것은 차단하지
않는다(Advisory). 여기에 edd 축이 더하는 것 — 구현 전에 평가를 동결·Red-Check하고(락 + 스냅샷),
SPEC 문장의 출처(S/I/U)가 게이트 강도를 정한다(`선택 대기` 지목 = 단언 금지) — 의 결합은
**훅 수준 실시간으로는** 확인된 선례가 없다(부분 선례: spec-kit-v-model의 opt-in 결정론 커맨드
게이트(훅 아님·hybrid mode 우회 자인) · 개념 선례: arXiv 2606.02755의 평가 동결·release gates
프로토콜(강제 기계는 산출물로 미확인) — 2026-08-24 조사, 판정표 docs/next/2026-08-24/r53.md).

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
| 스킬 `edd` | 구현 전 `EVAL.md` 확정 절차 — SPEC 문장→평가 항목 도출 · Red-Check · 동결 |
| 커맨드 `/eval` | `EVAL.md`를 쓰거나 검사기를 돌린다 — 항목 도출→사용자 승인→락→red-check |
| 훅 `PreToolUse` | 구현 소스를 쓰기 직전 — spec-gate(`Write`만): SPEC 부재 · C1~C3 / eval-gate(`Write\|Edit\|MultiEdit`): 락·red 스냅샷·E1~E5 위반이면 차단 |
| 훅 `Stop` | 완료 선언 직전 — spec-gate: C4(문장 지목) · C5(`선택 대기` 재확인) / eval-gate: final 스냅샷·신선도·E6·E7 위반이면 차단 |

**델타가 있으면 델타가 활성 문서다.** `SPEC.delta.md`가 살아 있는 동안 훅은 본 `SPEC.md`의
C 검사를 하지 않고 D 검사로 갈아탄다 — pre에서 D1·D2, 완료 전에 D1~D5. 전건 통과하면 Stop이
**그 자리에서 병합하고 델타를 지운다**(사람이 `merge`를 칠 필요가 없다). 병합이 실패하면
델타는 남고, 복구는 `spec-delta.mjs merge`를 손으로 돌리는 것이다.

**spec-gate는 `Edit`을 막지 않는다.** SPEC이 필요한 시점은 «새 기능을 시작할 때»이고, 기존 파일 한 줄
고치는 데까지 10범주 점검표를 요구하면 첫날에 꺼버리게 된다. 대가는 «빈 파일을 만들고
Edit으로 채우는» 우회가 열려 있다는 것이다 — 아래 한계 참조. eval-gate는 `Edit`·`MultiEdit`도
잡는다(동결의 실체가 락이라, 락이 생긴 뒤의 구현 수정도 평가 상태를 통과해야 한다).

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

## E검사 7종

`EVAL.md`에 걸리는 edd 축 검사. 근거는 `eval-template.md`와 `skills/edd/SKILL.md`이고 성질은
위와 같다(전부 정적 — 러너 실행은 `eval-run.mjs` 몫이고 게이트는 그 스냅샷을 읽기만 한다).

| | 검사 | 시점 | SG |
|---|---|---|---|
| E1 | 평가 표 완결 — ID 형식·중복·해시 형식 | 구현 전·완료 전 | SG1041 |
| E2 | 항목 완결 — `tests/eval/` 경로 · «무엇을 어떻게 재나» 한 줄 | 구현 전·완료 전 | SG1042 |
| E3 | 근거 문장 ID가 `SPEC.md`에 실존 (SPEC 없으면 **경고 강등**) | 구현 전·완료 전 | SG1043 |
| E4 | 미확정표 `선택 대기`(U) 행을 지목한 항목 금지 | 구현 전 | SG1044 |
| E5 | 근거 문장이 승인 시점과 동일(해시 대조) — 수정은 `## 개정` 행으로만 | 구현 전·완료 전 | SG1045 |
| E6 | 전건 green 또는 red마다 `## 기각` 사유 | 완료 전 | SG1046 |
| E7 | 동결 — 락 없이 구현 금지(pre) · 동결 후 수정은 `## 개정`으로만(stop) | 구현 전·완료 전 | SG1047 |

E검사 밖의 스냅샷 검사 둘이 같은 게이트에 있다: **SG1048**(스냅샷 부재·무효 — pre는 red를,
stop은 final을 요구한다) · **SG1049**(신선도 — final 스냅샷 이후 구현 파일이 바뀌면 다시 돌려라).
**C4 복제 금지** — SPEC 전 문장 커버리지는 위반이 아니라 SG1050 Warning 집계만 한다(지목 강제는
C4의 몫, 평가는 «재기로 한 것을 쟀는가»만 강제한다).

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
node framework/spec-interview.mjs stats         # 침묵 인터뷰 3택 집계 + 저장 mute(`interview.mute`) 보고 — 기록은 /spec 문안이 한다
node framework/spec-interview.mjs --selftest    # 기록·집계·저장 mute 15건 대조
node framework/spec-anchor.mjs record SPEC.md   # §3 지목의 실존·줄 범위 확인 → SPEC.anchors.json
node framework/spec-anchor.mjs drift  SPEC.md   # 앵커 대조 missing/stale/modified. exit 1 = 다시 읽을 문장이 있다
node framework/spec-anchor.mjs --selftest       # record 7건 + drift 8건
node framework/specgate.mjs verify SPEC.md      # 위 검사들을 SG 번호 + 힌트 한 줄로. CI는 이 줄만 있으면 된다
node framework/specgate.mjs verify SPEC.md --json    # ruleId·severity·loc·hint — 에이전트·CI 계약
node framework/specgate.mjs delta SPEC.delta.md # 같은 포맷으로 D1~D5. base는 델타 옆 SPEC.md
node framework/specgate.mjs drift SPEC.md       # 같은 포맷으로 앵커 3범주 + A4 경고
node framework/specgate.mjs --selftest          # 룰 매핑·mute·로그·볼륨 26건 대조
node framework/eval-verify.mjs EVAL.md          # E1~E7 정적 검사 — exit 0 위반없음 / 1 위반있음 / 2 파일없음
node framework/eval-run.mjs <app-dir> --phase red|final   # 평가 실행 → .specgate-eval.json 스냅샷. exit 0 = 스냅샷 산출 — 빨간불이어도 0, 판정을 exit에 싣지 않는다
node framework/hooks/eval-gate.mjs --selftest   # 게이트 분기 22건 대조
```

`specgate`는 **검사를 하나도 재구현하지 않는다** — 위 도구들의 결과에 번호와 정적 힌트를 입힐
뿐이고, 검출력은 한 건도 늘지 않는다. 번호는 `SG1001~1010`(C1~C5) · `SG1011~1015`(D1~D5) ·
`SG1021~1027`(앵커 A1~A4 · 드리프트 missing/stale/modified) · `SG1000`(SPEC 부재) ·
`SG1031~1034`(볼륨 — **Warning 전용, 차단 승격 금지**)이고, 훅 stderr도 같은 한 줄 포맷을 쓴다.
`verify`는 specprobe의 `volume` 값을 임계와 대조해 SG1031~1034를 병기한다 — 임계 기본값은
활성 문장 40 · [추론] 비율 0.5 · 표 행수 80(임의의 시작점, 실사용 관측 대상)이고, 프로젝트 루트
`.specgate.json`의 `{"volume":{"activeSentences":30}}` 형태로 바꾼다. SG1034(접기 제안)는
SG1031이 발동 중이고 아카이브 후보가 1건 이상일 때만 뜬다. 같은 파일에서 `{"mute":["SG1006"]}`으로
**Warning만** 끌 수 있고(Error는 mute되지 않는다), `interview.mute`(범주 번호 배열)는
`spec-interview stats`가 읽어 저장된 범주를 질문 승격에서 뺀다.

`drift`에서만 `--json`의 `loc.file`이 SPEC이 아니라 **코드 파일**을 가리킨다 — 고칠 대상이 코드이기
때문이다. `spec-anchor record`는 specgate에 **없다**: 이 CLI는 읽기 전용 판정만 감싸고 record는
`SPEC.anchors.json`을 쓴다. 그래서 A1~A3(SG1021~1023)은 번호는 있어도 `spec-anchor record`로만 나온다.

`spec-anchor`는 **어떤 훅에도 걸려 있지 않다** — 명시 실행 전용이고, 안 돌리면 아무것도 실증되지
않는다. `drift`의 exit 0은 «문장이 아직 참»이 아니라 «앵커 스팬이 그대로»라는 뜻이다.

## 한계 (알려진 것)

- spec-gate 훅은 `Write`만 잡는다(eval-gate는 `Write|Edit|MultiEdit`). **Bash로 파일을 만들면 어느
  게이트든 우회되고, spec-gate는 빈 파일을 만든 뒤 `Edit`으로 채우는 우회도 열려 있다** — 셸까지
  막으면 위양성이 커진다. 이 게이트는 «작정한 우회»가 아니라 «그냥 시작해버리는 것»을 막는다.
- `bypassPermissions` 모드에서는 PreToolUse 차단이 무력화된다. `acceptEdits`에서는 실제로 막는다(실측).
- 문장 ID(`S1`·`I2` 형태)가 없는 SPEC은 C4가 «판정 불가»로 빠진다 — 위반이 아니라 경고다.
- 게이트 대상 확장자는 `hooks/spec-gate.mjs`의 `SRC`에 하드코딩돼 있다. 설정으로 빼지 않았다.
- **델타 분기는 본 SPEC 요구를 약화시키는 통로다.** 게이트는 새 기능과 수정을 구별하지 못하므로,
  새 기능을 «수정»으로 위장하면 10범주 점검표 대신 델타 1장으로 pre를 통과할 수 있다.
- **볼륨은 아무것도 막지 않는다.** `specgate verify`가 임계 초과를 SG1031~1034로 내지만 전부
  Warning이고 어느 훅에도 안 걸린다 — 경고가 리뷰 행동을 바꾼다는 실측은 없다. 임계 기본값
  (40·0.5·80)은 임의의 시작점이고, 문장 수·표 행수는 읽기 부담의 **대리 지표**다 — 길이·밀도·난도는 재지 않는다.
  «아카이브» 이름의 타용도 절은 오마스킹된다. `archiveCandidates`에는 근거 위치 위양성이 있다
  (정의 줄의 «(근거: 문서:줄)»만으로 후보에 오른다) — 사람 승인이 뒤에 있어 실해는 제한적이다.
- 자동 병합의 안전망은 «병합이 검사 위반을 늘리지 않았는가» 하나뿐이고, 그건 **검사가 보는 것만**
  지킨다 — 문장이 엉뚱한 절에 놓이는 것은 위반이 아니다. 되돌리는 수단은 git이다.
- `verify-tdd.mjs`의 자체 테스트 계수에 `tests/eval/`이 섞인다 — 계측기 수정은 전수 재측정 조건이라
  기록만 한다.
- **E4는 «U를 지목한 항목»만 잡는다** — 근거 셀에 S를 적고 U 행의 기본값을 테스트 단언으로 굳히는
  우회는 못 잡는다(C4의 «ID 재기입만 잰다»와 같은 계열).
- **`EVAL.md`가 없으면 edd 축이 통째로 꺼진다** — 켠 줄 알고 EVAL을 안 만들면 아무것도 안 막는다.
- **스냅샷·락·EVAL.md는 위조 가능하다** — 게이트는 파일을 신뢰하고 읽으므로 Bash로 스냅샷을 직접
  쓰거나 셸로 소스를 만들면(`echo > src/x.ts` — matcher 밖) 속는다. 이 게이트의 위협 모델은
  드리프트 방지 절차 강제지 보안 경계가 아니다.

## 선택 대기

| # | 항목 | 적용한 기본값 | 대안 | 상태 | 번복 조건 |
|---|---|---|---|---|---|
| 1 | 플러그인 이름 | `specgate` | `spec-first` · `sdd-gate` | **확정** (2026-08-16) | — |
| 2 | 게이트 대상 도구 | `Write`만 | `Write\|Edit` · 규모 임계값 · 경로 선언 | **확정** (2026-08-16) | 빈 파일+Edit 우회가 실제로 관측되면 |
| 3 | 플러그인 루트 | `framework/` (실험 자산과 동거) | 별도 디렉터리로 분리 후 복사 | 선택 대기 | 외부 배포 시 |
| 4 | 게이트 대상 확장자 | 주요 언어 19종 하드코딩 | 설정 파일로 노출 | 선택 대기 | 오차단 발생 시 |
| 5 | 델타 병합 시점·주체 | Stop 훅이 D 전건 통과 시 자동 병합 | 에이전트가 `merge`를 명시 실행 · 지연 병합 | 선택 대기 | 자동 병합이 `SPEC.md`를 망가뜨린 사건 1건 |
| 6 | 병합 성공 알림 | 로그 1줄만(에이전트에겐 조용) | stderr로 «병합됨» 1줄 통지 | 선택 대기 | 에이전트가 병합 사실을 몰라 SPEC을 다시 쓰는 사건 1건 |
