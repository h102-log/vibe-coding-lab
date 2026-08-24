# planedd5runner — eval-run.mjs(러너 어댑터 → 스냅샷) 작성 지시서

## §0. 목적과 산출물

**목적 한 줄**: 에이전트가 평가(tests/eval/)를 러너로 실행하고 결과를 스냅샷 파일로 남기는 어댑터를 만든다 — 훅(planedd6gate.md)은 러너를 돌리지 않고 이 스냅샷만 밀리초에 읽는다(planeddmain.md §3-1 항 5).

**이 지시서의 산출물 한 줄**: `framework/eval-run.mjs` 1파일 신설 — 돌아가는 코드 + selftest 통과(개발 규칙 1).

## §1. 배경과 근거

- 게이트가 러너를 직접 돌리면 Stop 훅 타임아웃 시 fail-open이다(공식 문서 명시 — planeddmain.md
  §3-1 항 5). 그래서 실행과 판정을 시점으로 가른다: 에이전트가 eval-run을 돌려 스냅샷을 남기고,
  게이트는 파일만 읽는다.
- runOk 분리는 exp judge의 acRunOk 규율이다(planeddmain.md §3-1 항 6): 계측 실패는 통과도 실패도
  아니다 — 무효 스냅샷으로 남겨 게이트가 SG1048로 차단하게 한다.
- 실행부의 선례는 `framework/verify-tdd.mjs`의 검사 A 실행(고정값 1~5, r20 §3)이다. 단 **import는
  금지, 복사만** — 계측기(에이전트에게 절대 주지 않는다)와 처치(에이전트가 돌린다)의 축 분리(r20
  §7-5, «통합한다면 그때도 복사로만»). 또 verify-tdd와 달리 **앱의 vitest 설정을 그대로 쓴다** —
  임시 config 우회는 계측기가 앱을 불신해야 해서였고, eval-run에게는 앱의 러너 규약이 곧 판정 조건이다.

## §2. 선행 조건

- planedd3manifest.md + planedd4verify.md 라운드 완료 후 착수(팩 의존 순서 — planeddmain.md §3-5). planedd1probe.md·planedd2priorart.md와는 독립.
- 실행 전 확인 목록:
  - [ ] `framework/eval-template.md`·`framework/eval-verify.mjs`가 실존하고 `eval-verify.mjs --selftest`가 exit 0.
  - [ ] `framework/eval-run.mjs`가 아직 없다.
  - [ ] `framework/verify-tdd.mjs` 정독 — 특히 `spawnGroupKill`(235~266행)·`runVitest`(268~318행)·
        리포터 키 주석(370~374행). `framework/hooks/spec-gate.mjs` 19행 SRC 정규식 원문 확인(값 복사 대상).
  - [ ] `eval-verify.mjs`의 export 목록 확인 — 본표 파서를 export하면 import해 쓴다(spec-gate가
        spec-verify의 `inspect`를 import하는 선례 — planeddmain.md «import 재사용 허용»). 없으면
        ID·테스트 2열만 읽는 최소 파서를 자체 구현한다(6열 검증 재구현 금지 — 그건 E2 몫).

## §3. 작업

### 3-1. CLI 계약

```
node framework/eval-run.mjs <app-dir> --phase red|final [--json]   # → <app-dir>/.specgate-eval.json
node framework/eval-run.mjs <app-dir> --lock                        # 승인 시 1회 — 락 생성 + 해시 열 채움
node framework/eval-run.mjs --selftest
```

- exit **0 = 스냅샷 산출 완료(빨간불이어도 0)** / **1 = 계측 실패** / **2 = 사용법 오류** —
  verify-tdd 선례 그대로, **판정을 exit에 싣지 않는다**. red/green은 스냅샷 안에만 있다. 기본 출력은
  사람용 요약(항목별 status 1줄씩), `--json`이면 스냅샷 JSON을 stdout에도 낸다. 파일은 항상 쓴다.
- `--lock`은 planedd3manifest.md §3-3(«승인 시 락을 만드는 도구가 근거 해시 열을 채운다 — 사람이
  손으로 적지 않는다»)의 그 도구다. h8·매니페스트 파서를 이미 가진 파일이 여기라 같은 파일에 둔다
  (§7 #1). 동작 순서가 규약이다: ① 본표의 **빈** 근거 해시 셀을 SPEC 정의 줄(`/^\s*[-*+]\s+([SI]\d{1,3}[a-z]?)\./`
  첫 매치 — spec-verify `SENT_ID`가 허용하는 폭(`*`/`+` 마커·`S7a`형 접미)과 같게, 중복은 첫 매치 +
  stderr 경고)의 리스트 마커 뒤 원문 h8로 채워 다시 쓴다(찬 셀은 두고, 불일치는 E5 몫) ② 채운 **뒤의** EVAL.md 전문 h8 = `evalMd`(E7이 락 vs 현재를 대조하므로 순서가
  바뀌면 생성 직후부터 불일치다) ③ 테스트 열 각 파일 h8 = `tests` ④ ①의 문장별 h8 = `sentences`
  ⑤ `{ approvedAt: ISO, evalMd, tests, sentences }`를 `.specgate-eval.lock`에 쓴다.
  **SPEC.md가 없으면(edd 단독 조합 — planeddmain.md §3-7)** ①·④를 건너뛴다: 해시 열은 빈 채로
  두고 `sentences`는 빈 객체 `{}`로 락을 만든다(E1·E5는 빈 셀을 대조 제외하고, E3은 경고 강등 —
  planedd4verify.md 'E3.noSpec'). **SPEC이 있는데** 근거 문장 ID가 SPEC에 없거나(비 ID 자유 텍스트
  근거 행은 SPEC 부재 모드에서만 정상이므로 이 경우 exit 1) 테스트 파일이 없으면 exit 1 — 락은
  반쪽을 만들지 않는다(E2·E3이 잡을 것을 먼저 만난 것).

### 3-2. h8과 매니페스트 읽기

- `h8(text) = sha256(CRLF→LF 정규화 후 trim)의 hex 앞 8자리 소문자` — planedd3manifest.md §3-3
  규약을 함수 하나로 구현한다. 문장·파일·락 전부 이 함수다.
- 매니페스트 = `<app-dir>/EVAL.md` 본표(`## 1. 평가 항목` 절의 첫 표)에서 ID 열·근거 열·테스트 열.
  EVAL.md 부재·본표 파싱 불가·EV 0행이면 exit 1(계측 실패 — 축이 켜졌는데 못 읽는 것은 무효다).
  `## 기각`에 오른 EV도 **본표에 있으면 실행·기록 대상**이다 — 기각 참작은 게이트 E6 몫이고 러너는 전건을 잰다.

### 3-3. vitest 실행 — verify-tdd 검사 A의 복사 규약

본표 테스트 열의 경로 집합(중복 제거)을 인자로 vitest를 1회 실행한다. «npx vitest run \<paths\>
--reporter=json»과 등가지만, 호출은 verify-tdd 고정값 3·4·5를 **복사**해 만든다:

```js
const entry = join(appAbs, "node_modules", "vitest", "vitest.mjs");   // 고정값 4 — 명시 경로, npx 폴백 없음
// (npm ci 선행 — 부재 시 runOk:false "vitest 미설치". Windows Git Bash에서 spawn("npx")는 shell 없이 실패한다)
spawn(process.execPath, [entry, "run", ...paths, "--reporter=json", `--outputFile=${outPath}`],
  { cwd: appAbs, detached: !isWin, stdio: ["ignore", "ignore", "pipe"] });
// 고정값 3 — outputFile로 stdout 오염 회피(텍스트 파싱 금지, r20 §6-1)
// 고정값 5 — 120s 타임아웃 + 프로세스 «그룹» 킬(POSIX detached+음수 PID SIGKILL / Windows taskkill /T /F)
```

- `spawnGroupKill`·타임아웃 120s는 verify-tdd 235~266행을 **복사**한다(§6 — import 금지). 값 조정은
  §7 #4. 임시 config를 만들지 않는다 — 앱 자신의 vitest 설정(jsdom 등)으로 돈다(§1 셋째 불릿).
- outPath는 OS 임시 디렉터리(mkdtemp)이고 finally에서 rmSync — 앱 워킹 트리에 쓰는 파일은
  스냅샷·락(과 --lock의 EVAL.md 해시 열)뿐이다.

### 3-4. 리포터 파싱·EV 매핑

vitest `--reporter=json`은 jest 호환 스키마다 — `testResults[]`(파일 단위)·`assertionResults[]`·
`status` 키는 verify-tdd 354~374행이 실측한 선례고, **`fullName`·`title`·`ancestorTitles`는
verify-tdd가 쓴 적 없는 키라 jest 호환 스키마 문서 근거뿐이다**(§5-2의 실물 대조가 이 가정의
확인 지점이다). 매핑 규약(9장 공통 인터페이스):

1. **이름 매핑** — 각 assertionResult의 `fullName`(부재 시 `[...ancestorTitles, title].join(" ")`)에서
   `/\bEV\d+\b/g` **전부**를 추출해 그 케이스의 커버 항목으로 본다. describe 이름의 EV도 fullName에
   합쳐져 오므로 별도 처리 없이 잡힌다.
2. **크래시 폴백** — assertionResults가 0건인 testResults 항목(import 단계 사망 — 구현 전
   red-check에서는 **정상 경로**다: 아직 없는 src 모듈을 import하면 케이스까지 못 간다)은, 그 파일
   경로와 본표 테스트 열이 일치하는 EV 전부를 «실패 결과 있음»으로 매핑한다. 경로 대조는
   verify-tdd 364행 복사 — `posix(join(appAbs, rel)).toLowerCase()` 양변 비교.
3. 본표에 없는 EV가 이름에 나오면(예: EV9) items에 넣지 않고 stderr 경고 1줄.

스키마 가정(`fullName`·`status` 키)은 §5-2에서 실물 출력과 대조한다 — 어긋나면 실물이 이기고 rN에 기록한다.

### 3-5. items[].status 판정식 (결정론 — 같은 입력 같은 답)

본표의 EV 전건에 대해, 본표 순서대로:

| 조건 | status |
|---|---|
| 매핑된 결과가 0건 (이름 매핑도 크래시 폴백도 없음) | `missing` |
| 매핑된 결과 중 `"passed"`가 아닌 것이 1개 이상 (failed·크래시 폴백·skipped·todo·pending 전부) | `red` |
| 매핑된 결과 전부 `"passed"` | `green` |

skipped를 green으로 새게 두지 않는 것이 의도다 — `.skip` 한 줄이 E6을 우회하는 구멍이 된다
(fail-closed). skipped가 섞인 red에는 stderr 사유 1줄(`EV4: skipped 1건 — 통과 증거 아님`).

### 3-6. runOk 판정식

`runOk: false`가 되는 조건의 전건 열거(이 밖의 경로로 false를 만들지 않는다):

| # | 조건 | runError 값(스냅샷에 남긴다 — 진단용 추가 필드, 게이트는 읽지 않는다) |
|---|---|---|
| 1 | vitest 엔트리 부재(npm ci 미선행) | `"vitest 미설치 — node_modules/vitest/vitest.mjs 부재"` |
| 2 | 프로세스 스폰 실패(error 이벤트) / 타임아웃(120s 그룹 킬) | `"spawn: <err>"` / `"타임아웃(120s)"` |
| 3 | 프로세스는 exit했는데 outputFile 부재 또는 JSON 파싱 불가 | `"결과 파일 부재 (exit N)"` / `"결과 JSON 파싱 실패 — <msg>"` |
| 4 | 매핑된 EV 0건 — 이름 매핑 ∪ 크래시 폴백 합집합이 공집합 | `"매핑된 EV 0건 — 테스트 이름에 EV 접두가 없다"` |

runOk=false면 `items: []`로 비우고 **스냅샷은 그래도 쓴 뒤** exit 1 — «무효 스냅샷»을 게이트가
SG1048로 읽는 것이 설계다. 빨간불(항목 red)은 계측 실패가 **아니다** — runOk true·exit 0이다.

### 3-7. 스냅샷 필드 산출 규약

`<app-dir>/.specgate-eval.json` — 매 실행 통째 덮어쓴다(마지막 실행이 현재 상태다):

```json
{ "phase": "red", "at": "2026-08-24T09:00:00.000Z", "runOk": true, "runner": "vitest",
  "items": [{ "id": "EV1", "status": "red" }],
  "evalLockHash": "1a2b3c4d", "implHash": { "src/App.tsx": "5e6f7a8b" } }
```

- `evalLockHash` — `.specgate-eval.lock` **파일 자체**의 h8. 락 부재면 `null`(승인 없이 red를 돌린 것 — 차단은 pre 게이트의 락 부재 검사 몫이고 러너는 사실만 남긴다).
- `implHash` — \<app-dir\> 재귀 walk에서 SRC 정규식 매치 파일 전부의 `{posix 상대경로: h8}`.
  - SRC 정규식은 spec-gate.mjs 19행의 **값 복사**다(훅 쪽은 import가 가능하지만 방향이 반대다 —
    처치 도구가 훅 모듈을 import하면 훅 수정이 러너를 흔든다. 원본 행 번호를 주석으로 남긴다):
    `/\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|rb|php|swift|kt|c|cc|cpp|h|hpp|cs|vue|svelte)$/i`
  - 제외 디렉터리는 verify-tdd 29행 SKIP_DIRS와 **동일 값**: `node_modules`·`dist`·`.git`·`coverage`.
  - tests/도 SRC 매치면 포함한다(의도 — final 뒤 테스트를 고쳐도 stale이 잡힌다).
- `runError`(3-6) 외 추가 필드 금지 — 단 final 실행 시 직전 스냅샷의 phase가 `"red"`면 그 `at`을
  `redAt`으로 승계한다(추가 필드 1개). 단일 파일이라 final이 red 증거를 덮는데, pre 게이트의
  «red를 거쳤다» 검사가 final 이후에도 성립하려면 이 승계가 필요하다. **소비자는 확정됐다** —
  planedd4verify.md 'snapshot.invalid'의 pre 분기가 «phase `final`이라도 `redAt` 존재 + runOk
  true면 유효»로 읽는다(게이트는 inspectEval 경유라 별도 소비 코드가 없다).

### 3-8. phase 구분의 의미

- `--phase red` — 승인(--lock) 직후·구현 전. **green 항목은 Advisory 경고**를 stderr로 낸다
  (planeddmain.md §3-1 항 8): `EV1: 구현 전인데 green — 이 항목은 구현을 재지 못할 수 있다`.
  경고일 뿐 exit 0 — 스캐폴드가 이미 만족하는 문장이 실존하므로 전건 red를 강제하지 않는다.
- `--phase final` — 완료 전 재실행. 이때의 `implHash`가 stop 게이트 신선도(SG1049)의 기준값이다 —
  final 뒤 구현을 또 고치면 게이트가 현재 파일 해시와의 차이로 잡는다.

### 3-9. --selftest — 층 분리

실제 vitest를 **돌리지 않는다**(실물 통합은 planedd8smoke.md 몫). 파싱·매핑·스냅샷 산출을 순수
함수로 빼고(`parseManifest(text)` · `mapReport(reportJson, manifest, appAbs)` · `buildSnapshot(…)`)
인라인 모의 리포터 JSON 픽스처로 검사한다 — 새 픽스처 디렉터리 금지(개발 규칙 4), 픽스처는 소스 안
상수다(spec-gate.mjs D_FULL 선례 — 기준 픽스처를 한 군데씩 고쳐 만든다). 어긋나면 exit 1, 전건 일치 exit 0.

## §4. 산출물

- `framework/eval-run.mjs` — 신설, 유일한 파일 산출물(--phase·--lock·--selftest·--json 포함) + 집행 rN 1장(짧게 — 코드가 돈 뒤에 남긴다)

## §5. 검증 (판정 가능한 완료 조건)

### 5-1. selftest 케이스 표 — 전건 일치가 완료 조건

모의 매니페스트는 planedd3manifest.md §3-7의 EV1~EV5(테스트 열 2파일)를 그대로 쓴다.

| # | 케이스 | 모의 리포터 입력 | 기대 items | runOk | exit |
|---|---|---|---|---|---|
| 1 | 전건 통과 | EV1~EV5 각 1건 passed | 5건 전부 green | true | 0 |
| 2 | 일부 실패 | EV2만 failed, 나머지 passed | EV2 red · 나머지 green | true | 0 |
| 3 | 한 케이스가 두 EV | fullName `"EV1 EV2: …"` failed 1건 + EV3~EV5 passed | EV1·EV2 red | true | 0 |
| 4 | describe 승계 | ancestorTitles `["EV3: 목록"]`·title EV 무표기·fullName에 EV3 포함, passed | EV3 green | true | 0 |
| 5 | 결과 누락 | EV4 언급 케이스 0건(그 파일의 다른 케이스는 있음) | EV4 missing | true | 0 |
| 6 | 크래시 폴백 | lookup-edge.test.tsx가 assertionResults `[]` | EV4·EV5 red(폴백) | true | 0 |
| 7 | skipped 혼재 | EV1에 passed 1 + skipped 1 | EV1 red + stderr 사유 | true | 0 |
| 8 | 파싱 불가 | outputFile 내용 `"not-json"` | `[]` | false | 1 |
| 9 | 매핑 0건 | 모든 이름 EV 무표기·크래시 없음 | `[]` | false | 1 |
| 10 | 매니페스트 밖 EV | `"EV9: …"` passed 포함 | 본표 5건만 + stderr 경고 | true | 0 |

추가 자기검사 2건: ⓐ `h8(S1 정의 줄 원문) === "e297df68"` — planedd3manifest.md §5 기대표와 교차 검증
(원문은 그쪽 §3-7에서 바이트 그대로) ⓑ implHash walk가 `node_modules/` 아래 파일 0건(임시 디렉터리에 2파일 심어 확인).

### 5-2. 손 실행 시나리오 1건 — «조회 버튼» red-check (리포 밖 스크래치)

```bash
S=$(mktemp -d)/lookup && mkdir -p $S/tests/eval && cd $S
# ① planedd3manifest.md §3-7의 SPEC 발췌(S1·I2·I3 정의 줄)를 SPEC.md로, 예시 EVAL.md에서
#    근거 해시 열만 비운 것을 EVAL.md로 저장 (해시는 --lock이 채우는 것을 보는 게 목적)
# ② 테스트 2파일 — 구현 전 red 시뮬레이션: lookup.test.tsx에 it("EV1: …")·("EV2: …")·("EV3: …"),
#    lookup-edge.test.tsx에 it("EV4: …")·("EV5: …") — 본문 전부 expect.fail("구현 전")
npm init -y && npm i -D vitest && npm i -D jsdom   # npm ci 선행 요건의 스크래치판
node <리포>/framework/eval-run.mjs . --lock        # 기대: exit 0
node <리포>/framework/eval-run.mjs . --phase red   # 기대: exit 0
```

기대값(전부 일치해야 완료):

| 확인 | 기대 |
|---|---|
| --lock 후 EVAL.md 근거 해시 열 | `e297df68`×3 · `d4f21f56` · `14c4c44c` — planedd3 §5 표와 동일 |
| `.specgate-eval.lock` | `sentences`가 `{"S1":"e297df68","I2":"d4f21f56","I3":"14c4c44c"}` · `tests` 2키 · `evalMd`는 해시 열이 채워진 뒤의 값 |
| `.specgate-eval.json` | `phase:"red"` · `runOk:true` · items 5건 **전부 red** · `evalLockHash` ≠ null · implHash에 tests/eval 2파일 포함 |
| exit·stderr | 두 명령 다 exit 0 · green Advisory 경고 0건 |
| 리포터 스키마 대조 | 임시 outputFile을 지우기 전에 1회 열어 `fullName`·`status` 키 실존 확인(3-4의 가정 검증) |
| 후속 정합 | (planedd4 산출물로) `eval-verify.mjs`가 이 EVAL.md에 E1~E5 위반 0 |

## §6. 하지 말 것·경계

- **훅에서 eval-run을 호출하는 배선을 만들지 마라** — hooks.json에 이 파일이 등장하는 순간 Stop
  타임아웃 fail-open 구조가 되살아난다. 배선은 planedd6gate.md의 eval-gate.mjs(스냅샷 읽기 전용)뿐이다.
- **verify-tdd.mjs를 import하지 마라 — 복사만**(r20 §7-5). spawnGroupKill·경로 대조·SKIP_DIRS는
  전부 값·코드 복사고, 복사한 곳에 원본 행 번호 주석을 남긴다. verify-tdd 자체·spec-gate.mjs 등
  «수정 금지» 목록(planeddmain.md §2)도 한 글자도 고치지 않는다 — SRC 정규식은 값 복사다.
- **판정을 exit에 싣지 마라** — red 전건이어도 0이다. 0/1/2 밖 종료 코드 금지. 스냅샷 최상위에
  ok/success/pass 류 불리언 금지(verify-tdd 11행 선례 — 만드는 순간 그게 게이트다. 게이트가 읽을
  것은 runOk와 items뿐이다).
- `--phase` 실행은 EVAL.md·SPEC.md를 **읽기만** 한다 — 앱 트리에 쓰는 것은 스냅샷뿐. EVAL.md를
  쓰는 유일한 경로는 --lock의 빈 해시 셀 채움이다(그때도 다른 셀·다른 절은 건드리지 않는다).
- 차단·판정에 LLM 금지(개발 규칙 5) — 전 경로 결정론. 새 의존성 금지(개발 규칙 2) — Node 내장만.
- 실물 vitest 통합 검증을 selftest에 넣지 마라 — 층 분리(3-9). selftest는 오프라인·수 초·결정론이어야
  회귀 감시로 쓰인다. 실물 통합은 §5-2(1회 손 실행)와 planedd8smoke.md 몫이다.

## §7. 선택 대기

| # | 항목 | 기본값 | 대안 | 상태 | 번복 조건 |
|---|---|---|---|---|---|
| 1 | --lock 모드의 소속 | eval-run.mjs 안(h8·파서 공유 — planedd3 §8이 이미 이쪽을 지목) | 별도 eval-lock.mjs 분리 | 선택 대기 | /eval 커맨드 문안(planedd7skill.md)에서 «실행 도구가 승인 도구를 겸하는» 혼선 사건 1건 |
| 2 | red 증거 보존 방식 | 단일 스냅샷 + final 시 `redAt` 승계(3-7 — 소비는 planedd4 'snapshot.invalid' pre 분기로 확정) | phase별 2파일(.specgate-eval.red.json 별도) | 선택 대기 | redAt 승계가 «red를 거쳤다» 판정에 불충분한 사건 1건(예: redAt만 있고 red 항목 증거가 필요해진 경우) |
| 3 | skipped의 취급 | red로 계수(green 증거 아님 — 3-5) | skipped 별도 상태 신설(스냅샷 스키마 확장) | 선택 대기 | 정당한 조건부 skip(플랫폼 분기 등)이 기각 사유 없이 필요해진 사례 1건 |
| 4 | 러너 타임아웃 | 120s(verify-tdd 고정값 5 복사) | 앱 규모 따라 .specgate.json 키로 조정 가능화 | 선택 대기 | 정상 평가 스위트가 120s를 넘는 실사용 사건 1건 |

## §8. 참조

- 리포: `framework/verify-tdd.mjs`(고정값 1~5·spawnGroupKill·리포터 실측 키 — 복사 원본) ·
  `framework/hooks/spec-gate.mjs` 19행(SRC 값 복사 원본)·selftest 구조(인라인 픽스처 선례) ·
  `exp/judge.mjs:30`(정규화 후 해시·acRunOk 선례) · `docs/next/2026-08-16/r20.md` §3·§6-1·§7-5 ·
  `docs/next/2026-08-21/r50.md` §2(실물이 이긴다 선례).
- 팩 내: planeddmain.md §3-1 항 5·6·8 · planedd3manifest.md §3-2(매핑)·§3-3(h8)·§3-7(예시 EVAL —
  §5의 재료)·§5(기대 해시 표) · planedd4verify.md(파서 import 후보·E검사 분담) ·
  planedd6gate.md(스냅샷의 소비자 — SG1048·SG1049) · planedd8smoke.md(실물 vitest 통합 검증).
- 외부: vitest.dev/guide/reporters (json 리포터 — jest 호환 스키마) ·
  jestjs.io/docs/configuration#testresultsprocessor-string (assertionResults 필드 정의).

집행 중 이 지시서와 실물이 어긋나면 실물이 이긴다 — 어긋난 항목을 rN에 기록하라(r50 §2 선례).
