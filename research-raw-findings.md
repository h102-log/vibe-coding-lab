# FINDINGS

## [0] conf=high vote=3-0

**CLAIM:** HARPRAME은 '벤치마킹 대상 오픈소스 프로젝트'로 볼 근거가 없는 신생 개인 리포다 — 2026-07-24 생성, 2026-07-26 마지막 push, 커밋 23개, 스타/포크/이슈/구독자 전부 0, README·description 없음, LICENSE 파일 자체가 부재(license: null). 따라서 코드·문서의 재사용 허가가 없고(라이선스 없으면 기본 배타적 저작권), 커뮤니티 검증·후기·알려진 한계에 대한 3자 자료도 존재하지 않는다.

SOURCES: https://github.com/h102-log/harprame, https://api.github.com/repos/h102-log/harprame

## [1] conf=high vote=3-0 (병합: 세션분할 3-0 / 오케스트레이션 3-0 / CLI호출 3-0)

**CLAIM:** HARPRAME의 실행 아키텍처는 Claude Code의 subagent/Task 도구가 아니라 외부 Python 하네스(scripts/execute.py, 533줄)가 headless CLI를 subprocess로 반복 호출하는 구조다. `claude -p --dangerously-skip-permissions --output-format json <prompt>`(단일 호출 타임아웃 1800초, 정성 리뷰는 600초)를 스텝마다 새 프로세스로 실행하며(--resume/--continue/--session-id 없음), 컨텍스트 격리를 '서브에이전트'가 아니라 '세션 분할 + 문서 자기완결성'으로 구현한다. 하네스가 feat-{task-name} 브랜치 생성/checkout, 가드레일(CLAUDE.md+docs/*.md) 주입, 이전 스텝 summary 누적 전달, 최대 3회 재시도, 타임스탬프 기록을 담당한다.

SOURCES: https://github.com/h102-log/harprame/blob/main/scripts/execute.py, https://github.com/h102-log/harprame/blob/main/.claude/commands/harness.md, https://raw.githubusercontent.com/h102-log/harprame/main/scripts/test_execute.py

## [2] conf=high vote=3-0 (병합: 2계층 JSON 3-0 / 상태 외부화+audit_log 3-0)

**CLAIM:** HARPRAME은 페이즈/스텝 상태를 모델 컨텍스트가 아니라 파일시스템에 외부화한다: phases/index.json(상위 레지스트리 {"phases":[{dir,status,...}]}) → phases/{task}/index.json(project/phase/steps[{step,name,status,verification_cmd,qualitative_ac,summary}]) → phases/{task}/step{N}.md(지시문) + step{N}-output.json + audit_log.md. status는 pending → completed|error|blocked로 전이하고 created_at(페이즈 레벨)/started_at/completed_at/failed_at/blocked_at은 하네스가 자동 기록하며, 에이전트는 summary만 채우도록 프롬프트로 금지된다.

SOURCES: https://github.com/h102-log/harprame/blob/main/.claude/commands/harness.md, https://github.com/h102-log/harprame/blob/main/scripts/execute.py, https://raw.githubusercontent.com/h102-log/harprame/main/phases/index.json, https://raw.githubusercontent.com/h102-log/harprame/main/phases/0-smoke/index.json

## [3] conf=high vote=3-0 (병합: Red-Check/Sign-off 3-0 / Gate-Advisory 3-0 / Red-Check 구현 3-0)

**CLAIM:** HARPRAME의 TDD/검증 강제는 세 가지 결정론적 장치로 구성된다: (1) Red-Check — 코드 작성 전에 스텝의 verification_cmd를 하네스가 먼저 실행해 exit 0(통과)이면 'assert True류 가짜 AC'로 판정하고 sys.exit(2)로 중단, (2) 사람의 사전 Sign-off — 실행 전 1회 AC 묶음 y/n 승인(실행 후 수백 줄 코드 리뷰보다 실행 전 몇 줄 AC 리뷰가 싸다는 비용 논거), (3) Gate/Advisory 이분 — 판별 기준을 '같은 입력에 항상 같은 답이 나오는가' 하나로 두어 exit code·pytest·파일 존재 같은 결정론적 검사만 진행을 차단하고 독립 LLM 심판은 경고만 audit_log.md에 기록하는 Advisory로 한정(대상도 가독성·UX·문서 구조). 판정 주체는 에이전트가 아니라 하네스다.

SOURCES: https://github.com/h102-log/harprame/blob/main/docs/concepts.md, https://github.com/h102-log/harprame/blob/main/scripts/execute.py, https://simonwillison.net/guides/agentic-engineering-patterns/red-green-tdd/

## [4] conf=high vote=3-0

**CLAIM:** MoAI-ADK의 배포 형태는 npm이 아니라 Go 단일 바이너리다(v3.0.2). 설치는 curl(macOS/Linux/WSL) 또는 irm(Windows PowerShell 7.x+) 스크립트, 소스 빌드는 Go 1.26+ / make build. npm 패키지 moai-adk는 실제로 존재하나 dist-tags.latest=0.2.29, 마지막 publish 2025-10-12로 사실상 중단됐다 — 사용자의 'npm 배포형' 전제는 2025년 가을 기준으로는 옳았고 현재는 무효다. 리포는 Apache-2.0, 1,149 stars, 212 forks, 3,489 commits, open issues 1, 생성 2025-09-16, 최종 push 2026-07-30(조회 당일)으로 매우 활발하다.

SOURCES: https://github.com/modu-ai/moai-adk, https://api.github.com/repos/modu-ai/moai-adk, https://registry.npmjs.org/moai-adk, https://raw.githubusercontent.com/modu-ai/moai-adk/main/README.md

## [5] conf=high vote=3-0

**CLAIM:** MoAI-ADK의 SDD 파이프라인은 plan → run → sync 3단이며 각 페이즈가 슬래시 명령에 1:1 대응한다(`/moai plan "description"` 스펙 저작+수락 기준 → `/moai run SPEC-ID` TDD/DDD 구현 → `/moai sync SPEC-ID` 문서 동기화+PR 생성). 단일 `/moai` 라우터 아래 15개 서브커맨드(.claude/commands/moai/에 clean, codemaps, e2e, feedback, fix, gate, goal, harness, loop, mx, plan, project, review, run, sync)와 36개 CLI 명령(상용 13개: init/doctor/status/update/cc·glm·cg/worktree/session/spec/goal/harness/handoff/preference/web)을 제공하고, SPEC은 Tier S/M/L 크기 분류로 검증 깊이와 PR 라우팅을 결정한다. 자연어 입력(`/moai "fix the login bug"`)은 Analyze-First 라우팅으로 파이프라인에 진입한다.

SOURCES: https://github.com/modu-ai/moai-adk, https://github.com/modu-ai/moai-adk/tree/main/.claude/commands/moai, https://deepwiki.com/modu-ai/moai-adk

## [6] conf=high vote=3-0 (단 '강제 수준'에 대한 해석은 medium)

**CLAIM:** MoAI-ADK의 TDD 강제는 무조건적이 아니라 조건 분기형이다 — 신규 프로젝트 또는 커버리지 10% 초과는 TDD(RED→GREEN→REFACTOR), 커버리지 10% 미만 레거시는 DDD(ANALYZE→PRESERVE→IMPROVE)로 라우팅되며 설정 위치는 .moai/config/sections/quality.yaml의 development_mode다. 품질 게이트는 TRUST 5(Tested 85%+ 커버리지, Readable 린트 오류 0, Unified 포맷·구조 일관성, Secured OWASP 준수·입력 검증, Trackable Conventional Commits·issue refs)로 정의되고 '모든 변경이 통과해야 한다'고 명시된다. 단 이는 문서화된 정책 + 에이전트 판단 + 반복 수렴 루프이며, 하나의 방법론을 강제로 차단하는 코드 훅은 없다고 문서화되어 있다.

SOURCES: https://github.com/modu-ai/moai-adk, https://raw.githubusercontent.com/modu-ai/moai-adk/main/README.ko.md, https://deepwiki.com/modu-ai/moai-adk

## [7] conf=high vote=3-0

**CLAIM:** MoAI-ADK의 서브에이전트 오케스트레이션은 역할 분리형 11-에이전트 카탈로그이고, 핵심 설계는 '생성자와 검증자의 분리'다. Manager 5개(spec, develop, docs, git, design) + Evaluator 2개(plan-auditor, sync-auditor) + builder-harness + super-advisor + e2e-tester(web/mobile/desktop E2E) + 읽기 전용 내장 Explore. sync-auditor는 Functionality 40% / Security 25% / Craft 20% / Consistency 15% 가중 4차원 점수를 산출하며, 도구 권한(Write/Edit 없음)과 permissionMode: plan으로 검증자 역할이 파일 수준에서 강제된다.

SOURCES: https://github.com/modu-ai/moai-adk, https://github.com/modu-ai/moai-adk/tree/main/.claude/agents/moai, https://raw.githubusercontent.com/modu-ai/moai-adk/main/.claude/agents/moai/sync-auditor.md, https://raw.githubusercontent.com/modu-ai/moai-adk/main/.claude/agents/moai/plan-auditor.md

## [8] conf=medium vote=synthesis (구성 사실은 각 3-0, 철학 대비 해석은 본 에이전트 종합)

**CLAIM:** 두 벤치마크는 같은 SDD/TDD 목표를 정반대 층위에서 강제한다 — HARPRAME은 '강제를 Claude 밖으로 빼는' 결정론적 외부 하네스 노선(비-LLM 판정, exit code만 차단, 세션 분할, 파일 상태 외부화, 인간 사전 sign-off), MoAI-ADK는 '강제를 Claude 안에 심는' 에이전트 팀 + 정책 노선(라우터 슬래시 커맨드, 11 에이전트 역할 분리, 감사 에이전트의 확률적 채점, TRUST 5 정책, 조건 분기 방법론). 사용자 구상 5요소 대비 참고 가치는: 컨텍스트 페이즈 분할·검증 게이트 설계는 HARPRAME, 서브에이전트 팀 오케스트레이션·배포·다국어·CLI 표면은 MoAI-ADK가 유일한 실전 사례다(HARPRAME에는 커스텀 서브에이전트 정의 파일이 없다).

SOURCES: https://github.com/h102-log/harprame, https://github.com/modu-ai/moai-adk, https://github.com/h102-log/harprame/blob/main/docs/concepts.md, https://github.com/modu-ai/moai-adk/tree/main/.claude/agents/moai

## [9] conf=medium vote=3-0 (아키텍처) / 3-0 (Spine) / 2-1 (경쟁 도구 분류)

**CLAIM:** SDD 설계에 쓸 수 있는 개념 프레임은 두 갈래로 확인됐다. (1) Böckeler(martinfowler.com, 2025-10-15)의 성숙도 축 — spec-first / spec-anchored / spec-as-source. (2) arXiv:2606.27045 'The Spec Growth Engine'(Grabowski, 2026-06-25) — spec-code 정합성을 '규율'이 아니라 머지 차단 게이트로 강제하는 아키텍처: SPEC.md 파생 Intent Graph와 정적 분석 파생 Evidence Graph를 비교해 orphan code(스펙 소유자 없는 파일)·undeclared dependency(스펙 경계 넘는 미선언 import) 등 4종을 무조건 머지 차단 hard error로 처리하고, 컨텍스트 절약을 위해 'Spine'(루트→현재 노드 소유권 경로)으로 번들을 한정한다(형제 컴포넌트·의존성 내부 design·의존성 코드·전이적 의존성·임의 grep 결과를 명시적 배제 = Parnas information hiding을 에이전트 컨텍스트에 적용). 같은 논문은 GitHub Spec Kit을 'spec-anchored를 지향하나 실제로는 spec-first(스펙 1건당 약 8개 파일, 변경요청당 브랜치)'로 평가한다.

SOURCES: https://arxiv.org/abs/2606.27045, https://arxiv.org/html/2606.27045v1, https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html, https://deepwiki.com/github/spec-kit/10.1-create-new-feature, https://github.github.com/spec-kit/quickstart.html, https://kiro.dev/docs/specs/

## [10] conf=high vote=2-1 (검증자 confidence high, 축자 일치 및 반박 실패 확인)

**CLAIM:** 배포 형태가 '지침을 어떻게 주입하는가'를 구조적으로 규정한다: 플러그인 루트의 CLAUDE.md는 프로젝트 컨텍스트로 로드되지 않으며, 플러그인은 skill/agent/hook으로만 컨텍스트를 기여한다. 플러그인 컴포넌트 목록에 memory/instructions/rules가 아예 없고 .claude/rules/*.md도 플러그인이 배포할 수 없다. 따라서 CLAUDE.md에 워크플로 규칙을 싣는 방식(.claude 템플릿 리포)은 plugin marketplace 배포로 그대로 이식되지 않는다 — 게다가 skill은 트리거 시 본문을 끌어오는 progressive disclosure이고 CLAUDE.md는 세션 시작 시 eager 로드이므로, 항상 켜져 있어야 하는 규칙은 skill로 등가 대체되지 않고 SessionStart 훅이 필요하다.

SOURCES: https://code.claude.com/docs/en/plugins-reference, https://code.claude.com/docs/en/sub-agents, https://code.claude.com/docs/en/hooks

## [11] conf=high vote=3-0

**CLAIM:** 플러그인으로 Sub-agent Team Orchestrator를 배포할 때의 하드 제약: 플러그인이 배포하는 subagent 정의 frontmatter는 보안상 hooks, mcpServers, permissionMode를 지원하지 않고(플러그인 로드 시 무시됨), 지원 필드는 name, description, model, effort, maxTurns, tools, disallowedTools, skills, memory, background, isolation이며 isolation 유효값은 "worktree" 하나뿐이다. 플러그인 에이전트는 `my-plugin:code-reviewer` 형태 스코프 이름으로 @-mention 타이프헤드에 노출된다. 대체 수단인 settings.json의 permissions.allow는 '세션 전체'에 적용되므로 특정 에이전트만 자동승인하는 사전설정은 플러그인 배포 경로로 달성 불가하다. 단 플러그인은 hooks/hooks.json으로 훅을 배포할 수 있고 SubagentStart/SubagentStop 매처가 `^my-plugin:db-agent$` 같은 플러그인 스코프 식별자를 받으므로 '에이전트별 훅 강제'는 사실상 구현 가능하다.

SOURCES: https://code.claude.com/docs/en/plugins-reference, https://code.claude.com/docs/en/sub-agents

## [12] conf=high vote=3-0

**CLAIM:** 훅 스펙은 TDD/SDD 게이트 구현을 뒷받침하지만 실전 신뢰성에 알려진 결함이 있다. 플러그인 훅은 사용자 정의 훅과 동일한 라이프사이클 이벤트를 쓰고, 훅 타입은 command / http / mcp_tool / prompt(LLM으로 프롬프트 평가, $ARGUMENTS) / agent(도구를 가진 에이전틱 검증기) 5종이며, 오케스트레이션·컨텍스트 관리에 직결되는 SubagentStart, SubagentStop, PostToolBatch, PreCompact, PostCompact, TaskCreated, TaskCompleted, InstructionsLoaded, TeammateIdle 이벤트가 존재한다. 다만 (1) agent 훅은 문서에 'experimental and may change'로 명시되고, (2) 차단 가능 이벤트는 plugins-reference 표의 PreToolUse/UserPromptExpansion 둘이 아니라 hooks 문서 기준 약 15종(PostToolBatch, SubagentStop, TaskCreated, TaskCompleted, Stop, TeammateIdle, PreCompact, ConfigChange, WorktreeCreate, PermissionRequest, UserPromptSubmit, Elicitation 등)이며 TDD 게이트에는 TaskCompleted 차단이 더 적합할 수 있고, (3) --dangerously-skip-permissions(bypass) 하에서 PreToolUse 훅이 비동기 실행돼 차단에 실패한다는 버그 보고가 있다.

SOURCES: https://code.claude.com/docs/en/plugins-reference, https://code.claude.com/docs/en/hooks, https://github.com/anthropics/claude-code/issues/20946, https://github.com/anthropics/claude-code/issues/40117, https://github.com/anthropics/claude-code/issues/24327

## [13] conf=low vote=미투표 (검증자의 반대근거 탐색 중 부수 발견 — 독립 검증 필요)

**CLAIM:** 컨텍스트 축소·지침 주입이 항상 이득이라는 가정에는 2026년 반대 방향 근거가 존재한다 — 'Probe-and-Refine Tuning of Repository Guidance for Coding Agents'는 LLM이 생성한 컨텍스트/지침 파일이 SWE-bench Lite resolve rate를 오히려 떨어뜨린다고 보고하며(에이전트가 지시를 문자 그대로 따르다 역효과), 2026년 agentic-search 대 semantic-index 벤치마크들은 검색 채널을 강화하는 방향(CodeGraph류에서 tool call 58-70% 감소)에 유리한 결과를 낸다. 즉 Spine류의 강한 grep/의존성 코드 접근 차단이 실제 SWE 태스크에서 이득인지는 미검증·논쟁 영역이다.

SOURCES: https://arxiv.org/pdf/2606.20512

## [14] conf=medium vote=synthesis (개별 근거는 위 findings, 공백 판정은 본 에이전트)

**CLAIM:** 프레임워크 착수 전 확보해야 할 정보 체크리스트 — P0(첫 설계 결정 전 필수) 6항목은 이번 조사로 상당 부분 확보됐고, P1 6항목(웹 검증층, 멀티에이전트 근거, 컨텍스트 실증, 선행 지형, 운영 실무, 평가 방법)은 거의 전부 공백이다.

SOURCES: https://code.claude.com/docs/en/plugins-reference, https://code.claude.com/docs/en/hooks, https://code.claude.com/docs/en/sub-agents, https://github.com/modu-ai/moai-adk, https://github.com/h102-log/harprame/blob/main/docs/concepts.md, https://arxiv.org/abs/2606.27045, https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html



# REFUTED

- {"claim": "리포 루트 트리는 `.claude/`, `docs/`, `phases/`, `scripts/`, `.gitignore`, `CLAUDE.md` 단 6개 항목으로 구성되며 README도 LICENSE도 package.json도 없다. 따라서 배포 형태는 npm 설치형 CLI(moai-adk 방식)가 아니라 '.claude 디렉터리 템플릿 리포' 갈래에 해당하고, 사용자용 온보딩 문서(README)가 부재해 외부인이 사용법을 파악할 경로가 없다. (GitHub 리포 루트 트리 실측)", "vote": "0-3", "source": "https://github.com/h102-log/harprame"}

- {"claim": "`.claude/` 하위에는 `commands/` 디렉터리와 `settings.json` 파일만 존재하고 `agents/`, `skills/`, `hooks/` 디렉터리는 없다. `.claude/commands/`에 들어 있는 슬래시 명령은 `harness.md`와 `review.md` 두 개뿐이다. 즉 HARPRAME은 Claude Code의 subagent·Skill 메커니즘을 쓰지 않고 슬래시 커맨드 2개 + settings.json 중심으로 구현된 최소 구조이며, 사용자가 구상한 'Sub-agent Team Orchestrator'의 참고 구현은 이 리포에서 확인되지 않는다(미확인 아님, 부재 확인).", "vote": "0-3", "source": "https://github.com/h102-log/harprame"}

- {"claim": "페이즈 분할은 별도 툴이 아니라 파일시스템 구조로 구현되어 있다. `phases/` 디렉터리는 `0-smoke`, `1-fail` 두 하위 폴더와 `index.json` 매니페스트 파일을 담고 있어, 페이즈를 번호-이름 규칙의 디렉터리로 나열하고 JSON 인덱스로 관리하는 패턴을 보여준다. (index.json의 실제 스키마 및 각 페이즈 폴더 내부 구성은 이 조회 범위에서 미확인)", "vote": "0-3", "source": "https://github.com/h102-log/harprame"}

- {"claim": "HARPRAME은 '하네스(harness)'를 확률적 에이전트를 감싸는 결정론적 껍데기로 정의하고, 그 역할을 계획·게이트·판정·복구 네 가지로만 한정한다. 나아가 하네스 내부에 LLM을 넣는 것을 명시적으로 반대한다(그건 하네스가 아니라 에이전트 추가라는 논리) — 즉 프레임워크 설계의 1차 원칙이 '검증 로직의 비-LLM화'다.", "vote": "0-3", "source": "https://github.com/h102-log/harprame/blob/main/docs/concepts.md"}

- {"claim": "HARPRAME은 AC(acceptance criteria)를 실행 전에 '동결'하며, 동결의 구현상 정의를 '실행 에이전트가 AC를 쓰기 불가·읽기만 가능하게 만드는 것'으로 못박는다. 정당화 논리는 TDD의 red 단계와 동일(구현을 본 뒤 쓴 테스트는 구현을 베낀다)이다 — SDD/TDD 강제를 파일 권한 수준의 결정론적 제약으로 환원한 사례.", "vote": "0-3", "source": "https://github.com/h102-log/harprame/blob/main/docs/concepts.md"}

- {"claim": "이 파일에는 TDD(test-first) 강제 장치가 없다. 테스트는 '실행 가능한 Acceptance Criteria 커맨드'(예: `npm run build && npm test`)와 '기존 테스트를 깨뜨리지 마라'는 회귀 금지 규칙 수준으로만 등장하며, 테스트를 먼저 작성하게 만드는 단계나 훅은 문서에 나타나지 않는다(RED→GREEN 강제 미확인).", "vote": "0-3", "source": "https://github.com/h102-log/harprame/blob/main/.claude/commands/harness.md"}



# OPEN QUESTIONS

- 훅 기반 하드 게이트는 자동승인/bypass 모드에서 실제로 신뢰 가능한가? HARPRAME 자신이 --dangerously-skip-permissions로 에이전트를 호출하면서 settings.json PreToolUse 훅으로 위험 명령을 막으려는 구성은 issue #20946(bypass 모드에서 PreToolUse 차단 실패)과 정면 충돌한다. 최소 재현 테스트(bypass 모드에서 훅 exit 2로 파괴적 명령이 실제 차단되는지, TDD 게이트로 TaskCompleted 차단이 PreToolUse보다 적합한지)를 직접 돌려야 설계를 확정할 수 있다.

- AC(테스트) 작성 주체와 코드 작성 주체를 분리하면 실제로 테스트 조작·과적합이 줄어드는가? HARPRAME 원저자가 이를 미해결로 명시했고 후속 문서도 없다. MoAI-ADK의 plan-auditor/sync-auditor 분리가 사실상 해답인지, 아니면 확률적 심판을 도입해 다른 실패 모드를 만드는지에 대한 실증 근거가 없다.

- 웹사이트/웹앱 도메인에서 '결정론적으로 판정 가능한 AC'를 어디까지 만들 수 있는가? 인증·CRUD·폼 검증은 Playwright/vitest exit code로 게이트화가 자연스럽지만, 레이아웃·반응형·접근성·SEO 메타데이터·결제 플로는 어떤 층(시각적 회귀, Lighthouse, axe, Playwright MCP 스크린샷 피드백)까지 Gate로 승격 가능하고 어디부터 Advisory로 내려야 하는지가 미조사다.

- 멀티에이전트 팀 오케스트레이션이 웹 CRUD류 작업에서 '단일 에이전트 + 페이즈 분할 + 세션 리셋'보다 실제로 이득인가? 비용·컨텍스트 격리로 인한 정보 손실·결과 전달 오버헤드를 포함한 비교 근거(Anthropic multi-agent 사례 vs Cognition 반론, MoAI-ADK의 실제 토큰 소비)가 없다. 이 답이 구상 4번의 채택 여부와 배포 형태 선택(플러그인 에이전트 frontmatter 제약을 감수할 가치가 있는가)을 동시에 결정한다.

- MoAI-ADK가 npm(TypeScript)에서 Go 단일 바이너리로 전환한 이유는 무엇이며(설치 신뢰성? 성능? 의존성 제거?), 그 결정이 사용자의 배포 형태 선택에 어떤 교훈을 주는가? 릴리스 노트·이슈·커밋 이력에서 확인 가능하지만 이번 라운드에서는 미확인이다.



# CAVEATS

1) 사용자 전제 2건이 조사로 뒤집혔다 — MoAI-ADK는 npm 배포형이 아니라 Go 단일 바이너리이고(npm 0.2.29/2025-10-12에서 중단), HARPRAME은 '오픈소스 프로젝트'라 부를 만한 커뮤니티 검증도 라이선스도 없는 6일 된 개인 실험 리포다. 특히 HARPRAME은 LICENSE 파일 자체가 없어 기본 배타적 저작권 상태이므로 파일 복사·파생물 배포가 불가하며, 설계 아이디어 참고만 가능하다(사용하려면 저자 문의 필요).

2) HARPRAME 관련 사실은 모두 1차(리포 코드/문서) 근거로 강하지만, '검증된 관행'의 근거로는 쓸 수 없다. phases/ 하위가 0-smoke와 1-fail 둘뿐이고 3자 언급이 0건이다. 또한 리포 내부에 문서 드리프트가 있다(harness.md 전이 표와 execute.py 규칙이 status/error_message 기록 주체에서 충돌, 참조된 docs/weak-ac-flagging.md는 부재).

3) 이번 라운드에서 반증된 주장 6건은 대부분 '사실이 틀렸다'가 아니라 '부재를 과단정했다'는 이유로 떨어졌다. 특히 'HARPRAME은 subagent·Skill을 쓰지 않는다(부재 확인)'는 반증됐다 — harness.md가 탐색 단계에서 내장 Explore 에이전트 병렬 사용을 명시하고 .claude/settings.json에 Stop/PreToolUse 훅이 있다. 정확한 표현은 '커스텀 서브에이전트 정의 파일과 skills 디렉터리가 없다'다. 반증된 주장의 내용을 최종 보고서에서 사실로 되살리지 말 것.

4) 조사 각도 커버리지가 불균등하다. A(벤치마크 해부)와 C(Claude Code 확장 메커니즘 사양)는 1차 출처로 두껍게 확보됐으나, B(선행 프레임워크 지형: BMAD-METHOD/Agent-OS/SuperClaude/Task Master/awesome-claude-code/마켓플레이스 유사 플러그인)는 거의 미조사, D(TDD 강제·멀티에이전트·컨텍스트 실증)는 미심사 프리프린트 1편과 부수 발견 1편뿐, E(웹 도메인 검증층)와 F(운영 실무)는 사실상 공백이다. 최종 설계 문서를 쓰기 전에 별도 조사 라운드가 필요하다.

5) 방법론 근거의 질이 약하다. arXiv:2606.27045(Spec Growth Engine, Spine, Intent/Evidence Graph)는 미심사 단독저자 프리프린트로 경험적 평가가 전무하며 자사 방식을 홍보하는 Related Work를 포함한다. Kiro의 '스펙 폐기' 분류는 Kiro 공식 문서와 상충하므로 사실로 인용하면 안 된다. 반대로 컨텍스트 축소가 성능을 떨어뜨린다는 근거(arXiv 2606.20512)는 3표 검증을 통과한 주장이 아니라 검증자의 부수 발견이므로 원문 재확인 없이 인용하지 말 것.

6) 시간 민감성이 크다. Claude Code 문서는 빌드 단위로 갱신되고(v2.1.140~v2.1.218 동작이 반영됨) agent 훅은 experimental로 명시됐다. MoAI-ADK는 조회 당일에도 push되며 에이전트 개수가 버전마다 11/24/28로 급변한다 — 설계 문서에는 반드시 커밋 SHA와 CLI 버전을 고정해 인용해야 한다. 모든 수치는 2026-07-30 기준이다.

7) '게이트'라는 단어의 강도 차이에 주의. MoAI-ADK의 TRUST 5와 방법론 라우팅은 문서화된 정책 + 에이전트 판단 + 반복 루프이며 하드 차단 훅이 아니라고 문서에 적혀 있다. 반대로 Claude Code 훅 차단은 사양상 가능하지만 bypass 모드 무력화·플래그 회피 버그 보고가 있어 자체 재현 없이 신뢰할 수 없다. '강제'를 주장하려면 어느 층에서 무엇이 실제로 프로세스를 멈추는지 코드로 확인해야 한다.



# SOURCES

- {"url": "https://github.com/h102-log/harprame", "quality": "primary", "angle": "벤치마크 리포 해부 (A)", "claimCount": 5}
- {"url": "https://github.com/h102-log/harprame/blob/main/docs/concepts.md", "quality": "primary", "angle": "벤치마크 리포 해부 (A)", "claimCount": 5}
- {"url": "https://github.com/h102-log/harprame/blob/main/.claude/commands/harness.md", "quality": "primary", "angle": "벤치마크 리포 해부 (A)", "claimCount": 5}
- {"url": "https://github.com/h102-log/harprame/blob/main/scripts/execute.py", "quality": "primary", "angle": "벤치마크 리포 해부 (A)", "claimCount": 5}
- {"url": "https://github.com/modu-ai/moai-adk", "quality": "primary", "angle": "벤치마크 리포 해부 (A)", "claimCount": 5}
- {"url": "https://medium.com/@tim_wang/spec-kit-bmad-and-agent-os-e8536f6bf8a4", "quality": "blog", "angle": "선행 기술 지형·비교 (B)", "claimCount": 5}
- {"url": "https://arceapps.com/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad/", "quality": "blog", "angle": "선행 기술 지형·비교 (B)", "claimCount": 5}
- {"url": "https://nearform.com/insights/lessons-from-real-world-failures-using-spec-driven-development", "quality": "blog", "angle": "선행 기술 지형·비교 (B)", "claimCount": 5}
- {"url": "https://datawhalechina.github.io/easy-vibe/en/stage-3/core-skills/superpowers/", "quality": "secondary", "angle": "선행 기술 지형·비교 (B)", "claimCount": 5}
- {"url": "https://dev.to/willtorber/spec-kit-vs-bmad-vs-openspec-choosing-an-sdd-framework-in-2026-d3j", "quality": "blog", "angle": "선행 기술 지형·비교 (B)", "claimCount": 5}
- {"url": "https://arxiv.org/html/2606.27045", "quality": "primary", "angle": "선행 기술 지형·비교 (B)", "claimCount": 5}
- {"url": "https://code.claude.com/docs/en/plugins-reference", "quality": "primary", "angle": "Claude Code 확장 사양 + 배포/운영 (C+F)", "claimCount": 5}
- {"url": "https://code.claude.com/docs/en/hooks", "quality": "primary", "angle": "Claude Code 확장 사양 + 배포/운영 (C+F)", "claimCount": 5}
- {"url": "https://code.claude.com/docs/en/sub-agents", "quality": "primary", "angle": "Claude Code 확장 사양 + 배포/운영 (C+F)", "claimCount": 5}
- {"url": "https://code.claude.com/docs/en/skills", "quality": "primary", "angle": "Claude Code 확장 사양 + 배포/운영 (C+F)", "claimCount": 5}
- {"url": "https://code.claude.com/docs/en/plugin-marketplaces", "quality": "primary", "angle": "Claude Code 확장 사양 + 배포/운영 (C+F)", "claimCount": 5}
- {"url": "https://arxiv.org/abs/2510.20270", "quality": "primary", "angle": "반증·회의론·실증 근거 (D)", "claimCount": 5}
- {"url": "https://www.anthropic.com/engineering/multi-agent-research-system", "quality": "primary", "angle": "반증·회의론·실증 근거 (D)", "claimCount": 5}
- {"url": "https://cognition.com/blog/dont-build-multi-agents", "quality": "blog", "angle": "반증·회의론·실증 근거 (D)", "claimCount": 5}
- {"url": "https://research.trychroma.com/context-rot", "quality": "primary", "angle": "반증·회의론·실증 근거 (D)", "claimCount": 5}
- {"url": "https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/", "quality": "primary", "angle": "반증·회의론·실증 근거 (D)", "claimCount": 5}
- {"url": "https://arxiv.org/pdf/2606.27045", "quality": "primary", "angle": "반증·회의론·실증 근거 (D)", "claimCount": 5}
- {"url": "https://code.claude.com/docs/en/best-practices", "quality": "primary", "angle": "웹 도메인 템플릿·검증 루프 실무 (E)", "claimCount": 5}
- {"url": "https://playwright.dev/docs/test-agents", "quality": "primary", "angle": "웹 도메인 템플릿·검증 루프 실무 (E)", "claimCount": 5}
- {"url": "https://code.claude.com/docs/en/chrome", "quality": "primary", "angle": "웹 도메인 템플릿·검증 루프 실무 (E)", "claimCount": 5}
- {"url": "https://ui.shadcn.com/docs/changelog/2026-03-cli-va", "quality": "primary", "angle": "웹 도메인 템플릿·검증 루프 실무 (E)", "claimCount": 5}
