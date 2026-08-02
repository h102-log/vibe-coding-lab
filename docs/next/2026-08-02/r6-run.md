# 실행 절차 — 9~12단계 (새 세션용 런북)

**이 문서는 판단하는 문서가 아니다.** 아래를 순서대로 실행하고 각 단계의 검증만 확인한다.
판단이 필요한 상황은 §7에 전부 열거돼 있고, **거기 없는 상황이 생기면 멈추고 물어본다.**

**설계 근거는 여기 없다.** 왜 이렇게 하는지는 [r6.md](r6.md), 확정된 규칙은 `exp/FROZEN.md` §0·§10.

---

## 0. 시작 프롬프트

새 세션에 이걸 그대로 붙여넣는다.

```
proj3의 SDD 비교실험(9~12단계)을 마무리한다.

docs/next/2026-08-02/r6-run.md를 읽고 그대로 실행하라.
그 전에 exp/FROZEN.md의 §0(동결 대상)과 §10(종료 조건)을 읽어라 — 둘이 이 작업의 규칙이다.

판단이 필요한 지점은 런북 §7에 전부 적혀 있다. 거기 해당하면 멈추고 물어라.
그 외에는 묻지 말고 끝까지 진행하라.
```

**전제**: cwd = `C:\Users\bhy99\proj\proj3`. `claude` CLI 로그인 상태. Git Bash 사용 가능.

---

## 1. 사전 확인 — 동결이 살아 있나

```powershell
Get-FileHash -Algorithm SHA256 `
  exp\ac\todo.ac.test.tsx, exp\ac\ac.vitest.config.ts, exp\judge.mjs, `
  exp\CONTRACT-thin.md, exp\prompt-a2.md, exp\prompt-b2.md, `
  exp\fw\.claude-plugin\plugin.json, exp\fw\skills\spec\SKILL.md |
  Format-Table Hash, Path -AutoSize
```

**검증**: `FROZEN.md` §0 표의 값과 대조. `todo.ac.test.tsx`를 제외한 7개가 전부 일치해야 한다.
⚠️ §0 표는 **개행 정규화 후** 해시이고 위 커맨드는 바이트 해시다. 파일이 전부 LF이므로 일치하지만, 어긋나면 §7-①.

---

## 2. 단계 9 — AC 제목 축약

`exp/ac/todo.ac.test.tsx`의 `it()` 제목 **8개만** ID로 줄인다. **다른 줄은 한 글자도 건드리지 않는다.**

```
it("AC-01 add: Enter adds one item with the exact title and clears the input", async () => {
                                    ↓
it("AC-01", async () => {
```

8개 전부 같은 방식. AC-01 ~ AC-08.

**채점기는 수정하지 않는다 — 확인 완료.**

| 파일 | 코드 | 왜 안 깨지나 |
|---|---|---|
| `judge.mjs:97` | `a.title.slice(0, 5) === id` | 앞 5글자만 본다. `"AC-07"`도 그대로 매칭 |
| `logprobe.mjs:76` | `/(?:×\|>)\s*(AC-\d+)/g` | vitest 출력의 `× … > AC-07`을 긁는다. 제목 길이 무관 |
| `logprobe.mjs:64` | `/\((\d+) tests?(?: \| (\d+) failed)?\)/` | 파일 요약 줄만 본다. 제목 무관 |

> 부수 효과: 제목이 짧아지면 vitest 실패 출력이 짧아져 **§1의 tool_result 잘림 한계가 완화된다.** 나쁜 방향이 아니다.

**검증 ① — 단언 로직 diff 0줄**

```bash
git -C exp/todo-a diff --no-index -- exp/ac/todo.ac.test.tsx  # 리포가 아니면 아래로
```
git이 없으므로 실제로는 변경 전 사본과 비교한다. 축약 **전에** 백업부터 뜬다:

```powershell
Copy-Item exp\ac\todo.ac.test.tsx $env:TEMP\todo.ac.test.tsx.bak   # 축약 전에 실행
# 축약 후
diff $env:TEMP\todo.ac.test.tsx.bak exp\ac\todo.ac.test.tsx
```

**변경된 줄이 정확히 8줄이고 전부 `it("AC-0N…` 줄이어야 한다.** 다른 줄이 하나라도 뜨면 §7-③.

**검증 ② — Red-Check 재실행 (§5)**

```powershell
Copy-Item exp\seed exp\redcheck-t -Recurse
node exp/judge.mjs exp\redcheck-t redcheck-t
```

**`gateAC: 0/8`, `regression: pass`, `acRunOk: true`, M3 흔적 전부 빈 배열.**
`0/8`이 아니면 §7-②. (이 디렉터리는 증거로 남긴다. 지우지 않는다.)

---

## 3. 단계 10 — §0 재동결

```powershell
Get-FileHash -Algorithm SHA256 exp\ac\todo.ac.test.tsx
node -e "const{createHash}=require('crypto'),{readFileSync}=require('fs');console.log(createHash('sha256').update(readFileSync('exp/ac/todo.ac.test.tsx','utf8').replace(/\r\n/g,'\n')).digest('hex'))"
```

`FROZEN.md` §0 표의 `exp/ac/todo.ac.test.tsx` 행을 **취소선 + 새 해시**로 갱신하고(기존 `logprobe.mjs` 행 형식과 동일), 바로 아래에 사유를 한 줄 남긴다:

> `it()` 제목을 ID로 축약(r5 §3-가). 단언 로직 diff 0줄, Red-Check `0/8` 재확인. **계측기 예외가 아니라 진짜 재동결이며, 그래서 (a)(b) 양쪽을 재실행한다.**

---

## 4. 단계 11 — (a)(b) 재실행 6회

### 4.1 디렉터리·프롬프트 준비

```powershell
foreach ($d in "todo-a2t","todo-a2tb","todo-a2tc","todo-b2t","todo-b2tb","todo-b2tc") {
  Copy-Item exp\seed "exp\$d" -Recurse
}
```

```bash
# Git Bash. cwd = 프로젝트 루트
{ cat exp/prompt-a2.md; echo; cat exp/CONTRACT-thin.md; } > exp/runs/sent-a2t-r0.txt
{ cat exp/prompt-b2.md; echo; cat exp/CONTRACT-thin.md; } > exp/runs/sent-b2t-r0.txt

# 검증: 프롬프트는 안 바뀌었으므로 기존과 바이트 동일해야 한다
diff exp/runs/sent-a2-r0.txt exp/runs/sent-a2t-r0.txt   # 출력 0줄
diff exp/runs/sent-b2-r0.txt exp/runs/sent-b2t-r0.txt   # 출력 0줄
```

**어느 쪽이든 출력이 있으면 §7-⑤.**

### 4.2 (a) 3회 — 베이스라인을 먼저 (§7.3)

각 런: `cd exp/<dir>` 에서 실행. **Git Bash로 돌린다**(PS 5.1은 한글 인자를 깨뜨린다).

```bash
cat ../runs/sent-a2t-r0.txt | claude -p \
  --safe-mode --model opus --effort xhigh \
  --permission-mode acceptEdits --allowedTools Bash PowerShell \
  --session-id a1000000-0000-4000-8000-000000000000 \
  --output-format json > ../runs/a2t-r0.json 2> ../runs/a2t-r0.stderr.txt
```

| # | 디렉터리 | 세션 UUID | 출력 |
|---|---|---|---|
| 1 | `exp/todo-a2t` | `a1000000-0000-4000-8000-000000000000` | `a2t-r0.json` |
| 2 | `exp/todo-a2tb` | `a1000000-0000-4000-8000-000000000001` | `a2tb-r0.json` |
| 3 | `exp/todo-a2tc` | `a1000000-0000-4000-8000-000000000002` | `a2tc-r0.json` |

### 4.3 (b) 3회

**(a)와의 diff는 `--append-system-prompt` 한 줄 + 파일명뿐이다. 실행 전에 눈으로 확인한다.**

```bash
cat ../runs/sent-b2t-r0.txt | claude -p \
  --safe-mode --model opus --effort xhigh \
  --permission-mode acceptEdits --allowedTools Bash PowerShell \
  --append-system-prompt "$(cat ../fw/skills/spec/SKILL.md)" \
  --session-id b1000000-0000-4000-8000-000000000000 \
  --output-format json > ../runs/b2t-r0.json 2> ../runs/b2t-r0.stderr.txt
```

| # | 디렉터리 | 세션 UUID | 출력 |
|---|---|---|---|
| 1 | `exp/todo-b2t` | `b1000000-0000-4000-8000-000000000000` | `b2t-r0.json` |
| 2 | `exp/todo-b2tb` | `b1000000-0000-4000-8000-000000000001` | `b2tb-r0.json` |
| 3 | `exp/todo-b2tc` | `b1000000-0000-4000-8000-000000000002` | `b2tc-r0.json` |

**R0만 돌린다.** 기존 얇은 계열 6런도 전부 R0만 돌렸고, 1순위 `firstImplOracle`은 R0에서 확정된다. `gateAC`가 8/8 미만으로 끝나도 그대로 기록한다 — §10.5가 `gateAC`를 결론에 쓰지 않기로 했으므로 R1 투입은 불필요하다.

### 4.4 채점 — 각 런 직후

```powershell
node exp/judge.mjs exp\todo-a2t a2t-r0
node exp/logprobe.mjs a1000000-0000-4000-8000-000000000000 C--Users-bhy99-proj-proj3-exp-todo-a2t
```

⚠️ **`logprobe.mjs`의 2번째 인자(slug)를 반드시 준다.** 기본값이 `…-exp-todo-a`로 박혀 있어 생략하면 엉뚱한 세션을 읽는다. slug = 앱 경로의 `\`·`:`를 `-`로 바꾼 것.

**라운드 유효 판정** (§7.3·§10.1):

| 조건 | 출처 | 처리 |
|---|---|---|
| `acRunOk: false` | `verdict-*.json` | 무효 → 디렉터리를 시드에서 다시 복사하고 재실행 |
| `permission_denials` ≠ `[]` | `<label>.json` | 무효 → 같은 처리 |

**무효 라운드는 점수로 기록하지 않는다.** 그 외 어떤 이유로도 재실행하지 않는다(§10.2).

### 4.5 눈으로 볼 것 하나

`oracleTrace`의 `[RED]` 위치가 실제 작업 순서와 맞는가. `firstImplOracle`은 `Write`/`Edit`만 보므로 Bash 히어독으로 `src/`에 쓰면 놓친다(§1의 알려진 한계). 어긋나면 그 런의 세션 로그를 직접 확인하고 **리포트 §4에 적는다 — 재실행하지 않는다.**

### 4.6 기록

`FROZEN.md` §7.4에 6런의 표를 추가한다. 기존 얇은 계열 표와 **같은 열 구성**으로, 별도 조건(제목 축약)임을 제목에 명시. 손으로 판단해 채우는 칸은 없다 — 전부 `verdict-*.json`과 `-p` 출력 JSON에서 복사한다.

---

## 5. 단계 12 — `docs/REPORT.md`

**§10.4가 목차를 이미 박아뒀다. 그대로 5절을 채운다.**

```
1. 1순위 firstImplOracle — (a)×3 vs (b)×3, oracleTrace 병기
2. 비용 교환비 — cost / turns / 벽시계
3. 별도 조건 결과 — 완전 스펙 계열(전 지표 8/8) + 얇은 스펙 계열(제목 미축약)
4. 한계 — FROZEN §9 전체 + §10.4의 4건
5. 프레임워크 트랙으로 넘기는 입력 — 답한 것 / 답할 수 없는 것
```

**§10.3의 사전 등록 문장을 쓴다.** 결과가 이김/동률/짐 중 무엇이든 해당 문장이 이미 §10.3 표에 있다. **새로 문장을 만들지 않는다.**

승패를 선언하지 않고 관측값을 싣는다. n=3, 유의성 주장 없음.

---

## 6. 완료 조건

```
□ §1 해시 7개 일치
□ 제목 축약 diff = 8줄, 전부 it() 줄
□ redcheck-t → gateAC 0/8
□ §0에 새 해시 + 사유 기록
□ sent-*2t-r0.txt 2개가 기존과 바이트 동일
□ 유효 런 6개 (acRunOk true ×6, denials 0 ×6)
□ verdict + logprobe 6세트
□ FROZEN §7.4에 기록
□ docs/REPORT.md 5절 완성
```

**마지막 칸이 채워지면 이 실험은 끝이다.** 그다음은 프레임워크 트랙이고, 그건 별도 세션에서 r6 §2의 규칙 2건과 함께 시작한다.

---

## 7. 멈춤 지점 — 여기 해당하면 진행하지 말고 물어본다

| # | 상황 | 왜 멈추나 |
|---|---|---|
| ① | §1 해시가 §0과 불일치 | 동결이 이미 깨져 있다. 원인을 모르는 채로 재실행하면 데이터가 무의미해진다 |
| ② | Red-Check이 `0/8`이 아니다 | 제목 축약이 단언을 건드렸거나 AC가 손상됐다 |
| ③ | 축약 diff에 `it()` 아닌 줄이 있다 | 같은 이유. **"사소해 보여도" 넘어가지 않는다** |
| ④ | 같은 디렉터리에서 무효 라운드 2연속 | 에이전트 문제가 아니라 환경 문제다 |
| ⑤ | `sent-*2t-r0.txt`가 기존과 다르다 | 프롬프트가 오염됐다. 계약·프롬프트는 이번에 안 바뀌었어야 한다 |
| ⑥ | 여기 없는 상황 | 그래서 멈춤 지점이다 |

---

## 8. 절대 하지 말 것 (§10.2 · §10.5)

- **점수가 예상과 다르다는 이유로 재실행하지 않는다.** 재실행 사유는 `acRunOk: false` / `denials ≠ 0` / 계측기 버그 셋뿐이다
- **지표를 추가하거나 바꾸지 않는다.** `firstImplOracle`로 끝낸다
- **n을 3보다 늘리지 않는다**
- **처치를 추가하지 않는다.** TDD 강제·페이즈 분할은 이번 실험 밖이다
- **조건을 바꾸지 않는다.** 불공평해 보이는 것이 발견되면 고치는 게 아니라 **리포트 §4에 적는다**
- **`gateAC`를 결론에 쓰지 않는다.** 세 조건 전부 8/8이라 무정보다
- **기존 `exp/runs/*`·`todo-a2*`·`todo-b*`를 덮어쓰거나 지우지 않는다.** 별도 조건의 실측 원문이다
- **`exp/fw/*`·`CONTRACT*.md`·`prompt-*.md`를 고치지 않는다.** 고치면 6런 전부 무효다
