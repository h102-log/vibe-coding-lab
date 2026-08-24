# planedd4verify — `eval-verify.mjs`(정적 검사기) + specgate E룰 등재

## §0 목적·산출물

**목적 한 줄**: EVAL.md(평가 매니페스트)가 EDD 계약 — 근거 문장 실존·U 단언 금지·문장 해시 일치·전건 green/기각·동결 — 을 지키는지 **정적으로**(러너 실행 없이) 판정하는 검사기를 만든다.

**산출물 한 줄**: `framework/eval-verify.mjs`(inspectEval + CLI + --selftest) 신설 + `framework/specgate.mjs`에 RULES `SG1041~1050` 등재·`eval` 서브커맨드 추가 — 두 selftest 전건 통과, 기존 기대값 변경 0.

## §1 배경과 근거

- sdd의 C1~C5(`spec-verify.mjs`)가 «SPEC이 절차를 지켰는가»를 세듯, edd의 E1~E7은 «EVAL.md가 절차를 지켰는가»를 센다. 단 **판정 주체가 다르다**: C4는 «지목»(자기신고 — ID 재기입만 잼)이고, E6은 **러너의 빨간/초록불**을 스냅샷으로 읽는다(EDD 설계 계약 2). 검사기 자신은 러너를 돌리지 않는다 — Stop 훅은 타임아웃 시 fail-open이라(설계 계약 5) 훅 경로의 판정은 스냅샷 읽기(밀리초)여야 한다.
- 전부 결정론이다(개발 규칙 5 — 같은 입력 항상 같은 답). tdd-guard(2.3k★)는 같은 PreToolUse 지점의 차단 판정을 LLM에 맡기고 자체 문서가 오차단을 인정한다 — 우리는 정반대이고, 이 대비가 README «다른 점» 문안의 근거다(설계 계약 4).
- 구조는 `spec-verify.mjs`와 **동형**으로 간다: 순수 함수(`inspectEval`) + 파일 IO는 CLI 래퍼 + `--json` + `--selftest`(인라인 픽스처). 순수/IO 분리가 selftest를 값 대조만으로 만든다(spec-verify `inspect()` 선례). specgate 등재는 r48 선례 그대로 — **검사를 재구현하지 않고 번호·힌트만 입힌다**.
- E4(U 단언 금지)의 근거는 i1-cart-r1 스모크 판정 IV — «선택 대기 10행 중 4행의 기본값이 테스트 단언으로 굳는» 오염(CLAUDE.md). 이 검사가 그 «별도 라운드였던 예비 개입»의 실체다(설계 계약 3).

## §2 선행 조건

- **planedd3manifest.md 완료 후**(같은 라운드 병합 가능 — planeddmain.md 의존 순서). EVAL.md 필수 열·절 이름·문장 해시 정의는 planedd3의 `framework/eval-template.md`가 SSOT다 — 이 지시서의 열 이름과 어긋나면 그쪽이 이긴다.
- planedd1·planedd2와 무관하게 돌 수 있다. planedd5(러너)·planedd6(훅)은 이 지시서의 export(`inspectEval`·`loadEval`·`hash8`·`canonical`)를 소비하므로 **이 라운드가 먼저다**.
- 실행 전 확인 목록:
  1. `framework/eval-template.md` 실존 + 그 필수 열 6종(ID·근거·근거 해시·무엇을 어떻게 재나·테스트·승인)·필수 절 2종(`## 기각`·`## 개정`)이 아래 §3-3과 일치하는지 대조. 어긋나면 §3-3이 아니라 템플릿을 따르고 rN에 기록.
  2. `node framework/specgate.mjs --selftest` 통과(착수 전 기준선 — **26건**: r51이 T20~T23을 추가했다. T 최대 T23·T11 결번 — 감리 반영).
  3. `node framework/spec-verify.mjs --selftest` 통과(픽스처 6장 + 인라인 3건).
  4. `git status`에 framework/ 미커밋 변경 없음.

## §3 작업

### §3-1 실물 확인 분기 (먼저 한다)

`spec-verify.mjs`의 `inspect()` 반환에 문장 **원문 텍스트**가 있는지 확인한다. **이 지시서 작성 시점(2026-08-24) 실측**: 없다 — 반환은 `{spec, counts, c4:{total,hit,miss,ids,vague,located,positions}, c5, violations, warnings}`이고(spec-verify.mjs:244-253) 정의 줄 텍스트·`defs` 맵·미확정 ID 집합은 반환되지 않는다. `maskArchive()`도 개수만 반환한다(:77). 집행 시 재확인하고:

- **원문 필드가 그대로 없으면(기대)**: 자체 보충 파서를 쓴다. export된 `SENT_ID`·`cellsOf`·`stripFences`·`maskArchive`·`tables`·`undecidedTables`를 import하고, `headId` 1줄만 복사한다(spec-verify.mjs:57 — export가 아니라서다. **spec-verify에 export를 추가하는 것은 수정이라 금지**. 복사 위에 `// 사본: spec-verify.mjs:57 — 그쪽이 바뀌면 여기도` 주석).
- **원문 필드가 생겼으면**: 그쪽을 쓰고 복사를 하지 않는다 — 어긋남을 rN에 기록.

보충 파서가 낼 것 3집합(전부 `stripFences` 적용 후):
```js
const fenced = stripFences(specText.split('\n'));
const { lines: masked } = maskArchive(fenced);
// ① 아카이브 문장 ID — 마스킹 차분: fenced에는 있고 masked에서 지워진 줄만 headId
const archivedIds = new Set(fenced.flatMap((l, i) => (l && !masked[i] && headId(l)) ? [headId(l)] : []));
// ② 활성 문장 ID·정의 줄 원문 — inspect(specText).c4.ids + masked에서 headId 첫 등장 줄을 잡아 원문 보관
// ③ U 행 — tables(masked) → undecidedTables() → 데이터 행별 {id: cells[0].replace(/\*/g,'').trim(), pending: 상태열에 '선택 대기' 포함 여부}
//    상태 열 선택은 spec-verify.mjs:152-155와 같은 규칙(«상태» lastIndexOf) — 약 3줄 사본, 같은 출처 주석
```

### §3-2 `framework/eval-verify.mjs` 구조

spec-verify 동형. 머리 주석에 성격(«세고, 대조하고, 종료 코드로 뱉는다 — 러너를 돌리지 않는다»)과 exit 규약을 적는다.

- **export**: `canonical(line)`(정의 줄 정규화 = `^\s*[-*+]\s+` 마커 제거 + `\r` 제거 + trim — planedd3 포맷 정의와 동일해야 한다), `hash8(s)`(`node:crypto` sha256 hex 앞 8자리 — judge.mjs frozen과 같은 «정규화 후 해시» 계열), `parseEval(evalText)`, `inspectEval(evalText, opts)`, `loadEval(evalPath, phase)`. planedd5·6이 이 export를 import한다 — 사본 금지(r50 §2-5 선례).
- **순수 함수 시그니처**(파일 IO 없음 — 계약의 «inspectEval(evalText, {snapshot, lock, specText}) 식»을 다음으로 확정):
```js
inspectEval(evalText, { specText = null, snapshot = null, lock = null, lockHashNow = null,
                        testsNow = null, implNow = null, phase = 'lint', evalFreeze = 'reason' } = {})
// testsNow = {'tests/eval/x.test.ts': '8hex'} — 현재 tests/eval/* 해시(CLI가 계산)
// implNow  = snapshot.implHash의 키별 현재 파일 해시(CLI가 계산, 파일 없으면 null)
// lockHashNow = 락 파일 원문의 hash8 — snapshot.evalLockHash 대조용
// 반환: { counts: {items, rejected, revised, covered, uncovered}, violations, warnings, skipped }
// violations/warnings 원소는 spec-verify와 동형 {check, msg, kind, line} — specgate의 fromInspect·pack 재사용 근거
```
- **phase 3종**: `lint`(기본) = E1~E5 + SG1050 집계 / `pre` = lint 전부 + 락 존재(`E7.noLock` **Error**) + `phase:"red"` 스냅샷 존재·runOk(`snapshot.missing`/`snapshot.invalid`) / `stop` = lint 전부 + E6 + E7 + `phase:"final"` 스냅샷·`snapshot.stale`. stop이 E1~E5를 포함하는 이유: 승인 후 SPEC 문장만 바꾸는 사후 손질(E5)은 완료 시점에도 잡혀야 한다(REPORT4 §6-1 번복 5건의 재발 방지). **red 스냅샷의 green 항목은 어느 phase에서도 finding이 아니다** — 전건 red 강제 금지(설계 계약 8), Advisory는 러너(planedd5runner.md) 몫.
- **CLI**: `node framework/eval-verify.mjs <EVAL.md 경로> [--pre|--stop] [--json] | --selftest`. `loadEval`이 EVAL.md 옆(같은 디렉터리)의 `SPEC.md`·`.specgate-eval.json`·`.specgate-eval.lock`·`.specgate.json`(`evalFreeze` 키만)을 읽고 `tests/eval/*` 글롭·`implHash` 키의 현재 해시를 계산해 opts를 채운다. exit **0 위반없음 / 1 위반있음 / 2 EVAL.md 파일 없음·사용법 오류**(spec-verify 선례). EVAL.md **내용** 파싱 실패는 2가 아니라 E1 위반 → exit 1이다. 스냅샷·락의 부재·파싱 실패도 2가 아니다(`snapshot.missing`/`snapshot.invalid`/`E7.noLock` finding). 깨진 `.specgate.json`은 기본값 `reason` + notes 1줄(specgate loadConfig 선례 — 깨진 설정이 판정을 뒤집지 않는다). `isMain` 가드 필수 — planedd6의 훅이 import한다(spec-verify.mjs:363-365 선례).

### §3-3 검사 정의 E1~E7 (전부 정적)

kind 리터럴은 **반드시 작은따옴표 문자열**로 코드에 적는다 — specgate T3b가 소스 정규식으로 전수 대조한다(§3-6). 힌트 문안은 §3-6 RULES diff가 SSOT다(중복 기재 금지).

| 검사 | kind | 판정식 | 심각도 | 시점 | SG |
|---|---|---|---|---|---|
| E1 파싱·형식 | 'E1.noTable' | 필수 열 6종을 헤더에서 못 찾음(열 이름 `includes` 매칭) 또는 표 자체 없음 | 위반 | pre | SG1041 |
| | 'E1.badCols' | 필수 열 중 일부 누락 — 빠진 열 이름을 msg에 열거 | 위반 | pre | SG1041 |
| | 'E1.dupId' | 같은 EV ID 데이터 행 2개 이상 | 위반 | pre | SG1041 |
| | 'E1.badId' | ID 셀이 `/^EV\d+$/` 불일치 | 위반 | pre | SG1041 |
| | 'E1.badHash' | 근거 해시 셀이 `/^[0-9a-f]{8}$/` 불일치 — **빈 셀은 제외**(빈 셀 = 미승인이지 불일치가 아니다, planedd3manifest.md §3-2. 미승인의 차단은 pre의 'E7.noLock' 몫이고, 그 EV의 E5 대조도 skipped) | 위반 | pre | SG1041 |
| E2 항목 완결 | 'E2.noTest' | 테스트 셀이 비었거나 `tests/eval/`로 시작하지 않음(**문자열 검사만** — 파일 실존은 안 본다, 실존은 스냅샷 'E6.missing' 몫) | 위반 | pre | SG1042 |
| | 'E2.noMethod' | «무엇을 어떻게 재나» 셀이 빈 문자열 | 위반 | pre | SG1042 |
| E3 근거 실존 | 'E3.miss' | 근거 ID가 활성 문장(②)·U 행(③)·아카이브(①) 어디에도 없음 | 위반 | pre | SG1043 |
| | 'E3.noSpec' | specText가 null — **문서 전체 1건 경고**, E3·E4·E5·SG1050을 skipped로 넘김(계약: SPEC 없으면 경고로 강등) | 경고 | pre | SG1043 |
| | 'E3.archived' | 근거 ID가 아카이브 문장(①) — 그 항목의 E5는 skipped(§3-4) | 경고 | pre | SG1043 |
| E4 U 단언 금지 | 'E4.undecided' | 근거 ID가 U 행이고 상태에 `선택 대기` 포함 | 위반 | pre | SG1044 |
| | 'E4.settledU' | 근거 ID가 U 행이되 `선택 대기` 아님(확정됨) | 경고 | pre | SG1044 |
| E5 문장 무효화 | 'E5.outdated' | **유효 근거 해시** ≠ `hash8(canonical(정의 줄))`. 유효 해시 = `## 개정`에 그 EV 행이 있으면 **마지막 행의 새 해시**, 없으면 표의 근거 해시 — 개정 행이 현재 해시와 일치하면 통과(counts.revised에 계수). **빈 해시 셀은 대조 제외**(미승인 — E1.badHash와 같은 단서) | 위반 | pre | SG1045 |
| E6 전건 green/기각 | 'E6.red' | 스냅샷 items에서 status `red`인 EV가 `## 기각`에 없음(기각 행에서 ID 제거 후 trim 길이 0이면 사유 없음 = 기각 불인정, msg에 부기) | 위반 | stop | SG1046 |
| | 'E6.missing' | 매니페스트 EV가 스냅샷 items에 없거나 status `missing` — 기각된 EV는 제외 | 위반 | stop | SG1046 |
| | 'E6.rejectedGreen' | 기각된 EV의 status가 `green` | 경고 | stop | SG1046 |
| E7 동결 | 'E7.frozen' | `hash8(norm(evalText))` ≠ lock.evalMd **또는** testsNow의 {키 집합, 값}이 lock.tests와 불일치(추가·삭제·변경 전부) — 심각도·통과는 §3-5의 evalFreeze 3단 | 위반/경고 | stop | SG1047 |
| | 'E7.noLock' | lock이 null(부재·파싱 실패) — pre에서는 **위반**(승인 전 구현), lint·stop 단독 실행에서는 경고 | 위반(pre)/경고 | pre·stop | SG1047 |
| 스냅샷 | 'snapshot.missing' | phase pre/stop인데 snapshot null | 위반 | pre·stop | SG1048 |
| | 'snapshot.invalid' | runOk false · phase 불일치(pre엔 `red` — 단 **phase `final`이라도 `redAt` 존재 + runOk true면 유효**: final이 red를 덮은 뒤의 SRC 재수정을 막지 않기 위한 승계 소비, planedd5runner.md §3-7의 `redAt`을 여기서 읽는다 / stop엔 `final`) · JSON 파싱 실패 · lockHashNow 있고 snapshot.evalLockHash와 불일치(다른 승인본의 스냅샷). **계측 실패는 통과도 실패도 아니다** — 이 위반을 내고 E6 판정은 skipped(설계 계약 6, exp judge acRunOk 규율) | 위반 | pre·stop | SG1048 |
| | 'snapshot.stale' | stop에서 implNow의 어느 파일 해시가 snapshot.implHash와 다르거나 파일 소멸 — 파일별 1건, 경로는 msg에(loc.file은 EVAL.md 고정 — §7 #4) | 위반 | stop | SG1049 |
| 커버리지 | 'coverage.uncovered' | **활성 S ID** − 전체 EV 근거 ID 집합 차(분모 기본값 = S 문장만, planeddmain.md §7 #6 — S+I 확대는 선택 대기 §7 #7) — **1건 집계 경고**(ID 목록 포함), 0이면 무발행. **C4 복제 금지**: 모든 문장이 평가 가능하지 않으므로 절대 위반으로 올리지 않는다(설계 계약·§6) | 경고 | lint | SG1050 |

`## 기각` 파싱 = 그 절 안에서 `/\bEV\d+\b/`가 등장하는 각 줄, 사유 = ID·구두점 제거 후 잔여 텍스트. `## 개정` 파싱 = 그 절 안에서 EV ID가 등장하는 각 줄의 첫 `[0-9a-f]{8}` 토큰(4열 표 `| EV# | 새 해시 | 사유 | 날짜 |` 권장 — planedd3). E7이 재는 것도 C4와 같은 계열의 한계다 — «사유를 적는 **행위**»지 사유의 내용이 아니다. 개정 행 한 줄이면 어떤 수정이든 reason 단계를 통과한다. 이 한계를 머리 주석과 README(planedd8 일괄 반영분)에 명기한다.

### §3-4 E5 × 아카이브 상호작용

`## 4. 아카이브`로 접힌 문장을 지목한 EV: 실존 판정은 통과(접힘 ≠ 소멸)하되 'E3.archived' **경고**를 내고, 그 항목의 E5 해시 대조는 **skipped**로 넘긴다 — 접힌 문장의 원문은 아카이브 표 «문장(원문 그대로)» 셀에 있어 정의 줄과 형태가 달라 canonical이 갈라지기 때문이다. 아카이브 셀 원문으로 해시 대조를 잇는 대안은 §7 #2 선택 대기다. 활성/아카이브 판별은 §3-1의 마스킹 차분(①)만 쓴다 — `ARCHIVE_H` 정규식을 복사하지 않는다(차분이 spec-verify의 현행 마스킹 규칙을 자동 상속한다).

### §3-5 evalFreeze 3단 소비 (`.specgate.json`의 `"evalFreeze": "warn"|"reason"|"block"`, 기본 `"reason"`)

E7이 **이 설정을 소비하는 유일한 검사**다. 세 단은 'E7.frozen'의 **발행 심각도**를 정한다:

| 단 | 불일치 + 개정 행 없음 | 불일치 + 개정 행 있음 |
|---|---|---|
| `block` | 위반 | **위반**(개정으로도 못 푼다 — msg에 «evalFreeze=block» 부기) |
| `reason`(기본) | 위반 | 통과(counts.revised 계수) |
| `warn` | 경고 | 경고(개정 유무를 msg에 부기) |

기존 specgate 규칙(«Error는 mute 불가»)과의 정합: `freeze=warn`은 E7을 **Warning으로 발행**하는 것이지 Error를 mute하는 게 아니다 — 심각도는 검사기(발행 측)가 정하고 specgate RULES에는 심각도가 없다(specgate.mjs:28-29 현행 원칙 그대로). `.specgate.json`의 `mute` 배열로 SG1047 Error를 끄는 길은 여전히 없다. 이 3단이 r16 §7-3 «동결 강도» 미결을 관측으로 답하는 장치다(계약) — 기본 `reason`의 관측 결과가 번복 조건이다.

### §3-6 `framework/specgate.mjs` 수정 (additive 2곳 + selftest 2곳)

**① RULES에 E 블록 추가** — A 블록 뒤에 다음 행들을 그대로 넣는다(키 = kind, 전부 §3-3과 일치해야 T3b가 통과한다):
```js
  // E 블록 — eval-verify(planedd4). 근거는 framework/eval-template.md와 EDD 설계 계약이다.
  'E1.noTable':   { id: 'SG1041', hint: 'eval-template.md의 표(ID·근거·근거 해시·무엇을 어떻게 재나·테스트·승인)로 EVAL.md를 만든다' },
  'E1.badCols':   { id: 'SG1041', hint: '헤더에 빠진 필수 열을 채운다' },
  'E1.dupId':     { id: 'SG1041', hint: 'EV ID를 유일하게 다시 매긴다 — 최대 번호 +1로 잇는다' },
  'E1.badId':     { id: 'SG1041', hint: 'ID를 EV1·EV2 형태로 맞춘다' },
  'E1.badHash':   { id: 'SG1041', hint: '근거 해시를 8자리 소문자 hex로 적는다 — /eval 승인 절차가 계산해 준다' },
  'E2.noTest':    { id: 'SG1042', hint: '항목의 테스트를 tests/eval/ 아래 경로로 적는다' },
  'E2.noMethod':  { id: 'SG1042', hint: '«무엇을 어떻게 재나»를 한 줄로 채운다 — 비면 그 항목은 재는 게 없다' },
  'E3.miss':      { id: 'SG1043', hint: '근거를 SPEC에 실존하는 문장 ID로 고치거나, 문장을 SPEC에 먼저 올린다' },
  'E3.noSpec':    { id: 'SG1043', hint: 'SPEC.md가 없다 — 근거 실존·U·해시는 판정되지 않았다(통과가 아니다)' },
  'E3.archived':  { id: 'SG1043', hint: '아카이브 문장 지목이다 — 문장을 §1로 되살리거나 항목을 기각한다' },
  'E4.undecided': { id: 'SG1044', hint: '`선택 대기` 문장은 단언 자격이 없다 — 사용자 확정으로 S/I 문장이 된 뒤에 평가를 건다' },
  'E4.settledU':  { id: 'SG1044', hint: '확정된 미확정 항목 지목이다 — 문장을 §1·§2로 승격하고 그 ID를 지목한다' },
  'E5.outdated':  { id: 'SG1045', hint: '근거 문장이 바뀌었다 — 항목을 다시 보고 `## 개정`에 새 해시·사유·날짜를 적는다' },
  'E6.red':       { id: 'SG1046', hint: '빨간 항목이 남았다 — 통과시키거나 `## 기각`에 EV#와 사유를 적는다' },
  'E6.missing':   { id: 'SG1046', hint: '스냅샷에 그 EV가 없다 — 테스트 이름에 `EV#:` 접두를 달고 러너를 다시 돌린다' },
  'E6.rejectedGreen': { id: 'SG1046', hint: '기각한 항목이 통과했다 — 기각 사유가 아직 참인지 본다' },
  'E7.frozen':    { id: 'SG1047', hint: '동결 후 수정이다 — `## 개정`에 사유를 남기거나 수정을 되돌린다(단은 .specgate.json evalFreeze)' },
  'E7.noLock':    { id: 'SG1047', hint: '락이 없다 — /eval 승인으로 .specgate-eval.lock을 만든 뒤 구현한다' },
  'snapshot.missing': { id: 'SG1048', hint: '스냅샷이 없다 — eval-run으로 red-check(구현 전)·final(완료 전)을 돌린다' },
  'snapshot.invalid': { id: 'SG1048', hint: '스냅샷이 무효다(runOk·phase·승인본 불일치) — 계측 실패는 통과가 아니다. 러너를 고쳐 다시 돌린다' },
  'snapshot.stale':   { id: 'SG1049', hint: '스냅샷 이후 구현이 바뀌었다 — final 러너를 다시 돌린다' },
  'coverage.uncovered': { id: 'SG1050', hint: '평가로 덮이지 않은 S 문장 집계다 — 차단하지 않는다. 평가 가능한 문장이면 항목을 더한다' },
```
**② `eval` 서브커맨드** — verify·delta와 같은 꼬리(pack) 재사용:
```js
import { loadEval, inspectEval } from './eval-verify.mjs';   // 머리 import에 추가
export function evalCmd(evalPath, phase) {
  const io = loadEval(evalPath, phase);                       // {fatal, exit:2} | {evalText, options}
  if (io.fatal) return { fatal: io.fatal, exit: 2 };
  const target = slash(evalPath);
  return pack('eval', target, fromInspect(inspectEval(io.evalText, io.options), target), dirname(resolve(evalPath)));
}
```
CLI 분기: `else if (sub === 'eval')`에서 `const phase = rest.includes('--stop') ? 'stop' : rest.includes('--pre') ? 'pre' : 'lint';` 후 verify와 같은 fatal→--json→report→exit 순서. 서브커맨드 오타 조건을 `!(sub in RUN || sub === 'probe' || sub === 'eval')`로, USAGE에 `eval <EVAL.md 경로> [--pre|--stop] [--json]` 1줄 추가. exit는 eval-verify를 그대로 따른다(패스스루 원칙).

**③ T3b 확장** — 소스 kind 전수 대조에 1소스 추가(이게 있어야 «RULES 미등재 시 즉시 깨짐»(r50 §4)이 E 블록에도 작동한다):
```js
    const es = readFileSync(join(HERE, 'eval-verify.mjs'), 'utf8');
    for (const m of es.matchAll(/'((?:E\d|snapshot|coverage)\.\w+)'/g)) if (!RULES[m[1]]) miss.push(m[1]);
```
`hooks/eval-gate.mjs`는 아직 없다 — 그쪽 스캔 추가는 planedd6gate.md 몫이다. **④ T24 신설**(감리 반영 — T20~T23은 r51 볼륨 테스트가 선점, 원안 «T20 신설»은 충돌): 임시 디렉터리에 E1.dupId짜리 EVAL.md를 쓰고 `call(['eval', p, '--json'])` → SG1041 Error 존재 · 미배정(`SG----`) 0 · exit가 `eval-verify` 직접 실행과 동일(T16 동형)을 단언한다.

## §4 산출물

- `framework/eval-verify.mjs` — 신설 (inspectEval·loadEval·parseEval·canonical·hash8 export + CLI + --selftest)
- `framework/specgate.mjs` — RULES E 블록 23행 + `evalCmd`·CLI 분기·USAGE 1줄 + T3b 1소스·T24 (전부 additive)
- `docs/next/2026-08-24/rN.md` — 집행 기록(어긋난 항목·실측 해시 골든값 포함, 짧게 — 개발 규칙 1)

## §5 검증 (판정 가능한 완료 조건)

### §5-1 eval-verify --selftest 케이스 표 (인라인 픽스처 — 표 전 행 29건)

SPEC 재료는 `spec-verify.mjs`의 export 픽스처 `KA`를 import한다(r50 §2-5 선례 — 사본 금지). 파생: `KA_SET = KA.replace('선택 대기 | 오버플로 관측 시', '확정 (2026-08-24) | —')` — **파생 직전에 `KA.includes('선택 대기 | 오버플로 관측 시')`를 단언한다**(감리 반영: 원문이 다르면 replace가 조용히 no-op이 되어 W-3이 엉뚱한 지점에서 실패한다). EVAL 픽스처는 헬퍼가 조립하되 근거 해시는 모듈 자신의 `hash8(canonical(...))`로 끼운다 — 단 **H-0이 해시 함수 자체를 골든 상수로 고정**한다(구현 후 1회 실측값을 박는다 — spec-verify EXPECTED 방식. 이게 없으면 해시 함수 회귀를 순환 논증으로 놓친다). 정상 EVAL = EV1(근거 S1)·EV2(근거 I1), 테스트 `tests/eval/counter.test.ts`, 빈 `## 기각`·`## 개정`. 순수 함수 케이스는 `inspectEval` 반환값 대조, exit 열은 «위반 있음→1» 환산이고 CLI 실측은 C-1~C-3만 한다.

| # | 케이스 | 변형(정상 대비) | phase | 기대 위반 kind | 기대 경고 kind | SG | exit |
|---|---|---|---|---|---|---|---|
| H-0 | 해시 골든 | `hash8(canonical('- S1. 증가 버튼을 누르면 카운터가 1 증가한다. (근거: 요청 문장)'))` === 실측 상수(집행 시 박기) | — | — | — | — | — |
| N-1 | 정상 | 없음 | lint | 없음 | coverage.uncovered ×1 (S2) | 1050 | 0 |
| V-1 | 표 없음 | evalText=`'# EVAL\n\n대충.'` | lint | E1.noTable | — | 1041 | 1 |
| V-2 | ID 중복 | EV2 행의 ID를 EV1로 | lint | E1.dupId | coverage | 1041 | 1 |
| V-3 | 해시 형식 | EV1 해시 셀 `'xyz'` | lint | E1.badHash | coverage | 1041 | 1 |
| V-4 | 테스트 경로 | EV1 테스트 셀 `src/x.ts` | lint | E2.noTest | coverage | 1042 | 1 |
| V-5 | 판정 한 줄 없음 | EV1 «무엇을…» 셀 공백 | lint | E2.noMethod | coverage | 1042 | 1 |
| V-6 | 근거 실존 안 함 | EV1 근거 `S9` | lint | E3.miss | coverage | 1043 | 1 |
| W-1 | SPEC 부재 | specText=null | lint | 없음 | E3.noSpec ×1 (coverage도 skipped) | 1043 | 0 |
| W-2 | 아카이브 지목 | EV1 근거 `S0`(KA 아카이브) | lint | 없음 | E3.archived + coverage | 1043 | 0 |
| V-7 | U 지목 | EV1 근거 `U1`(KA는 선택 대기) | lint | E4.undecided | coverage | 1044 | 1 |
| W-3 | 확정 U 지목 | KA_SET + EV1 근거 `U1` | lint | 없음 | E4.settledU + coverage | 1044 | 0 |
| V-8 | 해시 불일치 | EV1 해시 `'deadbeef'` | lint | E5.outdated | coverage | 1045 | 1 |
| N-2 | 개정 해소 | V-8 + `## 개정`에 `\| EV1 \| ${hash8(canonical(S1줄))} \| 문장 개정 \| 2026-08-24 \|` | lint | 없음 | coverage | — | 0 |
| V-9 | red 잔존 | 스냅샷 final·runOk·EV1 red | stop | E6.red | coverage | 1046 | 1 |
| N-3 | 기각 통과 | V-9 + `## 기각`에 `\| EV1 \| jsdom 레이아웃 제약 — 렌더 단언으로 대체 불가 \|`(2열 표 행 — planedd3 템플릿 형식) | stop | 없음 | coverage | — | 0 |
| V-10 | 스냅샷 누락 항목 | 스냅샷 items에 EV2 없음 | stop | E6.missing | coverage | 1046 | 1 |
| W-4 | 기각인데 green | N-3에서 EV1 status green | stop | 없음 | E6.rejectedGreen + coverage | 1046 | 0 |
| V-11 | freeze=reason 기본 | lock.evalMd `'00000000'`(불일치)·개정 없음 | stop | E7.frozen | coverage | 1047 | 1 |
| N-4 | reason+개정 | V-11 + 개정 행 1개 | stop | 없음 | coverage | — | 0 |
| W-5 | freeze=warn | V-11 + evalFreeze:'warn' | stop | 없음 | E7.frozen(Warning) + coverage | 1047 | 0 |
| V-12 | freeze=block | N-4 + evalFreeze:'block'(개정 있어도) | stop | E7.frozen | coverage | 1047 | 1 |
| V-13 | 스냅샷 무효 | 스냅샷 runOk:false | stop | snapshot.invalid (E6은 skipped — 위반에 E6.* 없음까지 단언) | coverage | 1048 | 1 |
| V-14 | 신선도 | implNow 해시 상이 | stop | snapshot.stale | coverage | 1049 | 1 |
| P-1 | 승인 전 구현 | lock=null | pre | E7.noLock | coverage | 1047 | 1 |
| P-2 | red-check 미실행 | lock 있음·snapshot=null | pre | snapshot.missing | coverage | 1048 | 1 |
| P-3 | red green 무해 | lock + red 스냅샷 runOk·EV1 green | pre | **없음**(설계 8 — green을 위반으로 삼지 않는다) | coverage | — | 0 |
| N-5 | 빈 해시 셀 통과 | EV1 해시 셀 빈 값(승인 전 초안) | lint | **없음**(E1.badHash·E5 대상 제외 — 미승인) | coverage | — | 0 |
| P-4 | final+redAt 유효 | lock + 스냅샷 phase `final`·runOk·`redAt` 존재 | pre | **없음**(snapshot.invalid 예외 — redAt 승계) | coverage | — | 0 |

CLI 실측 3건: C-1 정상 EVAL 파일 → exit 0 / C-2 V-8 파일 → exit 1 / C-3 없는 경로 → exit 2. 임시 파일은 `mkdtempSync(tmpdir())`만 쓴다(specgate selftest 선례) — **픽스처 디렉터리 신설 금지**(개발 규칙 4).

### §5-2 전체 검증 명령과 기대값

| 명령 | 기대 |
|---|---|
| `node framework/eval-verify.mjs --selftest` | 통과 — §5-1 전건(29+CLI 3건) 일치, exit 0 |
| `node framework/specgate.mjs --selftest` | 통과 — **기존 26건 기대값 무변경** + T3b 확장·T24 포함 전건, exit 0 |
| `node framework/spec-verify.mjs --selftest` | 통과 — 픽스처 6장 EXPECTED diff 0 + 인라인 3건 (KA는 import만 했다는 증거) |
| `git diff --stat framework/spec-verify.mjs framework/spec-delta.mjs framework/spec-anchor.mjs framework/spec-interview.mjs framework/specprobe.mjs framework/verify-tdd.mjs framework/hooks/ framework/skills/ framework/commands/` | **0 파일 변경**(수정 금지 목록 무접촉의 기계 증거) |
| `node framework/specgate.mjs eval <임시 EVAL.md> --json` | findings에 `SG----` 0건 |

## §6 하지 말 것·경계

- **C4 복제 금지.** «SPEC 문장 전건이 평가로 덮였는가»를 위반으로 올리지 않는다 — 커버리지는 'coverage.uncovered' **경고 1건 집계**가 전부다. 모든 문장이 평가 가능하지 않다(선례: axe 전체 스캔 탈락·개별 규칙만 AC-08 승격, exp/FROZEN.md §4).
- **러너 실행 금지.** eval-verify가 vitest를 spawn하면 훅 경로(planedd6)가 타임아웃 fail-open에 노출된다(설계 계약 5) — 실행은 eval-run(planedd5) 몫, 여기는 스냅샷 **읽기**만. LLM·네트워크도 금지(개발 규칙 5). 의존성은 Node 내장만(`node:crypto`·`node:fs`·`node:path`·`node:os`).
- **수정 금지**: spec-verify.mjs(export 추가 유혹 포함 — headId가 필요해도 1줄 사본으로) · spec-gate.mjs · spec-delta.mjs · spec-anchor.mjs · specprobe.mjs · spec-interview.mjs · skills/sdd/ · skills/tdd/ · commands/spec.md. **verify-tdd.mjs는 import도 금지**(r20 §7-5 — 계측기·처치 축 분리). 기존 selftest EXPECTED 기대값 변경 0이 정합 증거다(r50 선례).
- 테스트 경로 실존·`tests/eval/` 디렉터리 유무를 fs로 검사하지 않는다(E2는 문자열만) — 실존의 판정은 러너 결과의 'E6.missing'이 한다. 정적 검사기가 fs를 더듬기 시작하면 lint phase가 대상 프로젝트 상태에 비결정적으로 묶인다.
- lock.sentences는 이 검사기가 **읽지 않는다** — 생성은 `eval-run --lock`(planedd5runner.md) 몫이고, **현재 자동 소비자는 없다**(진단·후속 도구용 기록). E5의 기준 해시는 EVAL 표(+개정)다.
- I 문장 지목의 «위임 표시»는 검사하지 않는다 — 표시 형식은 planedd3, 표시 문안 강제는 planedd7 몫. 여기서 지레 형식을 정하면 사용자 몫을 조용히 정하는 것이다(개발 규칙 6).
- 스모크 기존 디렉터리(`framework/smoke/*`)는 읽기만 한다(절대 규칙 6).

## §7 선택 대기

| # | 항목 | 기본값 | 대안 | 상태 | 번복 조건 |
|---|---|---|---|---|---|
| 1 | 확정 U 지목('E4.settledU') | 경고 | 무시(통과) · 위반 승격 | 선택 대기 | 실사용에서 확정 U 지목이 정당/유해 어느 쪽 사례든 1건 관측 시 |
| 2 | 아카이브 지목의 E5 | skipped + 'E3.archived' 경고 | 아카이브 표 «문장(원문 그대로)» 셀로 해시 대조 지속 | 선택 대기 | 접힌 문장의 평가가 회귀 자산으로 실제 유지되는 사례 1건 |
| 3 | 문장 해시 canonical | 마커 제거+trim, **ID 포함** | ID 제외 본문만 | 선택 대기(planedd3과 공동 — 그쪽 확정이 이긴다) | ID 개번으로 해시가 무의미하게 깨지는 관측 |
| 4 | 'snapshot.stale'의 loc.file | EVAL.md 고정(불변식 유지, 경로는 msg) | drift처럼 코드 파일(specgate.mjs:11-12의 두 번째 비대칭) | 선택 대기 | --json 소비자가 파일별 조치를 실제로 요구할 때 |
| 5 | SPEC 문장 ID `~N` 개정번호 표기 | 도입 안 함(해시 무효화로 충분 — 설계 계약 7) | OpenFastTrace식 revision-in-ID | 선택 대기(계약 재기록) | 해시 방식이 개정 이력 추적에 실패한 사건 1건 |
| 6 | 델타(`SPEC.delta.md`) 활성 중 E3·E5의 base | 본 SPEC.md 고정(델타 미인식 — planeddmain.md §7 #3) | 델타 병합 후 문장까지 base로 | 선택 대기 | 델타 활성 중 E5 위양성 관측 1건 |
| 7 | SG1050 미커버 집계의 분모 | S 문장만(planeddmain.md §7 #6) | S+I | 선택 대기 | I 문장 미커버가 실사용 사건의 발원 1건 |

## §8 참조

- `framework/spec-verify.mjs` — 동형 구조·export 목록·isMain 가드(:363)·headId(:57)·상태 열 규칙(:152-155)
- `framework/specgate.mjs` — RULES(:32)·pack/fromInspect(:116-132)·T3b(:375)·T16 패스스루(:479) — 행 번호는 r51 반영 실측(감리)
- `docs/next/2026-08-21/r50.md` — §2(지시서와 실물 어긋남 기록 선례)·§4(T3b 작동 사례)·§2-5(픽스처 export 재사용)
- `framework/eval-template.md`(planedd3manifest.md 산출물 — 포맷 SSOT) · `planedd5runner.md`(스냅샷 산출·red green Advisory) · `planedd6gate.md`(훅 배선·T3b 훅 스캔 추가) · `planedd7skill.md`(승인·락 생성·위임 표시)
- `exp/FROZEN.md` §4(평가 자격 선례) · `exp3/judge.mjs`(acRunOk — 계측 실패 분리 규율)

집행 중 이 지시서와 실물이 어긋나면 실물이 이긴다 — 어긋난 항목을 rN에 기록하라(r50 §2 선례).
