# planedd1probe.md — EDD R0: 훅 의미론 프로브 3종 + 설치형 트리거 확인(r28 ①) 병합

**팩**: EDD 트랙 9장 중 1장. 의존: planedd2priorart.md와 병행 가능, **planedd6gate.md 착수 전 이 지시서 완료 필수**.

## §0 목적·산출물

**목적 한 줄**: planedd6gate.md(eval-gate 훅 배선)의 전제 3건 — PreToolUse 타임아웃 의미론 · 같은 이벤트에 걸리는 다중 훅의 deny 우선 여부 · Stop 타임아웃 fail-open — 을 **현행 CLI에서 실측**해 배선 설계의 근거를 결과 전에 확보한다.

**산출물 한 줄**: 실측표 1장(새 rN에 기록, §5 양식) + planedd6gate.md §2 선행 조건 갱신문(§5-3) + r28 작업 ① 판정(발동·시점·과발동 — r28 §3-4 그대로).

## §1 배경과 근거

1. **왜 프로브가 필요한가.** 딥리서치(2026-08-24) 적대 검증에서 두 주장이 **0-3 기각**됐다: ✗ «PreToolUse 타임아웃은 fail-closed다» ✗ «다중 훅에서 deny 최우선은 하드 보장이다». 반면 «Stop/SubagentStop 훅은 타임아웃 시 fail-open(경고만 찍고 정상 종료)»은 공식 문서로 **3-0 확정**됐다(code.claude.com/docs/en/agent-sdk/hooks) — 단 훅 의미론은 버전별로 변하므로 **우리 CLI 버전에서 재확인**한다. 2026-08-16 프로브(2런 $0.36 — 파일 미생성 · `permission_denials` 기록)는 **정상 경로만** 확인했고 타임아웃·다중 훅 경로는 미측정이다.
2. **왜 planedd6 전에인가.** eval-gate는 `framework/hooks/hooks.json`에 spec-gate 항목 **옆의 신설 항목**(matcher `Write|Edit|MultiEdit` — 감리 반영: Edit·MultiEdit 우회면 봉쇄, planedd6 §3-5)으로 additive 배선된다. `Write`에는 두 항목이 함께 걸리므로 다중 훅의 실행·우선 의미론이 배선 형태를 직접 가른다. 또 이 도구의 미점유 차별점이 «결정론-전용 차단»이므로(tdd-guard는 차단 판정을 LLM에 맡기고 자체 문서가 오차단을 인정 — 리서치 3-0 ②), **차단이 실제로 결정론적으로 성립하는 조건**(타임아웃에 조용히 사라지지 않는가)을 모르면 README «다른 점» 문안이 근거를 잃는다.
3. **왜 스냅샷 구조와 닿는가.** Stop fail-open이 재확인되면 «완료 게이트 훅 안에서 러너(vitest)를 돌리면 차단력이 조용히 사라진다»가 우리 버전에서도 성립 — 공유 계약 5(스냅샷 구조: 에이전트가 eval-run으로 스냅샷을 남기고 훅은 스냅샷만 읽는다, 밀리초 판정)의 실측 근거가 된다.
4. **왜 r28 ①을 병합하는가.** r28 작업 ①(설치형 트리거 확인)은 «실사용 개시 전 필수»로 남아 있고(CLAUDE.md), 이 프로브와 같은 성격(리포 밖 스크래치 · 세션 로그 판정 · 효과 주장 없음)이라 한 라운드에 묶으면 세션·비용이 산다. 확인 항목 2개는 r16 §3-4 단계 3 그대로다 — ① 작업 중간 발동 여부 ② «TDD로 해줘» 류 과발동의 무해성.

## §2 선행 조건

- **의존**: 없음(planedd2와 병행 가능). 이 지시서의 실측표가 나오기 전에 planedd6gate.md를 집행하지 않는다.
- **실행 전 확인 목록** (하나라도 어긋나면 착수 전에 해소):
  1. Git Bash에서 실행한다(PowerShell 금지 — 프롬프트 인코딩 파손, r28 §3-5-4 실측).
  2. `claude --version` 출력을 기록한다 — **실측표 첫 행이다.** 훅 의미론은 버전별로 변하므로 버전 없는 실측표는 무효다.
  3. `node --version` 확인(훅 스크립트가 node다).
  4. r28 병합분 재료 실존: `framework/skills/tdd/SKILL.md`·`framework/skills/sdd/SKILL.md` · 시드 `verify-eval/seed/s1`·`s2` · 문안 `sent-s1.txt`·`sent-sd1.txt`(소재는 r28 §3-3 표기를 따른다).
  5. 리포 작업 트리 clean(`git status`) — 프로브가 리포를 안 건드렸음을 종료 시 대조하기 위한 기준값.

## §3 작업

### 3-1. 공통 실행 조건 (프로브 P-0~P-3)

- **전부 리포 밖 OS 스크래치**에서 돈다: `Temp/edd1-<label>/<label>` (r28 §3-3 형태). 리포의 `.claude/`에 훅을 등록하면 실험자 세션 오염이다(CLAUDE.md 하네스 절).
- **훅 등록은 스크래치의 `.claude/settings.json`으로 한다. 플러그인 설치가 아니다** — 플러그인 캐시는 원본을 안 따라오고(F2), 설치 세션엔 훅이 안 붙고(F1), 캐시는 작업 트리 복사라 시점 추적이 안 된다(F3)(FIELD-GUIDE §3 F1~F3). settings.json은 세션 시작에 그대로 읽히므로 이 세 함정이 전부 빠진다.
- 런 커맨드(프롬프트는 stdin으로만 — CLAUDE.md 런 실행 절):

```bash
# cwd = Temp/edd1-<label>/<label>
cat prompt.txt | claude -p \
  --model opus --effort xhigh \
  --setting-sources project,local \
  --permission-mode acceptEdits \
  --session-id <UUID> --output-format json > runs/<label>.json 2> runs/<label>.stderr.txt
```

- `--setting-sources project,local` 부착이 **프로브의 기본값**이다(선택 대기 #2) — 글로벌 settings.json의 Stop 훅(알림)과 플러그인 SessionStart 훅이 P-2·P-3 관측에 섞이는 것을 막는다. r28 §3-2 ⓒ 실측: 이 플래그로 플러그인 훅 주입 0건 · 프로젝트 스코프 설정 유지 · 인증 무사. **r28 병합분(3-7)은 반대로 붙이지 않는다**(r28 §9-4 기본안 — 재는 것이 경쟁 필드에서의 도달이라서).
- 프로브 프롬프트는 **ASCII 한 줄**로 쓴다(인코딩 파손 원인 제거). 런 직후 세션 JSONL 첫 메시지 = `prompt.txt` diff 0 확인(r28 §3-5-4).
- 훅 스크립트는 스크래치 `hooks/` 아래에 두고, **판정에 앞서 로그부터 남긴다** — 모든 스크립트가 실행 즉시 `hook-log.jsonl`(스크래치 루트)에 start 줄을 쓰고, 끝까지 살아남으면 end 줄을 쓴다. **end 줄의 유무가 «타임아웃이 실제로 발동했는가»의 결정론 마커다** — 이게 없으면 «파일이 생겼다»를 fail-open으로 읽는지 «timeout 설정 미적용»으로 읽는지 못 가른다.
- 런당 관측 5종을 매번 다 적는다: ① 대상 파일 생성 여부 ② stderr 원문(첫 줄) ③ 출력 JSON의 `permission_denials` ④ `hook-log.jsonl` 줄들(start/end·순서) ⑤ start↔end의 `t` 차(ms — **스크립트 체류 시간**이다: node 스폰 오버헤드는 포함되지 않음을 병기. 훅 1회 총 오버헤드의 실측은 planedd6 §5-2의 `time` 손 실행이 잰다 — 감리 반영: 어느 경쟁 도구도 훅 지연 수치를 공개하지 않아 이 실측이 첫 기준선이 된다).

훅 스크립트 3장 원형 (스크래치 `hooks/`에 둔다 — `PROBE-…` 문자열과 20000ms만 프로브별로 바꾼다):

```js
#!/usr/bin/env node
// slow-deny.mjs — timeout(5s)보다 길게(20s) 버틴 뒤 exit 2. end 줄이 찍히면 타임아웃 미발동 = 그 런 무효.
import { appendFileSync } from 'node:fs';
const log = (m) => appendFileSync(new URL('../hook-log.jsonl', import.meta.url),
  JSON.stringify({ t: new Date().toISOString(), ...m }) + '\n');
log({ hook: 'slow-deny', phase: 'start' });
await new Promise((r) => setTimeout(r, 20000));
log({ hook: 'slow-deny', phase: 'end' });
console.error('PROBE-P1-DENY');
process.exit(2);
```

`fast-deny.mjs` = 위에서 sleep 제거·`PROBE-P0-DENY`(P-0/P-2용은 `PROBE-P2-DENY`) · `fast-allow.mjs` = sleep 제거·stderr 없음·`process.exit(0)`.

### 3-2. P-0 — 배선 대조군 (1런, 관문)

빠른 deny 하나만 등록해 **이 스크래치·이 플래그 조합에서 훅이 붙는지**부터 확인한다. FIELD-GUIDE §0 A-3과 같은 성격 — 이게 실패하면 나머지 프로브는 전부 무의미하고, **원인을 가르는 것이 라운드의 전부가 된다**(유력 후보: `$CLAUDE_PROJECT_DIR` 치환 실패 → 훅 command를 절대경로로 바꿔 가름).

```json
{ "hooks": { "PreToolUse": [ { "matcher": "Write", "hooks": [
  { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/hooks/fast-deny.mjs\"" } ] } ] } }
```

`prompt.txt`: `Create src/probe.ts exporting function add(a, b). Do nothing else.`

### 3-3. P-1 — PreToolUse 타임아웃 (1런)

P-0 settings에서 훅만 `slow-deny.mjs`로 바꾸고 `"timeout": 5`를 훅 항목에 준다(단위 초 — 공식 문서 기준. 미적용 의심 시 end 마커가 잡는다). 과제 동일.

```json
{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/hooks/slow-deny.mjs\"", "timeout": 5 }
```

### 3-4. P-2 — 같은 이벤트에 걸리는 다중 훅, deny 우선 여부 (2런)

실물 배선(planedd6 §3-5)은 **별도 matcher 항목 2개**가 같은 `Write` 이벤트에 함께 걸리는 형태다(spec-gate 항목 `Write` + eval-gate 항목 `Write|Edit|MultiEdit` — 감리 반영). 프로브도 그 형태로 잰다: `PreToolUse` 배열에 항목 2개(각각 matcher `Write`, hooks 1개씩 — fast-allow 항목·fast-deny 항목)를 등록하고 **항목 순서**를 뒤집어 2런 돈다. 과제 동일.

| 런 | PreToolUse 항목 순서 |
|---|---|
| B-1 | `[allow 항목, deny 항목]` |
| B-2 | `[deny 항목, allow 항목]` |

`hook-log.jsonl`의 start 줄로 **둘 다 실행됐는지**(병렬/단락 여부)도 함께 관측한다 — 공식 문서는 matcher 일치 훅의 병렬 실행을 말하지만 그것도 검증 대상이다.

### 3-5. P-3 — Stop 타임아웃 fail-open 재확인 (1런)

`Stop` 이벤트에만 `slow-deny.mjs` 변형(`PROBE-P3-DENY`, `"timeout": 5`)을 등록한다. PreToolUse는 등록하지 않는다. `prompt.txt`: `Reply with the single word done. Do not create or modify any files.` — 즉시 완료되는 과제라 Stop 훅이 바로 발화한다.

관측: 출력 JSON의 `num_turns`·`is_error`·result 존재 여부, 세션 JSONL 끝부분(차단 시 stderr가 에이전트에게 되돌아가 추가 턴이 생긴다 — `spec-gate.mjs` 주석 7행과 같은 역학), hook-log의 end 마커.

### 3-6. 판정 — 사전 등록 분기표 (결과를 보기 전에 이 표가 전부다. 본 뒤 칸을 만들지 않는다)

**프로브별 2분기(+무효)**:

| 프로브 | 관측 | 판정 |
|---|---|---|
| P-0 | 파일 미생성 + `permission_denials` 기록 | 배선 정상 — 진행 |
| P-0 | 파일 생성 | **배선 실패 — 여기서 멈추고 원인 가름**(P-1~P-3 착수 금지) |
| P-1 | end 없음 + 파일 **생성** | **fail-open** |
| P-1 | end 없음 + 파일 **미생성**(denials 또는 훅 오류 기록) | **fail-closed** |
| P-1 | end **있음** | 무효 — timeout 미적용. 값·위치·단위를 고쳐 재실행(fail-open으로 반올림 금지) |
| P-2 | B-1·B-2 **둘 다** 파일 미생성 | deny 순서 무관 차단(이 버전에서, 각 n=1 — «하드 보장»으로 승격 금지) |
| P-2 | B-1(allow 먼저) 생성 · B-2 미생성 | **순서 의존** |
| P-2 | 둘 다 파일 생성 | P-0과 모순 — 계측 실패로 취급, 재실행(판정 아님) |
| P-3 | end 없음 + 세션 정상 종료(추가 턴 없음) | **fail-open** — 문서 확정의 우리-버전 재확인 |
| P-3 | end 없음 + stderr 전달·추가 턴 발생 | **fail-closed** — 문서와 배치, 그대로 기록 |
| P-3 | end 있음 | 무효 — 재실행 |

**결과 → planedd6gate.md 반영표** (이 표의 오른쪽 칸이 §5-3 갱신문의 내용이 된다):

| 실측 결과 | planedd6 설계 반영 |
|---|---|
| P-1 fail-open | pre 게이트도 무거운 검사 금지가 **차단력 조건**이 된다 — E1~E5는 정적(파일 읽기·정규식, ms 단위)이라 충족. planedd6에 «pre 훅 안 작업은 파일 읽기·정적 검사만, 러너·네트워크·설치 금지»를 위반 시 차단력 소실 근거와 함께 명문화 |
| P-1 fail-closed | 차단력은 유지되나 정상 검사가 느려지면 **오차단**이 된다 — 결론은 같다(검사 경량 유지), 문구의 근거만 바뀐다 |
| P-2 순서 무관(deny 우선) | eval-gate를 spec-gate 옆에 **별도 항목으로 나란히** 두는 planedd6 §3-5 배선 유지 |
| P-2 순서 의존 | 현 설계 위험 — planedd6에서 완화 택1: ⓐ hooks.json 배열 순서를 명시 규약으로 고정(게이트류 앞) ⓑ 단일 진입 스크립트(spec-gate → eval-gate 순차 호출, exit는 첫 차단 것). 선택은 planedd6 몫, 이 라운드는 근거만 |
| P-3 fail-open | 스냅샷 구조 유지(이미 계약 5) + **stop 훅 작업은 스냅샷·락 파일 읽기와 해시 대조만**(ms). eval-run(러너)은 훅 밖 — 에이전트가 돌린다 |
| P-3 fail-closed | 그래도 스냅샷 구조 유지 — 러너를 훅에 넣지 않는 이유는 타임아웃 하나가 아니다(결정론 판정 분리 = 개발 규칙 5, 중복 실행 비용). 관측만 기록 |

### 3-7. r28 작업 ① 병합 — 설치형 트리거 확인 (3런)

같은 스크래치 부모(`Temp/edd1-*`) 아래에서, **r28 §3-3~§3-5를 그대로 집행한다. 이 지시서는 재정의하지 않는다** — 런 I-1(tdd 발동)·I-2(sdd 발동)·I-3(과발동 프로브), 판정은 r28 §3-4 사전 등록(주 판정 = 세션 JSONL의 `"name":"Skill"` 유무 · 부 판정 ① 발동 시점 `T_skill`/`T_del` · 부 판정 ② 과발동), 무효 규정은 r28 §3-5의 4건.

이 라운드에서 다시 못박는 것만 3줄:

1. 확인 항목은 2개다(r16 §3-4 단계 3): **① 작업 중간 발동** — 테스트를 만든 직후 발동해야 «지우지 마라»가 힘을 쓴다(완료 시점 로드는 늦다) / **② «TDD로 해줘» 류 과발동의 무해성** — 무관 과제(I-3)에서 떠도 작업을 망치지 않는가.
2. I-1~I-3 스크래치에는 **settings.json 훅을 넣지 않는다**(프로브 재료와 격리 — 스킬만 `<앱>/.claude/skills/`에 복사 설치, `~/.claude/skills` 절대 금지, r28 §3-3).
3. `--setting-sources`는 **붙이지 않는다**(r28 §9-4 기본안) — 3-1의 프로브 기본값과 다르며, 이 차이 자체를 실측표에 병기한다.

### 3-8. 순서·비용·런 수

실행 순서: **P-0 → P-1 → P-2(B-1·B-2) → P-3 → I-1 → I-2 → I-3.** 프로브가 앞이다 — planedd6를 여는 것은 프로브이고, I런은 실사용 게이트(G3) 쪽 조건이라 세션이 넘치면 I런만 다음 세션으로 민다.

기본 8런(프로브 5 + I런 3). 런당 $0.5~1.5 어림이되 프로브 과제는 한 줄이라 하한 쪽이다(선례: 2026-08-16 프로브 2런 $0.36). I런은 r28 §7 어림 $2~5. **합계 어림 $3~8, 무효 재실행 1~2회 예비 포함 상한 $10.**

## §4 산출물

| 경로 | 내용 |
|---|---|
| `docs/next/2026-08-24/rN.md` (새 rN — 실행 세션이 번호를 잇는다) | 실측표(§5 양식) · CLI 버전 · 프로브별 관측 5종 원문 인용 · I런 판정(r28 §3-4 양식) · 어긋남 기록 |
| `docs/next/2026-08-24/probe-runs/` | 스크래치에서 **이동**해 온 실측 원문: settings.json 4장 · 훅 스크립트 3장 · `hook-log.jsonl` · 출력 JSON·stderr (r28 §5의 «종료 후 산출물을 리포로 이동해 커밋» 그대로) |
| planedd6gate.md §2 갱신문 | §5-3의 1~3줄. planedd6 파일 자체를 고치거나, planedd6가 미작성이면 rN에 «planedd6 §2에 넣을 문장»으로 남긴다 |

신설·수정 코드 0. `framework/` 파일은 한 글자도 안 바뀐다.

## §5 검증 — 판정 가능한 완료 조건

1. **실측표가 다 찼다.** 양식(행이 비면 미완):

| 행 | 값 |
|---|---|
| `claude --version` | (원문) |
| 플래그 조건 | 프로브: `--setting-sources project,local` / I런: 없음 |
| P-0 | 파일 · denials · 판정(배선 정상/실패) · start↔end Δms(참고 — 스크립트 체류 시간) |
| P-1 | end 마커 · 파일 · denials · stderr 첫 줄 · **판정(fail-open/closed/무효)** |
| P-2 B-1 | 파일 · hook-log 순서(둘 다 떴는가) · denials |
| P-2 B-2 | 파일 · hook-log 순서 · denials |
| P-2 종합 | **판정(순서 무관/순서 의존/재실행)** |
| P-3 | end 마커 · `num_turns` · 추가 턴 유무 · **판정(fail-open/closed/무효)** |
| I-1 | Skill 호출 유무 · `T_skill`/`T_del` · skill_listing 수(미발동 시 필수 — r28 §3-4 교란 병기) |
| I-2 | Skill 호출 유무 · skill_listing 수(〃) |
| I-3 | 발동 횟수 · 과발동 분류(없음/무해/유해) |

2. **모든 판정이 3-6 분기표의 기존 칸에 떨어졌다.** 표에 없는 관측이 나오면 새 칸을 만들지 말고 «표 밖 관측»으로 원문만 기록한다 — 해석은 planedd6 집행자의 몫이다.
3. **planedd6 §2 갱신문이 존재하고**, P-1·P-2·P-3 판정 3개를 각각 한 번씩 인용한다(예: «P-2 = 순서 의존(rN §3) — 배선은 단일 진입 ⓑ 검토»).
4. **무효 런이 판정에 안 섞였다** — end 마커 있는 타임아웃 런·P-2 모순 런은 실측표에 «무효»로 남기되 판정 행에서 제외했다.
5. 종료 시 `git status`에서 리포 변경이 §4의 3건뿐이다(프로브가 리포를 건드리지 않았다는 대조 — r28 §8-7).

## §6 하지 말 것·경계

- **리포 안 `.claude/`에 훅·스킬을 등록하지 않는다.** 실험자 세션 오염(CLAUDE.md 하네스 절). `~/.claude/skills` 설치도 금지(r28 §3-3).
- **플러그인 설치로 프로브하지 않는다** — F1(설치 세션 미부착)·F2(캐시 미갱신)가 관측을 통째로 속인다(FIELD-GUIDE §3).
- **분기표(3-6)를 결과를 본 뒤 고치지 않는다.** 표 밖 관측은 §5-2대로 원문만 남긴다.
- **무효를 판정으로 반올림하지 않는다** — end 마커 있는 런을 fail-open 증거로 쓰는 것이 이 라운드 최악의 오류다.
- **n=1 관측을 보장으로 승격하지 않는다.** P-2가 두 순서 모두 막아도 «이 버전에서 관측됨»까지다 — 리서치가 그 주장을 0-3 기각한 이유(버전 의존)가 그대로 남는다.
- **`framework/` 코드를 수정하지 않는다.** spec-gate.mjs·hooks.json·SKILL.md 전부 무접촉 — 프로브 결과가 수정을 요구하는 것처럼 보이면 그것이 planedd6의 입력이지 이 라운드의 작업이 아니다(r28 §1-4와 같은 경계).
- **산출물 품질을 재지 않는다.** I런은 r28 §1-3 그대로 발동 여부만 — verify-tdd를 돌리지 않는다(r28 §3-4 «재지 않는 것»).
- **프로브 훅에 판단을 넣지 않는다.** 스크립트는 로그+sleep+exit뿐이다 — 여기 로직을 얹기 시작하면 재는 대상이 «CLI 의미론»에서 «내 스크립트»로 바뀐다.

## §7 선택 대기

| # | 항목 | 기본값 | 대안 | 상태 | 번복 조건 |
|---|---|---|---|---|---|
| 1 | 프로브 런 모델 | CLAUDE.md 레시피 유지(`--model opus --effort xhigh`) | 저비용 모델 — 판정이 결정론 관측(파일 존재·훅 로그)이라 모델 무관일 가능성 | 선택 대기 | 프로브 재실측이 반복돼 비용이 문제될 때 |
| 2 | 프로브 런에 `--setting-sources project,local` 부착 | 붙인다(글로벌 Stop 훅·플러그인 훅이 P-2·P-3 관측에 섞임 — r28 §3-2 ⓒ 실측) | 안 붙인다(배포 환경 그대로) | 선택 대기 | 부착 상태에서 스크래치 훅 자체가 안 뜨는 이상 관측 시(P-0이 잡는다) |
| 3 | JSON 출력형 훅 결정(`permissionDecision: "deny"`)의 타임아웃·우선 의미 추가 프로브 | 안 한다 — 우리 게이트는 exit 2만 쓴다(spec-gate 선례) | 2런 추가 | 선택 대기 | planedd6가 JSON 결정 형식 채택을 검토하게 될 때 |

## §8 참조

- 리포: `CLAUDE.md`(런 실행 절·하네스 절) · `framework/FIELD-GUIDE.md` §0 A-3·§3 F1~F3 · `framework/hooks/hooks.json` · `framework/hooks/spec-gate.mjs`(exit 2 규약·재진입 가드·로그 역학) · `docs/next/2026-08-15/r28.md` §3-3~§3-5·§7·§9-4 · `docs/next/2026-08-21/r49.md`(지시서 형식 선례)
- 외부: code.claude.com/docs/en/agent-sdk/hooks(Stop 타임아웃 fail-open 명시) · code.claude.com/docs/en/hooks(훅 등록·timeout 필드) · github.com/nizos/tdd-guard + docs/validation-model.md(LLM 차단 판정 대비 — README «다른 점» 근거)

집행 중 이 지시서와 실물이 어긋나면 실물이 이긴다 — 어긋난 항목을 rN에 기록하라(r50 §2 선례).
