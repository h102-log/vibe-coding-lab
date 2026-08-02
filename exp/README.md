# exp/ — 프레임워크 유·무 비교실험

같은 Todo 앱 과제를 **(a) 맨 Claude Code**와 **(b) 프레임워크 적용** 두 그룹에 주고, 실행 전에 동결한 인수 테스트로 채점한다.

> **`FROZEN.md`가 이 실험 설계의 SSOT다.** 아래는 지도일 뿐이고, 여기와 FROZEN.md가 어긋나면 FROZEN.md가 이긴다.

## 파일

| 경로 | 무엇 | 누가 보나 |
|---|---|---|
| `FROZEN.md` | 설계 문서 — Gate/Advisory, 알고 뺀 것, 프로토콜, 한계, 실행 기록(§7.4) | 실험자만 |
| `CONTRACT.md` / `CONTRACT-thin.md` | 구현 계약. 두 그룹에 **완전히 동일하게** 준다. **본 실험은 얇은 판(`-thin`)** | 에이전트 |
| `prompt-a.md` / `prompt-a2.md` | (a) 진입 프롬프트. 계약을 이어붙여 한 프롬프트로 투입 | 에이전트 |
| `prompt-b2.md` | (b) 진입 프롬프트. `prompt-a2.md` + 프레임워크 진입 1줄 | 에이전트 |
| `fw/` | 프레임워크 자산. 플러그인 형태지만 `--safe-mode`가 `--plugin-dir`를 끄므로 `SKILL.md` 본문을 `--append-system-prompt`로 주입한다 | 에이전트 |
| `logprobe.mjs` | 과정 지표 계측. 1순위 `firstImplOracle`을 세션 로그에서 뽑는다 | 실험자만 |
| `prompt-change*.md` | R4~R7 변경 요구. 양쪽에 같은 순서로 동일 투입 | 에이전트 |
| `ac/` | 동결 인수 테스트 8개(AC-01~08) + 채점 전용 vitest 설정 | — |
| `judge.mjs` | 채점기 | — |
| `seed/` | 두 그룹 공통 시드. `App.tsx`는 스텁 | — |
| `todo-a/` | (a) 실행 산출물 | — |
| `runs/` | 실행 로그 + 채점 결과 | — |

완전 스펙 계열(`CONTRACT.md`/`prompt-a.md`)의 (a)는 전 지표 8/8로 끝나 **별도 조건의 결과**로만 남는다. (b)는 돌리지 않는다.

## 채점

```bash
node exp/judge.mjs exp/todo-a a-r0        # <app-dir> <label>
# → exp/runs/verdict-a-r0.json
```

차단하지 않는다. 채점 시점에 `ac/`를 앱의 `tests/ac/`로 통째 복원한 뒤 동결 config로만 실행한다. 조작은 점수에 닿지 못하고 흔적만 남는다(`tampered`/`strayAc`/`strayCfg`).

## 건드리지 말 것

| | 왜 |
|---|---|
| `ac/*` | `FROZEN.md` §0이 이 글롭 전체를 해시로 동결한다. **파일을 추가하기만 해도** 목록이 바뀐다 |
| `fw/*` | §0에 해시로 동결된 처치 자산. 고치면 (b)를 처음부터 재실행해야 하고, 축 이름이 한 줄만 섞여도 §7.7 오염이다 |
| `seed/*` | (a)에 들어간 것과 (b)에 들어갈 것이 바이트 단위로 같아야 한다. 여기 README가 없는 것도 그 때문이다 |
| `todo-a/*` | 실행 산출물이자 실험 데이터. `judge`가 해시로 변조를 검사한다 |
| `runs/*` | 실측 원문. 덮어쓰거나 지우면 재실행 말고는 복구 경로가 없다 |

두 그룹 실행 **사이에** AC·계약·프롬프트·프레임워크 자산을 고쳤다면 **양쪽 다 처음부터 재실행**한다. 예외 없음(`FROZEN.md` §0).

에이전트에게 주는 것은 `prompt-*.md` + `CONTRACT.md`뿐이다. `FROZEN.md`·`judge.mjs`·`ac/`는 절대 주지 않는다.
