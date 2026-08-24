# planedd6gate.md — EDD R4: `hooks/eval-gate.mjs` + hooks.json 배선

**팩**: EDD 트랙 9장 중 1장. 의존: **planedd1probe.md 완료 필수**(기각 2건의 실측 답 없이 배선하지 않는다 — planeddmain §2) + planedd5runner.md 완료(스냅샷 실물 선례). 다음은 planedd7skill.md다.

## §0 목적·산출물

**목적 한 줄**: EDD의 차단 시점 2개 — 구현 SRC Write 직전(승인·red-check 없이 구현 금지)과 완료 선언 직전(final 스냅샷·신선도·E6·E7) — 를 `spec-gate.mjs`와 동형의 훅으로 **실제로 막는다**. 판정 로직은 여기 없다 — `eval-verify.mjs`의 `inspectEval()`을 그대로 쓰고 시점만 가른다(spec-gate.mjs:2-3과 같은 성질).

**산출물 한 줄**: `framework/hooks/eval-gate.mjs` 신설(decide + CLI + --selftest ≥22건) + `framework/hooks/hooks.json` additive 배선 + `framework/specgate.mjs` T3b 1소스 추가 — 신구 selftest 동시 통과, 기존 기대값 변경 0.

## §1 배경과 근거

1. **왜 훅인가.** spec-kit 헌법 Article III는 «테스트 승인 → FAIL 확인» 순서를 명령하지만 강제 기계가 0이다(리서치 3-0 ③ — PreToolUse·exit-code 차단 없음, LLM 지시문뿐). 이 리포의 실측(2026-08-16, $0.36)은 `acceptEdits`에서 PreToolUse 훅이 실제로 차단함을 확인했다 — 문안이 아니라 훅이 EDD 4요소(도출→Red-Check→재실행→동결)를 시점에 묶는다.
2. **왜 훅 안에서 러너를 안 돌리나.** Stop 훅은 타임아웃 시 fail-open이다(리서치 3-0 ⑥ — 공식 문서 명시, planedd1 P-3이 현행 CLI 재확인). 훅 안 vitest는 차단력이 조용히 사라지는 자리다. 그래서 러너는 `eval-run.mjs`(planedd5) 몫이고 **훅은 스냅샷 파일만 읽는다**(밀리초 판정 — 공유 계약 5).
3. **왜 결정론 전용인가.** tdd-guard(2.3k★)는 같은 PreToolUse 지점의 차단 판정을 LLM에 맡기고 자체 문서가 오차단을 인정한다(리서치 3-0 ②). 이 게이트의 판정 재료는 파일 존재·해시 대조·스냅샷 status뿐이다 — 같은 입력 항상 같은 답(개발 규칙 5).
4. **왜 spec-gate 동형인가.** decide 객체 `{msg, exit, log}` · fail-open stdin 파싱 · 재진입 가드(차단에만) · `.specgate-log.jsonl` additive 로그 · 실프로세스 selftest — 전부 spec-gate.mjs에 이미 있고 실사용(FIELD-GUIDE)으로 검증됐다. 새 형태를 발명하지 않는다(개발 규칙 2).

## §2 선행 조건

- **planedd1 실측표(rN)가 존재하고 P-1·P-2·P-3 판정이 적혀 있다.** 없으면 착수 금지. 판정별 반영(planedd1 §3-6 반영표 그대로):
  - **P-1**(PreToolUse 타임아웃): fail-open이든 closed든 결론은 같다 — pre 훅 작업은 파일 읽기·정규식·해시 대조만(러너·네트워크·설치 금지). fail-open이면 이것이 **차단력 조건**임을 eval-gate.mjs 머리 주석에 명문화한다.
  - **P-2**(같은 이벤트 다중 훅): **순서 무관 차단이면** §3-5의 별도 항목 나란히 배선(기본값)을 그대로 쓴다. **순서 의존이면** 택1 — ⓐ PreToolUse 항목 순서 규약 고정(spec-gate 항목 앞) ⓑ 단일 진입 스크립트(spec-gate → eval-gate 순차 호출, exit는 첫 차단 것). 선택과 근거를 rN에 기록하고 §7 #1을 갱신한다.
  - **P-3**(Stop fail-open): stop 훅 작업이 스냅샷·락·EVAL.md 읽기와 해시 대조뿐(ms)인 근거로 인용한다.
- planedd4 산출물 실존: `framework/eval-verify.mjs`의 export `inspectEval`·`loadEval`·`hash8`·`canonical` + specgate RULES에 SG1041~1050 등재(`node framework/specgate.mjs --selftest` 통과로 확인).
- planedd5 산출물 실존: `framework/eval-run.mjs` — 이 지시서의 스냅샷 픽스처가 그 출력 계약(`.specgate-eval.json` 필드)과 일치하는지 대조한다. 어긋나면 실물(eval-run)이 이긴다.
- 기준선: `node framework/hooks/spec-gate.mjs --selftest`(23건) · `node framework/eval-verify.mjs --selftest` 통과, `git status` clean.

## §3 작업

### 3-1. 구조 — spec-gate 동형 (먼저 spec-gate.mjs 전문을 정독한다)

`framework/hooks/eval-gate.mjs` 신설. 다음을 그대로 따른다:

- **CLI**: `node hooks/eval-gate.mjs pre|stop < 이벤트JSON` / `--selftest`. exit **0 통과 / 2 차단**(spec-gate 선례) — 2일 때 stderr가 에이전트에게 되돌아간다.
- **stdin 파싱 실패 = 빈 이벤트 = 통과**(spec-gate.mjs:278 동일) — 이유도 동일하게 주석으로: 파싱 실패는 에이전트 잘못이 아니라 계측 문제이고, 여기서 막으면 훅 버그 하나가 세션 전체를 잠근다.
- **판정은 항상 `{msg, exit, log}` 객체**(spec-gate.mjs:36-48). `blocked()`의 log에 `t·mode·file·first·rules`를 같은 이름으로 싣되 **mode는 `'eval-pre'`/`'eval-stop'`**으로 적는다 — 같은 `.specgate-log.jsonl`을 쓰므로(additive, FIELD-GUIDE §1) spec-gate 줄과 mode만으로 갈라 읽을 수 있어야 한다. 새 로그 파일을 만들지 않는다.
- **import**: `{ inspectEval, loadEval, hash8 } from '../eval-verify.mjs'` · `{ RULES, ruleOf, UNASSIGNED, line1 } from '../specgate.mjs'`. stderr 한 줄 포맷은 spec-gate의 `list()`/`rulesOf()`와 동일 구현(SG 번호 + 힌트 줄 — KF4 공유 포맷).
- **SRC 정규식은 spec-gate.mjs:19의 값을 그대로 복사**하고 `// 사본: spec-gate.mjs:19 — 그쪽이 바뀌면 여기도` 주석을 단다. spec-gate는 export하지 않고, export 추가는 수정이라 금지다(planedd4 §3-1의 headId 사본과 같은 처리). 두 게이트의 대상 일치가 기본값이다(planeddmain §7 #7).
- **로그 append는 try/catch로 감싼다**(spec-gate.mjs:281-285) — 관측이 게이트를 망가뜨리면 안 된다.
- `decide(mode, ev)`를 export한다(selftest·후속 도구가 부른다). isMain 가드는 spec-gate 방식(모드 인자 분기) 그대로.

### 3-2. pre 판정 순서도 (위에서 아래로, 첫 결정에서 끝)

```
1. f = ev.tool_input?.file_path ?? ''
2. SRC.test(f) 거짓 → PASS                     (문서·설정·EVAL.md·스냅샷 .json은 여기서 빠진다)
3. /tests[\\/]eval[\\/]/.test(f) 참 → 동결 분기:
   a. .specgate-eval.lock 없음 → PASS           (승인 전 작성 단계 — 동결의 실체는 락이다)
   b. 락 있음 → evalFreeze 3단 표(아래) 적용
4. (구현 SRC) EVAL.md 없음 → PASS               (축 꺼짐 — 산출물 존재로만 연결, r16 조합 원칙)
5. EVAL.md 있음 → loadEval(EVAL.md, 'pre') → inspectEval → violations 있으면 exit 2
   (락 존재 E7.noLock · phase red 스냅샷 존재·runOk = snapshot.missing/invalid · E1~E5 — 전부
    eval-verify pre phase가 이미 낸다. 게이트는 재구현하지 않고 violations만 읽는다.
    final 뒤의 SRC 재수정이 여기 막히지 않는 것은 'snapshot.invalid'의 redAt 예외 —
    planedd4verify.md §3-3 — 가 inspectEval 안에서 처리하기 때문이고, SPEC 없는 edd 단독
    프로젝트의 sentences 빈 락도 같은 경로로 정상 통과한다(planedd5runner.md §3-1 분기))
6. 위반 0 → PASS
```

**evalFreeze 3단의 pre 적용** (`.specgate.json`의 `"evalFreeze"`, 기본 `"reason"` — 깨진 설정은 기본값, specgate loadConfig 선례):

| 단 | 락 있는 상태의 tests/eval/* Write | 근거 |
|---|---|---|
| `block` | **차단** exit 2 — stderr는 SG1047 한 줄(kind `'E7.frozen'`) + «동결된 평가다 — `## 개정`으로도 못 푼다(evalFreeze=block)» | 동결이 하드인 단 |
| `reason`(기본) | **통과** exit 0 + 로그 1줄(mode `'eval-pre'`, `first: 'freeze-reason: <파일>'`) — «`## 개정` 행 없음»은 pre 시점엔 판정 불가(수정이 아직 안 일어났다)이므로 판정은 stop의 E7이 한다 | 수정 허용 + 사후 사유 강제 |
| `warn` | **통과** exit 0 + 로그 1줄(`first: 'freeze-warn: <파일>'`) — stderr는 내지 않는다(경고를 stderr로 내면 «에이전트에겐 조용히» 기본값이 뒤집힌다, spec-gate.mjs:65-66 원칙) | 관측 전용 단 |

주의 둘: ① 3(동결 분기)이 4·5(구현 분기)보다 **앞**이다 — tests/eval 파일도 SRC 정규식에 걸리므로 순서가 바뀌면 평가 테스트 작성이 자기 락에 막힌다. ② pre는 SPEC.delta.md를 보지 않는다 — 델타의 D1·D2는 spec-gate가 이미 본다(Write 이벤트에 두 게이트 항목이 함께 걸린다). 중복 판정 금지.

### 3-3. stop 판정 순서도

```
1. ev.stop_hook_active 참 → PASS                (재진입 가드 — 차단에만 건다. eval-gate는 stop에서
                                                 쓰기 동작이 없으므로 spec-gate의 델타 병합 같은
                                                 가드-이후 작업도 없다 — 최상단 가드로 충분하다)
2. EVAL.md 없음:
   a. .specgate-eval.lock도 없음 → PASS          (축을 안 쓴 세션)
   b. 락은 있음 → 차단 exit 2 — SG1047 «EVAL.md가 동결 후 사라졌다 — 되살리거나 락을 지운 사유를
      남겨라» (EVAL.md 삭제로 stop 게이트 전체를 우회하는 구멍을 닫는다)
3. loadEval(EVAL.md, 'stop') → inspectEval → violations 있으면 exit 2. 포함되는 것:
   - snapshot.missing(SG1048): phase final 스냅샷 부재 — 힌트에 «eval-run --phase final을 돌려라»
   - snapshot.invalid(SG1048): runOk false·phase 불일치·승인본 불일치 — 계측 실패는 통과가 아니다
   - snapshot.stale(SG1049): implHash vs 현재 파일 재해시 불일치 — «구현이 스냅샷 이후 바뀌었다 — 재실행하라»
   - E6(SG1046): red 잔존·스냅샷 누락 항목 — 기각(`## 기각` 사유 행)이면 통과
   - E7(SG1047): 락 해시 vs 현재 EVAL.md·tests/eval/* — `## 개정` 행이면 통과(reason), 단은 §3-2 표
   - E1~E5: eval-verify stop phase가 포함한다(사후 손질은 완료 시점에도 잡혀야 한다 — planedd4 §3-2)
4. 위반 0 → PASS
```

신선도(implHash) 재해시·tests/eval 글롭·락 파싱은 전부 `loadEval`이 한다 — 게이트에 fs 로직을 중복 구현하지 않는다. 게이트 고유 검사는 2-b 하나뿐이고, 그 finding도 `kind: 'E7.frozen'`으로 낸다(기존 RULES 재사용 — 새 kind·새 SG 번호를 만들지 않는다).

### 3-4. 델타 분기 상호작용 — 유예 없음

`SPEC.delta.md` 활성 중에도 eval-gate의 E3·E5 base는 **본 SPEC.md 고정**이다(planeddmain §7 #3, 소유 planedd4). 델타가 Stop에서 병합되면 SPEC 문장이 바뀌어 **E5 Outdated가 대량 발생할 수 있다** — 그래도 병합 직후 1회 유예 같은 조용한 완화를 넣지 않는다. 해소 경로는 정공법 하나다: 바뀐 문장을 지목한 EV마다 `## 개정`에 새 해시·사유·날짜를 적는다. Outdated는 «그 평가를 다시 봐야 한다»는 신호이지 마찰이 아니고, 유예는 그 신호를 도구가 조용히 삼키는 것이다(REPORT4 §6-1 번복 5건의 재발 방지가 이 축의 존재 이유다). 유예 도입은 §7 #2 선택 대기로만 남긴다.

훅 실행 순서상 같은 Stop에서 spec-gate(병합)가 eval-gate보다 먼저 돌면 eval-gate가 병합 후 SPEC을 보게 되고, 뒤에 돌면 병합 전 SPEC을 본다 — **어느 쪽이든 판정은 결정론이고 늦어도 다음 Stop에 잡힌다.** 이 시차를 없애려고 eval-gate에 병합 감지를 넣지 않는다(관측 1건 전의 추측성 코드).

### 3-5. hooks.json 배선 — 정확한 결과물

P-2 = 순서 무관이면 아래가 최종본이다(기존 spec-gate 항목은 한 글자도 안 바뀐다 — `PreToolUse` 배열에 **신설 항목 1개**(matcher `Write|Edit|MultiEdit`), `Stop` 배열에 1항목 additive):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/spec-gate.mjs\" pre" }
        ]
      },
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/eval-gate.mjs\" pre" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/spec-gate.mjs\" stop" },
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/eval-gate.mjs\" stop" }
        ]
      }
    ]
  }
}
```

**matcher가 spec-gate(`Write`)보다 넓은 이유(감리 반영)**: Edit·MultiEdit로 구현 파일을 고치면 `Write` 단일 matcher는 게이트가 아예 발화하지 않는다 — 같은 지점을 막는 tdd-guard는 `Write|Edit|MultiEdit|TodoWrite`를 건다. Edit·MultiEdit 이벤트도 `tool_input.file_path`를 주므로 `decide`는 그대로 동작한다(판정 재료가 경로뿐 — selftest 케이스 추가 불요). spec-gate 항목의 동일 확장은 기존 항목 수정이라 이 트랙 밖이다(§7 #6 · planeddmain §7 #8). Bash 경유 쓰기(`echo > src/x.ts`)는 여전히 matcher 밖이다 — 위협 모델 한계로 README에 기록한다(planedd8 §3-7 ④).

순서는 **spec-gate 항목 먼저**다 — SPEC이 없으면 EVAL 논의 자체가 무의미하고(사슬: sdd 문장 → edd 실행 판정), 에이전트가 받는 첫 stderr가 SG1000(SPEC부터 써라)이어야 한다. 단 훅 병렬 실행이 실측되면(planedd1 P-2의 hook-log 관측) 이 순서는 «stderr 도착 순서 보장»이 아니라 **항목 순서 규약**일 뿐임을 eval-gate.mjs 머리 주석에 적는다. P-2 = 순서 의존이면 §2의 택1(ⓐ/ⓑ)로 이 절을 대체하고 rN에 기록한다.

### 3-6. specgate.mjs T3b 1소스 추가 (planedd4 §3-6 ③이 이 지시서로 미룬 것)

T3b의 소스 스캔에 eval-gate를 더한다(additive 2줄, 기존 스캔·기대값 무변경):

```js
    const gs = readFileSync(join(HERE, 'hooks', 'eval-gate.mjs'), 'utf8');
    for (const m of gs.matchAll(/kind: '((?:E\d|snapshot|coverage|gate)\.\w+)'/g)) if (!RULES[m[1]]) miss.push(m[1]);
```

eval-gate가 직접 만드는 finding(§3-2 3-b·§3-3 2-b의 `'E7.frozen'`)이 RULES 미등재 kind로 새는 것을 기계가 잡게 한다 — r50 §4에서 T3b가 실제로 작동한 그 자리다.

## §4 산출물

- `framework/hooks/eval-gate.mjs` — 신설(decide export + CLI + --selftest)
- `framework/hooks/hooks.json` — §3-5 배선(additive 2항목)
- `framework/specgate.mjs` — T3b 1소스(additive 2줄, 이 라운드의 유일한 specgate 접촉)
- `docs/next/2026-08-24/rN.md` — 집행 기록(P-2 반영 배선 형태·어긋난 항목, 짧게 — 개발 규칙 1)

## §5 검증 — 판정 가능한 완료 조건

### 5-1. `eval-gate --selftest` 케이스 표 (실프로세스 — spawnSync + stdin JSON + exit까지, spec-gate CASES 형식)

픽스처: SPEC은 **인라인 MINI-EDD**(S1·I2·U1 + §3 대조 — spec-gate의 MINI를 import하지 않고 자체 보유: 그쪽 재료를 잡아 쓰면 한쪽 수정이 양쪽을 흔든다, spec-gate.mjs:120-121 동일 근거). EVAL.md·락·스냅샷은 헬퍼 `mkproj()`가 임시 디렉터리(`mkdtempSync`)에 조립하고 **해시 필드는 전부 eval-verify의 `hash8`로 실계산**한다(해시 함수 자체의 골든 고정은 planedd4 H-0 몫 — 중복하지 않는다). 정상 스냅샷 계약은 공유 인터페이스 그대로: red = `{phase:"red", runOk:true, items:[{id:"EV1", status:"red"}], ...}`, final = green + `implHash: {"src/cart.ts": hash8(실제 내용)}`. G1만 실물 스모크 `framework/smoke/i1-cart-r1/SPEC.md`를 **복사해 읽기만** 한다(spec-gate selftest의 i1 참조 방식 — 절대 규칙 6).

| # | 이름 | 재료(정상 대비 변형) | 모드 | Write 대상 | 기대 exit | stderr 포함 SG | 부수 확인 |
|---|---|---|---|---|---|---|---|
| G1 | EVAL 없음(실물 SPEC) | i1 SPEC만, EVAL·락 없음 | pre | src/app.ts | 0 | — | sdd-only 프로젝트 무간섭 |
| G2 | 툴 무관 | tool_input 없음 | pre | (없음) | 0 | — | |
| G3 | 비SRC | 정상 일습 | pre | README.md | 0 | — | .specgate-eval.json Write도 0 |
| G4 | 락 없이 구현 Write | EVAL 있음·락 없음 | pre | src/cart.ts | 2 | SG1047 | stderr에 'E7' 힌트 줄 |
| G5 | red 스냅샷 없음 | 락 있음·스냅샷 없음 | pre | src/cart.ts | 2 | SG1048 | |
| G6 | runOk false | red 스냅샷 `runOk:false` | pre | src/cart.ts | 2 | SG1048 | stderr에 «통과가 아니다» |
| G7 | 정상 pre(green 무해) | 락 + red 스냅샷 EV1 **green** | pre | src/cart.ts | 0 | — | green은 위반 아님(설계 계약 8) |
| G8 | E4 U 지목 | EVAL의 EV1 근거를 U1로 | pre | src/cart.ts | 2 | SG1044 | |
| G9 | tests/eval 작성 단계 | 락 없음 | pre | tests/eval/cart.test.ts | 0 | — | |
| G10 | freeze=warn | 락 + `{"evalFreeze":"warn"}` | pre | tests/eval/cart.test.ts | 0 | — | 로그에 `freeze-warn` 줄 존재 |
| G11 | freeze=reason(기본) | 락 + 설정 없음 | pre | tests/eval/cart.test.ts | 0 | — | 로그에 `freeze-reason` 줄 존재 |
| G12 | freeze=block | 락 + `{"evalFreeze":"block"}` | pre | tests/eval/cart.test.ts | 2 | SG1047 | stderr에 'block' |
| G13 | stop EVAL·락 없음 | — | stop | — | 0 | — | |
| G14 | final 스냅샷 없음 | 정상 락·EVAL, 스냅샷 없음 | stop | — | 2 | SG1048 | stderr에 `eval-run` 힌트 |
| G15 | stale | final 스냅샷 후 src/cart.ts 내용 변경 | stop | — | 2 | SG1049 | stderr에 «재실행» |
| G16 | E6 red 잔존 | final 스냅샷 EV1 red·기각 없음 | stop | — | 2 | SG1046 | |
| G17 | 기각으로 통과 | G16 + `## 기각`에 EV1 사유 행 | stop | — | 0 | — | |
| G18 | E7 개정으로 통과 | EVAL 수정(락 불일치) + `## 개정` 행 | stop | — | 0 | — | reason 기본 단 |
| G19 | E7 개정 없이 수정 | G18에서 개정 행 제거 | stop | — | 2 | SG1047 | |
| G20 | 재진입 가드 | G16 재료 + `stop_hook_active:true` | stop | — | 0 | — | 무한 루프 방지 |
| G21 | EVAL 소멸 우회 | 락 있음·EVAL.md 삭제 | stop | — | 2 | SG1047 | §3-3 2-b |
| G22 | stdin 파싱 실패 | stdin 빈 문자열 | pre | — | 0 | — | fail-open(계측 문제≠차단) |

케이스 루프는 spec-gate selftest(:240-271)를 본뜬다 — `spawnSync(process.execPath, [self, mode], {input: JSON.stringify(ev)})`, exit 불일치 시 stderr 첫 줄 병기. 차단 케이스 중 1건(G4)에서 `.specgate-log.jsonl` 마지막 줄의 `rules`에 해당 SG가 있는지도 단언한다(로그 계약 회귀).

### 5-2. 전체 검증 명령과 기대값

| 명령 | 기대 |
|---|---|
| `node framework/hooks/eval-gate.mjs --selftest` | §5-1 전건(≥22건) 일치, exit 0 |
| `node framework/hooks/spec-gate.mjs --selftest` | **기존 23건 기대값 무변경**, exit 0 (hooks.json은 spec-gate 코드가 아니다 — 여기가 변하면 무언가를 잘못 건드린 것) |
| `node framework/specgate.mjs --selftest` | 통과 — T3b 확장 포함, 기존 기대값 무변경 |
| `node framework/eval-verify.mjs --selftest` | 통과(무변경 — 게이트는 import만 했다는 증거) |
| `git diff --stat framework/hooks/spec-gate.mjs framework/spec-verify.mjs framework/skills/ framework/commands/ framework/verify-tdd.mjs` | **0 파일 변경** |
| `node framework/hooks/eval-gate.mjs pre <<< '잘못된 json'` | exit 0(수동 fail-open 확인 — **cwd를 스크래치로 두고 돌린다**, §6) |
| Git Bash: `time node framework/hooks/eval-gate.mjs pre < <정상 이벤트JSON>` (cwd = 스크래치, 1회) | 소요 ms를 rN에 기록 — 훅 1회 오버헤드(node 스폰 + 판정)의 첫 실측치. 감리 2차 조사 기준 어느 경쟁 도구도 훅 지연·토큰 비용 수치를 공개하지 않아 공개 기준선이 없다. **README·효과 주장에는 쓰지 않는다**(r28 §4 금지와 같은 결) |

## §6 하지 말 것·경계

- **`spec-gate.mjs`·`spec-verify.mjs`·`eval-verify.mjs`를 한 글자도 고치지 않는다**(SRC export 추가 유혹 포함 — 사본 1줄로). specgate.mjs 접촉은 §3-6의 T3b 2줄뿐이다. skills/sdd·tdd·commands/spec.md·verify-tdd.mjs(import도 금지) 무접촉 — 기존 selftest 기대값 변경 0이 정합 증거다(r50 선례).
- **훅 안에서 러너·npm·네트워크를 실행하지 않는다.** Stop 타임아웃 fail-open(리서치 3-0 ⑥ + planedd1 P-3 실측)이 차단력을 조용히 지운다 — 판정 재료는 스냅샷·락·EVAL.md·SPEC.md 파일 읽기와 해시 대조뿐이다(공유 계약 5). LLM 호출 금지(개발 규칙 5). 의존성은 Node 내장만.
- **검사를 게이트에 재구현하지 않는다.** E1~E7·스냅샷 판정은 `inspectEval` 경유가 유일 경로다 — 게이트 고유 로직은 시점 분기·SRC/tests-eval 필터·동결 3단·EVAL 소멸(2-b)까지다. 여기 판정식이 늘기 시작하면 eval-verify와 이중 진실이 된다.
- **재진입 가드를 pre에 걸지 않는다**(stop_hook_active는 Stop 전용 필드다), **stop에서 가드보다 앞에 차단 검사를 두지 않는다**(무한 루프 — spec-gate.mjs:106 주석).
- **훅을 손으로 돌릴 때 cwd를 스크래치로 준다** — 리포나 대상 프로젝트에서 돌리면 `.specgate-log.jsonl`에 진단 로그가 섞인다(FIELD-GUIDE §3 끝 — 첫 로그 줄이 그렇게 오염됐다). 시험 설치도 리포 밖 스크래치에서만(F1~F3: 설치 세션 미부착·재설치 필요·캐시는 작업 트리 복사).
- **델타 병합 직후 E5 유예를 «편의로» 넣지 않는다**(§3-4 — 조용한 완화 금지). **경고를 stderr로 내지 않는다**(warn 단 포함 — 로그만).
- `framework/smoke/` 기존 디렉터리는 읽기 전용(절대 규칙 6). 픽스처 디렉터리 신설 금지(개발 규칙 4 — 인라인 + mkdtemp만).

## §7 선택 대기

| # | 항목 | 기본값 | 대안 | 상태 | 번복 조건 |
|---|---|---|---|---|---|
| 1 | 배선 형태 | 별도 matcher 항목으로 나란히(spec-gate 항목이 앞) | 단일 진입 스크립트(순차 호출) | 선택 대기 — **planedd1 P-2 판정이 정한다**(§2) | P-2 = 순서 의존 실측 |
| 2 | 델타 병합 직후 E5 Outdated 유예 | 유예 없음 — `## 개정` 행으로 해소 | 병합 후 첫 Stop 1회 경고 강등 | 선택 대기 | 병합 직후 Outdated 마찰 사건 **3건**(1건은 우연, 3건은 설계 — FIELD-GUIDE §6) |
| 3 | eval-gate의 SRC 판정 | spec-gate SRC와 동일 값 사본 | 별도 목록·공용 export | 선택 대기(planeddmain §7 #7과 동일 항목) | 두 게이트의 대상 불일치로 오차단 1건 |
| 4 | evalFreeze 기본값 | `"reason"` | `"warn"` / `"block"` | 선택 대기(planeddmain §7 #2 — 이 지시서 소유) | 개정 행이 형식적 통과로 전락 3회 → block / 마찰 3회 → warn |
| 5 | EVAL 소멸(2-b)의 SG 번호 | SG1047 재사용(kind 'E7.frozen') | 게이트 전용 룰 신설(spec-gate 'gate.noSpec' 계열) | 선택 대기 | 로그 분석에서 «소멸»과 «수정»을 갈라 읽어야 할 사건 1건 |
| 6 | spec-gate matcher의 동일 확장(`Write|Edit|MultiEdit`) | 안 한다 — 기존 항목 무접촉(eval-gate 신설 항목만 확장 matcher, 감리 반영) | 동일 확장(별도 라운드) | 선택 대기(planeddmain §7 #8과 동일 항목) | Edit/MultiEdit 경유 SPEC 게이트 우회 실사용 1건 |

## §8 참조

- `framework/hooks/spec-gate.mjs` — 동형 원본: decide 객체(:36-48)·SRC(:19)·fail-open(:278)·재진입(:51-52·:106)·로그(:280-285)·selftest 루프(:240-271)·MINI 비공유 근거(:120-121)
- `framework/hooks/hooks.json`(현행) · `framework/specgate.mjs` — RULES(:32)·T3b(:375)·line1(:83) — 행 번호는 r51 반영 실측(감리)
- `framework/FIELD-GUIDE.md` — §1(로그는 사람이 안 받아적는다)·§3 F1~F3(설치 역학)·손 실행 cwd 오염
- `docs/next/2026-08-24/planedd1probe.md` §3-6(반영표) · `planedd4verify.md` §3-2(phase 계약)·§3-6 ③(T3b 위임) · `planedd5runner.md`(스냅샷 계약) · `planeddmain.md` §7 #2·#3·#7
- 외부: code.claude.com/docs/en/agent-sdk/hooks(Stop 타임아웃 fail-open) · github.com/nizos/tdd-guard docs/validation-model.md(LLM 차단 판정 대비 — 결정론 전용의 근거)

집행 중 이 지시서와 실물이 어긋나면 실물이 이긴다 — 어긋난 항목을 rN에 기록하라(r50 §2 선례).
