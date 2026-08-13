# 동결 문서 — 실험 4 (§4 문안 개정 트랙)

**작성일**: 2026-08-12 · **동결 시각**: **2026-08-12, `exp4/todo-e` R0 실행 직전** · **환경**: Windows 11, node v24.14.0
**설계 근거**: `docs/next/2026-08-12/r13.md` · `r14.md` · **물음의 출처**: `docs/REPORT2.md` §6.3 (결과를 보기 전에 등록된 표적)
**선행**: `exp2/FROZEN2.md` (판정 규칙·결함 세트·프로토콜의 원본) · `docs/REPORT2.md` · `exp3/FROZEN3.md` (상속 형식의 선례)

> **SSOT**: 실험 4에 관해서는 이 문서가 이긴다. r13·r14와 어긋나면 여기가 맞다.
> `exp/`·`exp2/`·`exp3/` 전체는 동결 취급이며 이 트랙에서 **한 글자도 고치지 않는다** — 자산은 `exp4/`로 복사만 했다.

---

## 0. 동결 대상과 해시

**전부 바이트 기준 SHA256(`sha256sum`)이다.** FROZEN2·FROZEN3 §0은 개행 정규화 방식(`judge.mjs`의
`frozen`)이었으나, 이 표는 r14 §1의 실측값(바이트)을 그대로 등재한다. 대조는 같은 방식끼리 한다.
아래 사본들은 개행이 전부 LF라 **두 방식의 값이 일치한다** — FROZEN2 §0 등재값과 문자 그대로 대조 가능
(실측: `judge.mjs`·`prompt`·`CONTRACT` 등 아래 값들이 FROZEN2 §0의 값과 동일).

디렉터리 트리 해시 방식: `(cd <dir> && find . -type f | sort | xargs sha256sum) | sha256sum`
(= `mutation.sh`의 `srchash`. `seed/`만 `node_modules` 제외 조건 추가).

| 파일 | SHA256 (바이트) | 원본과 |
|---|---|---|
| **`exp4/fw-e/skills/spec/SKILL.md`** (처치 본체, 45줄) | `12b69dd6b6337221b70d425f354e73d1841c0e16b29b0b26f2483aa04017befb` | **§4에 2줄 추가 (B안)** |
| └ 앞 43줄만 | `00f70d94b2f0c1e51e2591bdea0d051e8b7fafc89dc165b83ecc7320bb98a7c1` | = FROZEN2 §0 처치 본체 — **변경이 추가 2줄뿐임의 증명** |
| `exp4/fw-e/.claude-plugin/plugin.json` | `8798f8c717f6b04ccc9275fe7cba7077726f85a567a187a0b9d02462602f61b5` | 동일 |
| `exp4/prompt-e.md` | `67bd1e9918aaa1839648bf75e881f3f8ac2abbc83784d0cf22acf76e09386eda` | = `prompt-d.md` (= `prompt-b2.md`) |
| `exp4/CONTRACT-thin.md` | `7dd38823e7e41a77d011b607a2f4b0985147245ea9a29f547775a4a61b58fe6b` | 동일 |
| `exp4/ac/todo.ac.test.tsx` | `1445df74c9fcbbd4f2f263c132740cf5857bf54debc0523075e21e2bddb4e478` | 동일 |
| `exp4/ac/ac.vitest.config.ts` | `cb4447ebd82dbb7cb4da7152570c1c69b7dcc3546a22a23f109fc36225820e29` | 동일 |
| `exp4/judge.mjs` | `dfdc872095c2f90493482b8d3c8da10ebff430bdfe583bdfcb07ead8168bf71d` | 동일 |
| `exp4/logprobe.mjs` | `b8022ccf8966ceb0a9831028a18554d21ed15f8fcc8d0d03e8bc5df8aecd37c7` | 동일 (FROZEN2 §0.5 교체본) |
| `exp4/mutation.sh` | `4659d5e3d88e535e4bfa60ab6d0de036bc165012ec51857afc2164328df5f3c6` | **경로 상수만 수정 — diff 전문 §0.4** |
| `exp4/faults/` (트리) | `377978d642a84fb14926ff160addb51ff94c29b6c500299622bc74e6bc75587f` | `exp2/faults`와 `diff -r` 동일 |
| `exp4/faultbase-pristine-src/` (트리) | `84bb3708dc3c250107ac758f831ab170791b156242df5c64243a37d6c6014d60` | = FROZEN2 §0 등재값 (방식도 동일) |
| `exp4/seed/` (트리, node_modules 제외) | `9c3324101345350bdaa5789d8c8e98694766ccc9e676fbd0a52e9cc827751085` | `exp2/seed`와 `diff -r -x node_modules` 동일 (디스크에는 node_modules 포함 복사 — 런 디렉터리가 `npm install` 없이 뜬다) |

`selftest.sh`는 **사본을 만들지 않았다** — `bash exp2/selftest.sh <app-dir>`를 그대로 호출한다.
인자 경로만 받고 쓰기는 앱 안에서만 일어난다(설정 복사 후 삭제, 잔여물 0 — FROZEN2 §4.2 실측). exp3이 이렇게 썼다.

### 0.1 복사 검증 — `exp2/`는 읽기만 했다

복사 **전후** `exp2/` 전수 트리 해시(`node_modules` 제외)가 동일하다 (2026-08-12, r14 §1):

```
(find exp2 -type f -not -path '*/node_modules/*' | sort | xargs sha256sum) | sha256sum   # 리포 루트에서
→ fa6c7dda9b81f8037884873af8a96cad25dbff3b37d16bbe6c1a34500eade435
```

동결 시각에 재실측해 같은 값을 확인했다. FROZEN2 §0.1은 파일별 38개 대조였고 이번엔 전수 트리 해시
1개다 — 형식은 다르나 증명 대상은 같다. 보조 증거: 복사 커밋 `a434d6e` 이후 `exp2/`를 건드린 커밋 0건,
워킹트리 클린 (git 실측). 단일 파일·디렉터리 단위의 바이트 동일은 §0 표의 `cmp`/`diff -r` 대조로 재확인했다.

### 0.2 처치 검증 3건 (FROZEN2 §0.2와 같은 틀)

| 검증 | 기준 | 실측 |
|---|---|---|
| ① §1~3·기존 §4 무변경 | 원본 43줄본과 diff에 삭제·변경 0줄 | **통과.** 추가 2줄뿐. 앞 43줄 해시 = `00f70d94…` (원본 전체와 동일) |
| ② 자산 오염 | `todo\|react\|testid\|localStorage\|filter\|checkbox\|persist\|storage\|aria\|a11y\|accessib\|영속\|저장\|접근성` — 추가 2줄에서 0줄 | **통과. 0줄** |
| ③ 프롬프트 | `prompt-e.md` = `prompt-d.md` 바이트 동일 | **통과** (`cmp` + 해시 `67bd1e99…`) |

> ②의 패턴에서 `test|테스트`만 뺀 것은 FROZEN2 §0.2-②와 동일하다(처치의 본체가 "테스트"이므로).
> 금지선도 그대로다 — **무엇을 테스트할지**는 한 글자도 적지 않았다. 추가 2줄에 등장하는 명사는
> "문장·테스트·파일·이유"뿐이고 축 이름(영속·접근성·필터·체크박스…)은 0건이다.

### 0.3 처치 본체 — (e)에 추가로 들어가는 전부

```markdown
1·2번의 문장은 하나도 빠짐없이 테스트로 옮긴다. 옮기지 못한 문장은
그 이유를 파일 안에 적는다 — 이유를 적기 전에는 완료가 아니다.
```

§4 끝에 이 2줄이 붙는다. 43줄 → 45줄. 문체는 §3의 완료 게이트(«둘 중 하나를 하기 전에는 완료가 아니다»)와 같은 꼴.

- **A안(2번째 줄 교체)은 기각했다** (r13 §4) — 라벨링 지시(3/3이 이행했고 효과가 관측된 줄)가 사라져
  변경이 2개가 되고, 결과가 어느 변경 때문인지 갈리지 않는다. B안은 (e) − (d) = **추가분뿐**이라 귀속이 깨끗하다.
- **탈출구(«옮기지 못한 문장은 이유를») 유지 확정** — 2026-08-12, r14 §2의 미결을 실행 전에 닫았다(실험자 결정).
  근거: jsdom에서 못 재는 문장(반응형 등)이 실재한다(하드 제약) — 탈출구 없이 «전부»만 쓰면 문안이 거짓말이 된다.
  **반론도 등록한다**: `todo-d`의 U-38 선례(«이름 문자열 자체는 테스트가 판정하지 않는다») 같은 명시적 제외가
  이 탈출구로 합법화될 수 있다. F-08이 survived로 남고 그 사유가 탈출구 문장으로 적혀 나오면,
  그것 자체가 «상한 관측»의 정확한 형태다 — 지우지 않고 그대로 싣는다.

### 0.4 `mutation.sh` 사본의 diff 전문 — 경로 상수와 usage 주석뿐

```diff
--- exp2/mutation.sh
+++ exp4/mutation.sh
@@ -2,22 +2,22 @@
 # 6단계 (FROZEN2 §4.3) — 산출물에 결함을 하나씩 주입하고, 그 산출물에 남은 자체 테스트가
 # 잡아내는지 본다. AC 오라클이 아니라 에이전트가 남긴 테스트로 잰다.
 #
-#   usage: bash exp2/mutation.sh <app-name> [F-ID ...]
-#   예   : bash exp2/mutation.sh todo-d
-#          bash exp2/mutation.sh todo-a2t          # (a)(b)는 주입 없이 none 확인만
+#   usage: bash exp4/mutation.sh <app-name> [F-ID ...]
+#   예   : bash exp4/mutation.sh todo-d
+#          bash exp4/mutation.sh todo-a2t          # (a)(b)는 주입 없이 none 확인만
 #
-# 전제: 주입 파일이 exp2/faults-d/<app>/<F-ID>/src/… 에 준비돼 있어야 한다.
+# 전제: 주입 파일이 exp4/faults-e/<app>/<F-ID>/src/… 에 준비돼 있어야 한다.
 #       (의미 단위 주입이므로 위치는 산출물마다 다르다 — 사람이 만든다)
 #       준비된 결함이 하나도 없으면 selftest 만 1회 돌리고 끝낸다.
 set -uo pipefail
 cd "$(dirname "$0")/.."
 
 APP="$1"; shift
-DIR="exp/$APP"; [ -d "exp2/$APP" ] && DIR="exp2/$APP"
+DIR="exp/$APP"; [ -d "exp4/$APP" ] && DIR="exp4/$APP"
 [ -d "$DIR" ] || { echo "!!! 없는 디렉터리: $DIR"; exit 2; }
-PRISTINE="exp2/pristine/$APP-src"
-OUT="exp2/faults-d/$APP"
-mkdir -p "$OUT" "exp2/pristine"
+PRISTINE="exp4/pristine/$APP-src"
+OUT="exp4/faults-e/$APP"
+mkdir -p "$OUT" "exp4/pristine"
 
 srchash() { (cd "$1" && find . -type f | sort | xargs sha256sum) | sha256sum | cut -d' ' -f1; }
```

로직 라인은 100% 동일하다. 원본은 `exp2/pristine/`·`exp2/faults-d/`에 쓰기까지 하므로 그대로 호출하면
동결 위반이다 — 그래서 사본을 만들었다 (r13 §5).

---

## 1. 물음과 1순위 지표

**물음**: 처치 §4에 «1·2번의 문장을 전부 테스트로 옮겨라»를 더하면 exp2의 `mutationScore` 3/4이
4/4가 되는가, 껍데기 테스트만 늘어나는가.

실험 2의 (d) 3런은 전부 `F-08`(삭제 버튼 접근성 이름)을 놓쳤다(3/4 ×3). 원인은 확정돼 있다(REPORT2 §1.1):
SPEC 문장도 구현도 대조도 있는데 **테스트만 없다**. 3런의 자체 테스트에서 `getByRole` 사용 0건.
처치 §4가 «남겨라»까지만 말하고 **«어느 문장을 옮길지»를 안 정하기 때문이다.** 문안 한 줄이 이 갭을
닫는지가 물음이다. 결함 세트를 안 바꾸므로 exp2의 3/4과 **직접 비교**된다.

> **주 판정: (e)의 `F-08`이 killed가 되는가.**
> 껍데기 판정에 별도 지표를 두지 않는다 — 단언 수가 늘어도 score가 안 오르면 그게 껍데기다.

### 1.1 판정 규칙 — FROZEN2 §1.1 그대로. 새 지표를 만들지 않는다

| verdict | 조건 | 집계 |
|---|---|---|
| `killed` | 남은 자체 테스트 중 **하나 이상 실패** (트랜스폼·런타임 에러 포함) | 잡음 (+1) |
| `survived` | 전부 통과 | 놓침 |
| `none` | 돌릴 자체 테스트가 없음 | **놓침으로 집계** |

### 1.2 2순위 — 병기만 하고 결론에 쓰지 않는다 (r13 §3.2)

`getByRole`/`getAllByRole` 사용 건수(REPORT2의 결정적 확인 재사용) · 케이스/단언 수 ·
cost/turns/벽시계(교환비) · `firstImplOracle`. **`F-03`이 다른 셋보다 잡기 쉽다는 사실(FROZEN2 §2.1,
4개 AC 연쇄)은 그대로 상속·병기한다.**

---

## 2. 결함 세트 — FROZEN2 §2에서 무변경 상속

세트·기준 구현·판정 전부 그대로다. **Fault-Check 재검 없음** — 유효성 4/4는 exp2 실측이고
(FROZEN2 §2.1), 결함 정의(`faults/`)와 기준 pristine(`faultbase-pristine-src/`)이 바이트 동일 사본이며
세트를 바꾸지 않는다.

| ID | 결함 (의미 단위) | 잡아야 할 AC |
|---|---|---|
| `F-07` | 영속성 **쓰기** 경로를 제거한다 | AC-07 |
| `F-08` | 삭제 버튼의 접근성 이름을 제거한다 (`aria-label`/텍스트 콘텐츠 제거) — **주 판정 대상** | AC-08 |
| `F-03` | 토글이 앱 상태를 갱신하지 않게 한다 | AC-03, AC-05 (+연쇄) |
| `F-06` | 필터 조건을 뒤집는다 (active ↔ completed) | AC-06 |

주입 형식도 상속: patch가 아니라 **수정된 파일 전체**로 정의, 주입 = 덮어쓰기, 복원 = pristine에서 복사,
회차마다 트리 해시로 복원 확인 (FROZEN2 §2.3).

---

## 3. 조건 — 신규는 (e) 3런뿐

| 조건 | 처치 | 런 |
|---|---|---|
| (d) 비교 기준 | `SKILL.md` 43줄 | **exp2 실측 재사용, 재실행 없음** — 3/4 ×3, F-08 survived ×3 (FROZEN2 §11.3) |
| **(e)** | 43줄 + §0.3의 2줄 = 45줄 | **신규 3런, R0만** |

(d)를 재실행하지 않는 근거 (r13 §3.1): `mutationScore`는 산출물에 사후 적용하는 측정이고, (d)와 (e)의
차이를 `SKILL.md` 한 곳에 가둔다 — exp2가 (a)(b)를 재사용한 것과 같은 논리. 프롬프트·시드·AC·결함·CLI
플래그 전부 동일하므로 남는 교란 변수는 **실행 시점**(모델 드리프트)뿐이다 → §6-1.

---

## 4. 측정 절차

### 4.1 자체 테스트 실행기 — `bash exp2/selftest.sh <app-dir>` 직접 호출

자체 테스트의 정의(내용 기준, FROZEN2 §0.5에서 확정)를 그대로 쓴다:
① `tests/ac/**` 밖 ② `node_modules`·`dist`·`.git`·`coverage` 밖 ③ `expect(`와 `it(`/`test(`를 모두 가진 파일.
`tests/ac/**` 제외 이유도 동일 — AC가 섞이면 지표가 통째로 무의미해진다.

### 4.2 mutation score 측정 (6단계 — FROZEN2 §4.3, 경로만 exp4)

각 산출물 X ∈ {`todo-e`, `todo-eb`, `todo-ec`}에 대해:

```
0. X/src 를 exp4/pristine/<X>-src 로 백업 (측정 시작 전 1회 — mutation.sh 자동)
1. 각 결함 F ∈ {F-07, F-08, F-03, F-06}:
     a. X/src 를 백업에서 복원 → 트리 해시로 확인
     b. F를 X에 주입 (의미 단위. 위치는 산출물마다 다르다 — exp4/faults-e/<X>/<F>/src/… 를 실험자가 만든다)
     c. diff -u 를 exp4/faults-e/<X>/<F>.diff 에 저장 (mutation.sh 자동)
     d. bash exp2/selftest.sh <X>  → verdict 기록
2. 복원 → 트리 해시로 확인
```

**원자료 보존 1건을 사전 등록한다** (exp2 대비 개선, 스크립트 무수정 — 호출 리다이렉트만):

```bash
bash exp4/mutation.sh <app> | tee exp4/runs/mutation-<app>.txt
```

exp2에서는 mutation verdict가 stdout에만 있어서 마크다운 전사본(FROZEN2 §11.3·REPORT2 §1) 외에
원자료가 남지 않았다. 이번에는 stdout 원문을 `exp4/runs/`에 남긴다.

**측정 후 postcheck**: `node exp4/judge.mjs exp4/<app> <label>-postcheck` ×3 — 복원 뒤 AC 8/8을
재확인한다 (exp2 선례: `verdict-d-r0-postcheck.json`).

### 4.3 주입 기록 의무 — FROZEN2 §4.4 상속

의미 단위 주입에는 사람의 판단이 들어간다. 주입 diff를 전부 파일로 남겨 사후 검증 가능하게 하고,
판단이 갈린 지점은 리포트에 적는다.

---

## 5. (e) 실행 프로토콜 — FROZEN2 §5와 동일, 경로만 다르다

```bash
# cwd = exp4/todo-e.  Git Bash로 돌린다 (PS 5.1은 한글 인자를 깨뜨린다). 프롬프트는 stdin으로만.
cat ../runs/sent-e-r0.txt | claude -p \
  --safe-mode --model opus --effort xhigh \
  --permission-mode acceptEdits --allowedTools Bash PowerShell \
  --append-system-prompt "$(cat ../fw-e/skills/spec/SKILL.md)" \
  --session-id e1000000-0000-4000-8000-000000000000 \
  --output-format json > ../runs/e-r0.json 2> ../runs/e-r0.stderr.txt
```

| # | 디렉터리 | 세션 UUID | 출력 |
|---|---|---|---|
| 1 | `exp4/todo-e` | `e1000000-0000-4000-8000-000000000000` | `e-r0.json` |
| 2 | `exp4/todo-eb` | `e1000000-0000-4000-8000-000000000001` | `eb-r0.json` |
| 3 | `exp4/todo-ec` | `e1000000-0000-4000-8000-000000000002` | `ec-r0.json` |

> **UUID 중복 주의 (실측 완료)**: 이 UUID들은 exp3의 `b2t{,b,c}` R1과 같다 (r13 §6이 그대로 등록했다).
> 세션 저장소가 **cwd 슬러그별**이라 충돌하지 않음을 동결 전에 실측했다 (2026-08-12, 스크래치패드
> 슬러그에서 동일 UUID로 `-p` 정상 완료). 대신 `logprobe.mjs`에 **슬러그를 반드시 명시한다** —
> `C--Users-bhy99-proj-proj3-exp4-todo-e` / `…-todo-eb` / `…-todo-ec`.

- 런 디렉터리 생성: `cp -r exp4/seed exp4/todo-e{,b,c}` (node_modules 포함 — `npm install` 없이 뜬다).
- 프롬프트: `{ cat exp4/prompt-e.md; echo; cat exp4/CONTRACT-thin.md; } > exp4/runs/sent-e-r0.txt`
  → **`exp/runs/sent-b2t-r0.txt`와 바이트 동일해야 한다** (처치 차이를 `SKILL.md` 한 곳에 가둔다).
  다르면 실행하지 않는다 — 프롬프트가 오염됐다는 뜻이다.
- **R0만 돌린다.** **순차 단독 실행** (벽시계를 재므로 — FROZEN3 §3.3의 명문을 상속).
- **모델 대조 (실행 직후, 라운드마다)**: 출력 JSON의 `modelUsage` 키가 `claude-opus-5`인지 확인한다.
  (d)의 2026-08-02 실측값과 같아야 한다. **다르면 멈추고 (d) 재실행 여부를 묻는다** (§8.4-②).
- 채점: `node exp4/judge.mjs exp4/<app> <label>` + `node exp4/logprobe.mjs <uuid> <slug>`
  (**2번째 인자를 반드시 준다** — 기본값이 다른 세션을 가리킨다).

**라운드 유효 판정**: `acRunOk: true` AND `permission_denials` 비어 있음. 그 외 어떤 이유로도 재실행하지
않는다. 무효 라운드는 계측 실패이므로 점수로 기록하지 않고 앱 디렉터리를 삭제 후 `seed`에서 재복사해 재실행한다.

---

## 6. 리스크 — 실행 전에 등록 (r13 §7)

1. **모델 드리프트가 유일한 교란 변수다.** (d)는 2026-08-02 실행, (e)는 2026-08-12 — 10일 시차.
   `modelUsage` 키 대조(§5)로 같은 모델 문자열임은 확인하지만, 같아도 시차는 한계 절에 적는다.
2. 처치가 강해져 **테스트 수가 급증하면 비용·벽시계가 (d)보다 뚜렷이 늘 수 있다.** 교환비로 병기만 한다.
3. **45줄 처치는 실사용 트랙의 43줄과 다른 물건이다.** 실사용 결과(REPORT4)와 섞어 해석하지 않는다.

---

## 7. 한계 (리포트에 그대로 옮길 것)

**FROZEN2 §7의 8항이 전부 상속된다** — 설계 편향(표적을 보고 겨눈 처치), SDD 결합 비분리, n=3·단일
머신·순서 효과 미통제, 의미 단위 주입의 사람 판단, 결함 4개는 AC 8개의 부분집합, F-03 용이성, jsdom
상한·React 결합 등 실험 1 한계 전부. 여기에 **§6-1(10일 시차)**과 **§6-3(실사용 트랙과 비혼합)**이 추가된다.

---

## 8. 종료 조건 (등록 시점부터 유효 — 결과를 본 뒤에는 고칠 수 없다)

### 8.1 재실행 사유 화이트리스트 — FROZEN2 §8.1 그대로

| 사유 | 처리 |
|---|---|
| `acRunOk: false` | 그 라운드만 재실행 |
| `permission_denials` ≠ 0 | 그 라운드만 재실행 |
| 계측기 버그 | **재실행 없음.** 전수 재측정 + 사유 기록 |

**그 외 전부 금지.** 특히 이것들은 재실행 사유가 아니다 — mutationScore가 예상과 다름, 결함이 너무
쉬워/어려워 보임, n이 작아 보임. **전부 리포트 한계 절로 간다.**

### 8.2 사전 등록 문장 — 승패를 정의하지 않는다 (r13 §3.3 확정본, 이후 수정 불가)

| 결과 | 리포트에 쓸 문장 (사전 등록) |
|---|---|
| (e) 4/4 — F-08 killed | «어느 문장을 옮길지»를 문안이 정하자 커버리지가 표적에 도달했다. n=3, 유의성 주장 없음. |
| (e) 3/4 유지 — F-08 survived | «전부 옮겨라»도 에이전트의 테스트 가치 판단을 뒤집지 못했다 — **문안 개정의 상한 관측**. 명시적 제외 단서가 반복되는지 병기. |
| (e) < 3/4 | 문안 추가가 기존 커버리지를 해쳤다. 예상 밖이며 그대로 싣는다. |
| 테스트를 안 남긴 런 | 처치 미도달로 기록 (FROZEN2 §8.2 3행과 동일 처리 — 멈추고 물어본다) |

**어느 경우에도 실험은 성공이다.** 산출물은 "(e)가 이겼다"가 아니라 **비교 리포트**다.

### 8.3 안 하는 것 — FROZEN2 §8.3 상속 + r13 §9

(d) 재실행 · 결함 추가·교체 · n>3 · `SKILL.md` §1~§3 변경 · 처치 추가 · 과제 변경 · 실사용 재료(§1·§2 축)
혼입 · 결과를 본 뒤 지표·문장 추가 · **«남긴 테스트 수»를 결론에 쓰기** (자명하게 (e)가 이긴다 —
지시 준수를 재는 것이지 효과가 아니다) · `gateAC`를 결론에 쓰기 (네 조건 연속 8/8, 영구히 무정보).

### 8.4 멈춤 지점 (r13 §8)

| # | 상황 | 상태 |
|---|---|---|
| ① | B안 탈출구 유지/제거 | **닫힘** — 유지 확정 (§0.3) |
| ② | (e) 런의 모델 문자열이 `claude-opus-5`가 아님 | 발생 시 멈추고 묻는다 |
| ③ | `mutation.sh` 사본 수정이 경로 상수를 넘어야 함 | 〃 |
| ④ | (e)가 테스트를 안 남김 (§8.2 4행) | 〃 |
| ⑤ | 여기 없는 상황 | 〃 |

---

## 9. 리포트 목차 — 지금 박는다

산출물은 **`docs/REPORT5.md` 한 장.** 아래 6절이 채워지면 이 실험은 끝이다.

```
1. 1순위 mutationScore — (d)×3 (exp2 실측 재게시) · (e)×3, 결함별 killed/survived 표. 주 판정 F-08
2. 처치 도달 확인 — 남은 테스트 파일·단언 수 (2순위. 결론에 쓰지 않음)
3. 비용 교환비 — cost / turns / 벽시계, (d)와 비교
4. 병기 지표 — getByRole 건수, firstImplOracle, 탈출구 문장 사용 여부(U-38식 명시적 제외 반복?)
5. 한계 — §7 전체 + 실행 중 관측된 것
6. 다음 트랙으로 넘기는 입력 — 답한 것 / 답할 수 없는 것
```

**§8.2의 사전 등록 문장을 쓴다. 새로 문장을 만들지 않는다.**

---

## 10. `exp4/` 디렉터리 구조

```
exp4/
  FROZEN4.md                이 문서 (실험 4의 SSOT)
  fw-e/                     처치 자산 — skills/spec/SKILL.md (45줄, §4에 2줄 추가본)
  ac/                       동결 AC (exp2/ac 사본, 무변경)
  seed/                     런 디렉터리의 원본 (exp2/seed 사본, node_modules 포함)
  CONTRACT-thin.md          과제 계약 (사본, 무변경)
  prompt-e.md               (e) 진입 프롬프트 (= prompt-d.md = prompt-b2.md, 바이트 동일)
  judge.mjs  logprobe.mjs   채점·계측 (사본, 무변경)

  faults/<F-ID>/src/…       결함 정의 (exp2/faults 사본, 무변경)
  faultbase-pristine-src/   기준 구현 src 백업 (exp2 사본, 무변경)
  mutation.sh               6단계 실행기 (사본 + 경로 상수 수정 — §0.4)

  faults-e/<app>/<F>/src/…  (e) 산출물별 주입 파일 (6단계 전에 실험자가 생성)
  faults-e/<app>/<F>.diff   주입 diff 기록 (6단계에서 생성)
  pristine/<app>-src/       (e) 산출물 src 백업 (6단계에서 생성)

  todo-e{,b,c}/             (e) 3런 (seed 복사로 생성)
  runs/                     verdict-*.json, *-r0.json, sent-e-r0.txt, mutation-*.txt
```

---

## 11. 실행 기록 (2026-08-12)

### 11.1 (e) 3런 — 전부 유효

| 앱 | 세션 | `gateAC` | `regression` | `acRunOk` | denials | cost | turns | 벽시계 | `modelUsage` |
|---|---|---|---|---|---|---|---|---|---|
| `todo-e` | `e1…000` | 8/8 | pass | true | 0 | $2.4984 | 31 | 652.8초 | `claude-opus-5` ✓ |
| `todo-eb` | `e1…001` | 8/8 | pass | true | 0 | $3.0781 | 44 | 765.5초 | `claude-opus-5` ✓ |
| `todo-ec` | `e1…002` | 8/8 | pass | true | 0 | $4.1146 | 51 | 926.3초 | `claude-opus-5` ✓ |

무효 라운드 0건 — 재실행 없음. `modelUsage` 키는 (d)의 2026-08-02 실측과 동일하게
`claude-opus-5` + `claude-haiku-4-5-20251001`(하네스 보조 호출) 2개 — (d) 3런 JSON과 같은 구성이라 멈춤 ② 아님.
`tampered`·`strayAc` 전부 빈 배열 ×3. `todo-eb`만 `strayCfg: ["vitest.config.ts"]` — 에이전트 설정이
감시 이름과 겹쳤을 뿐, 채점은 동결 설정으로만 돌므로 영향 없음(FROZEN2 §11.1 선례와 동일).

### 11.2 처치 도달 — 3/3

| 앱 | 남긴 테스트 | 케이스 | 단언 | `testsDeleted` | 탈출구(«옮기지 못한 문장과 이유») |
|---|---|---|---|---|---|
| `todo-e` | `tests/spec/todo.spec.test.tsx` | 44 | 120 | **0** | 이행 — M16·M17·M3·M6·U16·U36 (전부 절차성) |
| `todo-eb` | `src/todo.spec.tsx` | 36 | 100 | **0** | 이행 — 러너 순환 1건 |
| `todo-ec` | `tests/spec/spec.test.tsx` | 58 | 140 | **0** | 이행 — S8·S10·S12·S13·S11 일부 (전부 절차성) |

### 11.3 1순위 `mutationScore` — 실측 (원자료 `exp4/runs/mutation-*.txt`)

| 조건 | 앱 | baseline | F-07 | F-08 | F-03 | F-06 | **score** |
|---|---|---|---|---|---|---|---|
| (d) | `todo-d{,b,c}` | — | killed ×3 | **survived ×3** | killed ×3 | killed ×3 | **3/4 ×3** (FROZEN2 §11.3 재게시) |
| (e) | `todo-e` | survived(0) | killed(7) | **survived(0)** | killed(14) | killed(5) | **3/4** |
| (e) | `todo-eb` | **killed(1)** ← §11.4 | killed(2) | **killed(2)** | killed(10) | killed(4) | **4/4** |
| (e) | `todo-ec` | survived(0) | killed(2) | **survived(0)** | killed(18) | killed(8) | **3/4** |

괄호는 실패 케이스 수. **중앙값 (e) 3/4** (집계 방식은 FROZEN2 §11.3 상속). 주 판정 F-08: **survived 2/3**.

### 11.4 실행 중 관측 — 판정에 관련된 진단 2건

1. **`todo-eb`의 baseline이 killed(1)** — 실패는 `S-14`(스타일 파일 mtime 비교 테스트) 1건.
   `mutation.sh`의 복원(디렉터리 복사)이 mtime을 갱신해 깨진다(7ms 차 — 복사 순서 인공물). 에이전트
   세션에서는 통과했던 테스트로, 측정 절차의 파일 복사와 비양립인 환경 취약 테스트다. 2회 재현 확인.
   **판정 영향 없음**: baseline 실패분을 빼는 보수적 판독(델타)으로도 `todo-eb`의 4개 결함 전부
   추가 실패가 있어(2·2·10·4 > 1) killed 유지. 특히 주 판정 F-08은 주입 상태에서 실패 테스트를
   이름으로 확인했다 — `S-16`(«화면 문구가 한국어 하나다» 불변식)이 결함으로 실제 실패한다.
2. **주입 시 동반 수정 2건 (FROZEN2 §4.4 기록 의무)**: `todo-e`(App.tsx)·`todo-ec`(useTodos.ts)의
   F-03은 핸들러를 비우면 `toggleTodo` import가 미사용이 되어, 컴파일 가능성 유지(FROZEN2 §2.3,
   `_` 접두사와 같은 범주)를 위해 해당 import를 함께 제거했다. diff에 그대로 남아 있다.

### 11.5 무결성

- `exp2/` 전수 트리 해시(측정 후 재실측) = `fa6c7dda…` — §0.1과 동일, **읽기만 했다.**
- `exp/`·`exp2/`·`exp3/` git 클린 ×3 (측정 후 확인).
- postcheck ×3: 복원 뒤 `gateAC 8/8`·`regression pass`·`acRunOk true` (`verdict-*-r0-postcheck.json`).
- `mutation.sh` 복원 해시 일치 ×3 (스크립트 자체 검사) + 주입 diff 12건 저장(`faults-e/<app>/<F>.diff`).
- `sent-e-r0.txt` = `exp/runs/sent-b2t-r0.txt` 바이트 동일(2,772B, diff 0줄). 런 디렉터리 3개의
  시작 상태 트리 해시(node_modules 제외) = `seed/` 등재값 `9c332410…` ×3.

---

> **이 문서가 완성되기 전에는 (e)를 실행하지 않는다.**
> 완성 시각 이후의 §0 해시 변경은 전부 동결 위반이다. **§11(실행 기록)은 실행 후 추가되며 이 규칙의 대상이 아니다.**
