# 바이브 코딩 프레임워크 설계를 위한 조사 결과

> 조사일: 2026-07-30
> 대상: https://github.com/h102-log/harprame , https://github.com/modu-ai/moai-adk
> 목표: TDD + SDD, 페이즈별 컨텍스트 분할, 선택적 Sub-agent Team Orchestrator를 갖춘
> 웹사이트/웹앱 제작용 자체 프레임워크 (실행 환경: Claude Code)
>
> 근거: 두 저장소 직접 해부 + 1차 심층조사(에이전트 108개) + 2차 심층조사(105개) + 공식 문서 직접 확인

---

## 가장 중요한 발견 먼저

**harprame이 파이썬 500줄로 만든 것의 상당 부분을 Claude Code가 이미 네이티브로 제공한다.** 공식 베스트 프랙티스 문서가 검증 루프를 강제하는 방법을 네 단계로 명시하는데, 그중 두 개가 harprame의 하네스와 같은 일을 한다.

- 프롬프트 안에서 검사 실행 및 반복 (가장 가벼움)
- **`/goal` 조건** — "별도 평가자가 매 턴 후 재검사하고, 조건이 성립할 때까지 Claude가 계속 작업한다"
- **Stop 훅** — "검사를 스크립트로 돌려 통과할 때까지 턴 종료를 차단한다. 단 8회 연속 차단되면 Claude Code가 훅을 무시하고 턴을 끝낸다"
- **검증 서브에이전트** — "새 모델이 결과를 반박해 보게 해서, 작업한 에이전트가 채점자가 되지 않게 한다"

그러니까 설계 출발점은 "harprame처럼 외부 오케스트레이터를 만든다"가 아니라 **"`/goal` + Stop 훅 + 스킬로 안 되는 게 뭔지 먼저 확인한다"** 여야 한다. 외부 러너는 그다음 문제고, 안 만들 수 있으면 안 만드는 게 이긴다.

출처: https://code.claude.com/docs/en/best-practices

---

## 1. 두 벤치마크 대상에서 가져올 것

### 1.1 harprame — 개념은 훌륭, 코드는 참고만

커밋 23개 · 스타 0개 · README 없음 · LICENSE 없음의 개인 실험(2026-07-24 생성, 최종 커밋 2026-07-26). 저장소 자신의 `docs/requirements.md`가 "harness.md는 에이전트에게 status를 판정하라 하는데 execute.py는 status를 수정하지 말라 한다"는 내부 모순을 기록하고 있을 정도로 미완성이다. **"검증된 베스트 프랙티스"로 인용하면 안 된다.** 다만 개념 네 개는 그대로 훔칠 값어치가 있다.

**AC 동결과 Red-Check.** 코드 작성 전에 `verification_cmd`를 먼저 돌려서 **이미 통과하면 계획을 거부하고 `sys.exit(2)`로 중단**한다. `assert True` 같은 가짜 인수 기준을 걸러내는 장치. 근거는 "결과를 본 뒤에 기준을 정하면, 기준이 결과에 맞춰 휜다".

**Gate와 Advisory 분리.** 판별 기준이 딱 하나로 명쾌하다 — "같은 입력에 항상 같은 답이 나오는가". exit code · 파일 존재 같은 결정론적 검사만 진행을 차단하고, LLM 리뷰는 경고만 남기고 통과시킨다.

**step 파일의 자기완결성.** "각 step 파일은 독립된 Claude 세션에서 실행된다. '이전 대화에서 논의한 바와 같이' 같은 외부 참조는 금지한다."

**실패 지문 기반 조기 종료.** 검증 출력에서 시간 노이즈를 정규식으로 지운 뒤 직전 실패와 같으면 재시도를 멈춘다. "같은 실패가 반복되면 재시도는 주사위를 다시 굴리는 것"이고, 이건 실행 실패가 아니라 **계획이 틀렸다는 신호**로 해석한다.

**반면교사.** harprame의 가드레일 주입은 `docs/*.md` 6개를 **모든 step에 무조건 전량** 싣는다. 페이즈별 선택 로딩이 코드 어디에도 없다. 우리가 피하려는 바로 그 문제를 안고 있다.

### 1.2 MoAI-ADK — 구조는 훌륭, 무게는 부담

**스킬 38개의 접두사 분류가 곧 페이즈 분할의 실물 구현이다.**

```
moai-foundation-*  core, quality, thinking, cc          기반
moai-workflow-*    spec, tdd, ddd, loop, worktree …     워크플로
moai-domain-*      frontend, backend, database …        도메인
moai-ref-*         react-patterns, ui-polish, owasp …   레퍼런스
hns-*                                                    프레임워크 자체 유지보수
```

에이전트도 `agents/moai/`(제품 제작용 10개)와 `agents/harness/`(프레임워크 자체 정비용 10개)로 갈라 둔다. README의 "11개"와 태그라인의 "24개" 불일치는 이 두 계열을 어떻게 세느냐의 차이였다.

**작성자와 감사자의 구조적 분리**가 핵심 철학. `manager-spec`이 명세를 쓰고 `plan-auditor`가 감사하는데, 감사자 파일에 "이 역할은 병합되어서는 안 된다"고 못박고 편향 방지 장치 다섯 개를 명문화한다.

- M1 컨텍스트 격리 — 감사자는 작성자의 추론 과정 · 초안 · 대화 이력을 못 보고 최종 산출물만 본다
- M2 적대적 태도
- M3 루브릭 고정
- M4 증거 인용
- M5 must-pass 방화벽

감사자 에이전트는 `permissionMode: plan`으로 쓰기 권한 자체가 없다. `sync-auditor`는 Functionality 40% / Security 25% / Craft 20% / Consistency 15%의 4차원 가중 채점에 더해, Functionality나 Security 중 하나라도 실패하면 총점과 무관하게 FAIL시킨다.

**TDD 조작 방지 불변식 두 개**도 그대로 쓸 만하다.

1. 실패한 테스트의 출력을 **원문 그대로** 완료 증거에 포함해야 한다
2. 실패 테스트보다 먼저 쓰인 구현 코드는 삭제하고 RED부터 다시 유도해야 한다

**커버리지 기준 방법론 분기**도 영리하다. 신규거나 커버리지 10% 이상이면 TDD, 미만인 레거시면 DDD(ANALYZE→PRESERVE→IMPROVE)로 가고 PRESERVE에서 현재 동작을 포착하는 characterization test를 쓴다. 기존 웹 프로젝트에 프레임워크를 얹을 때 필요한 분기.

품질 게이트 TRUST 5(Tested / Readable / Unified / Secured / Trackable)의 커버리지 85% 기준은 하드코딩이 아니라 `quality.yaml`로 뺐다. **임계값을 설정 파일로 외부화한다**는 것만 가져가면 된다.

---

## 2. 구상의 세 축을 근거로 검증

### 2.1 "페이즈를 나눠 컨텍스트를 아낀다" — 실증적으로 정당하다

가장 직접적인 근거는 Chroma의 LongMemEval 실험이다. 같은 질문에 대해 **필요한 부분만 담은 약 300토큰 프롬프트가, 전체를 담은 약 113,000토큰 프롬프트를 모든 모델에서 이겼다.** GPT · Gemini · Qwen 계열 전반에서 같은 경향.
→ https://www.trychroma.com/research/context-rot

더 강한 근거는 EMNLP 2025 Findings 논문. 제목부터가 "Context Length Alone Hurts LLM Performance Despite Perfect Retrieval"인데, **모델이 관련 정보를 완벽히 찾아내도 입력이 길어지면 성능이 13.9%~85% 떨어지고, 무관 토큰을 공백으로 바꾸거나 어텐션에서 완전히 마스킹해도 저하가 남는다.** 즉 "노이즈를 지우면 된다"가 아니라 길이 자체가 독립 변수다.
→ https://arxiv.org/abs/2510.05381

광고된 컨텍스트 윈도우를 믿으면 안 된다는 근거. NoLiMa(ICML 2025)는 "베이스 점수의 85%를 유지하는 최대 길이"를 유효 길이로 정의했는데:

| 모델 | 광고 | 유효 길이 |
|---|---|---|
| Claude 3.5 Sonnet | 200K | 4K |
| GPT-4o | 128K | 8K |
| Llama 3.3 70B | 128K | 2K |
| Gemini 1.5 Pro | 2M | 2K |

→ https://arxiv.org/abs/2502.05167

**반대 방향 주의사항 세 개:**

1. "관련 있어 보이는 문서를 넉넉히 넣기"는 안전하지 않다 — 방해 정보가 단 1개만 들어가도 성능이 떨어지고 4개면 누적된다
2. 위치 최적화("중요한 건 프롬프트 끝에")는 보완책이지 해법이 아니다
3. **인용 가능한 수치가 전부 2025년 상반기 이전 모델 기준이다.** Opus 5 · GPT-5 · Gemini 3의 유효 길이 수치는 확보되지 않았고, NoLiMa 확장표에서 32K 기준 미달 비율이 11/13 → 약 10/22로 개선된 걸 보면 세대가 올라가며 나아지고 있다. **방향성은 믿되 크기를 그대로 투사하지 말 것.**

### 2.2 "페이즈별로 문서를 쪼갠다" — 방법이 틀리면 역효과

progressive disclosure의 **정확한 정의는 "문서를 잘게 쪼개 미리 다 읽히는 것"이 아니다.** Anthropic의 정의는 "메타데이터/참조만 남기고 에이전트가 탐색으로 점진적으로 발견하게 하는 것"이고, 표준 구현이 Agent Skills의 3단계다.

1. name/description만 사전 로드
2. SKILL.md 본문은 호출 시
3. 번들 파일은 필요할 때만

흔한 오해 하나 — 이게 "아무것도 미리 로드하지 마라"는 뜻은 아니다. Anthropic 자신이 CLAUDE.md는 통째로 사전 로드하고 스킬 메타데이터는 상시 상주시킨다. 부정되는 건 **쪼갠 것을 전부 미리 읽히는 것**뿐이다.

대가도 명시돼 있다 — "런타임 탐색은 사전 계산 데이터 조회보다 느리다", "에이전트가 툴을 잘못 쓰거나 막다른 길을 쫓다 컨텍스트를 낭비할 수 있다". **페이즈를 지나치게 잘게 쪼개면 탐색 오버헤드가 절약분을 잠식하는데, 이 손익분기점 수치는 어디에도 없다.**
→ https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

### 2.3 "필요에 따라 서브에이전트를 쓴다" — 그 "필요"의 기준

**서브에이전트의 이득은 토큰 절감이 아니라 리드 에이전트의 윈도우 격리다.** 각 서브에이전트가 수만 토큰을 쓰고 1,000~2,000토큰 요약만 반환하니 리드는 보호되지만, 총비용은 오히려 늘어난다. Anthropic 자신의 수치로 **에이전트는 채팅 대비 약 4배, 멀티에이전트는 약 15배**.

적용 범위 제한도 Anthropic이 직접 말한다. "모든 에이전트가 같은 컨텍스트를 공유해야 하거나 에이전트 간 의존이 많은 도메인은 오늘날 멀티에이전트에 적합하지 않다. 예를 들어 **대부분의 코딩 작업은 리서치보다 진짜로 병렬화 가능한 작업이 적다.**"

Cognition은 더 세게 반대한다. "컨텍스트를 공유하라, 개별 메시지가 아니라 전체 트레이스를 공유하라", "행동은 암묵적 결정을 담고 있고, 충돌하는 결정은 나쁜 결과를 낳는다". 주목할 건 **Anthropic이 "이득"이라 부르는 압축(전체 트레이스 → 1~2K 요약)이 Cognition이 지목하는 1순위 실패 모드 그 자체**라는 것.

→ https://www.anthropic.com/engineering/multi-agent-research-system
→ https://cognition.com/blog/dont-build-multi-agents

**판단 기준:**

| 쓸 것 | 쓰지 말 것 |
|---|---|
| 읽기 전용 탐색 · 조사 (코드베이스 파악, 자료 수집) | 같은 파일을 편집하는 병렬 구현 |
| 결과를 요약해 넘겨도 손실이 적은 작업 | 결정이 서로 얽혀 전체 맥락이 필요한 작업 |
| 독립 검증 · 리뷰 (신선한 컨텍스트가 오히려 이득) | 작업량이 적어 15배 비용이 아까운 작업 |

병렬 편집이 꼭 필요하면 서브에이전트가 아니라 **git worktree로 세션을 물리적으로 분리**하는 쪽이 공식 권고.

---

## 3. Claude Code 프리미티브 선택 지도

각 메커니즘의 **로딩 시점**이 곧 컨텍스트 비용이고, 그게 곧 선택 기준이다.

| 메커니즘 | 로드 시점 | 컨텍스트 비용 | 쓸 곳 |
|---|---|---|---|
| **CLAUDE.md** | 세션 시작, 전량 | 매 요청 (가장 비쌈) | 항상 참인 규칙만. **200줄 이하** |
| **`.claude/rules/` + `paths`** | 매칭 파일을 다룰 때 | 해당 시점만 | 파일 종류별 규약 |
| **스킬** | description 상시, 본문은 호출 시 | 낮음 | 페이즈 절차, 긴 참조 자료 |
| **서브에이전트** | 완전 격리, 요약만 반환 | 리드는 0, 총량은 증가 | 탐색 · 조사 · 독립 검증 |
| **훅** | 이벤트 발생 시 | **0** (출력 없으면) | 반드시 지켜야 할 불변식 |

### 함정들

**`paths` 없는 rules는 절약이 없다.** "paths frontmatter가 없는 rules는 `.claude/CLAUDE.md`와 같은 우선순위로 시작 시 로드된다"고 문서에 명시. 트레이드오프도 있다 — `/compact` 후에 path-scoped rules는 "매칭 파일을 다시 읽을 때까지 유실"되는 반면, 루트 CLAUDE.md는 "디스크에서 재주입"된다. **오프로드는 컨텍스트를 아끼는 대신 압축 후 규칙 유실을 감수하는 선택.**

**스킬 description도 공짜가 아니다.** description과 when_to_use 합산 1,536자에서 잘리고, 전체 목록에 모델 컨텍스트의 1% 예산이 걸려서 넘치면 가장 적게 쓴 스킬부터 description이 드롭된다. `/context`의 Skills 행으로 실측 가능. 비용을 0으로 만들려면 `disable-model-invocation: true`를 쓰면 되는데, 대가는 **Claude가 스스로 못 부른다**는 것이라 "페이즈를 Claude가 알아서 고르게" 하려는 설계에는 못 쓴다.

**서브에이전트의 `skills:` 필드는 전량 프리로드다.** "온디맨드 로딩이 아니라 전체 스킬 내용이 주입된다"고 명시. 스킬을 많이 매달면 격리로 아낀 컨텍스트를 그대로 되돌려준다.

**훅이 유일한 진짜 강제 수단이다.** 공식 문서 표현이 직설적이다.

> "CLAUDE.md나 스킬에 적은 '절대 .env를 수정하지 마라'는 **요청이지 보장이 아니다**. 편집을 차단하는 PreToolUse 훅이 강제다. 규칙이 매번 성립해야 한다면 프롬프트가 아니라 훅으로 만들어라."

다만 **PreToolUse matcher는 툴 이름만 본다.** `Edit|Write`만 걸면 `Bash`로 `sed -i`나 `cat > impl.ts` 하는 우회는 훅이 아예 발화하지 않는다. `Bash`까지 매칭하고 `if` 필드로 인자를 검사해야 한다.

**훅 이벤트 전체 목록** (생각보다 많다):
`SessionStart`, `Setup`, `UserPromptSubmit`, `UserPromptExpansion`, `PreToolUse`, `PermissionRequest`, `PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `Notification`, `MessageDisplay`, `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `Stop`, `StopFailure`

TDD 게이트에는 `PreToolUse`(차단)와 `Stop`(완료 조건)이 핵심.

**TDD 강제는 두 갈래로 나눠야 한다.**

- "테스트 파일 수정 금지" → 경로 기반 정적 판정. 공식 문서의 `.env` 예시와 구조가 같아 훅의 정석 용례
- "테스트 없이 구현 금지" → 무엇이 구현인지, 대응하는 실패 테스트가 있는지를 판정해야 해서 훅 스크립트 안에 판단 로직을 직접 넣지 않으면 결정론적 게이트가 안 됨

참고로 **Claude Code 공식 문서에는 TDD 언급이 아예 없다** — 이 부분은 확인된 훅 사양으로부터의 응용이지 검증된 권고가 아니다.

---

## 4. 웹 제작 특화

### 4.1 시각적 검증 루프

공식 베스트 프랙티스가 UI 작업에 대해 구체적인 프롬프트 패턴을 제시한다.

> "make the dashboard look better" (나쁨)
> → "**[스크린샷 붙여넣기]** 이 디자인을 구현해라. 결과를 스크린샷 찍어서 원본과 비교해라. 차이점을 나열하고 고쳐라." (좋음)

즉 **시각적 목표물을 주고 스스로 비교 · 수정하게 하는 것**이 핵심. 브라우저 스크린샷을 검사 수단으로 명시한다. 이걸 페이즈로 만들면 프론트엔드 검증 루프가 된다.

### 4.2 명세 작성의 네이티브 패턴 (사실상 SDD)

> "[기능 설명]을 만들고 싶다. AskUserQuestion 툴로 나를 상세히 인터뷰해라. 기술 구현 · UI/UX · 엣지 케이스 · 우려 · 트레이드오프를 물어라. 뻔한 질문 말고 내가 놓쳤을 어려운 부분을 파고들어라. 다 다룰 때까지 인터뷰한 뒤 **완전한 명세를 SPEC.md에 써라.**"

이어서 "명세가 완성되면 **새 세션을 시작해 실행하라. 새 세션은 구현에만 집중된 깨끗한 컨텍스트를 갖는다**".

좋은 명세의 조건도 명시:
> "**자기완결적일 것**: 관련된 파일과 인터페이스를 이름으로 지목하고, 범위 밖이 무엇인지 밝히고, 기능이 동작함을 증명하는 종단 검증 단계로 끝난다."

harprame의 step 자기완결성 원칙과 정확히 같은 이야기고, 이게 공식 문서에서 나온다는 게 중요하다.

### 4.3 디자인 일관성

**harprame `docs/UI_GUIDE.md`** — "AI가 만든 티" 안티패턴을 명시적으로 금지:
- `backdrop-filter: blur()` (glassmorphism = AI 템플릿의 가장 흔한 신호)
- 그라디언트 텍스트 (AI제 SaaS 랜딩의 1번 특징)
- "Powered by AI" 배지
- 네온 글로우 애니메이션, 보라/인디고 브랜딩
- 균일한 둥근 모서리, 배경의 흐릿한 그라디언트 오브

**MoAI-ADK `moai-ref-ui-polish` 스킬** — 더 정밀:
- 동심원 반경: `outerRadius = innerRadius + padding`
- 진입은 `ease-out`, 퇴장은 더 부드럽게
- 상태 변화는 keyframes 아닌 `transition` (중단 가능해야 함)
- 동적 숫자에 `tabular-nums`, 헤딩에 `text-wrap: balance`
- 아이콘 스트로크를 인접 텍스트 굵기에 맞춤 (400 → 1.5px, 600 → 2px)
- 아이콘 상태는 `currentColor` + CSS로, 별도 에셋 파일 금지
- 최소 히트 영역 44×44px(터치) / 40×40px(데스크톱)
- 첫 렌더에 진입 애니메이션 생략
- `transition: all` 금지, 항상 속성 명시

전제 조건: **"개입하기 전에 프로젝트의 기존 디자인 시스템을 먼저 파악하라. 폴리시 수정을 위해 두 번째 스타일링 시스템을 도입하지 마라."**

이 스킬의 frontmatter에 토큰 예산이 선언돼 있는 것도 참고:

```yaml
user-invocable: false
allowed-tools: Read, Grep, Glob
progressive_disclosure:
  enabled: true
  level1_tokens: 100
  level2_tokens: 3000
```

---

## 5. 배포

**`plugin.json`은 아예 선택 사항이다.** 없으면 기본 위치에서 컴포넌트를 자동 발견하고 디렉터리 이름을 플러그인 이름으로 쓴다. 매니페스트를 넣더라도 **필수 필드는 `name` 하나뿐**.

### 기본 파일 배치

```
.claude-plugin/plugin.json   매니페스트 (선택)
skills/<name>/SKILL.md       스킬 (신규 플러그인은 이쪽 권장)
commands/                    플랫 마크다운 커맨드 (레거시)
agents/                      서브에이전트
workflows/                   워크플로 스크립트
hooks/hooks.json             훅
.mcp.json                    MCP 서버
bin/                         Bash PATH에 추가되는 실행 파일
```

### 마켓플레이스

저장소 루트에 `.claude-plugin/marketplace.json` 하나 두고 git에 푸시하면 끝. 각 플러그인 항목에 `name`과 `source`만 있으면 되고, source는 로컬 경로 · github · git-subdir · npm · url 지원. 사용자는 `/plugin marketplace add`로 추가, 갱신은 푸시로.

```json
{
  "name": "company-tools",
  "owner": { "name": "DevTools Team", "email": "devtools@example.com" },
  "plugins": [
    {
      "name": "code-formatter",
      "source": "./plugins/formatter",
      "description": "Automatic code formatting on save",
      "version": "2.1.0"
    },
    {
      "name": "deployment-tools",
      "source": { "source": "github", "repo": "company/deploy-plugin" }
    }
  ]
}
```

**버전 관리 함정.** `version`을 생략하면 커밋 SHA로 대체돼서 **모든 커밋이 새 버전으로 취급된다.** 사용자가 원할 때만 업데이트받게 하려면 명시적으로 버전을 박아야 한다. `claude plugin validate --strict`를 CI에 걸면 오타난 필드를 배포 전에 잡을 수 있다.

**주의:** 플러그인 루트의 `CLAUDE.md`는 프로젝트 컨텍스트로 로드되지 않는다. 지침을 Claude 컨텍스트에 넣으려면 스킬로 만들어야 한다.

### 이식성

cc-sdd가 선례. 동일한 스킬 세트를 8개 코딩 에이전트에 각 플랫폼의 네이티브 프리미티브로 배포하는데, 커맨드 표기가 툴마다 달라진다는 게(Cursor는 `/opsx-propose`, Amazon Q는 `@opsx-propose` 식) 실무 부담. cc-sdd는 슬래시 커맨드 모드를 deprecate하고 **Agent Skills로 이동**했고, 그 이유가 멀티 플랫폼 이식성이었다.

---

## 6. 설계 시 결정해야 할 것들 (체크리스트)

작업을 시작하기 전에 정할 것. 각 항목 뒤 `→` 는 추천.

- [ ] **오케스트레이터 위치** — 외부 결정론적 스크립트(harprame) vs 에이전트 내부(MoAI-ADK, cc-sdd)
  → **먼저 네이티브(`/goal` + Stop 훅)로 시도.** 외부 러너는 재현성이 강점이지만 설치 · 유지보수 부담이 크고, Claude Code가 이미 대부분을 제공한다.

- [ ] **배포 프리미티브** — 슬래시 커맨드 / 스킬 / 서브에이전트 / 플러그인 중 1차 형태
  → **스킬 중심.** cc-sdd가 커맨드에서 스킬로 옮긴 이유가 있고, 컨텍스트 비용을 직접 조절할 수 있는 유일한 메커니즘.

- [ ] **페이즈 컨텍스트 로딩 방식** — 전량 사전 로드 vs 스킬 온디맨드 vs 경로 포인터만
  → **위의 프리미티브 표대로 계층화.** 스킬 개수 × description 토큰을 예산에 넣고 `/context`로 실측.

- [ ] **페이즈 게이트 강도** — spec-kit식 순차 게이트 vs OpenSpec식 무게이트 유동
  → **작업 규모로 분기.** 공식 문서도 "한 문장으로 diff를 설명할 수 있으면 계획을 건너뛰라"고 한다. 소규모 웹 변경에 5단계 파이프라인을 강요하면 오버헤드가 이득을 넘는다.

- [ ] **요구사항 표기법** — EARS(`WHEN … THE SYSTEM SHALL …`) vs 마크다운 헤딩 스키마 vs 자유 산문
  → 헤딩 스키마는 **validator로 강제 가능**하다는 실증이 있다(OpenSpec의 `validate --strict`가 시나리오 없는 요구사항을 오류 처리).

- [ ] **명세 갱신 방식** — 전체 재작성 vs 델타(ADDED/MODIFIED/REMOVED/RENAMED)
  → 기존 웹 프로젝트에 얹는다면 델타가 spec drift에 강하다.

- [ ] **게이트 정책**
  → **harprame의 Gate/Advisory 분리를 그대로 채택.** 판별 기준 "같은 입력에 항상 같은 답이 나오는가"는 그대로 쓸 만큼 명확하다.

- [ ] **AC 동결과 쓰기 권한** — 실행 에이전트가 인수 기준과 상태 필드를 수정 못 하게 할 것인지
  → 막을 것. 감사 역할은 `permissionMode: plan`으로.

- [ ] **RED 강제 방법**
  → **두 겹으로.** 훅으로 테스트 파일 수정 차단(정적 판정) + 프롬프트 불변식으로 실패 출력 원문 제출 요구(판단 필요). Bash 우회를 막으려면 matcher에 `Bash`도 넣을 것.

- [ ] **자기채점 금지 구조**
  → 작성자/감사자 분리 + 감사자에게 초안과 대화 이력을 주지 않기. 공식 문서도 "신선한 컨텍스트가 코드 리뷰를 개선한다, 방금 자기가 쓴 코드에 편향되지 않으니까"라고 한다.
  ⚠️ **경고도 함께 있다** — "결함을 찾으라고 지시받은 리뷰어는 작업이 멀쩡해도 대개 뭔가를 보고한다. 모든 지적을 쫓으면 과도한 추상화와 방어 코드로 이어진다." 리뷰어에게 "정확성이나 명시된 요구사항에 영향을 주는 것만 지적하라"고 범위를 좁힐 것.

- [ ] **품질 게이트 임계값**
  → 설정 파일로 외부화(MoAI-ADK의 `quality.yaml` 방식).

- [ ] **레거시 분기**
  → 커버리지 기준으로 TDD/DDD 갈라내기. 웹 프로젝트 온보딩에 필요.

- [ ] **멀티에이전트 발동 조건**
  → 읽기 전용 탐색에만. 병렬 편집은 worktree로.

- [ ] **이식성**
  → 단일 CLI 전용으로 시작하는 게 낫다. 멀티 플랫폼은 커맨드 표기 차이 때문에 유지보수가 곱절.

---

## 7. 아직 모르는 것 (직접 실험으로 채울 부분)

- **현행 모델의 유효 길이.** 인용한 정량 근거가 전부 2025년 상반기 이전 모델. Opus 5 · GPT-5 · Gemini 3 기준으로 "몇 토큰부터 실제로 위험한가"를 말할 근거가 없다.

- **페이즈 분할의 최적 입도.** 너무 잘게 쪼개면 탐색 오버헤드가 절약분을 잠식한다는 것만 확인됐고, 손익분기점 수치는 존재하지 않는다.

- **"테스트 없이 구현 금지"를 훅으로 구현한 실제 사례.** 리팩터링 · 설정 변경을 오탐하지 않으면서 Bash 우회까지 막는 matcher 조합의 검증된 레시피를 찾지 못했다.

- **에이전트 테스트 조작의 실제 발생률.** reward hacking 실태와 훅 도입 후 감소폭에 대한 1차 근거가 없다.

- **브라우저 MCP의 컨텍스트 비용.** Playwright MCP나 Chrome DevTools MCP의 툴 정의가 매 요청 컨텍스트를 얼마나 먹는지 미확인. **컨텍스트 절약 설계와 브라우저 MCP 도입이 정면 충돌할 수 있어서** 실측 필요.

- **SDD 프레임워크의 오버헤드 손익분기점.** spec-kit 사용자 토론에 "명세 교정에 몇 시간을 쓴다", "소규모 기능에서 오버헤드가 이득 초과", "브라운필드 spec drift" 같은 비판이 있지만 정량 데이터는 없다.

---

## 8. 권장 시작점

조사한 여섯 개 프레임워크 중 실제로 널리 쓰이는 건 소수고, 공통된 비판이 **"명세 작성 오버헤드가 이득을 넘는 지점"**에 몰려 있다.

그래서 처음부터 페이즈 다섯 개짜리 파이프라인을 만들기보다, **`/goal` 조건 하나 + 스킬 두세 개 + 훅 하나**로 최소 버전을 세워 실제 웹 프로젝트에 써보고 아쉬운 지점부터 채우는 쪽을 권한다.

harprame이 커밋 23개 만에 만난 벽들(부분 성공 롤백, 커밋 범위, 실패 아티팩트 보존)이 전부 실제로 돌려봐야 보이는 것들이었다.

---

---

# 부록 A. harprame 상세 해부

## A.1 저장소 구조

```
.claude/
  commands/
    harness.md      ← 계획 수립 슬래시 커맨드 (152줄, 6,925 bytes)
    review.md
  settings.json
docs/
  ADR.md
  ARCHITECTURE.md   ← 대상 프로젝트용 템플릿 (Next.js 전제)
  PRD.md            ← 빈 템플릿 (플레이스홀더만)
  UI_GUIDE.md       ← 안티패턴 목록
  concepts.md       ← 핵심 설계 철학
  requirements.md   ← 요구사항 (R2, R8 등)
  analysis/
  next/
    2026-07-25.md   ← 개발 로그
    2026-07-26.md
phases/
  index.json        ← 전체 task 인덱스
  0-smoke/{index.json, step0.md, step1.md}
  1-fail/{index.json, step0.md, step1.md}
scripts/
  execute.py        ← 오케스트레이터 (533줄, 22,222 bytes)
  probe.py
  status.py
  test_execute.py   ← 30,933 bytes (본체보다 큼)
  test_probe.py
  test_status.py
CLAUDE.md           ← 대상 프로젝트용 템플릿
```

**주의:** `docs/`의 PRD.md, ARCHITECTURE.md, CLAUDE.md는 harprame 자신의 문서가 아니라 **대상 웹 프로젝트용 빈 템플릿**이다. Next.js 15 / TypeScript strict / Tailwind 전제에 "모든 API 로직은 `app/api/` 라우트 핸들러에서만 처리" 같은 아키텍처 규칙이 박혀 있다.

**인용 시 주의:** README.md가 없으므로(raw README fetch는 HTTP 404), 출처는 `.claude/commands/harness.md`, `docs/concepts.md`, `docs/requirements.md`, `scripts/execute.py`로 표기해야 한다.

## A.2 `/harness` 커맨드의 5단계

| 단계 | 내용 |
|---|---|
| A. 탐색 | `/docs/` 하위 PRD · ARCHITECTURE · ADR을 읽고 기획 · 아키텍처 · 설계 의도 파악. 필요시 Explore 에이전트 병렬 사용 |
| B. 논의 | 구체적 구현 결정 · 기술적 모호성을 사용자에게 먼저 제기, 합의 도출 |
| C. Step 설계 | 여러 step으로 나뉜 초안 작성 후 피드백 요청 |
| D. 파일 생성 | **사용자가 승인하면** 파일 생성 (human-in-the-loop 게이트) |
| E. 실행 | `python3 scripts/execute.py {task-name}` |

## A.3 Step 설계 원칙 (원문)

1. **Scope 최소화** — 하나의 step에서 하나의 레이어 또는 모듈만 다룬다. 여러 모듈을 동시에 수정해야 하면 step을 쪼갠다.
2. **자기완결성** — 각 step 파일은 독립된 Claude 세션에서 실행된다. "이전 대화에서 논의한 바와 같이" 같은 외부 참조는 금지한다. 필요한 정보는 전부 파일 안에 적는다.
3. **준비물 강제** — 읽어야 할 파일과 선행 산출물을 앞부분에 문서화
4. **인터페이스 수준 명세** — 시그니처를 기술하고 구현 로직은 에이전트에 위임 (단 멱등성 · 보안 · 데이터 무결성 같은 중요 규칙은 예외)
5. **실행 가능한 AC** — 인수 기준은 실행 가능한 명령어(`npm run build && npm test`)여야 하며 추상적 서술 금지
6. **구체적 경고** — 모호한 주의 대신 "Do not X. Reason: Y" 형식
7. **slug 네이밍** — kebab-case (예: `core-types`, `api-layer`)

### step{N}.md 템플릿 섹션

```
## 읽어야 할 파일
## 작업
## Acceptance Criteria
## 검증 절차
## 금지사항
```

⚠️ 실측 편차: 실제 `phases/0-smoke/step0.md`에는 `## 검증 절차` 대신 `## 완료 시`가 있어 템플릿과 실물이 어긋난다.

## A.4 상태 머신

`phases/{task}/index.json`의 status: `"pending" | "completed" | "error" | "blocked"`

타임스탬프 키 매핑: `{"completed": "completed_at", "error": "failed_at", "blocked": "blocked_at"}`

실제 `phases/index.json` 예:
```json
{
  "phases": [
    { "dir": "0-smoke", "status": "completed", "completed_at": "2026-07-26T15:46:03+0900" },
    { "dir": "1-fail",  "status": "error",     "failed_at": "2026-07-26T16:12:13+0900" }
  ]
}
```

## A.5 `execute.py` 실행 메커니즘

**에이전트 호출:**
```python
["claude", "-p", "--dangerously-skip-permissions", "--output-format", "json", prompt]
```
timeout 1800초(30분). 프롬프트 = 프리앰블 + 가드레일 + step 파일 내용.

**오케스트레이션 흐름:**
1. `_checkout_branch()` — `feat-{phase_name}` 브랜치 생성/전환
2. `_sign_off()` — 모든 `verification_cmd`를 표시하고 사용자 승인 대기 (`[y/N]`)
3. `_red_check()` — **Claude 실행 전에** `verification_cmd`가 실패하는지 확인. 통과하면 가짜 AC로 판정하고 `sys.exit(2)`
4. `_execute_all_steps()` 루프 — 각 pending step에 대해:
   - 가드레일 + 컨텍스트 + 직전 에러를 담아 Claude 호출
   - `verification_cmd` 실행
   - 통과: status 업데이트 → 선택적 정성 리뷰 → 커밋
   - 실패: 에러를 다음 시도에 주입하거나 종료
5. `_finalize()` — phase completed 표시, 선택적 push

**가드레일 주입 (`_load_guardrails`, L180-189):**
```python
claude_md.read_text()  # 전문
for doc in sorted(docs_dir.glob("*.md")):
    sections.append(...)
"\n\n---\n\n".join(sections)
```
⚠️ phase당 1회만 호출되고 동일 blob이 **모든 step에 재사용**된다. step/phase별 문서 필터링 분기가 코드 어디에도 없다. `glob("*.md")`는 비재귀라 `docs/analysis/`, `docs/next/`는 로드되지 않는다.

**컨텍스트 누적 (`_build_step_context`, L191-200):**
`index.json`에서 `status == "completed"` 이고 `summary`가 있는 항목만 뽑아 `## 이전 Step 산출물` 블록 생성. 형식: `"Step {n} ({name}): {summary}"`

**판정 주체 (코드 주석 원문):**
- L408: "판정은 에이전트가 아니라 하네스가 verification_cmd로 내린다."
- L427: "에이전트는 작업만, status 판단 없음"
- 프리앰블 규칙: "너는 /phases/{phase_dir}/index.json의 「status」 필드를 절대 수정하지 마라"

**재시도:** `MAX_RETRIES = 3`. 실패 시 검증 출력 전문을 `prev_error`로 다음 프리앰블에 주입. `_failure_fingerprint()`가 `r"\d+\.\d+s"` 정규식으로 시간 노이즈를 제거한 뒤 직전 실패와 비교, 동일하면 조기 중단.

**2단계 분리 커밋 (`_commit_step`):**
```python
git add -A
git reset HEAD -- {output_rel}     # 메타데이터 제외
# 코드 커밋: "feat(phase): step N — name"
git add -A
# 메타데이터 커밋: "chore(phase): step N output"
```

**LLM 정성 리뷰 (`_qualitative_review`, L334-354):** 스크립트 안에서 `claude -p`를 직접 호출한다. 단 docstring이 "advisory, 진행 차단 금지"이고 예외도 삼켜서 제어흐름에 영향 없음. timeout 600, `--output-format` 없음.
→ 따라서 "오케스트레이터에 LLM 없음"은 과장. 정확히는 **"차단성 게이트에는 LLM을 쓰지 않는다"**.

## A.6 `docs/concepts.md` 핵심 (원문 인용)

**하네스의 정의 (L13-22):**
> "하네스는 결정론적이다... 하는 일은 네 가지뿐이다" — 계획 / 게이트 / 판정 / 복구
> "하네스는 에이전트보다 멍청해도 된다. 대신 일관돼야 한다. `exit code == 0`을 읽는 데 지능은 필요 없다... 하네스에 LLM을 넣고 싶어지면 그건 대개 하네스가 아니라 에이전트를 하나 더 만드는 것이다."

**§3 AC 동결:**
> "**실행 전에.** 이유는 하나다: **결과를 본 뒤에 기준을 정하면, 기준이 결과에 맞춰 휜다.**"
> "이건 TDD의 red 단계와 정확히 같은 논리다"
> "'얼린다'의 실질적 의미: 실행 에이전트가 그것을 수정할 수 없다."

**§4 Gate vs Advisory:**

| | Gate (Hard) | Advisory (Soft) |
|---|---|---|
| 판정 주체 | 하네스 (exit code, pytest, 파일 존재) | 독립 LLM 심판 |
| 성질 | 결정론적 | 확률적 |
| 실패 시 | 진행 차단 | 경고만 기록하고 통과 |

`requirements.md` R2: "결정론적 검증만 진행을 막는다. LLM 심사는 점수와 피드백만 기록하고 통과시킨다."

**실행 분리:** 에이전트는 자기를 판정할 수 없다. 실제 사례 — API 호출이 200을 반환했지만 레코드가 0건이었음. **"기계적 성공(호출됨) ≠ 의미적 성공"**. 같은 이해가 같은 방향의 오류를 낳는다 (상관 편향).

**미해결 문제 (저자 본인이 기록):**
- 약한 AC는 Red-Check를 통과하지만 의미적으로 실패한다
- 같은 AI가 AC와 코드를 모두 쓰면 상관 편향이 복제된다
- 재계획 메커니즘이 없다 (v1에서 의도적으로 제외)

## A.7 `_red_check()` 원문

```
docstring: "코드 작성 전 검증. 통과(exit 0)하면 가짜 AC이므로 계획을 거부한다."
→ verification_cmd 없으면 early return
→ _run_verification()이 ok면:
   "✗ Red-Check 실패: ...코드 작성 전에 이미 통과했습니다.
    → 무효 AC(assert True 류)일 가능성이 높습니다. verification_cmd를 수정하세요."
   sys.exit(2)
```
호출 위치가 `_execute_single_step` 최상단, 즉 재시도 루프 앞이라 "코드 작성 전" 조건이 코드로 보장된다.

⚠️ 한정: verification_cmd를 선언한 step에만 적용된다. 미선언 step은 red-check를 건너뛰고 sign-off에서만 경고.

## A.8 개발 로그 (`docs/next/2026-07-26.md`) 교훈

**확정된 설계 결정 3가지:**
1. 하네스만 커밋한다 (에이전트 아님) — 실패한 코드에 거짓 "feat:" 메시지가 붙는 것을 방지
2. 롤백에 `git stash -u` 사용 — 빌드 아티팩트를 보존하면서 수정사항만 제거
3. 커밋 후 탐지/복구(수십 줄) 대신 pre-commit 훅(2줄)

**저자 본인의 습관 문제 발견:** 대안을 탐색하지 않고 첫 해법으로 직행하는 패턴. 개선책 — 선택 전에 대안 3개 쓰기, 각 주장의 구현 비용 정량화, 설계 결정에 명시적 근거 첨부.

**미해결 3가지:**
1. 3회 재시도 실패 시 stash를 어떻게 할 것인가 (즉시 삭제 vs 브랜치 보존)
2. `git add -A` 범위 — 전부 커밋 vs 검증된 파일만
3. 부분 성공 롤백 — step 3이 파일 5개를 만들고 4개는 통과 1개는 실패할 때, `stash -u`가 유효한 4개를 버리는가? **"검증은 step 단위인데 복구는 파일 단위여야 이상적"**

**E2E 실행 결과:**
- E2E 1 (스모크): 두 step 모두 첫 시도 통과 → 실패 복구 데이터 없음
- E2E 2 (의도적 실패): AC 모순으로 동일 실패 3회 재시도. **에이전트는 1차 시도에서 문제를 진단했으나 그것을 전달할 채널이 없었다**
- **인코딩 버그: 유닛 테스트 65개가 통과했는데 UTF-8 처리가 실패 → "테스트 통과 ≠ 동작하는 시스템"**

---

# 부록 B. MoAI-ADK 상세

## B.1 에이전트 목록 (실측)

**`.claude/agents/moai/` (제품 제작용, 10개)**

| 파일 | 역할 |
|---|---|
| `manager-spec.md` | SPEC 작성 |
| `manager-develop.md` | TDD/DDD 구현 |
| `manager-docs.md` | 문서 동기화 |
| `manager-git.md` | PR 생성 · 라우팅 |
| `manager-design.md` | 디자인 협업 |
| `plan-auditor.md` | 계획 편향 방지 (구현 이전 전용) |
| `sync-auditor.md` | 4차원 채점 (코드 생긴 이후) |
| `builder-harness.md` | 프로젝트별 스캐폴딩 |
| `super-advisor.md` | 고난도 추론 에스컬레이션 |
| `e2e-tester.md` | 웹/모바일/데스크톱 테스트 |

\+ 내장 `Explore` = README가 말하는 "11개"

**`.claude/agents/harness/` (프레임워크 자체 유지보수용, 10개)**

`cli-template-specialist`, `hns-github-specialist`, `hns-oss-docs-content-author-specialist`, `hns-oss-docs-locale-translator-specialist`, `hns-oss-docs-structure-curator-specialist`, `hns-release-specialist`, `hns-release-update-specialist`, `hook-ci-specialist`, `quality-specialist`, `workflow-specialist`

→ **제품용과 프레임워크 정비용을 디렉터리로 분리한 것 자체가 참고할 패턴.**

## B.2 스킬 38개 전체 목록

```
# foundation (기반)
moai-foundation-cc, moai-foundation-core,
moai-foundation-quality, moai-foundation-thinking

# workflow (워크플로)
moai-workflow-spec, moai-workflow-tdd, moai-workflow-ddd,
moai-workflow-loop, moai-workflow-ci-loop, moai-workflow-project,
moai-workflow-testing, moai-workflow-worktree, moai-workflow-docs-claim-check

# domain (도메인)
moai-domain-backend, moai-domain-database, moai-domain-frontend,
moai-domain-html-report, moai-domain-humanize, moai-domain-svg-infographic

# ref (레퍼런스)
moai-ref-api-patterns, moai-ref-git-workflow, moai-ref-llm-security,
moai-ref-owasp-checklist, moai-ref-react-patterns, moai-ref-secops,
moai-ref-supply-chain, moai-ref-testing-pyramid, moai-ref-ui-polish

# harness (프레임워크 자체)
hns-moaiadk-best-practices, hns-moaiadk-dev-reference, hns-moaiadk-patterns,
hns-oss-docs-i18n-rules, hns-oss-docs-readme-sync,
hns-oss-docs-structure-map, hns-oss-docs-verify

# 기타
moai-harness-learner, moai-meta-harness, moai (중첩 디렉터리)
```

## B.3 SKILL.md frontmatter 실례

`moai-domain-frontend/SKILL.md`:
```yaml
name: moai-domain-frontend
description: >
  Frontend development specialist covering React 19, Next.js 16, Vue 3.5,
  and modern UI/UX patterns with component architecture. Use when building
  web UIs, implementing components, optimizing frontend performance, or
  integrating state management.
when_to_use: >
  Use for frontend development: React 19, Next.js 16, Vue 3.5 components,
  responsive UIs, TypeScript/JavaScript, state management, hooks, props,
  JSX/TSX, DOM, CSS, Tailwind, and client-side browser performance.
license: Apache-2.0
compatibility: Designed for Claude Code
allowed-tools: Read, Grep, Glob
user-invocable: false
metadata:
  version: "2.1.0"
  category: "domain"
  status: "active"
  updated: "2026-03-28"
  tags: "frontend, react, nextjs, vue, ui, components"
  author: "MoAI-ADK Team"
```

내용: React 19(`cache()`, Suspense), Next.js 16(Zod 검증 server actions, ISR), Vue 3.5(composables, Pinia). 번들 파일 `.claude/rules/moai/languages/typescript.md`를 frontmatter paths로 자동 로드. 임계값: 번들 50KB, 컴포넌트 300줄.

## B.4 TDD 스킬의 조작 방지 불변식 (원문)

> **Invariant i (RED 실패 필수):** "The verbatim RED failing-test output (the failing-test run captured BEFORE any implementation makes it pass) MUST be observed and shown as part of run-phase completion evidence."
>
> **Invariant ii (선행 구현 삭제 규칙):** "Any implementation code written before its failing test exists MUST be deleted and re-derived from a failing test (RED then GREEN)."

이 둘이 막는 것:
1. 테스트가 처음에 실패했다는 관측 가능한 증거 요구
2. 대응 테스트보다 먼저 온 구현 금지

없으면 전부 통과하는 테스트 스위트가 test-after 개발을 위장할 수 있다. **원문 RED 출력 요구가 RED 단계 생략을 구조적으로 탐지 가능하게 만든다.**

---

# 부록 C. 경쟁 프레임워크 요약

| 프레임워크 | 파이프라인 | 산출물 | 특징 |
|---|---|---|---|
| **GitHub spec-kit** | `/speckit.constitution` → `specify` → `plan` → `tasks` → `implement` (+`clarify`는 plan 이전, `analyze`는 tasks 이후) | `.specify/memory/constitution.md`, `specs/[branch]/{spec,plan,tasks,research,data-model,quickstart}.md`, `contracts/` | spec은 "무엇/왜"만, 기술 선택은 plan으로 분리. 순차 게이트형 |
| **cc-sdd** | `/kiro-discovery` → `spec-init` → `spec-requirements` → `spec-design` → `spec-tasks` → `impl` | `brief.md`, `roadmap.md`, `requirements.md`(EARS), `design.md`(Mermaid + File Structure Plan), `tasks.md`(`_Boundary:` / `_Depends:`) | **Agent Skills 17개로 배포**, 커맨드 모드는 deprecated. `/kiro-impl`은 태스크별 fresh implementer + 독립 reviewer + 조건부 debugger |
| **OpenSpec** | `/opsx:explore` → `propose` → `apply` → `archive` | 델타 형식 마크다운 (`## ADDED/MODIFIED/REMOVED/RENAMED Requirements` → `### Requirement:` → `#### Scenario:`) | **명시적 무게이트** ("update any artifact anytime, no rigid phase gates"). 마크다운 헤딩이 곧 스키마이자 유일 식별자, `validate --strict`로 강제 |
| **Kiro (AWS)** | requirements → design → tasks | EARS 표기법 (`WHEN [조건] THE SYSTEM SHALL [동작]`) | 목적 4가지 명시: Clarity, Testability("각 요구사항을 테스트 케이스로 직접 변환"), Traceability, Completeness |

**⚠️ 검증에서 기각된 주장 (인용 금지, 직접 확인 필요):**
- MoAI-ADK의 plan/run/sync 3단계 + 15개 명령 목록
- spec-kit의 5+4 커맨드 정확한 목록
- OpenSpec의 `openspec/` 디렉터리 구조와 변경당 4종 산출물
- Kiro의 requirements/design/tasks 3파일 고정 구조

**마케팅 프레이밍 구분:**
- spec-kit의 "specifications become executable"은 명세가 컴파일된다는 뜻이 아니라 LLM 파이프라인이 코드를 쓴다는 은유
- OpenSpec의 "no rigid phase gates"와 spec-kit 비교는 OpenSpec 자신의 포지셔닝 문구
- Kiro의 traceability는 벤더 표방 의도이며 코드 검증까지 자동 보장하지 않음 (3자 비판: "EARS 문구는 실행 가능한 계약이 아니고, 어느 도구도 생성된 코드를 요구사항 대비 검증하지 않는다")
- cc-sdd의 "17 skills loaded on demand"는 본문에만 해당, frontmatter는 상시 상주

---

# 부록 D. 주요 출처

**공식 문서**
- https://code.claude.com/docs/en/best-practices
- https://code.claude.com/docs/en/features-overview
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/context-window
- https://code.claude.com/docs/en/plugins-reference
- https://code.claude.com/docs/en/plugin-marketplaces

**Anthropic 엔지니어링**
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- https://www.anthropic.com/engineering/multi-agent-research-system
- https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills

**반론 · 연구**
- https://cognition.com/blog/dont-build-multi-agents
- https://www.trychroma.com/research/context-rot
- https://arxiv.org/abs/2510.05381 (Context Length Alone Hurts, EMNLP 2025 Findings)
- https://arxiv.org/abs/2502.05167 (NoLiMa, ICML 2025)
- https://arxiv.org/abs/2307.03172 (Lost in the Middle, TACL 2024) ※ U자 곡선 주장은 이번 검증에서 기각됨 — 인용 비권장

**벤치마킹 대상**
- https://github.com/h102-log/harprame
- https://github.com/modu-ai/moai-adk
- https://github.com/github/spec-kit
- https://github.com/gotalab/cc-sdd
- https://github.com/Fission-AI/OpenSpec
- https://kiro.dev/docs/specs/feature-specs/

**⚠️ 시의성:** 모든 대상이 조사 시점(2026-07-30) 기준 활발히 변경 중. moai-adk pushed_at 2026-07-30(당일), harprame 최종 커밋 2026-07-26, OpenSpec v1.7.0(7/29), cc-sdd 3.0.2(레거시 커맨드 모드 제거 예정). 명령어 문자열은 구현 직전 재확인 필요.
