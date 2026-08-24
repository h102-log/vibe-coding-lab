# planedd7skill — edd 문안 작성 지시서: skills/edd/SKILL.md + commands/eval.md

**전제**: EDD 트랙 공유 설계 계약(planeddmain.md, 2026-08-24 확정)의 팩 1장이다. 이 지시서가
계약이나 집행 시점의 실물과 어긋나면 그쪽이 이긴다.

## 0. 목적과 산출물

**목적 한 줄**: edd 축의 전달 경로 2종 — 자연 발동용 스킬 문안과 명시 호출용 커맨드 문안 — 을
기존 2축 문안의 문체·분량 감각 안에서 만든다.

**산출물 한 줄**: `framework/skills/edd/SKILL.md`(30~45줄) + `framework/commands/eval.md`(40~70줄)
신설 2파일. 완료 판정은 §5의 정적 확인이고, 발동 실효는 planedd8smoke.md 몫이다.

## 1. 배경과 근거

- **훅은 차단만 하고 절차는 문안이 나른다.** planedd6gate.md의 pre 게이트는 락·red 스냅샷이
  없으면 막지만, 도출·승인·Red-Check·재실행·동결의 절차는 에이전트가 읽는 문안에만 실린다.
- **문체·분량 선례**: sdd SKILL 79줄 · tdd SKILL 16줄 · commands/spec.md 65줄(감리 실측). edd SKILL은
  절차가 5단계라 tdd보다 두껍고, 점검표 10범주 같은 목록이 없어 sdd보다 얇다 — 30~45줄이 그 사이다.
- **description이 곧 도달 경로다.** 설치형에서 본문은 Skill 호출 시점에야 들어오고 상시로 실리는
  것은 description뿐이다(r28 §3-1). 설치형 인식·명시 호출은 확인됐으나 자연 발동은 미노출이므로
  (r28 §7-0), description은 r28의 확인 항목 — I-1·I-2(구현 과제에서 발동 기대)와 I-3(코드 무변경
  과제에서 미발동 또는 무해 기대, §3-4 부 판정 ②) — 을 균형점으로 쓴다.
- **U 단언 금지의 실측 근거**: i1-cart-r1 스모크 판정 IV — `선택 대기` 10행 중 4행의 기본값이
  테스트 단언으로 굳었다(CLAUDE.md). 이 문안의 U 금지 절과 E4가 그때 미뤄 둔 예비 개입이다.
- **green은 실패가 아니라 Advisory다**: 전건 red를 강제하지 않는다 — 스캐폴드가 이미 만족하는
  문장이 실존한다(계약 8, planedd5runner.md의 `--phase red` green Advisory와 같은 결).
- **축 연결은 파일 존재로만**: 문안에 다른 축·스킬 이름을 적지 않는다(r19 §1, 근거 r16 §1) — §3-3.

## 2. 선행 조건

**planedd6gate.md 완료 후**에 돈다(의존 순서 planedd3→4→5→6→7 — planeddmain.md). 착수 전 확인:

- [ ] 4파일 실존: `ls framework/eval-template.md framework/eval-verify.mjs framework/eval-run.mjs
  framework/hooks/eval-gate.mjs` — 하나라도 없으면 착수하지 않는다.
- [ ] `node framework/eval-verify.mjs --selftest` · `node framework/eval-run.mjs --selftest` 둘 다 exit 0.
- [ ] `framework/skills/edd/` · `framework/commands/eval.md`가 아직 없다.
- [ ] **실물 CLI 대조**: eval-run은 `<app-dir> --phase red|final [--json]`과 `<app-dir> --lock`
  (planedd5runner.md §3), eval-verify는 `<EVAL.md 경로> [--pre|--stop] [--json]`(planedd4verify.md
  §3-2 CLI · §3-3 E검사)이다. 집행 시 실물 usage가 다르면 **§3의 초안 호출 줄을 실물에 맞추고** rN에 기록한다.
- [ ] `framework/eval-template.md` 정독 — 필수 열 6종(ID·근거·근거 해시·무엇을 어떻게 재나·
  테스트·승인)·필수 절(`## 기각`·`## 개정`)·«근거 해시는 도구가 채운다» 주석이 초안의 전제다.
  템플릿이 이 지시서와 어긋나면 템플릿이 이긴다(planedd4verify.md §2와 같은 규칙).
- [ ] 정독(문체 캘리브레이션): `framework/skills/sdd/SKILL.md`(절 구성·확정 절차의 문장 결) ·
  `framework/skills/tdd/SKILL.md`(짧은 description 형) · `framework/commands/spec.md`
  (없으면/있으면 분기·검사기 보고 형·allowed-tools 줄).

## 3. 작업

### 3-1. `framework/skills/edd/SKILL.md` — 전문 초안

아래 초안에서 출발해 다듬는다. **고정**(바꾸면 다른 지시서 산출물과 어긋난다): 인터페이스 어휘
전부 — `EVAL.md` · EV ID · `tests/eval/` · `EV3:` 접두 · `.specgate-eval.json` · `## 개정` ·
`## 기각` · `선택 대기` · `위임` — 와 절 구성 5절(도출·확정·Red-Check·동결·재실행) + 평가 자격 +
U 금지. **자유**: 문장 표현·줄바꿈. 단 30~45줄을 유지한다.

```markdown
---
name: edd
description: 새 기능 구현 요청에서, 구현을 시작하기 전에 성공 기준을 실행 가능한 평가(EVAL.md)로 확정하고 실행으로 판정한다. 구현 요청인데 EVAL.md가 없으면 이 절차를 먼저 하고, 코드 변경이 없는 작업(문서 정리·오타 수정 등)에는 적용하지 않는다.
---

# 구현 전 평가 확정

코드를 쓰기 전에 프로젝트 루트에 `EVAL.md`를 쓴다 — 성공 기준을 러너가 빨강/초록으로
판정하는 평가 항목(EV1, EV2, …)으로 확정하는 작업 문서다. 구현 산출물이 아니다.

## 1. 도출

`SPEC.md`가 있으면 그 §1·§2의 문장에서 항목을 도출한다 — 각 항목의 근거 열에 문장 ID를
적는다. 없으면 사용자 요청 문장이 근거다 — 근거 열에 요청 원문을 짧게 인용한다.

**평가 자격.** 둘 다 만족하는 것만 항목이 된다.
- 구현 전에 «무엇을 어떻게 재나»를 한 줄로 적을 수 있다(사전 명세 가능).
- 러너가 참/거짓을 낸다. jsdom에는 레이아웃이 없다 — «보이는가»는 못 재고
  «렌더되는가/언렌더되는가»로 바꿔 잰다. 바꿔 잴 수 없으면 자격 미달이다.

`SPEC.md` 미확정 표의 상태 `선택 대기` 행은 **근거로 쓰지 않는다.** 확정 전 기본값을
평가가 단언하면, 사용자가 아직 정하지 않은 것을 산출물이 굳히게 된다.

테스트는 `tests/eval/`에 두고, it/describe 이름 앞에 `EV3:` 식으로 항목 ID를 붙인다.

## 2. 확정 — 사용자 승인 1회

항목 표(ID · 근거 · 무엇을 어떻게 재나)를 제시하고 승인을 받는다 — 일괄 승인이 기본, 항목별
제외 가능. «알아서»면 기본안으로 확정하되 승인 열에 `위임`(날짜)을 적는다. 확정은 사용자 몫이다.

## 3. Red-Check — 구현 전 실행

승인 뒤, 구현을 시작하기 **전에** 평가를 실행해 실패(red)를 확인한다. 실행은 결과
스냅샷(`.specgate-eval.json`)을 남기는 방식으로 한다 — 스냅샷 없는 실행은 기록이 아니다.
red가 정상이다. 구현 전인데 green인 항목은 «구현을 재지 못할 수 있다»고 사용자에게 알린다.

## 4. 동결

승인된 `EVAL.md`와 `tests/eval/`의 테스트는 구현 중에 고치지 않는다. 정당한 수정은
`## 개정` 절에 행(EV# · 사유 · 날짜)을 남기고 한다 — 통과시키려는 손질과 가르는 기록이다.

## 5. 완료 전 재실행

완료를 선언하기 전에 평가를 다시 실행한다. 전건 green이거나, 아닌 항목마다 `## 기각`
절에 사유를 적는다. 둘 중 하나를 하기 전에는 완료가 아니다.
```

### 3-2. `framework/commands/eval.md` — 전문 초안

`/spec`의 «없으면/있으면» 분기 구조를 따른다. **락 생성 주체는 이 커맨드 문안이다** — 훅은
락을 읽기만 하고 만들지 않는다(계약 게이트 시점). `--lock`이 근거 해시 열을 채우므로 초안
단계의 해시 셀은 비워 둔다(planedd3manifest.md §3-3). 4단계 문장은 승인→락의 순서가 읽히게
유지한다 — 흐리면 planedd5runner.md 선택 대기 #1(«실행 도구가 승인 도구를 겸하는» 혼선)의
번복 조건이 발동한다.

````markdown
---
description: EVAL.md를 쓰거나, 이미 있으면 검사기를 돌려 위반·경고를 보고한다
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(node:*)
---

프로젝트 루트의 `EVAL.md` 상태에 따라 갈라진다.

**없으면** — `eval-template.md` 사본으로 새로 쓴다.

1. 근거를 정한다. 프로젝트 루트에 `SPEC.md`가 있으면 그 §1·§2 문장에서 평가 항목을
   도출하고 근거 열에 문장 ID를 적는다. 없으면 사용자 요청 문장에서 도출하고 근거 열에
   요청 원문을 짧게 인용한다. `SPEC.md` 미확정 표의 `선택 대기` 행은 근거로 쓰지 않는다.
2. 항목마다 «무엇을 어떻게 재나» 한 줄과 `tests/eval/` 테스트 경로를 채우고, 테스트의
   it/describe 이름 앞에 `EV3:` 식 접두를 단다. 근거 해시 열은 비워 둔다 — 4의 도구가
   채운다. 사전 명세가 안 되거나 러너가 참/거짓을 못 내는 기준(jsdom에서 «보이는가»
   류)은 항목으로 만들지 않는다.
3. 항목 표(ID · 근거 · 무엇을 어떻게 재나)를 사용자에게 제시하고 승인을 받는다 —
   일괄 승인이 기본, 항목별 제외 가능, «알아서»면 승인 열에 `위임`(날짜)을 적는다.
   **승인 응답을 받기 전에는 4로 넘어가지 않는다.**
4. 락을 만든다: `node "${CLAUDE_PLUGIN_ROOT}/eval-run.mjs" . --lock` —
   락(`.specgate-eval.lock`)은 이 절차가 만들고, 게이트 훅은 읽기만 한다.
5. Red-Check — 구현을 시작하기 **전에**
   `node "${CLAUDE_PLUGIN_ROOT}/eval-run.mjs" . --phase red` 를 돌리고 결과를 보고한다.
   red가 정상이다. green 항목은 «이 항목은 구현을 재지 못할 수 있다»로 보고만 한다 —
   지울지 유지할지는 사용자 몫이다. `runOk: false`는 평가 실패가 아니라 계측 실패다 —
   원인(러너 미실행·크래시·파싱 실패)을 고치고 재실행한다.
6. 구현이 끝나면 완료 선언 전에 `node "${CLAUDE_PLUGIN_ROOT}/eval-run.mjs" . --phase final`
   을 돌리고 결과를 보고한다.

**있으면** — 먼저 검사기를 돌리고, 그 출력을 근거로 보고한다:

```
node "${CLAUDE_PLUGIN_ROOT}/eval-verify.mjs" EVAL.md
```

- 위반 E1·E2 → `EVAL.md` 자체가 미완이다. 해당 항목·절을 채운다.
- 위반 E3 → 근거 문장 ID가 `SPEC.md`에 없다. ID를 고치거나 그 문장의 확정을 사용자에게
  요청한다. `SPEC.md`가 없는 프로젝트에서는 경고로 나온다 — 보고만 한다.
- 위반 E4 → `선택 대기` 행을 지목한 항목이 있다. 그 항목을 지우거나 사용자에게 그 행의
  확정을 요청한다. 기본값을 대신 단언하지 않는다.
- 위반 E5 → 근거 문장이 승인 시점과 달라졌다(Outdated). 사용자 재확인을 받아 `## 개정`
  행을 남기거나, 항목을 `## 기각`으로 보낸다.
- E6·E7은 완료 시점 검사다(전건 green 또는 기각 · 동결 대조) — 완료 선언 전이면 상태만 보고한다.
- 경고 → 위반이 아니다. 보고만 하고 임의로 고치지 마라.

검사 후 락(`.specgate-eval.lock`)이 없으면 아직 승인 전이다 — 위 3~5를 이어서 한다.

$ARGUMENTS 가 경로면 그 경로를 `EVAL.md` 대신 쓴다.
````

### 3-3. 축 연결 규칙 — 두 문안 전체에 적용

1. **직접 참조 0건.** 두 파일 어디에도 sdd·tdd·다른 스킬 이름·다른 축의 검사 이름(C1~C5 등)을
   적지 않는다. 축 연결은 산출물 파일 존재로만 한다(r16 조합 원칙, r19 §1 금지 선례) —
   초안에서 `SPEC.md`는 항상 «있으면» 분기의 파일이지 어느 절차의 산출물로 소개되지 않고,
   **없을 때 만들라고 지시하지도 않는다**(만들기는 다른 축의 몫이라 언급 자체가 참조다).
2. **edd 단독 조합이 문안에 실려 있어야 한다.** `SPEC.md` 없이 `EVAL.md`만 쓰는 프로젝트에서
   근거 열은 자유 텍스트(요청 원문 인용)가 되고 E3는 경고로 강등된다(계약 E검사). 초안에서
   이를 나르는 줄은 SKILL §1의 «없으면 사용자 요청 문장이 근거다»와 eval.md의 1·E3 항이다 —
   다듬으면서 이 두 자리를 지우지 않는다.

### 3-4. 다듬기 경계

- 판정 임계·항목 수 상한·신선도 기준 같은 **모르는 값을 문안에 박지 않는다** — §7 표로 보낸다.
- 문안은 도구 판정을 재정의하지 않는다. E검사·`runOk`·스냅샷 필드의 정의는 planedd4verify.md·
  planedd5runner.md 산출물이 정본이고, 문안은 호출·보고·위반별 조치 안내까지만 한다.
- description에 효과·품질 주장을 넣지 않는다(README 금지 선례 — r28 §4).

## 4. 산출물

- `framework/skills/edd/SKILL.md` — 신설 (30~45줄)
- `framework/commands/eval.md` — 신설 (40~70줄)
- 집행 rN 1장(짧게 — 초안과 달리 쓴 항목·실물과 어긋난 항목 기록)

## 5. 검증 — 전건 판정 가능, 리포 루트에서

| # | 확인 | 명령 | 기대값 |
|---|---|---|---|
| V1 | 직접 참조 0건 | `grep -n "sdd\|tdd\|SKILL" framework/skills/edd/SKILL.md framework/commands/eval.md` | 매치 0건 (exit 1) |
| V2 | 도구 경로 실존 일치 | `grep -ohE '\$\{CLAUDE_PLUGIN_ROOT\}/[a-z-]+\.mjs' framework/commands/eval.md \| sort -u` | 정확히 2종 — `eval-run.mjs` · `eval-verify.mjs`, 둘 다 `ls framework/` 에 실존 |
| V3 | 호출 플래그가 실물 CLI와 일치 | `grep -oE '\-\-(lock\|phase (red\|final))' framework/commands/eval.md \| sort \| uniq -c` | `--lock` 1 · `--phase red` 1 · `--phase final` 1 |
| V4 | allowed-tools 줄 | `head -4 framework/commands/eval.md` | `allowed-tools: Read, Write, Edit, Glob, Grep, Bash(node:*)` 포함 (spec.md와 동일 목록) |
| V5 | frontmatter | `head -4 framework/skills/edd/SKILL.md` | `name: edd` 존재, description에 «구현»·«전»·«평가» 포함 |
| V6 | 분량 | `wc -l framework/skills/edd/SKILL.md framework/commands/eval.md` | 30~45 / 40~70 |
| V7 | 모르는 값 부재 | `grep -nE '최대 [0-9]+\|상한\|임계' framework/skills/edd/SKILL.md framework/commands/eval.md` | 매치 0건 |
| V8 | 기존 자산 무수정 | `git status --porcelain framework/commands/spec.md framework/skills/sdd framework/skills/tdd framework/hooks` | 출력 0줄 |

인터페이스 어휘 잔존 확인(두 파일 합집합에서 각 1회 이상):

```bash
for t in 'EVAL.md' 'tests/eval/' '.specgate-eval.json' '.specgate-eval.lock' \
         '## 개정' '## 기각' '선택 대기' '위임' 'EV'; do
  grep -qF -- "$t" framework/skills/edd/SKILL.md framework/commands/eval.md || echo "누락: $t"
done   # 기대: 출력 0줄
```

V1~V8 전건 통과 + 누락 0줄이 완료 조건이다. 하나라도 어긋나면 문안을 고치고 재검한다 —
기대값 쪽을 고치지 않는다.

## 6. 하지 말 것·경계

- **수정 금지**(계약 파일 지도): spec-verify.mjs · spec-gate.mjs · spec-delta.mjs ·
  spec-anchor.mjs · specprobe.mjs · spec-interview.mjs · skills/sdd/ · skills/tdd/ ·
  verify-tdd.mjs · commands/spec.md · hooks.json(planedd6gate.md 완료분 그대로). 이 라운드가
  만드는 것은 신설 2파일뿐이다.
- **이 리포의 `.claude/`에 시험 설치하지 않는다.** 발동 확인은 planedd8smoke.md 몫이고 시험
  설치는 리포 밖 스크래치에서 한다(CLAUDE.md 하네스 절 · FIELD-GUIDE F1~F3).
- **새 커맨드·새 픽스처 디렉터리를 만들지 않는다.** 커맨드는 eval 하나다.
- **문안이 게이트 강도를 정하지 않는다.** `evalFreeze` 3단계(warn/reason/block)는
  `.specgate.json` 설정 몫이라 문안에 어느 단계가 옳다고 적지 않는다.
- **«전건 red» 강제 문장을 넣지 않는다** — green은 Advisory 보고다(§1 근거). Red-Check를
  통과 의례로 바꾸는 문장(«red가 나올 때까지 테스트를 고쳐라» 류)이 유혹당할 지름길이다.
- **초안을 버리고 백지에서 다시 쓰지 않는다.** 초안과 다르게 쓴 항목은 rN에 사유와 함께
  적는다. 고정 인터페이스 어휘는 사유가 있어도 못 바꾼다 — 계약 개정이고 이 라운드 밖이다.

## 7. 선택 대기

| # | 항목 | 기본값 | 대안 | 상태 | 번복 조건 |
|---|---|---|---|---|---|
| 1 | 평가 항목 수 상한 | 없음 — 평가 자격 기준만으로 거른다 | «최대 N개» 명시 | 선택 대기 | 실사용에서 항목 폭증(러너 1회가 분 단위로 길어짐)이 관측되면 |
| 2 | SKILL 본문의 도구 호출 줄 | 넣지 않는다 — 기존 두 문안이 무도구 선례고, 미실행은 게이트가 스냅샷 부재(SG1048)로 잡는다 | `${CLAUDE_PLUGIN_ROOT}` 호출 1줄 추가 | 선택 대기 | 커맨드 없이 발동한 세션이 SG1048로 반복 차단되는 사건 1건 |
| 3 | description 발동 범위 | «새 기능 구현 요청» + 코드 무변경 작업 제외 | 기존 코드 수정 요청까지 포함 | 선택 대기 | planedd8smoke.md·실사용에서 미발동(수정 과제) 또는 유해 과발동이 관측되면 |
| 4 | SKILL의 스냅샷 파일명 노출 | 노출한다(`.specgate-eval.json` 1회 — 게이트 차단 메시지와 어휘를 잇는다) | 파일명 없이 «스냅샷»으로만 | 선택 대기 | 파일명을 바꾸는 개정이 생기면(문안 동기화 비용이 드러난다) |
| 5 | 승인 UX | 일괄 승인 1회 + 항목별 제외(planeddmain.md §7 #1 — 초안 §3-1 절 2·§3-2 3단계가 이 기본값을 구현) | 항목별 개별 승인 | 선택 대기 | 일괄 승인이 «안 읽고 넘김»으로 관측 1건 |

## 8. 참조

- `docs/next/2026-08-24/planeddmain.md` — 공유 설계 계약(고정 인터페이스·파일 지도)
- `framework/skills/sdd/SKILL.md` · `framework/skills/tdd/SKILL.md` · `framework/commands/spec.md` — 문체·분량·분기 구조 선례
- `docs/next/2026-08-24/planedd3manifest.md` — EVAL.md 포맷 SSOT(`framework/eval-template.md`)
- `docs/next/2026-08-24/planedd4verify.md` §3-2(eval-verify CLI)·§3-3(E검사) · `planedd5runner.md` §3(eval-run CLI·green Advisory·선택 대기 #1) · `planedd6gate.md`(게이트 시점 — 훅은 락을 읽기만 한다)
- `docs/next/2026-08-13/r19.md` §1 — 축 직접 참조 금지(근거 r16 §1)
- `docs/next/2026-08-15/r28.md` §3-1·§3-4·§7-0 — description 발동·과발동 확인 항목, 자연 발동 미노출
- `CLAUDE.md` — i1-cart-r1 판정 IV(`선택 대기` 4행 굳음), 하네스 절(시험 설치는 리포 밖)

---

집행 중 이 지시서와 실물이 어긋나면 실물이 이긴다 — 어긋난 항목을 rN에 기록하라(r50 §2 선례).
