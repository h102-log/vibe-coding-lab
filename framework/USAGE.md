# specgate 사용법

`SPEC.md` 없이 구현 소스를 쓰면 Write가 **거부**되고, SPEC 문장의 구현 위치를 지목하지 못한 채 끝내려 하면
완료 선언이 **막히는** Claude Code 플러그인이다. 검사는 전부 정적(LLM 없음)이라 같은 입력에 항상 같은 답이 나온다.
무엇을·왜 검사하는지는 `README.md`, 이 문서는 **순서대로 따라 하는 절차**만 적는다.

## 1. 설치

대상 프로젝트 디렉터리에서 Claude Code를 열고:

```
/plugin marketplace add C:\Users\bhy99\proj\proj3
/plugin install specgate@proj3
```

그다음 **세션을 끄고 다시 연다.** 훅은 세션 시작 때 로드되므로 설치한 그 세션에는 걸리지 않는다(실측).

- 필요한 것: Node 18+. 다른 의존성은 없다. 평가 축(`/specgate:eval`)까지 쓰려면 프로젝트에 vitest가 설치돼 있어야 한다.
- 권한 모드는 **`acceptEdits`**로 쓴다. `bypassPermissions`에서는 PreToolUse 차단이 무력화된다.
- 되돌리는 수단이 git이다. git 리포에서 쓴다.
- 설치 없이 잠깐 써보려면: `claude --plugin-dir C:\Users\bhy99\proj\proj3\framework`

### 설치 확인 (30초)

재시작한 세션에서 `SPEC.md` 없이 이렇게 요청한다.

> `src/a.ts`에 인사 함수 하나 만들어줘

파일이 **안 생기고** 에이전트가 «SPEC.md가 없다 … 구현 전에 SPEC.md를 써라»(`SG1000`)라고 되물으면 설치가 된 것이다.
그냥 생기면 §7 «안 막힌다»부터 본다. 확인 뒤 `src/a.ts`는 지운다.

## 2. 새 기능 만들기 — 기본 흐름

```
/specgate:spec          ← ① SPEC.md 작성 (침묵 인터뷰 최대 3문항)
기능 구현 요청           ← ② 구현. SPEC이 §1·§2를 갖춰야 Write가 통과한다
(에이전트가 끝내려 함)   ← ③ Stop 훅이 §3 대조를 검사 — 못 채우면 완료가 막힌다
```

커맨드 이름은 `/specgate:spec`이다(`/sp`를 치면 자동완성으로 확인된다. 설치 형태에 따라 `/spec`으로 뜰 수 있다).

### ① `/specgate:spec` — SPEC.md 쓰기

프로젝트 루트에 `SPEC.md`가 없으면 `spec-template.md`대로 새로 쓴다. 한 줄 요구를 주면 된다.

> `/specgate:spec` 북마크를 태그로 필터하는 페이지

에이전트가 하는 일:
1. **§1 명시된 것** — 요구에서 읽어낼 수 있는 검증 가능한 문장(`S1.` `S2.` …, 근거 병기).
2. **§2 명시되지 않은 것** — 10범주 점검표(`Clear`/`Partial`/`Missing`)와 추론 문장(`I1.` … `[추론]`).
3. **침묵 인터뷰** — `Partial`/`Missing` 중 구현이 가장 크게 갈리는 것 **최대 3개**를 한 번에 하나씩 묻는다.
   답마다 셋 중 하나를 고른다:
   - **답을 쓴다** → §1에 S문장으로 올라간다(근거: 사용자).
   - **Enter(기본값 수락)** → 위임. §2.2에 `[추론]` 문장으로 남는다.
   - **«건너뜀»** → §2.3 미확정 표에 `선택 대기`로 남는다. 이 행은 나중에 다시 묻는다.
4. **§2.3 미확정 표**(6열: 침묵 지점·기본값·대안·상태·번복 조건) — 묻지 않은 후보는 전부 여기 기록된다.

인터뷰는 한 번만 한다. «그만 물어»라고 하면 남은 질문은 묻지 않는다.

SPEC이 이미 있으면 `/specgate:spec`은 검사기(`spec-verify`)를 돌려 남은 위반·경고와 볼륨(문장 수·[추론] 비율)을 보고한다.
SPEC을 직접 고쳐도 된다 — 사용자가 쓴 문장은 근거 있는 문장이다.

### ② 구현

평소처럼 요청한다. 구현 소스(`.ts .js .py .go .rs .java …` 19종, `hooks/spec-gate.mjs`의 `SRC`)를 **새로 Write**할 때 게이트가 본다:

| 상황 | 결과 |
|---|---|
| `SPEC.md` 없음 | 차단 `SG1000` |
| `[추론]` 표기 없음(C1) · 점검표 10범주 미완(C2) · 미확정 표가 6열 아님(C3) | 차단 — SPEC 해당 절을 채우면 풀린다 |
| 문서·설정·테스트·`SPEC.md` 자신 | 검사 안 함 |
| 기존 파일 `Edit` | spec-gate는 검사 안 함(평가 축이 켜져 있으면 eval-gate는 본다) |

막히면 에이전트에게 stderr로 룰 번호·힌트 한 줄이 돌아가고, 에이전트는 보통 SPEC을 고치거나 사용자에게 되묻는다.
사람은 그 되물음에 답하면 된다.

### ③ 완료 — §3 대조

에이전트가 «끝났다»고 하려는 순간 Stop 훅이 `SPEC.md` 전체를 검사한다.

- **C4** — §1·§2 문장 전건이 §3.1 표에 `파일:줄`로 지목됐는가. 구현 안 한 문장은 기각 사유를 적어야 한다.
- **C5** — `선택 대기` 행 전건이 §3.2 재확인 목록에 올랐는가.

못 채우면 완료가 막히고 에이전트가 §3을 채운 뒤 다시 끝낸다. **사람이 할 일은 §3.2 재확인 목록을 보고
`선택 대기` 항목을 확정하는 것**이다 — 기본값으로 굳힐지, 바꿀지. 확정한 문장은 §1로 올린다.

원한다면 지목이 아직 참인지 나중에 확인할 수 있다(훅에 안 걸린 명시 실행 전용):

```bash
node "$CLAUDE_PLUGIN_ROOT/spec-anchor.mjs" record SPEC.md   # 지목 줄 범위를 SPEC.anchors.json에 기록
node "$CLAUDE_PLUGIN_ROOT/specgate.mjs" drift SPEC.md        # 이후 코드가 바뀌어 다시 읽을 문장이 있으면 exit 1
```

## 3. 기존 코드 고치기 — `/specgate:spec delta`

한 줄 고치는 데 10범주 점검표를 다시 요구하지 않는다. 대신 델타 1장을 쓴다.

> `/specgate:spec delta` 태그 필터를 AND에서 OR로 바꿔줘

- `SPEC.delta.md`가 생기고 요구가 `## ADDED` / `## MODIFIED` / `## REMOVED`로 쪼개진다. MODIFIED 대상
  `` `파일:심볼` ``은 구현 **전에** 채운다(D2).
- 델타가 살아 있는 동안은 델타가 활성 문서다 — 본 `SPEC.md`의 C 검사 대신 D 검사가 걸린다.
- 완료 시 `## 대조`가 채워져 D1~D5를 전건 통과하면 **Stop 훅이 그 자리에서 `SPEC.md`에 병합하고 델타를 지운다.**
  병합 실패 시 델타는 남고, 복구는 `node "$CLAUDE_PLUGIN_ROOT/spec-delta.mjs" merge SPEC.delta.md`.
- 델타가 이미 있으면 새로 만들지 않고 거기에 더한다. 방치된 델타를 지우는 건 사람 몫이다.

## 4. 평가 축 켜기 — `/specgate:eval` (선택)

`EVAL.md`가 없으면 이 축은 통째로 꺼져 있다. 켜면 «구현 전에 성공 기준을 테스트로 동결하고, 구현 후 재실행»이 강제된다.
vitest가 필요하다.

```
/specgate:spec            ← SPEC 먼저 (권장 — 평가 항목의 근거가 SPEC 문장 ID가 된다)
/specgate:eval            ← 항목 표 제시 → 사용자 승인 → 락 → Red-Check
기능 구현 요청
(완료 전 final 실행)
```

`/specgate:eval`이 하는 일:
1. SPEC §1·§2 문장에서 평가 항목(`EV1` …)을 도출한다. `선택 대기` 행은 근거로 쓰지 않는다(E4).
2. 항목마다 «무엇을 어떻게 재나» 한 줄 + `tests/eval/<파일>.test.ts` 경로. 테스트 이름 앞에 `EV3:` 접두.
3. **항목 표를 제시하고 승인을 받는다.** 일괄 승인이 기본, 항목별 제외 가능. «알아서»면 `위임`으로 기록된다.
   승인 전에는 다음으로 넘어가지 않는다.
4. 락 생성(`.specgate-eval.lock`) — 이때부터 `EVAL.md`와 `tests/eval/`은 동결이다.
5. **Red-Check** — 구현 전에 평가를 돌려 red를 확인한다(`.specgate-eval.json` 스냅샷). green 항목은 «구현을 재지 못할 수 있다»로 보고만 한다.
6. 구현 뒤 `--phase final`을 돌린다.

게이트가 보는 것:

| 시점 | 막는 것 |
|---|---|
| 구현 소스 Write/Edit 전 | 락은 있는데 red 스냅샷이 없음(`SG1048`) · E1~E5 위반 · 락 뒤 `EVAL.md`/`tests/eval/` 수정(`SG1047`, `evalFreeze` 설정에 따라) |
| 완료 전 | final 스냅샷 없음(`SG1048`) · 스냅샷 뒤 구현 파일이 바뀜(`SG1049`, 다시 돌려라) · red가 남았는데 `## 기각` 사유 없음(`SG1046`) · 동결 후 수정인데 `## 개정` 행 없음(`SG1047`) |

평가를 정당하게 고쳐야 하면 `## 개정` 절에 행(EV# · 새 해시 · 사유 · 날짜)을 남긴다. 통과시키려는 손질과 가르는 기록이다.

## 5. 설정 — `.specgate.json` (프로젝트 루트, 선택)

```json
{
  "volume": { "activeSentences": 40, "inferenceRatio": 0.5, "tableRows": 80 },
  "mute": ["SG1006"],
  "interview": { "mute": [4, 7] },
  "evalFreeze": "reason"
}
```

| 키 | 뜻 |
|---|---|
| `volume` | SPEC 볼륨 경고(`SG1031~1034`) 임계. **경고일 뿐 아무것도 막지 않는다** |
| `mute` | 끌 Warning 목록. Error는 mute되지 않는다 |
| `interview.mute` | 침묵 인터뷰에서 질문으로 승격하지 않을 범주 번호(1~10). 에이전트가 «앞으로도 묻지 말까»라고 물을 때 승인하면 여기 저장된다 |
| `evalFreeze` | 락 뒤 `EVAL.md`·`tests/eval/` 수정 처리 — `warn`(로그만) / `reason`(기본, `## 개정` 행 요구) / `block`(개정으로도 못 품) |

## 6. 생기는 파일

| 파일 | 만드는 주체 | 커밋 |
|---|---|---|
| `SPEC.md` | `/specgate:spec` | 한다 — 작업 문서이자 §3 대조의 원본 |
| `SPEC.delta.md` | `/specgate:spec delta` | 완료 시 자동 병합·삭제. 남아 있으면 미완 |
| `SPEC.anchors.json` | `spec-anchor record` (명시 실행) | 선택 |
| `EVAL.md` | `/specgate:eval` | 한다 |
| `.specgate-eval.lock` · `.specgate-eval.json` | `eval-run --lock` / `--phase` | 락은 승인 기록이라 커밋. 스냅샷은 취향 |
| `.specgate-log.jsonl` | 게이트가 차단할 때마다 1줄 | `.gitignore`. 줄 수가 곧 마찰 횟수다 |
| `.specgate.json` | 사람 | 한다 |

## 7. 자주 겪는 것

- **안 막힌다** → ① 설치한 세션 그대로 아닌가(재시작) ② 권한 모드가 `bypassPermissions` 아닌가 ③ 만든 파일 확장자가
  `SRC` 19종 밖(`.html` `.css` `.md` 등)이 아닌가 ④ `SPEC.md`를 cwd 루트가 아닌 하위 디렉터리에서 찾고 있지 않은가.
- **플러그인을 고쳤는데 그대로다** → 설치본은 `~/.claude/plugins/cache/` 복사본이라 원본을 따라오지 않는다.
  `/plugin uninstall specgate@proj3` → `/plugin install specgate@proj3` → 재시작. 고친 줄이 캐시본에 있는지 grep으로 확인한다.
- **한 줄 고치고 끝내려는데 Stop이 §3을 요구한다** → SPEC이 있으면 완료마다 전체 검사다. 수정 작업은 `/specgate:spec delta`로
  시작하면 델타의 `## 대조`만 채우면 된다.
- **막혔는데 정당하지 않다** → 오차단이다. 확장자 목록은 `hooks/spec-gate.mjs:19`에 하드코딩돼 있다(설정으로 안 뺐다).
  사건이 쌓이면 그때 뺀다 — `.specgate-log.jsonl`에 남아 있다.
- **우회하고 싶어진다** → 빈 파일 만들고 Edit · Bash로 `echo > src/x.ts` · SPEC에 문장 ID 안 붙이기. 전부 열려 있다.
  이 게이트는 «작정한 우회»가 아니라 «그냥 시작해버리는 것»을 막는다. 우회하고 싶어진 순간이 고칠 지점이다 — 로그에 한 줄 남긴다.
- **게이트를 끄고 싶다** → `/plugin uninstall specgate@proj3` 후 재시작(실행 중 세션의 훅은 uninstall로 안 꺼진다).
  끄기 전에 왜 끄는지 한 줄 적어 두면 그게 다음 수정의 근거다.

## 8. 손으로 돌리기

훅이 보는 것과 같은 검사를 터미널에서 바로 볼 수 있다. CI에 걸 때는 첫 줄 하나면 된다.

```bash
node "$CLAUDE_PLUGIN_ROOT/specgate.mjs" verify SPEC.md          # C1~C5 + 볼륨 경고. exit 0/1/2
node "$CLAUDE_PLUGIN_ROOT/specgate.mjs" delta  SPEC.delta.md    # D1~D5
node "$CLAUDE_PLUGIN_ROOT/eval-verify.mjs" EVAL.md              # E1~E7
node "$CLAUDE_PLUGIN_ROOT/eval-run.mjs" . --phase red|final     # 평가 실행 → 스냅샷 (판정은 exit에 안 싣는다)
node "$CLAUDE_PLUGIN_ROOT/spec-interview.mjs" stats             # 인터뷰 응답 집계 · mute 권장 범주
```

`$CLAUDE_PLUGIN_ROOT`는 설치본 경로(`~/.claude/plugins/cache/…/specgate`). 이 리포에서 직접 쓸 때는 `framework/`다.

## 9. 안 되는 것 (짧게 — 전체는 README «한계»)

- Bash로 만든 파일·빈 파일+Edit은 spec-gate 밖이다. 보안 경계가 아니라 절차 강제 장치다.
- C4·C5가 재는 건 «ID를 다시 적었는가»지 지목이 맞는가가 아니다. 빈 셀도 통과한다.
- 새 기능을 «수정»으로 위장하면 델타 1장으로 점검표를 건너뛸 수 있다.
- `EVAL.md`가 없으면 평가 축은 아무것도 안 막는다. 켠 줄 알고 안 만들면 그냥 꺼진 것이다.
