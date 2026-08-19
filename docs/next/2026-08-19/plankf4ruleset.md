# KF4 수정계획서 — SG 번호 룰셋 + CLI 에이전트 계약

## 0. 요약

기존 검사기들(spec-verify C1~C5 · KF1의 D1~D5 · KF3의 A1~A3·드리프트 3범주 · KF5의 볼륨 4종)을 `SG1001…`
번호 룰 + 심각도(Error=차단 / Warning=출력만)로 재포장하고, `framework/specgate.mjs` 단일 CLI(`verify`/`delta`/
`drift`/`probe`)와 `.specgate.json`(mute)을 새로 만든다. 훅 stderr에도 룰 ID·힌트가 실려 사람·에이전트·CI가 같은
검사기를 소비한다. **새 검사는 0개** — 검출력은 한 건도 늘지 않고, 자기수정 루프가 도는지는 미실측(조사 Q1)이다.

## 1. Pain Point와 근거

**원 요청(KF4 절)**: «게이트 실패가 에이전트에게 이해 가능한 형태가 아니면 자기수정 루프가 안 돈다.
LLM 체크리스트는 비결정론(조사 F2), GUI 버튼은 에이전트에게 안 보인다(조사 F7).» 선례는 openapi-diff(조사
F6) — 검사를 ID 1000~1050의 번호 룰 약 50개로 열거하고 룰별 심각도를 붙여 Azure 프로덕션 CI의 차단 검사로
돌린다. 원 요청은 이 기능을 «새 검사가 아니라 기존 검사를 에이전트가 소비할 수 있는 형태로 바꾸는 기능»으로 규정했다.

**리포 실측이 보여주는 현행 형태**:

- `spec-verify.mjs`의 위반은 `[위반 C4] 문장 S3이 …` 산문이고 위치·수정 방법이 메시지 문자열에 섞여
  있다(`spec-verify.mjs:192`). finding 단위 스키마가 없고, 훅 stderr도 산문이다(`hooks/spec-gate.mjs:32·34·41`).
- 2026-08-16 프로브($0.36)에서 차단당한 에이전트는 우회 없이 사용자에게 되물었다 — 단 r37 §3의
  기록대로 에이전트의 이해는 stderr가 아니라 **훅 스크립트 원문을 읽어 C1~C5를 재구성**한 데서
  왔다. stderr만으로 같은 행동이 나오는지는 미실측이고(§9-3에 합류), «스스로 보완하고 재시도»까지
  간 관측도 없다.
- 검사기가 셋으로 갈라질 예정이다(KF1 `spec-delta.mjs` · KF3 `spec-anchor.mjs` · 기존 `spec-verify.mjs`) —
  진입 명령이 셋이면 CI 한 줄·에이전트 안내 한 줄이 성립하지 않는다.

## 2. 목표 / 비목표

**목표**

1. 모든 검사 결과가 `SG번호 (심각도): 메시지 — 위치` 한 줄로 나온다. 사람 터미널·훅 stderr·CI가 동일 포맷.
2. `--json`이 finding 단위로 `ruleId / severity / loc / hint`를 준다 — 에이전트·CI가 파싱한다.
3. `specgate.mjs` 단일 CLI가 기존 도구를 **얇게 감싼다**. 기존 도구의 독립 실행·출력·exit는 그대로 유지.
4. `.specgate.json`으로 Warning 룰 단위 mute. 에이전트 계약 — exit 1 + 룰 ID + 힌트로 스스로 보완·재시도할 수 있는 **형태**를 만든다.

**비목표** (목표와 같은 무게다)

- **새 검사를 만들지 않는다.** KF4는 기존 검사의 재포장이다. C4·C5가 «ID를 다시 적었는가»만 재는
  한계(빈 셀·«구현 안 함» 통과)는 번호를 붙여도 그대로다. 검출력 향상을 약속하지 않는다.
- 자기수정 루프가 실제로 도는 것을 약속하지 않는다 — 형태를 만들 뿐, 효과는 실사용 관측 대상(§9).
- 룰별 심각도의 «옳음»을 약속하지 않는다 — 심각도는 각 검사기의 현행 위반/경고 구분을 그대로 옮긴다.
  기존 도구의 출력·exit 변경 없음 — `spec-verify.mjs SPEC.md`를 치던 사람은 바뀐 걸 못 느낀다.

## 3. 현행 기반과의 관계

| 기존 파일 | 이 계획에서의 역할 |
|---|---|
| `framework/spec-verify.mjs` | `inspect()` export를 그대로 쓴다(훅이 이미 import하는 선례). finding 객체에 `kind`(안정 문자열)·`line` 필드만 **추가**한다 — 사람용 출력·exit·selftest 기대값 무변경 |
| `framework/hooks/spec-gate.mjs` | `list()`의 stderr 포맷 개정(룰 ID·힌트) + 로그 줄에 `rules` 필드 추가(§4-6). 판정 로직·시점 분리(pre C1~C3 / stop 전부)·재진입 가드는 손대지 않는다 |
| `framework/specprobe.mjs` | `probe` 서브커맨드가 출력을 패스스루한다. **성격 유지** — 판정을 exit에 싣지 않는다(메인 §5-3). SG103x 경고화는 KF5의 임계값이 생긴 뒤 이 CLI 층(R4의 `verify`)에서만 한다 |
| `framework/smoke/runs/r32-fixture-*.md` | specgate selftest의 대조 재료(읽기만 — 절대 규칙 6) |
| `hooks/spec-gate.mjs`의 selftest 패턴 | 실프로세스 실행 + exit 검증 패턴을 specgate selftest가 그대로 따른다 |

**새로 만드는 것이 «먼저 있는 걸 쓴다»에 어긋나지 않는 이유**: `specgate.mjs`는 검사를 하나도
재구현하지 않는다 — `inspect()` 계열 export를 부르고 결과를 번호·포맷으로 바꿔 낼 뿐이다. 룰 표
(`RULES`)는 그 안의 export 하나다(새 디렉터리·새 의존성 0, Node 내장만). 훅이 RULES를 import해도
CLI가 돌지 않도록 isMain 가드(`spec-verify.mjs:239` 선례)를 쓴다.

## 4. 설계

### 4-1. 서브커맨드 체계

```
node framework/specgate.mjs verify <SPEC.md>  [--json]   # spec-verify.inspect() 랩 — C1~C5
node framework/specgate.mjs delta  <SPEC.delta.md> [--json]  # KF1 spec-delta 랩 — D1~D5 (도구 부재 시 안내 + exit 2)
node framework/specgate.mjs drift  <SPEC.md> [--json]    # KF3 spec-anchor drift 랩 — 3범주 (동일. 인자 형식은 KF3 §4-5와 일치)
node framework/specgate.mjs probe  <SPEC.md>             # specprobe 패스스루 — 판정 없음, exit 0
node framework/specgate.mjs --selftest
```

- exit 통일: **0** Error급 finding 없음 / **1** 있음(드리프트 포함) / **2** 사용법·파일 없음·대상 도구
  부재. Warning만 있으면 exit 0(현행 spec-verify와 동일 — 경고는 판정이 아니다).
- **패스스루 원칙**: 래퍼의 exit는 감싼 도구의 판정과 어긋나면 안 된다(selftest T2가 검사).
  `delta`·`drift`는 `spec-delta.mjs`·`spec-anchor.mjs`를 **동적 import**한다 — 파일이 없으면
  «KF1(또는 KF3) 미도입 — <경로>가 없다» 한 줄 + exit 2. KF4가 먼저 착수돼도 verify는 돈다.

### 4-2. SG 룰 배정표 (메인 §5-2 예약 블록의 전개 — **표 전체가 §10-1·§10-2 선택 대기다**)

번호 도입의 적기는 룰 목록이 안정된 뒤다(재번호 비용 — 원 요청). 아래는 배정 **안**이고, KF1·KF3
검사가 확정되기 전에는 예약이다. 심각도는 exit를, «훅 배선»은 차단 시점을 정한다 — 둘은 별개 축이다.

| ruleId | 근원 | 심각도 | 훅 배선 | 메시지 골격 |
|---|---|---|---|---|
| SG1000 | 게이트: SPEC.md 부재 | Error | pre(Write) | SPEC.md가 없다 — 구현 전에 쓴다 (§10-4: 메인 §5-2 표 밖 추가분 — 메인 §10-2에서 확정) |
| SG1001 | C1 위반 | Error | pre·stop | `[추론]` 표기 0건 |
| SG1002 | C2 위반 | Error | pre·stop | 점검표 없음 / 누락 범주 / 상태 리터럴 위반 |
| SG1003 | C3 위반 | Error | pre·stop | 미확정표 없음 / 6열 아님 |
| SG1004 | C4 위반 | Error | stop | 문장 <ID> 완료 전 대조 미지목 |
| SG1005 | C5 위반 | Error | stop | `선택 대기` <ID> 재확인 목록 누락 |
| SG1006 | C4 경고 | Warning | 없음 | 지목에 «파일:줄» 없음 |
| SG1007 | C3 경고 | Warning | 없음 | `선택 대기`가 상태 열에서 안 잡힘 |
| SG1008 | C4 경고 | Warning | 없음 | 문장 ID 없음 — 판정 불가 |
| SG1009 | C5 경고 | Warning | 없음 | 순수 번호 ID — 판정 불가·제외 |
| SG1011~1015 | D1~D5 (KF1) | D3만 Warning, 나머지 Error | KF1 문서가 확정 | 3절 구조 / MODIFIED 파일:심볼 필수 / ID 규약 / 델타 범위 지목 / REMOVED 실존 |
| SG1021~1023 | A1~A3 record (KF3) | A3만 Warning, 나머지 Error | 없음(명시 실행) | 파일 미실존 / 줄 범위 무효 / 앵커 미기록 |
| SG1024~1026 | drift missing·stale·modified (KF3) | Error(**비배선** — 보고+exit 1) | 없음(명시 실행·CI 전용, 메인 §5-3) | 앵커 기준 3범주 |
| SG1031~1034 | 볼륨 4종 (KF5) | **Warning 전용**(차단 금지 — 조사 Q4: 최적 분량 미정량) | 없음 | 활성 문장 수 / [추론] 비율 / 표 행수 / 아카이브 후보 |

룰과 kind의 연결은 specgate.mjs의 export 하나다(발췌 — R1은 C 블록+SG1000만 등재, D·A·V 블록은 R3):

```js
// specgate.mjs — kind(spec-verify가 finding에 싣는 안정 문자열) → 룰. 훅도 이걸 import한다.
export const RULES = {
  'gate.noSpec':    { id: 'SG1000', sev: 'Error',   hint: 'sdd 절차(§1 명시 · §2 점검표 10범주 · 미확정 6열 표)로 SPEC.md를 먼저 쓴다' },
  'C1.none':        { id: 'SG1001', sev: 'Error',   hint: '§2에서 추론으로 확정한 문장 끝에 `[추론]`을 단다' },
  'C2.missingCat':  { id: 'SG1002', sev: 'Error',   hint: '점검표의 빠진 범주 행을 채운다' },
  'C4.miss':        { id: 'SG1004', sev: 'Error',   hint: '그 문장의 구현 위치를 §3.1에 «파일:줄»로 지목하거나 기각 사유를 적는다' },
  'C5.miss':        { id: 'SG1005', sev: 'Error',   hint: '그 `선택 대기` 항목을 §3.2 재확인 목록에 올린다' },
  'C4.vague':       { id: 'SG1006', sev: 'Warning', hint: '위치를 붙일 수 있으면 붙인다 — «실행 확인»·«부재로 충족»이면 그대로 둔다' },
  'C4.noId':        { id: 'SG1008', sev: 'Warning', hint: 'S1·I2 형태의 문장 ID를 매기면 C4 대조가 검사된다' },
  // 'C2.none'·'C2.badLiteral'(SG1002 동번호·힌트만 다름)·'C3.none'·'C3.badCols'(SG1003)·
  // 'C3.pendingLost'(SG1007)·'C5.numericId'(SG1009 — 전건 순수 번호 «판정 불가»)·
  // 'C5.numericExcluded'(SG1009 동번호 — 혼합 ID에서 «번호 N건 제외», spec-verify.mjs:171의 다섯째
  // 경고. 이 kind가 빠지면 §4-8의 SG---- 폴백으로 샌다) 등재 동형 — R1에서 전 kind를 채운다.
  // 전수성은 T3(픽스처 6장) + T14(혼합 ID — 픽스처에 없는 kind)가 잡는다.
};
```

전제 수정 1건: `spec-verify.mjs`의 `violate()`/`warn()` 호출부(약 13곳)에 `kind`·`line`을 얹는다.
사람용 출력·exit·`--selftest` 기대값은 한 글자도 안 바뀐다 — 필드 추가뿐이다. 메시지 문자열
정규식 매칭으로 kind를 추정하는 대안은 버린다(메시지 문구 수정이 곧 매핑 파손이라 취약하다).

### 4-3. 위반 출력 한 줄 포맷 (사람 터미널 = 훅 stderr = CI 로그)

```
$ node framework/specgate.mjs verify SPEC.md
SG1004 (Error): 문장 S3이 완료 전 대조에서 지목되지 않았다 — SPEC.md:12
  ↳ 그 문장의 구현 위치를 §3.1에 «파일:줄»로 지목하거나 기각 사유를 적는다
SG1006 (Warning): 지목은 있으나 «파일:줄»이 없는 문장 2건: S5, I1 — SPEC.md
  ↳ 위치를 붙일 수 있으면 붙인다 — «실행 확인»·«부재로 충족»이면 그대로 둔다
→ Error 1 · Warning 1 · muted 0 · exit 1
```

- 형식: `SG<번호> (<심각도>): <메시지> — <파일>[:<줄>]`. 줄을 모르는 finding(C1 등 문서 전역 검사)은 `:<줄>`을
  뺀다. 힌트는 룰 표의 **정적 문자열** 1줄(`↳`) — LLM이 상황별 힌트를 짓지 않는다(개발 규칙 5: 결정론과 판단 분리).

### 4-4. `--json` 스키마

```json
{
  "tool": "specgate", "subcommand": "verify", "target": "SPEC.md",
  "findings": [
    { "ruleId": "SG1004", "severity": "Error", "check": "C4", "kind": "C4.miss",
      "msg": "문장 S3이 완료 전 대조에서 지목되지 않았다",
      "loc": { "file": "SPEC.md", "line": 12 },
      "hint": "그 문장의 구현 위치를 §3.1에 «파일:줄»로 지목하거나 기각 사유를 적는다" }
  ],
  "muted": [], "counts": { "error": 1, "warning": 0 }, "exit": 1
}
```

`loc.line`은 모르면 `null`이다. 기존 `spec-verify --json`(원형 덤프)은 그대로 남는다 — 원형은 사람 디버깅용, 이쪽은 에이전트·CI 계약용이다.

### 4-5. `.specgate.json` (대상 프로젝트 루트 — KF4가 도입, 메인 §5-1)

```json
{
  "mute": ["SG1006"],
  "interview": {},
  "volume": {}
}
```

- `mute`: **Warning 룰만** 받는다. Error 룰 ID가 들어 있으면 무시하고 통지 1줄을 낸다(`mute 불가:
  SG1004는 Error다`) — 게이트를 설정 파일로 끄는 구멍을 열지 않는다. 이 자체가 §10-3 선택 대기다.
- `interview`(KF2 카테고리 mute)·`volume`(KF5 임계값)은 **예약 키** — 키의 값 스키마는 해당 KF
  문서가 정의하고(KF2 §4-5·KF5 §4-4), **로더·소비 배선(SG1031~1034 발행 포함)은 이 계획의 R4가
  WBS로 소유한다**(§5). 서로에게 미루다 소유 라운드가 비는 것을 막는 확정이다.
  훅은 KF4 시점에는 이 파일을 읽지 않는다 — 훅이 내는 것은 Error뿐이고 Error는 mute 불가라 읽을 이유가 없다.
- 파싱 실패 시: mute 미적용 + Warning 1줄(`구성 무시: .specgate.json 파싱 실패`), exit는 검사
  결과대로 — 깨진 설정이 판정을 뒤집지 않는다(로그 실패가 게이트를 안 막는 것과 같은 원칙).

### 4-6. 훅 stderr 개정 (`hooks/spec-gate.mjs` — 출력만, 판정·시점 불변)

```
# 현행                                          # 개정 후
SPEC.md가 아직 구현에 들어갈 상태가 아니다:      SPEC.md가 아직 구현에 들어갈 상태가 아니다:
  - [C2] 점검표 누락 범주: 4, 7                   - SG1002 (Error): 점검표 누락 범주: 4, 7
막힌 것: src/app.ts                                 ↳ 점검표의 빠진 범주 행을 채운다
                                                막힌 것: src/app.ts
```

`decide()`가 specgate.mjs의 `RULES`를 import해 `list()`에서 접두어·힌트를 붙인다. SPEC 부재
분기(`spec-gate.mjs:31`)는 `SG1000 (Error):` 접두어를 얻는다. **로그에는 `rules` 배열 필드를
추가한다** — 실물은 차단 블록의 첫 줄만 기록하므로(`spec-gate.mjs:105` `first: block.split('\n')[0]`,
그 첫 줄은 개정 후에도 헤더 문장이다) 필드를 더하지 않으면 룰 ID가 로그에 안 남고, §9-3의
«같은 룰 반복 차단» 판독이 처음부터 측정 불능이 된다:

```json
{"t":"2026-08-19T…","mode":"pre","file":"src/app.ts","first":"SPEC.md가 아직 …","rules":["SG1002","SG1004"]}
```

기존 필드는 그대로다(additive). 로그 복원은 T13이, 회귀는 §6 수용 기준이 확인한다.

### 4-7. CI 한 줄

```yaml
# 대상 프로젝트의 CI에 — exit 1이 곧 실패다. 옵션도 파서도 필요 없다.
- run: node <specgate 설치 경로>/specgate.mjs verify SPEC.md
```

로컬 훅과 CI가 **같은 검사기·같은 exit**를 쓴다. `bypassPermissions`에서 훅이 무력한 한계(README)의 보완선이 이 줄이다 — 훅을 지나쳐도 CI에서 같은 룰 ID로 걸린다.

### 4-8. 실패 모드 정리

| 상황 | 동작 |
|---|---|
| SPEC 파일 없음 / 사용법 오류 / 서브커맨드 오타 | usage 1줄 + exit 2 (spec-verify의 1/2 구분 관례 유지) |
| `delta`·`drift` 대상 도구 미도입 | 안내 1줄 + exit 2 |
| RULES에 없는 kind가 옴 | `SG----`로 출력하고 심각도는 finding의 위반/경고 축을 따른다 — 조용히 숨기지 않는다. selftest가 픽스처 전장에서 미배정 0을 검사한다 |
| `.specgate.json` 파싱 실패 | §4-5 — mute 무시 + 경고, 판정 불변 |

## 5. 작업 분해 (WBS)

각 라운드의 산출물은 «돌아가는 코드 + selftest»다. 판정 문서 라운드는 없다.

- **R1 — verify 랩 + 룰 표.** `spec-verify.mjs` 호출부에 `kind`·`line` 필드 추가(출력·exit 무변경,
  `--selftest` 6장 그대로 통과가 완료 조건) → `specgate.mjs` 신설: `RULES`(C 블록 + SG1000 예약,
  `C5.numericExcluded` 포함 전 kind 등재), `verify`, 한 줄 포맷, `--json`, `--selftest`(§6 표
  T1~T4·T8·T9·T11·T12·T14).
- **R2 — 설정 + 훅 + probe.** `.specgate.json` 로더·mute·파싱 실패 처리 → `spec-gate.mjs` stderr 개정(RULES
  import, SG1000 포함) + 로그 `rules` 필드(§4-6) → `probe` 패스스루 → selftest 확장(T5~T7·T10·T13) +
  기존 두 selftest 회귀 무변경 확인.
- **R3 — delta·drift 배선 (KF1·KF3 산출이 존재할 때만).** 동적 import 배선, D·A·드리프트 블록 RULES
  등재와 exit 패스스루 selftest, `README.md`에 룰 표 절 추가(코드가 돈 뒤의 짧은 문서 — 개발 규칙 1).
  KF1·KF3 전이면 이 라운드는 열지 않는다 — T11의 «미도입 exit 2»가 R1에서 이미 돈다.
- **R4 — volume·interview 배선 (KF5 R1·R2와 KF2 R1이 존재할 때만).** `verify`가 specprobe의
  `probe()`를 import해 `volume` 값을 읽고 `.specgate.json`의 `volume` 임계(기본값은 KF5 §4-4 표)와
  대조해 **SG1031~1034 Warning을 낸다** — `probe` 서브커맨드는 패스스루 유지(T10 불변). KF2
  카테고리 mute의 `interview` 키 로더·소비(인터뷰 문안이 stats 대신/과 함께 참조). selftest
  확장(볼륨 임계 초과·미달, interview mute 각 1건 이상) + 기존 회귀 무변경. V 블록 RULES 등재는
  이 라운드다 — §4-2 표의 V 블록은 그 전까지 예약이다.

## 6. 검증 계획

`node framework/specgate.mjs --selftest` — spec-gate.mjs 선례대로 실프로세스로 돌리고 exit까지 본다.
픽스처는 `framework/smoke/runs/r32-fixture-*.md` 6장 읽기만, 설정이 필요한 케이스는 `mkdtempSync` 임시 디렉터리를 쓴다.

| # | 케이스 | 입력 | 기대 |
|---|---|---|---|
| T1 | 픽스처 6장 finding 수 일치 | F1~F6 verify | finding 수 = spec-verify 위반+경고 수, Error 수 = 위반 수 |
| T2 | exit 패스스루 | F1~F6 verify | exit = `spec-verify.mjs` 직접 실행의 exit와 6장 전부 동일 |
| T3 | 미배정 kind 0 | F1~F6 verify | `SG----` 출력 0건 (매핑 전수성) |
| T4 | 한 줄 포맷 | F3 verify | 첫 Error 줄이 `^SG\d{4} \((Error|Warning)\): .+( — .+)?$` 매치, C4 건은 `— <파일>:<줄>` 포함 |
| T5 | Warning mute | 임시 프로젝트 + `{"mute":["SG1006"]}` + F5 | SG1006 줄 미출력, `muted:["SG1006"]`, exit 불변 |
| T6 | Error mute 시도 | `{"mute":["SG1004"]}` + F3 | 통지 1줄 + SG1004 출력 유지 + exit 1 유지 |
| T7 | 깨진 설정 | `.specgate.json`에 비JSON | `구성 무시` 경고 1줄, mute 미적용, exit는 검사 결과대로 |
| T8 | 파일 없음 | verify 없는경로 | exit 2 |
| T9 | 서브커맨드 오타 | `verfy` | usage + exit 2 |
| T10 | probe 패스스루 | F2 probe | specprobe와 동일 JSON 필드, exit 0 (판정 없음) |
| T11 | 도구 미도입 (R3 전 R1에서도 상시) | delta·drift 호출, 대상 파일 부재 | 안내 + exit 2 |
| T12 | --json 스키마 | F3 verify --json | 전 finding에 ruleId/severity/loc/hint 4필드 존재, loc.line은 정수 또는 null |
| T13 | 로그 룰 ID 복원 (R2) | mkdtemp 프로젝트에서 훅 pre 차단을 실프로세스로 유발 후 `.specgate-log.jsonl` 판독 | 마지막 줄의 `rules` 배열 = stderr에 나온 SG 번호 집합. 기존 필드(`t`·`mode`·`file`·`first`) 보존 |
| T14 | 혼합 ID kind 매핑 (R1) | mkdtemp 인라인 SPEC — 미확정표 ID가 숫자·비숫자 혼합(픽스처 6장에 없는 kind) | `C5.numericExcluded`가 SG1009로 출력 · `SG----` 0건 |

**수용 기준**: T1~T14 전건 통과(라운드별 해당분) + **기존 selftest 회귀 무변경** — `spec-verify.mjs --selftest` 6장
기대값과 `hooks/spec-gate.mjs --selftest` 10건 exit 그대로(훅 stderr 문구는 바뀌지만 그 selftest는
exit만 단언한다). 기대값을 고쳐야 통과한다면 판정이 바뀐 것이니 멈추고 원인을 가른다.

## 7. 3예산 명세

- **① 읽기**: 위반 대면 시점의 읽기는 준다 — 룰당 1줄 + 힌트 1줄, 세 소비자(터미널·훅·CI)가 같은 문장을 공유한다.
  느는 것은 README 룰 표 절 약 30행(1회성 참조, R3) — 반대급부는 «왜 막혔는지»를 코드를 열지 않고 표에서 찾는 것.
- **② 중단**: **새 중단 지점 0.** 차단 시점·조건은 현행 게이트(pre/stop) 그대로 — 위반 시에만, 형식만 바뀐다.
- **③ 화폐**: LLM 0패스, 토큰 0(전부 정적 — 메인 §5-3). 훅 stderr가 finding당 힌트 1줄만큼 길어지는
  것이 유일한 컨텍스트 증가분이고, 힌트는 룰당 정적 1줄 상한이다.

## 8. 의존성과 착수 조건

- **전제(모든 KF 공통)**: r38 관문 A-3(플러그인 설치 형태에서 차단 확인) 통과 + G3(실사용 실수요).
- **KF4는 P2다.** 착수 적기 자체가 §10-1 선택 대기다 — 기본값은 «룰 목록 안정 뒤»(KF1의 D1~D5·KF3의 A1~A3·
  드리프트 정의 확정 뒤). 실사용에서 «왜 막혔는지 모르겠다» 마찰이 먼저 쌓이면 C 블록만 조기 도입하는 대안이 있다(§10-1).
- R3은 KF1(`spec-delta.mjs`)·KF3(`spec-anchor.mjs`)의 `inspect()` 계열 export가 있어야 연다.
  R4는 KF5 R1·R2(값 계약)와 KF2 R1(기록 계약)이 있어야 연다. R1·R2는 현행 spec-verify만으로 돈다.
- KF2의 카테고리 mute·KF5의 볼륨 임계는 이 계획이 도입하는 `.specgate.json` **이후**다(메인 §5-1:
  KF4 전에는 설정 파일 없음). KF5의 SG1031~1034 경고는 R4에서 `verify`가 specprobe 값을 읽어 내는
  형태고(메인 §5-3), specprobe 자신은 끝까지 판정을 exit에 싣지 않는다.

## 9. 명시적 한계

1. **F7은 medium이다**(원 요청). «GUI 버튼은 에이전트에게 안 보인다»는 근거의 증거 강도가 높지 않다.
2. **번호 체계 도입의 적기는 룰 목록이 안정된 뒤다**(원 요청 — 재번호 비용). 그래서 §4-2 배정표는 확정이
   아니라 선택 대기(§10-1·§10-2)다. 조기 도입 후 검사가 갈라지면 재번호 비용을 문서·로그·mute 설정 전부가 치른다.
3. **에이전트 자기수정 루프가 실제로 도는지는 미실측이다(조사 Q1).** 확인된 것은 «차단이 작동한다»($0.36 프로브)까지고,
   그때의 «되묻기»도 stderr가 아니라 훅 소스 읽기에서 왔다(§1 — stderr 단독 효과는 미실측). 차단이
   품질을 올린다는 통제 비교는 조사 전체에 없다. 룰 ID·힌트를 받은 에이전트가 보완-재시도하는지는
   실사용 2회차 관측 항목이다(`.specgate-log.jsonl`의 같은 룰 반복 차단 — §4-6의 `rules` 필드가
   있어야 판독 가능하다).
4. **검출력은 1도 늘지 않는다.** C4·C5가 «ID를 다시 적었는가»만 재는 한계(빈 셀·«구현 안 함» 통과 —
   README·r36 §9-2)는 SG1004·SG1005로 이름이 바뀌어도 그대로다. 그 한계를 깎는 것은 KF3의 몫이다.
5. **정적 힌트는 상황을 모른다.** «이 프로젝트의 이 문장을 어떻게 고칠지»는 담지 못한다. 상황별
   안내에는 LLM이 필요하고, 그건 차단 경로에 넣지 않는다(개발 규칙 5).
6. **F2(LLM 체크리스트 비결정론)는 KF4가 결정론이어야 하는 이유이지, KF4가 효과 있다는 증거가 아니다.**
7. mute는 Warning 전용이라 **오차단의 탈출구가 아니다** — 조치는 FIELD-GUIDE §2대로 `SRC`·`PRE` 조정이다. Error mute 불가가 내는 마찰은 관측 대상이다(§10-3 번복 조건).
8. 훅 stderr가 길어지는 만큼 에이전트가 읽을 텍스트도 는다 — «한 줄 포맷이 산문보다 잘 소비된다»도 실측된 적 없는 가정이다.

## 10. 선택 대기

| # | 침묵 지점 | 적용한 기본값 | 대안 | 상태 | 번복 조건 |
|---|---|---|---|---|---|
| 1 | SG 번호 도입 적기 | 룰 목록 안정 뒤(KF1·KF3 검사 확정 후) 착수 | 실사용 마찰이 먼저면 C 블록(SG1000~1009)만 조기 도입, D·A·V는 예약 유지 | 선택 대기 | 실사용에서 «왜 막혔는지 모르겠다» 유형 마찰 사건 발생 시 조기안으로 |
| 2 | 배정표 자체(블록 구획·개별 번호) | 메인 §5-2 예약 블록 그대로(§4-2 표) | 검사기별 100단위 분리(SG11xx 델타 · SG12xx 앵커 등) | 선택 대기 | KF1·KF3 확정 시 검사 수가 예약 블록을 넘치면 |
| 3 | Error 룰 mute 가능 여부 | 불가 — mute 지정 시 무시 + 통지 | ⓐ 허용 ⓑ mute 시 Error→Warning 강등(exit 0) | 선택 대기 | 실사용 오차단이 `SRC`·`PRE` 조정으로 못 잡히는 형태로 관측될 때 |
| 4 | SPEC 부재 차단의 번호 | SG1000 배정(게이트 전용 — 메인 §5-2 표 밖 추가분) | 번호 없이 현행 산문 유지 | 선택 대기 | 메인 §10-2에서 기각되면 산문 유지 |
| 5 | Warning의 exit 반영 | 없음 — Warning만 있으면 exit 0 | `--strict` 플래그로 Warning도 exit 1(CI 전용) | 선택 대기 | CI 도입 후 경고 방치가 반복 관측될 때 |
| 6 | `.specgate.json` 스키마 구획 | 최상위 키 네임스페이스(`mute`/`interview`/`volume`) | 도구별 설정 파일 분리 | 선택 대기 | KF2·KF5 키가 실제로 채워질 때 충돌이 나면 |
