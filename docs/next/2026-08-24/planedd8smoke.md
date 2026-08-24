# planedd8smoke.md — EDD R6: 2층 스모크(문안·게이트) + 트랙 종결 문서 일괄

**팩**: EDD 트랙 9장 중 1장(마지막). 의존: planedd7skill.md 완료(SKILL·/eval 실물 필수) + planedd1~6 산출물 전부. 차별점 문단은 planedd2priorart.md의 확정 문장을 받는다.

## §0 목적·산출물

**목적 한 줄**: edd 축이 «문안으로 도달해 산출물이 순서대로 나오는가»(층A)와 «훅이 실제로 막는가»(층B)를 각각 실측하고, 통과하면 README·CLAUDE.md·STATUS를 일괄 갱신해 트랙을 닫는다.

**산출물 한 줄**: 층A 유효 런 2개(`se1-cart-r1` sdd+edd 조합 · `ed1-cart-r1` edd 단독) + 층B 차단 시나리오 3종 실측 + `framework/README.md`·`CLAUDE.md`·`docs/STATUS.md` 갱신 + rN 기록.

## §1 배경과 근거

1. **왜 2층인가.** 층A의 실행 역학은 기존 스모크 그대로 `--safe-mode` 본문 주입인데, **`--safe-mode`는 훅을 끈다**(CLAUDE.md 런 실행 절 — `--plugin-dir`까지 끄는 실측). 즉 층A에서는 게이트가 아무것도 검증되지 않는다. 반대로 층B(훅 등록 세션)는 문안을 주입하지 않으므로 산출물 순서를 검증하지 못한다. 한 런으로 둘을 재려는 설계는 어느 쪽도 못 잰다 — 그래서 층을 가른다.
2. **왜 sdd+edd 조합 1런인가.** r16 §5-2가 `sdd+edd`를 가치 가설의 핵심 조합으로 지목했고(침묵→문장이 먼저 있어야 평가 재료가 생긴다 — sdd 없이 edd는 상한이 낮다), r34의 2축 확정으로 이 조합은 한 번도 실측되지 않았다(STATUS: «r16 §5-2가 핵심으로 지목한 sdd+edd를 못 잰다»). 이 스모크가 그 첫 관측이다 — 단 n=1, 효과 주장 없음(§6).
3. **왜 edd 단독 1런인가.** EVAL.md 없으면 축 꺼짐·SPEC 없으면 E3 경고 강등이 설계 계약(공유 계약·planeddmain §3-7)인데, SPEC 없는 조건에서 문안이 실제로 EVAL.md를 만드는지는 조합 런으로 확인되지 않는다. 축의 독립 동작 확인이다.
4. **왜 문서 일괄이 여기인가.** README·CLAUDE.md는 sdd 병행 작업과의 공유 파일이라 트랙 종결 시 일괄 수정으로 직렬화한다(planeddmain §3-6). 그리고 스모크 전에 README를 쓰면 «돌아가는 것»이 아니라 «돌아갈 예정인 것»을 적게 된다.

## §2 선행 조건

**착수 전 정독(전문)**: CLAUDE.md «런 실행» 절 + «스모크 설계 규칙(조건 5)» 절 · `framework/FIELD-GUIDE.md`(특히 §3 F1~F3 — 설치 세션엔 훅 안 붙음 · 재설치 필요 · 캐시는 작업 트리 복사) · `docs/next/2026-08-16/r35.md` §2(층A 실행 역학의 직전 선례) · planedd7skill.md 실물 산출물(`framework/skills/edd/SKILL.md`·`framework/commands/eval.md` — 문안이 도구를 부르는 경로 표기를 확인해 둔다, §3-3-4).

- [ ] planedd3~7 산출물 실존: `eval-template.md`·`eval-verify.mjs`·`eval-run.mjs`·`hooks/eval-gate.mjs`·`hooks/hooks.json` 배선·`skills/edd/SKILL.md`·`commands/eval.md`.
- [ ] 신설 3종 selftest 통과: `node framework/eval-verify.mjs --selftest` · `node framework/eval-run.mjs --selftest` · `node framework/hooks/eval-gate.mjs --selftest` — 전부 exit 0.
- [ ] 라벨 충돌 0: `ls framework/smoke/ | grep -E '^(se1|ed1)'` → 0건 (절대 규칙 6 — 기존 스모크 디렉터리는 실측 원문, 덮어쓰기 금지).
- [ ] `git status` clean(종료 시 대조 기준값 — r28 §8-7).
- [ ] Git Bash · 프롬프트는 stdin으로만(CLAUDE.md 런 실행 절 — PowerShell은 한글 파손, r28 §3-5-4).

## §3 작업

### 3-1. 순서

**층B → 층A → 문서 갱신.** 층B가 싸고($0.4~1/런) 실패 파장이 크다 — 게이트가 CLI 세션 경유로 안 막히면(planedd6 selftest는 spawnSync 실프로세스지 CLI 훅 경유가 아니다) 층A 지출 전에 알아야 한다. 층B 실패 시 층A를 돌리지 않고 원인 가름이 라운드의 전부가 된다(FIELD-GUIDE §0 A-3과 같은 규율).

### 3-2. 조건 5(대조군) 적용 판단 — 불요

CLAUDE.md 스모크 설계 규칙의 조건 5는 적용 범위를 스스로 한정한다: *«침묵이 산출물에서 이름을 얻는가» 류의 판정(판정 ③·④ 같은 침묵 포착 판정)을 쓰는 **스모크**는 설계에 문안 없는 대조군 1런을 처음부터 넣는다*. 이 스모크의 판정(§3-5·§3-6)은 전부 **산출물 존재·순서·차단 이벤트**다 — 침묵 포착 판정이 하나도 없으므로 대조군은 불요다. 유일하게 침묵과 닿는 ㉤(U 지목 0)도 «모델이 침묵을 채웠는가»가 아니라 «E4 검사가 위반 0인가»라는 정적 검사 결과 확인이다. **대조군을 안 넣는 것이 조건 5 위반이 아니라 조건 5의 적용 범위 밖**임을 rN에 이 문장 근거로 한 줄 남긴다.

### 3-3. 층A — 문안 스모크 (런 2개)

**실행 역학은 기존 그대로**(CLAUDE.md 런 실행 절 · r35 §2 선례): Git Bash · stdin 프롬프트 · `--safe-mode` · `--append-system-prompt`로 SKILL 본문 주입 · `--permission-mode acceptEdits` · `--allowedTools Bash PowerShell`. `--safe-mode`가 훅을 끄므로 **층A에서 게이트는 검증되지 않는다** — 층A가 확인하는 것은 문안 도달과 산출물 순서뿐이다.

1. **격리**: cwd = 리포 밖 OS 스크래치 단독 부모(`Temp/fw-<라벨>/<라벨>/` — r35 §2 «격리» 형태). 부모에는 문안·SKILL 사본·도구 사본만 두고 형제 앱·리포가 보이면 안 된다. 종료 후 산출물을 리포로 **이동**해 커밋한다(r28 §5).
2. **시드**: `framework/verify-eval/seed/s2/`를 **복사**(절대 규칙 1 — r35 §2와 동일: `package.json`·`package-lock.json`의 `name`을 라벨로 → `npm ci`(lock md5 무변경 확인) → `npm run build` 종료 0. `dist/`는 `.gitignore` 처리).
3. **과제 문안**: `sent-sd1.txt`(CartList) 사본 → `sent-se1.txt`·`sent-ed1.txt`, 각각 `cmp` diff 0 확인. cart 계열 재사용이 기본값(기존 `sd1`·`i1`과 비교 가능 — 신규 과제는 §7 #1, planeddmain §7 #4의 사용자 확정 몫).
4. **도구 사본**: 층A 앱에는 플러그인이 없으므로 문안이 부르는 `eval-run.mjs`가 없다. `framework/eval-run.mjs`와 그 import 대상(`grep -E "^import" framework/eval-run.mjs`로 실물 열거 — 고정 목록을 믿지 않는다)을 스크래치 부모에 **복사**해 둔다. SKILL 실물이 다른 경로(`${CLAUDE_PLUGIN_ROOT}` 등)를 지시하면 사본 위치를 그 표기에 맞추되 **SKILL 원문은 한 글자도 고치지 않는다** — 경로가 안 풀려 러너가 못 돌면 그 관측 자체가 planedd7의 입력이다(기록, 무효 아님 — ㉢·㉣이 미충족으로 떨어진다).
5. **주입**: `se1` = `--append-system-prompt "$(cat ../sdd-SKILL.md; echo; cat ../edd-SKILL.md; echo; cat ../eval-cmd.md)"`(sdd → edd 순 — 사슬 순서, r35 §2의 sdd→tdd 선례. 순서는 기록 대상이지 판정 대상이 아니다) / `ed1` = edd-SKILL.md + eval-cmd.md. **eval-cmd.md(= `framework/commands/eval.md` 사본)를 반드시 함께 주입한다** — SKILL 초안에는 도구 호출 줄이 없고(planedd7skill.md §7 #2) `--safe-mode`에는 커맨드도 훅도 없으므로, 커맨드 문안이 빠지면 에이전트가 eval-run의 존재·경로를 알 길이 없어 ㉢·㉣이 구조적으로 미충족이 된다. 주입 시 문안 속 `${CLAUDE_PLUGIN_ROOT}`는 §3-3-4 사본 위치로 치환한 사본을 만든다(원본 무수정). 사본은 `framework/skills/*/SKILL.md`·`framework/commands/eval.md`에서 뜨고 md5를 기록한다.
6. **턴 설계 — 승인 회신**: /eval 흐름의 승인은 사용자 몫이라 단발 런에서 완결되지 않는다. 2턴 기본(sd3b 다턴 선례): t1 = 과제 문안 → 에이전트가 평가 항목 표를 제시하고 승인을 요청하며 멈추는 것이 기대 / t2 = `--resume`으로 회신 문안 `sent-<라벨>-t2.txt`(«전건 승인한다. 계속 진행해 완료까지 가라.») 투입. `--resume` 시 `--safe-mode`·`--model`·`--effort`·`--append-system-prompt`를 **매 턴 다시 준다**(CLAUDE.md — 자동으로 안 이어진다). t1이 승인을 묻지 않고 진행하면 ㉡ 미충족으로 기록하고 t2는 돌리지 않는다. 실물 SKILL의 흐름이 이 턴 설계와 다르면 실물이 이기고 rN에 적는다.
7. **런 후 계측(실험자, 스크래치에서 이동 전)**: `node framework/eval-verify.mjs <앱>/EVAL.md --json`(㉤ 재료) · `node framework/hooks/eval-gate.mjs stop < 빈이벤트JSON`을 cwd=앱으로 실행해 exit 기록(㉣ 재료). 손 실행이 `.specgate-log.jsonl`에 남긴 줄은 «계측분»으로 표기한다(FIELD-GUIDE §3 끝 — 진단 로그 오염 선례).

### 3-4. 층A 무효 조건 (사전 등록)

- 출력 JSON `permission_denials` 비어있지 않음 — **층A에는 훅이 없으므로** denial은 전부 계측 실패다(층B와 판정이 다르다, §3-6-3).
- `npm ci` 누락(요구 문안의 «설치됨» 단언이 거짓이 된다 — r25 §4-4).
- 첫 턴 무결성: 세션 JSONL 첫 사용자 메시지 ↔ `sent-*.txt` diff 0 실패(r28 §3-5-4).
- 세션 JSONL 미발견·파싱 실패.

무효는 에이전트 실패가 아니라 계측 실패다 — 앱을 시드로 되돌리고 새 라벨(`-r2`)로 재실행한다.

### 3-5. 층A 사전 등록 판정표 (결과 본 뒤 항목·기대값 변경 금지)

판정 재료는 세션 JSONL(툴콜 순서)·전사 원문·종료 시점 파일이다. ㉢의 red 스냅샷은 final이 같은 파일을 덮으므로 **세션 JSONL의 eval-run(phase red) Bash 호출과 그 tool_result 원문**으로 판정한다(실물 eval-run 출력 형식이 다르면 실물 기준으로 같은 사실을 판정하고 rN에 적는다).

| # | 판정 | 정의(판정 재료) | 기대 se1 | 기대 ed1 |
|---|---|---|---|---|
| ㉠ | EVAL 선행 | JSONL Write 순서: `EVAL.md` Write 인덱스 < 첫 구현 SRC(`src/*.ts·tsx`) Write 인덱스. se1은 추가로 SPEC.md가 첫 Write(r35 판정 I 상속) | 충족(SPEC → EVAL → SRC) | 충족(EVAL → SRC) |
| ㉡ | 승인 요청 | t1 전사에 평가 항목 표 제시 + 승인 요청 발화 — **원문 인용**으로 판정. 구현 SRC Write는 t2(승인 회신) 이후에만 | 충족 | 충족 |
| ㉢ | red-check | JSONL에 phase red의 eval-run 실행 기록·exit 0·`runOk:true`·red≥1 | 충족 | 충족 |
| ㉣ | final | 종료 시점 `.specgate-eval.json`이 `phase:"final"`·`runOk:true`·전건 green 또는 EVAL.md `## 기각`에 사유 행. §3-3-7의 eval-gate stop 손 실행 exit 0 | 충족 | 충족 |
| ㉤ | U 지목 0 | eval-verify `--json`에서 E4(SG1044) 위반 0 | 충족 | 해당 없음(SPEC 없음 — U 행 부재) |
| ㉥ | EV 표기 | `tests/eval/*` 전 파일의 it/describe 이름에 `/\bEV\d+\b/` 1건 이상(grep) | 충족 | 충족 |

red=0(전건 green)이 나오면 ㉢ 미충족으로 적고 원인 후보(스캐폴드 선만족 — 설계 계약 8)를 병기한다 — 기대값을 사후에 «green도 충족»으로 바꾸지 않는다.

### 3-6. 층B — 게이트 스모크 (차단 시나리오 3종)

**질문은 하나다 — 훅이 CLI 세션 경유로 실제로 막는가.** 리포 밖 스크래치(`Temp/edd8-<시나리오>/<시나리오>/`)에서 돈다. planedd1 프로브와 같은 스크래치 부모 재사용 가능.

1. **등록 형태 = `.claude/settings.json`**(기본값, §7 #2). 플러그인 설치가 아니다 — F1(설치 세션 미부착)·F2(캐시 미갱신)·F3(작업 트리 복사)이 관측을 속인다(FIELD-GUIDE §3, planedd1 §3-1과 같은 근거). 배선은 `framework/hooks/hooks.json`의 eval-gate 항목과 동형으로 하되 `${CLAUDE_PLUGIN_ROOT}` → `$CLAUDE_PROJECT_DIR` 치환. **eval-gate만 배선한다**(spec-gate 제외 — 신호 고립: SPEC 쪽 차단이 섞이면 어느 게이트가 막았는지 stderr를 읽어 갈라야 한다. 양 게이트 동시 배선의 실물 확인은 실사용 개시 몫).
2. **파일 사본**: eval-gate.mjs는 `../eval-verify.mjs`·`../specgate.mjs`를 import한다(planedd6 §3-1) — 스크래치에 상대 배치를 보존해 복사한다: `<스크래치>/hooks/eval-gate.mjs` + 루트에 import 대상 전부(`grep -E "^import" `으로 실물 열거, 재귀 1단계까지).
3. **차단 판정의 구분 방법 (사전 등록)**: PreToolUse 훅 exit 2는 출력 JSON의 `permission_denials`로 집계된다(2026-08-16 프로브 실측 — CLAUDE.md 방식 전환 절). 따라서 층B에서는 «denial 비어있지 않음 = 무효»를 그대로 쓰지 않는다. **denial·stderr 원문에 `SG10\d\d` 매치가 있으면 기대 차단(판정 재료), 없으면 계측 실패(무효)**다. 결정론 마커는 `.specgate-log.jsonl`의 `mode:"eval-pre"`/`"eval-stop"` 줄(planedd1 hook-log 선례). Stop 차단은 denial이 아니라 stderr 전달 + 추가 턴으로 나타난다(planedd1 P-3 관측 양식).
4. **시나리오 시드 조립**: EVAL.md는 `eval-template.md` 기반 최소 1항목(EV1·근거 S1), 락·스냅샷은 node 원라이너로 `eval-verify.mjs`의 `hash8`을 import해 **실계산** 조립한다(planedd6 §5-1 mkproj와 같은 방식 — 손으로 적은 가짜 해시 금지). 프롬프트는 ASCII 한 줄(planedd1 §3-1 — 인코딩 파손 원인 제거).
5. **런 커맨드 플래그**: **`--safe-mode` 금지**(훅을 끈다 — §1-1의 실측. CLAUDE.md 런 레시피를 그대로 복사하면 H-1이 «배선 실패»로 떨어진다). planedd1 §3-1의 런 커맨드를 준용한다 — `--setting-sources project,local` 부착(글로벌 훅·플러그인 훅이 관측에 섞이는 것을 막는다).

| # | 시나리오 | 시드(스크래치 상태) | 프롬프트 | 시점 | 기대 |
|---|---|---|---|---|---|
| H-1 | 락 없이 구현 시작 | EVAL.md 있음 · 락 없음 | `Create src/cart.ts exporting function addItem(). Do nothing else.` | pre | `src/cart.ts` **미생성** · denial/stderr에 **SG1047** · 로그 `mode:"eval-pre"` 1줄 |
| H-2 | red 스냅샷 없음 | EVAL.md + 락 있음 · 스냅샷 없음 | 동일 | pre | 미생성 · **SG1048** · 로그 1줄 |
| H-3 | final 없이 완료 선언 | EVAL.md + 락 + phase red 스냅샷(`runOk:true`) | `Create src/cart.ts exporting function addItem(), then declare the task complete.` | stop | 구현 Write는 통과(pre 조건 충족 — **이 pre 통과가 planeddmain.md §5 #6의 «정상 통과 1건»에 해당한다**), Stop에서 **SG1048**(phase final 부재) stderr 전달 · **추가 턴 발생**(`num_turns` 증가 또는 에이전트의 되물음 — 2026-08-16 프로브와 같은 역학) · 로그 `mode:"eval-stop"` 1줄 |

층B 무효 조건: SG 매치 없는 denial · 로그 mode 줄 0(훅 미발화 — 배선 실패, H-1에서 잡히면 P-0형 원인 가름으로 전환) · 세션 JSONL 미발견. 층B 산출물(settings.json·시드·출력 JSON·stderr·`.specgate-log.jsonl`)은 `docs/next/2026-08-24/edd8-runs/`로 이동해 커밋한다(planedd1 §4의 probe-runs 형태).

### 3-7. 트랙 종결 문서 일괄 갱신 (층A·층B 판정 후에만)

**framework/README.md**:
- «무엇이 들어오나» 표에 3행 추가: 스킬 `edd`(SPEC 문장→평가 항목→Red-Check→동결 절차) · 커맨드 `/eval`(항목 도출→승인→락→red-check) · 훅 행에 eval-gate 병기(pre: 락·red 스냅샷·E1~E5 / stop: final·신선도·E6·E7).
- «검사 5종»·«델타 검사 5종» 옆에 **«E검사 7종» 절 신설**: E1~E7 표(시점 열 포함) + SG1041~1050 번호 + «C4 복제 금지 — 전 문장 커버리지는 SG1050 Warning 집계만» 한 줄.
- «직접 돌리기»에 3행: `eval-verify.mjs <EVAL.md>`(exit 0/1/2) · `eval-run.mjs`(exit 0 = 스냅샷 산출, 빨간불이어도 0 — 판정을 exit에 싣지 않는다) · `hooks/eval-gate.mjs --selftest`.
- «한계» 절에 4건 추가: ① verify-tdd의 자체 테스트 계수에 `tests/eval/`이 섞인다(계측기 수정은 전수 재측정 조건이라 기록만 — 절대 규칙 3) ② **E4는 «U를 지목한 항목»만 잡는다** — 근거 셀에 S를 적고 U 행의 기본값을 테스트 단언으로 굳히는 우회는 못 잡는다(C4의 «ID 재기입만 잰다»와 같은 계열) ③ EVAL.md가 없으면 축이 통째로 꺼진다 — 켠 줄 알고 EVAL을 안 만들면 아무것도 안 막는다 ④ **스냅샷·락·EVAL.md는 위조 가능하다**(감리 반영) — 게이트는 파일을 신뢰하고 읽으므로 Bash로 스냅샷을 직접 쓰거나 셸로 소스를 만들면(`echo > src/x.ts` — matcher 밖) 속는다. 이 게이트의 위협 모델은 드리프트 방지 절차 강제지 보안 경계가 아니다.
- «다른 점» 문안 아래에 planedd2priorart.md가 확정한 차별점 문단을 **그대로**(«잠정» 꼬리표가 남아 있으면 꼬리표까지) 옮긴다.
**CLAUDE.md**: 커맨드 절에 3행(위 «직접 돌리기»와 같은 명령 + exit 규약 주석 한 줄씩) · 하네스 절의 specgate 언급에 eval-gate 훅·edd 스킬 포함을 반영.
**docs/STATUS.md**: edd 행을 «보류 — v0.2»에서 «착수·종결(도구 트랙)»로 — 보류 해제 근거(2026-08-24 사용자 결정 · planeddmain §1-1)와 G1·G2가 /eval 승인·`evalFreeze` 3단으로 형태를 바꿔 되살아난 것을 명시. 스모크 결과는 한정어 그대로(n=1·효과 주장 없음).

갱신 3건은 이 라운드가 README·CLAUDE.md를 접촉하는 유일한 지점이다(planeddmain §3-6 직렬화 — sdd 쪽 수정 라운드와 병행 금지).

## §4 산출물

| 경로 | 내용 |
|---|---|
| `framework/smoke/se1-cart-r1/` · `framework/smoke/ed1-cart-r1/` | 층A 앱 산출물(스크래치에서 이동) |
| `framework/smoke/runs/{se1,ed1}-cart-r1.{json,jsonl,stderr.txt,uuid.txt}` + `sent-se1.txt`·`sent-ed1.txt`·`sent-*-t2.txt` | 층A 실측 원문 |
| `docs/next/2026-08-24/edd8-runs/` | 층B 실측 원문(settings.json·시드·출력·로그) |
| `framework/README.md` · `CLAUDE.md` · `docs/STATUS.md` | §3-7 갱신 |
| `docs/next/2026-08-24/rN.md` | 판정표 채움·어긋남 기록(짧게 — 개발 규칙 1) |

## §5 검증 — 판정 가능한 완료 조건

1. **층A 판정표(§3-5) 전 행이 충족/미충족/해당 없음 중 하나로 채워졌고**, ㉡은 원문 인용이 붙어 있다. 미충족 행은 실패가 아니라 관측이다 — 그대로 적고 후속(문안 수정 여부)은 별도 라운드 몫.
2. **층B 3행(§3-6) 전부**: 기대 SG 번호가 denial/stderr 원문에서 확인되고 로그 mode 줄이 있다. 하나라도 어긋나면 트랙 종결(§3-7) 보류 — 게이트가 안 막는 채로 README에 «차단된다»를 쓸 수 없다.
3. **전체 selftest 스위트 전건 통과** (전부 exit 0, 기존 EXPECTED 무변경 — r50 선례):

| 구분 | 명령 |
|---|---|
| 신설 3종 | `node framework/eval-verify.mjs --selftest` · `node framework/eval-run.mjs --selftest` · `node framework/hooks/eval-gate.mjs --selftest` |
| 기존 | `node framework/spec-verify.mjs --selftest` · `node framework/specprobe.mjs --selftest` · `node framework/spec-delta.mjs --selftest` · `node framework/spec-anchor.mjs --selftest` · `node framework/spec-interview.mjs --selftest` · `node framework/hooks/spec-gate.mjs --selftest` · `node framework/specgate.mjs --selftest` |

`verify-tdd.mjs --selftest`는 스위트에서 **뺀다** — 돌리면 `framework/smoke/runs/`의 커밋된 실측 원문을 덮어쓴다(r28 §6-2). 이 라운드는 verify-tdd를 접촉하지 않으므로 돌릴 사유가 없고, 돌렸다면 `git diff` 확인 후 `git checkout` 복원이 조건이다.
4. **문서 갱신 존재 확인**: README에 `E검사`·`eval-gate`·`/eval` 문자열 실존(grep) · CLAUDE.md 커맨드 절 3행 · STATUS의 edd 행에 «보류» 문자열 부재.
5. 종료 시 `git status` 변경이 §4 목록뿐이다(기존 `framework/smoke/` 디렉터리·`runs/` 기존 파일 무변경 — `git diff --stat framework/smoke/` 로 신규 추가만 확인).

## §6 하지 말 것·경계

- **기존 `framework/smoke/`·`runs/` 파일을 덮어쓰지 않는다**(절대 규칙 6). 시드는 복사만(절대 규칙 1). exp*/ 4트랙 무접촉.
- **결과를 본 뒤 판정 항목·기대값을 바꾸지 않는다**(절대 규칙 5의 정신). 표 밖 관측은 새 칸을 만들지 말고 원문만 기록한다(planedd1 §5-2 형식).
- **효과를 주장하지 않는다.** 이 스모크가 확인하는 것은 «문안 도달»과 «차단 발생»까지다 — «edd가 값을 하는가»는 실사용의 아쉬운 지점 몫이다(CLAUDE.md 전환의 대가 명시). README·STATUS 문안에도 효과·품질 수치를 쓰지 않는다(r28 §4 금지 목록과 같은 결).
- **층A 결과를 보고 이 라운드에 SKILL·커맨드 문안을 고치지 않는다** — 고칠 거리는 rN에 기록하고 수정은 별도 라운드다(r25 «판정 후 문안 수정 0건» 선례). 판정과 수정을 한 라운드에 섞으면 자기 손질이 된다.
- **층A에서 게이트가 검증됐다고 쓰지 않는다**(`--safe-mode`가 훅을 끈다). 층B에서 문안이 검증됐다고도 쓰지 않는다(주입 없음). 층별 결론을 섞는 문장이 이 라운드 최악의 오류다.
- **리포 안 `.claude/`에 훅·스킬을 등록하지 않는다**(실험자 세션 오염 — CLAUDE.md 하네스 절). `~/.claude/skills` 금지. 층B는 플러그인 설치가 아니라 settings.json이다(F1~F3).
- 검증은 jsdom + `tsc -b` + `vite build`만 — Playwright 등 네이티브 바이너리는 이 머신에서 실행 불가(하드 제약, 재검토 금지).

## §7 선택 대기

| # | 항목 | 기본값 | 대안 | 상태 | 번복 조건 |
|---|---|---|---|---|---|
| 1 | 스모크 과제 | cart 계열 재사용(`sent-sd1.txt` 사본 — sd1·i1과 비교 가능) | 신규 과제 1장 | 선택 대기 — **착수 라운드에서 사용자 확정**(planeddmain §7 #4, 이 지시서 소유) | 사용자가 신규를 고르면 §3-3-3만 갈고 판정표는 유지 |
| 2 | 층B 등록 형태 | `.claude/settings.json` | 플러그인 설치 + 세션 재시작(F1~F3 절차 준수) | 선택 대기 | settings.json 경로로는 안 잡히는 배포 형태 결함(`${CLAUDE_PLUGIN_ROOT}` 치환 등)이 의심되는 사건 1건 — 그때 플러그인 형태로 1런 추가 |
| 3 | 층A 승인 턴 설계 | 2턴(`--resume` 회신 — sd3b 선례) | 문안에 «승인 불가 시 그 지점에서 중단» 단발 1턴 | 선택 대기 | t1이 승인 없이 진행하는 관측이 반복돼 턴 분할이 무의미해질 때 |
| 4 | 층B 런 모델 | CLAUDE.md 레시피 유지(`--model opus --effort xhigh`) | 저비용 모델(판정이 결정론 관측이라 모델 무관일 가능성 — planedd1 §7 #1과 동일 항목) | 선택 대기 | 재실측 반복으로 비용이 문제될 때 |

## §8 참조

- 리포: `CLAUDE.md`(런 실행 절 · 스모크 설계 규칙 조건 5 · 하네스 절 · 하드 제약) · `framework/FIELD-GUIDE.md` §0 A-3·§3 F1~F3·§4 · `docs/next/2026-08-16/r35.md` §2(층A 역학 선례)·§5(한정어 선례) · `docs/next/2026-08-15/r28.md` §3-5(무효 규정)·§5(격리 규칙)·§6-2(verify-tdd selftest 덮어쓰기) · `docs/next/2026-08-13/r16.md` §5-2(sdd+edd 핵심 조합) · `docs/STATUS.md`(edd 행 현행)
- 팩: `planeddmain.md` §3-6(직렬화)·§5 #6·§7 #4 · `planedd1probe.md` §3-1(settings.json 등록·ASCII 프롬프트·로그 마커) · `planedd6gate.md` §3-2·§3-3(차단 분기·SG 번호)·§5-1(G4·G5·G14가 H-1~H-3의 실프로세스 짝) · `planedd7skill.md`(SKILL·/eval 실물) · `planedd2priorart.md`(차별점 문단)

집행 중 이 지시서와 실물이 어긋나면 실물이 이긴다 — 어긋난 항목을 rN에 기록하라(r50 §2 선례).
