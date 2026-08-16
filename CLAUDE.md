# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 이 리포는 무엇인가

바이브 코딩 프레임워크를 **만들기 전에**, 프레임워크 없는 베이스라인이 실제로 무엇을 틀리는지 관측하는 **비교실험 기록**이다. `exp*/`의 Todo 앱들은 산출물이 아니라 **실험 데이터**다. 앱 코드를 "고치는" 것은 거의 항상 오답이다.

실험 트랙은 디렉터리 하나 = 트랙 하나로 나뉘고, **끝난 트랙은 통째로 동결**된다.

| | 질문 | 상태 | SSOT | 결과 |
|---|---|---|---|---|
| `exp/` | 프로세스 강제(SDD)가 첫 제출 점수를 올리는가 | 종료 | `exp/FROZEN.md` | `docs/REPORT.md` — 이득 없음 |
| `exp2/` | "쓴 테스트를 남겨라"가 회귀 자산을 만드는가 | 종료 | `exp2/FROZEN2.md` | `docs/REPORT2.md` — 만든다(mutation 3/4) |
| `exp3/` | 남은 자산이 새 세션에서 회수되는가(`assetRun`) | 종료 | `exp3/FROZEN3.md` | `docs/REPORT3.md` — 회수된다(새 세션 3/3) |
| 실사용 (`docs/usage/`) | 요구가 불완전할 때 §2가 침묵 지점을 미리 잡는가 | 종료 | `docs/next/2026-08-02/r8.md` | `docs/REPORT4.md` — 소수(`specHit` 1/4) |
| `exp4/` | «전부 옮겨라» 문안이 F-08 갭(3/4)을 닫는가 | 종료 | `exp4/FROZEN4.md` | `docs/REPORT5.md` — 못 닫음(중앙값 3/4, F-08 survived 2/3) |

**다섯 트랙이 전부 끝났다.** 실사용 트랙은 2026-08-12 마일스톤 달성으로 종료됐다 (사건 4건 · `specHit` 1/4,
사전 등록 문장은 «소수» 행 — `docs/REPORT4.md`). 대상이었던 `C:\Users\bhy99\proj\ai-prompt-vault`는
별도 리포의 살아 있는 프로젝트로 남고, 이 리포에는 관측 기록(`docs/usage/`)과 리포트만 남는다.
**실험 4(§4 문안 개정)도 2026-08-12 종료됐다** — «전부 옮겨라»를 얹어도 중앙값 3/4에 머물렀고(F-08
survived 2/3), 갭은 §4(문장→테스트 전이)가 아니라 **§2(침묵 지점 포착)에 있음**이 관측됐다
(`docs/REPORT5.md` §6). 남은 축(§1·§2)은 통제 실험으로 못 재므로(삼각 모순 — REPORT2 §6.3·r13 §1)
**다음은 프레임워크 v0.1 + 실사용 2회차다** — v0.1 1단계(tdd)는 r16(착수)~r18(재점검 종결)로
끝났고, tdd 산출물 계측기 `framework/verify-tdd.mjs`가 r20으로 신설됐으며, 그 정확도·실용성
평가(계획 r24)는 **r26으로 종결 — tdd 산출물 판정의 1차 도구로 채택**됐다(A 4/4 일치·B 미탐 0;
육안 축소는 B만, C·D는 미검증이라 육안 전수 유지). 2단계(sdd)는 계획 r22(v4 SSOT · §9 종결
기록 r23)에 따라 **r25로 착수 완료**했다(SKILL.md 79줄 + specprobe + 스모크 S-A/S-B/S-C,
판정 후 문안 수정 0건). sdd 검증 보강(r30 지시서 → **r31 실행**)에서 **대조군 1런(`sd4-cart-r1`, 문안 없음)에서도
판정 ③(접근성)이 «충족»**으로 나와 그 판정의 문안 귀속이 약해졌다(n=1 대조·반증 방향 — «sdd 효과 없음»이 아니라 «판정 ③은
문안 아니어도 나온다»). 블라인드 재판정(같은 계열 모델·5 독립 세션)은 **완전 대조 1장(S-A)에서 r25 판정 ③을 값·인용까지
재현**했고 대조군은 실험자 선판정과 일치(S-B는 r25에 3값이 없어 인용 지목만, S-C 2장은 대조 상대 없는 새 판정·1장은 무효 런 —
n/5로 세지 않는다); 재현 안 된 것은 질문 수 계수였고, **그 정의는 r32(지시서) → r33(집행)으로 닫혔다** —
sdd 판정 정의·재판정 루브릭의 SSOT `framework/rubric-sdd.md` v2.1을 신설하고 cart 형태 합성 픽스처
6장 × 독립 3세션 = 18세션이 선커밋 기대값과 **전건 일치**해 채택했다(문안 수정 0회). 한계는 «합성
픽스처에서의 재현성»으로 한정된다는 것 — **실물 SPEC 1장 재판정은 미실행**이고, «범위 흩어짐» 조항은
설계 미비로 시험되지 않았다(r33 §3-2·§6). 과제 선정 조건 5(모델 기본 행동 프로브)도 이때 아래
«스모크 설계 규칙»에 등재됐다. 다음은 3단계(edd, r16 §3-3단계) — 선행 미결은 r16 §7-2·3(사용자 결정).
다음 일정 선택지는 `docs/next/2026-08-15/r27.md`(방향 5개·시나리오 3개, 사용자 답 대기), 회수 라운드
지시서는 r28(미실행). 최신 세션 기록은 `docs/next/2026-08-16/r33.md`, **대기 중인 지시서는 r28 하나**이고
그 밖의 미결은 실물 재판정 1회와 루브릭 개정 후보 5건의 처리 시점이다(r33 §7-1·2 — 사용자 결정).
리포 전체 현황 한 장은 `docs/STATUS.md`.

## 절대 규칙

1. **`exp/`·`exp2/`·`exp3/`·`exp4/`는 한 글자도 고치지 않는다.** 네 트랙 전부 종료·동결이다. 새 트랙은 **새 디렉터리**를 만들고 자산을 **복사만** 한다 (`exp3/`가 그 예 — `judge.mjs`·`ac/`·`selftest.*`가 `exp/`·`exp2/`의 바이트 동일 사본).
2. **`ac/`는 파일을 *추가*하기만 해도 동결이 깨진다.** `FROZEN*.md` §0이 글롭 전체를 해시로 박는다.
3. **동결 자산 수정 = 양쪽 그룹 전체 재실행.** 예외는 계측기(`logprobe.mjs`)뿐이고, 그 경우 **기존 세션 전수 재측정** + 사유 기록이 조건이다.
4. **에이전트에게 `FROZEN*.md`·`judge.mjs`·`ac/`를 절대 주지 않는다.** 투입은 `prompt-*.md` + `CONTRACT*.md`뿐.
5. **결과를 본 뒤에 지표·조건·프롬프트를 바꾸지 않는다.** 재실행 사유는 `FROZEN3.md` §7.1 화이트리스트(계측 실패 2종)뿐.
6. 진행 중 트랙의 `runs/`·앱 디렉터리는 실측 원문이다. **`framework/smoke/`도 여기 포함된다** — 스모크 앱들은 실측 원문이면서 동시에 `framework/verify-tdd.mjs`의 회귀 감시 픽스처다(r20 §4). 덮어쓰면 복구 경로가 재실행밖에 없다.

## 하네스(Claude Code 커스터마이제이션)

이 리포에 등록된 것은 `.claude/skills/thought-dump/` 하나와 `.claude/settings.local.json`의 permissions 2줄뿐이다. 프로젝트 훅·서브에이전트·커맨드는 **없다** — 프레임워크 v0.1은 착수됐지만(`framework/` — tdd 스킬·스모크·verify 계측), 처치는 런에 `--append-system-prompt`로만 들어가고 계측은 실험자가 밖에서 돌리므로 하네스에 등록할 것이 없다.

⚠️ **`exp*/fw*/skills/spec/SKILL.md` 5개는 스킬처럼 생겼지만 하네스가 아니다.** 실험의 **처치물**이고 §0에 해시로 동결돼 있다. `~/.claude/skills`나 `.claude/skills`로 설치하면 동결 위반이자 실험자 세션 오염이다. 런에는 `--append-system-prompt`로만 들어간다.

실험 런은 `--safe-mode`라 프로젝트·글로벌 커스터마이제이션이 **주입되지 않는다.** 즉 여기 무엇을 등록하든 실측값에는 닿지 않고, 영향 범위는 실험자 세션(= 지금 이 세션)뿐이다.

## 커맨드

전부 **리포 루트에서** 돌린다. 트랙 번호(`exp` / `exp2` / `exp3`)를 자기 트랙 것으로 맞춰 쓴다.

```bash
# 채점 — tests/ac/를 원본으로 복원한 뒤 동결 config로만 실행 → exp3/runs/verdict-<label>.json
node exp3/judge.mjs exp3/b2t b2t-r1

# 과정 지표 — 세션 로그에서 firstImplOracle·oracleTrace·자체 테스트 작성/삭제를 뽑는다
# 두 번째 인자(cwd 슬러그)를 반드시 준다. 기본값은 exp/todo-a용이라 조용히 엉뚱한 세션을 읽는다
node exp3/logprobe.mjs <session-uuid> C--Users-bhy99-proj-proj3-exp3-b2t

# 앱에 남은 자체 테스트만 실행 (동결 AC 제외, 파일명이 아니라 내용으로 열거)
bash exp2/selftest.sh exp3/d

# mutation score — 동결 결함을 하나씩 주입하고 남은 테스트가 잡는지 본다
bash exp2/mutation.sh todo-d          # exp2/faults-d/<app>/<F-ID>/src/… 가 준비돼 있어야 한다
bash exp2/faultcheck.sh F-07          # 결함을 AC 오라클로 채점 (인자 없으면 4개 전부)

# 앱 안에서 오라클 1회 (사람이 실패 원문을 읽을 때)
cd exp3/b2t && npx vitest run --config tests/ac/ac.vitest.config.ts 2>&1 | tail -50

# tdd 산출물 판정 재료 (계측 — 에이전트에게 절대 주지 않는다. 해당 앱 npm ci 선행)
node framework/verify-tdd.mjs <app-dir> <label> [out-dir]   # → <out-dir>/verify-<label>.json (기본 framework/smoke/runs)
node framework/verify-tdd.mjs --selftest          # 음성 픽스처 4종, 기대값은 r20 §4 표와 대조

# sdd 산출물(SPEC.md) 판정 보조기 (계측 — 세기만 한다. 에이전트에게 절대 주지 않는다)
node framework/specprobe.mjs <SPEC.md 경로>   # 리터럴 4종 카운트, 판정은 육안이 이긴다 (r25 §0)
# sdd 판정 정의·재판정 루브릭 v2 = framework/rubric-sdd.md (r22 §5-2 → r30 부록 A → r32 개정, r33 검증: cart 픽스처 6장×3세션 전건 재현. 판정은 육안, 인용 필수 — 판정자에게는 A-0~A-5 본문만 준다)
```

`exp3/selftest.sh`는 사본이지만 내부에서 `exp2/selftest.vitest.config.ts`를 복사해 쓴다(내용 동일). 고치지 말고 `exp2/` 쪽을 그대로 호출하면 된다.

## 런 실행 (에이전트 투입)

**Git Bash로 돌린다** — PowerShell 5.1은 네이티브 exe 인자에 ANSI 코드페이지를 써서 한글 프롬프트 바이트가 깨진다. 프롬프트는 **stdin으로만** 준다(커맨드라인 인자는 동결 해시가 실투입값을 보증하지 못한다).

```bash
# cwd = 앱 디렉터리
cat ../runs/sent-r1.txt | claude -p \
  --safe-mode --model opus --effort xhigh \
  --permission-mode acceptEdits --allowedTools Bash PowerShell \
  --append-system-prompt "$(cat ../fw-d/skills/spec/SKILL.md)" \
  --session-id <UUID> --output-format json > ../runs/<label>-r1.json 2> ../runs/<label>-r1.stderr.txt
```

- `--safe-mode`가 `--plugin-dir`까지 끈다(실측). 그래서 처치는 `SKILL.md` **본문 주입**으로 넣는다.
- `acceptEdits`만으로는 `npm run …`이 전부 거부된다. `--allowedTools Bash PowerShell`이 필수다.
- `--resume` 시에도 `--safe-mode`·`--model`·`--effort`를 **매 라운드 다시 준다** (자동으로 안 이어진다).
- **라운드 무효 조건 2개** — `verdict.acRunOk: false` 또는 출력 JSON의 `permission_denials` 비어있지 않음. 에이전트 실패가 아니라 계측 실패이므로 점수로 기록하지 않고 앱을 시드로 되돌린 뒤 재실행한다.

### 스모크 설계 규칙

- **조건 5 — 모델 기본 행동 프로브** (r22 §5-1 조건 1~4에 더한다 — r32 §3-4 문안, r33 등재; r22는 고치지 않는다). «침묵이 산출물에서 이름을 얻는가» 류의 판정(판정 ③·④ 같은 침묵 포착 판정)을 쓰는 **스모크**는 설계에 **문안 없는 대조군 1런**을 처음부터 넣는다 — 같은 시드·같은 요구·같은 조건, **처치 주입만 뺀다**(실행 역학이 `--append-system-prompt` 주입인 동안은 그 플래그를 빼는 것이 곧 그것이다, r30 §3-2 형태). **본 런 전에** 프로브를 돌려 결정한다(런 1회 $0.5~1.5). 대조군 값은 r30 §3-6ⓒ 3분기 그대로 읽는다: **충족** → 그 침묵은 문안 효과를 보여줄 수 없는 축 — ⓐ 판정 축에서 빼거나 ⓑ 과제를 바꾼다 / **부분** → 축은 유지하되 문안 기여분을 ⓐ(지목)·ⓒ(값)으로 좁혀 읽고 본 런 판정 문장에 «대조군에서 ⓑ는 나왔다(원문 인용)»를 병기 / **미관측** → «문안 덕»의 약한 신호일 뿐(n=1 비대칭) — 본 런 판정 문장에는 «대조군 1런에서는 나오지 않았다»까지만 쓴다. **실사용 2회차에는 적용하지 않는다**(같은 시드·요구의 대조 런이 성립하지 않는다) — 거기서 침묵 포착 판정을 관측 항목으로 쓸 때는 «모델 기본 행동으로 채워지는 침묵일 수 있다(r31 §1-4)»를 한계로 병기하는 데 그친다. 현 cart 과제는 이 조건에 이미 걸린다(대조군 ③ 충족·④ 잡힘 — r31 §1-2).
<!-- r28 작업 ③(스모크 격리 규칙 2줄 — 리포 밖 OS 스크래치 단독 부모 · 종료 후 리포로 이동)은 실행 시 이 소절에 항목으로 더한다 (r32 §2-3 선착순: r32가 먼저 등재) -->

## 이 머신의 하드 제약 (재검토 금지, 실측 결론)

- **Smart App Control Enforced** → Playwright(chromium)·oxlint 등 네이티브 바이너리 **실행 불가**. E2E·별도 린터가 실험에서 빠진 이유이고, 끄라고 요구할 성질이 아니다. 검증은 jsdom + `tsc -b` + `vite build`로만 한다.
- **jsdom에는 레이아웃 엔진이 없다** → 반응형·CSS 가시성 판정 불가. 그래서 필터는 '숨김'이 아니라 '언렌더'로 계약에 규정돼 있다.
- Windows 네이티브는 Claude Code의 OS sandbox 미지원. 실행 중 차단은 설계에서 뺐고, **채점 시점 복원**으로 대체했다.
- 해시는 두 방식이 공존한다: `Get-FileHash`는 바이트, `judge.mjs`의 `frozen`은 **개행 정규화 후**. 값이 다른 게 정상이고 대조는 같은 방식끼리 한다.

## 문서 규약

- `docs/next/YYYY-MM-DD/rN.md` — 세션당 한 장, `N`은 날짜를 넘겨 이어진다. **결정에 이르는 과정**을 적는다.
- 확정된 실험 설계는 rN이 아니라 `FROZEN*.md`로 간다. **둘이 어긋나면 FROZEN이 이긴다.**
- `docs/analysis/` = 조사 압축본(인용은 여기서), 루트 `*.md` 3건 = 조사 원문(라인 번호·출처가 필요할 때만).
- `docs/thoughts/` = 결론 없어도 되는 기록. `.claude/skills/thought-dump`가 이 형식으로 쓴다.
- `docs/STATUS.md` = 리포 전체 현황 요약본(진행·미비·다음). 재구성일 뿐이므로 **rN·FROZEN과 어긋나면 그쪽이 이긴다.**
