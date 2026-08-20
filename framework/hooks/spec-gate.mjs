#!/usr/bin/env node
// spec-gate — SPEC.md 없이 구현에 들어가는 것을 훅에서 «실제로» 막는다.
// 판정 로직은 여기 없다. spec-verify.mjs의 inspect()를 그대로 쓰고, 시점만 가른다.
//   node hooks/spec-gate.mjs pre   < PreToolUse JSON   # 구현 소스를 «새로» 쓰기 직전(Write만)
//   node hooks/spec-gate.mjs stop  < Stop JSON         # 완료를 선언하기 직전
//   node hooks/spec-gate.mjs --selftest
// exit 0 통과 / 2 차단 — 2일 때 stderr가 에이전트에게 되돌아간다.
import { existsSync, readFileSync, writeFileSync, copyFileSync, rmSync, mkdtempSync, appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { inspect } from '../spec-verify.mjs';
import { inspectDelta, mergeDelta } from '../spec-delta.mjs';

// 게이트 대상 = 구현 소스. 문서·설정·SPEC 자신은 SPEC 없이도 쓸 수 있어야 한다
// (여기에 .md를 넣으면 SPEC.md를 쓰려는 첫 Write가 자기 자신에게 막힌다).
const SRC = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|rb|php|swift|kt|c|cc|cpp|h|hpp|cs|vue|svelte)$/i;
// 구현 시작 시점에 참이 될 수 있는 검사만 pre에 건다. C4(문장 지목)·C5(`선택 대기` 재확인)는
// 구현이 끝나야 쓸 수 있는 것이라 pre에 걸면 첫 줄부터 영원히 막힌다.
const PRE = new Set(['C1', 'C2', 'C3']);
// 델타판 — 같은 이유로 D4(대조)·D5(REMOVED 실존)는 stop 몫이다. D3은 전부 경고라 애초에 안 걸린다.
const PRE_D = new Set(['D1', 'D2']);

const read = (p) => inspect(readFileSync(p, 'utf8'), 'SPEC.md');
const list = (vs) => vs.map((x) => `  - [${x.check}] ${x.msg}`).join('\n');

// 판정은 항상 객체다 — { msg: 사람이 읽을 것|null, exit: 0|2, log: 남길 줄|null }.
// «메시지는 내되 exit 0»(병합 실패 재진입)과 «차단이 아닌 로그»(병합 성공)를 문자열로는 못 낸다.
const PASS = { msg: null, exit: 0, log: null };
const blocked = (mode, ev, msg) => ({
  msg, exit: 2,
  // 로그 형식은 그대로 유지한다 — .specgate-log.jsonl은 실사용 관측 자산이다(FIELD-GUIDE §1).
  log: { t: new Date().toISOString(), mode, file: ev.tool_input?.file_path ?? null, first: msg.split('\n')[0] },
});

// Stop에 델타가 살아 있으면 D1~D5 전건을 보고, 통과하면 그 자리에서 병합한다.
// 재진입 가드를 «차단»에만 거는 것이 핵심이다 — «위반 1회 차단 → 대조 채움 → 재정지»가 정상
// 흐름이고, 거기서 통째로 return하면 병합이 영영 안 일어난다.
function stopDelta(ev, spec, delta) {
  const dtext = readFileSync(delta, 'utf8');
  const btext = existsSync(spec) ? readFileSync(spec, 'utf8') : null;
  const r = inspectDelta(dtext, btext, 'SPEC.delta.md');
  if (r.violations.length)
    return ev.stop_hook_active ? PASS : blocked('stop', ev, `완료 전 델타 대조가 끝나지 않았다:\n${list(r.violations)}`);
  try {
    const m = mergeDelta(dtext, btext);
    // 쓰기 성공 뒤 삭제가 실패하면 델타가 남아 다음 Stop이 중복 병합을 시도한다 — 조용히 넘기지
    // 않고 아래 catch가 exit 2로 사람에게 넘긴다(spec-delta.mjs의 merge CLI와 같은 성질).
    writeFileSync(spec, m.text);
    rmSync(delta);
    // 병합 성공은 차단이 아니지만 기록은 남긴다. 경고는 여기에만 싣는다 — stderr로 내면
    // «에이전트에겐 조용히»라는 기본값이 뒤집힌다(계획서 §9 #2).
    return { msg: null, exit: 0, log: {
      t: new Date().toISOString(), mode: 'merge',
      added: r.counts.added, modified: r.counts.modified, removed: r.counts.removed,
      coldstart: r.coldstart, ...(m.warnings.length ? { warnings: m.warnings } : {}),
    } };
  } catch (e) {
    // 초회 exit 2 · 재진입 exit 0. 쓰기 권한 오류·병합 버그처럼 에이전트 행동으로 해소되지 않는
    // 결정론적 실패가 Stop마다 2를 반복하면, 재진입 가드가 막으려던 무한 루프가 병합 경로로
    // 되살아난다. 델타는 지우지 않는다 — 복구 경로가 사람의 수동 `merge`다(조용한 유실 금지).
    return { msg: `병합 실패: ${e.message} — SPEC.delta.md는 남겨뒀다`, exit: ev.stop_hook_active ? 0 : 2, log: null };
  }
}

export function decide(mode, ev) {
  const cwd = ev.cwd ?? process.cwd();
  const spec = join(cwd, 'SPEC.md');
  // 델타가 있으면 델타가 «활성 문서»다 — 본 SPEC의 C 검사를 병행하지 않는다. 콜드스타트 누적
  // SPEC은 점검표가 없어(기계가 판단을 채우지 않는다) C2에 영원히 막히기 때문이다.
  const delta = join(cwd, 'SPEC.delta.md');

  if (mode === 'pre') {
    const f = ev.tool_input?.file_path ?? '';
    if (!SRC.test(f)) return PASS;          // SRC 필터가 델타 검사보다 먼저다(델타 자신을 쓰는 Write)
    if (existsSync(delta)) {
      const btext = existsSync(spec) ? readFileSync(spec, 'utf8') : null;
      const r = inspectDelta(readFileSync(delta, 'utf8'), btext, 'SPEC.delta.md');
      const v = r.violations.filter((x) => PRE_D.has(x.check));
      return v.length ? blocked(mode, ev, `SPEC.delta.md가 아직 구현에 들어갈 상태가 아니다:\n${list(v)}\n막힌 것: ${f}`) : PASS;
    }
    if (!existsSync(spec))
      return blocked(mode, ev, `SPEC.md가 없다. 구현 전에 프로젝트 루트에 SPEC.md를 써라 — 명시된 것(§1) · 침묵 지점 10범주 점검표와 미확정 6열 표(§2).\n기존 코드 수정이면 \`/spec delta\`로 SPEC.delta.md 1장을 대신 써라.\n막힌 것: ${f}`);
    const v = read(spec).violations.filter((x) => PRE.has(x.check));
    return v.length ? blocked(mode, ev, `SPEC.md가 아직 구현에 들어갈 상태가 아니다:\n${list(v)}\n막힌 것: ${f}`) : PASS;
  }

  if (mode === 'stop') {
    if (existsSync(delta)) return stopDelta(ev, spec, delta);
    if (ev.stop_hook_active) return PASS;   // 재진입 — 여기서 또 막으면 무한 루프다
    if (!existsSync(spec)) return PASS;     // SPEC 없이 끝난 세션은 pre가 이미 판단했다
    const v = read(spec).violations;
    return v.length ? blocked(mode, ev, `완료 전 대조(§3)가 끝나지 않았다:\n${list(v)}`) : PASS;
  }
  return PASS;
}

// ── --selftest ─────────────────────────────────────────────────────────────
// 실제 프로세스로 돈다 — stdin 파싱과 exit code까지 덮는다. decide()만 직접 부르면 그 두 줄이
// 깨져도 selftest는 통과하고, 훅은 «파싱 실패 → 빈 이벤트 → 통과»로 조용히 fail-open한다.
// SPEC 재료로 실물 스모크 2장을 읽기만 한다(절대 규칙 6). i1 = 위반 0, sd1 = C5 위반 9건.
const HERE = dirname(fileURLToPath(import.meta.url));

// 델타 케이스의 베이스 — spec-delta.mjs의 MINI와 같은 내용이다. import하지 않는다: 그쪽 selftest
// 재료를 게이트가 잡아 쓰면 한쪽 수정이 양쪽을 흔든다(계획서 §6).
const MINI = `# SPEC — mini

## 1. 명시된 것
- S1. 담기를 누르면 장바구니에 항목이 추가된다. (근거: 사용자, 2026-08-19)
- S2. 수량이 0이면 항목을 제거한다. (근거: 사용자, 2026-08-19)

## 2.3 미확정 항목
| # | 침묵 지점 | 적용한 기본값 | 대안 | 상태 | 번복 조건 |
| --- | --- | --- | --- | --- | --- |
| U1 | 재고 초과 담기 | 허용 | 차단 | 선택 대기 | 재고 사건 1건 |

## 3. 완료 전 대조
| 문장 | 코드 위치 |
| --- | --- |
| S1 | src/cart.ts:10 |
| S2 | src/cart.ts:20 |
`;

// 델타 픽스처 — 전부 인라인. D_FULL을 한 군데씩 고쳐 만든다: «D_FULL과 무엇이 다른가»가 곧
// 그 케이스의 정의다. 치환이 안 먹으면 그 케이스는 조용히 D_FULL이 되고 selftest가 자기를 속인다.
const edit = (s, a, b) => {
  const r = s.replace(a, b);
  if (r === s) throw new Error(`픽스처 치환 실패: ${a}`);
  return r;
};

const D_FULL = `# DELTA — 쿠폰 중복 적용을 막아줘

## ADDED
- S3. 쿠폰이 이미 적용돼 있으면 두 번째 쿠폰을 거부한다. (근거: 사용자, 2026-08-20)

## MODIFIED
- S2. 수량이 0이면 항목과 쿠폰을 함께 제거한다 — 대상 \`src/cart.ts:setQty\` (근거: 사용자, 2026-08-20)

## REMOVED

## 대조
| 문장 | 코드 위치 |
| --- | --- |
| S3 | src/coupon.ts:12 |
| S2 | src/cart.ts:31 |
`;

const D_COLD = `# DELTA — 장바구니를 만들어줘

## ADDED
- S1. 담기를 누르면 장바구니에 항목이 추가된다. (근거: 사용자, 2026-08-20)
- I2. 수량 기본값은 1이다. \`[추론]\`

## MODIFIED

## REMOVED

## 대조
| 문장 | 코드 위치 |
| --- | --- |
| S1 | src/cart.ts:10 |
| I2 | src/cart.ts:4 |
`;

const D_OK     = edit(D_FULL, '| S3 | src/coupon.ts:12 |\n| S2 | src/cart.ts:31 |\n', '');  // 대조 빈 → D4
const D_NOSEC  = edit(D_OK, '## REMOVED\n\n', '');                                          // D1
const D_NOTGT  = edit(D_OK, ' — 대상 \`src/cart.ts:setQty\`', ' — 대상 setQty');            // D2
const D_GHOST  = edit(D_FULL, '## REMOVED\n', '## REMOVED\n- S9. 기각 사유: 이번 범위에서 뺀다.\n');  // D5
const D_BADSEC = edit(D_FULL, '## 대조', '## 검증');   // verify는 통과하고 mergeDelta가 C4 0→1로 막는다

const rd = (d, f) => (existsSync(join(d, f)) ? readFileSync(join(d, f), 'utf8') : null);
// 앵커가 틀려도 위반은 0일 수 있다(검사기는 절을 모른다) — 순서가 그것을 잡는 값싼 방법이다.
const ordered = (s, ...ps) => {
  const at = ps.map((p) => s?.indexOf(p) ?? -1);
  const miss = ps.find((p, i) => at[i] < 0);
  return miss ? `«${miss}» 없음` : at.some((x, i) => i && x < at[i - 1]) ? '순서가 어긋났다' : null;
};
const left = (d) => (rd(d, 'SPEC.delta.md') ? null : '델타가 사라졌다');
const said = (w) => (d, e) => (e.includes(w) ? null : `stderr가 ${w}을 말하지 않았다`);
const intact = (d, e) => (rd(d, 'SPEC.md') !== MINI ? 'SPEC.md가 바뀌었다' : left(d) ?? said('병합 실패')(d, e));

const CASES = [
  //  이름                SPEC 재료      모드    Write 대상     기대exit  재진입  델타      부수 확인
  ['SPEC 없음',         'none',        'pre',  'src/app.ts',  2],
  ['빈 SPEC',           'empty',       'pre',  'src/app.ts',  2],
  ['빈 SPEC + 문서',    'empty',       'pre',  'README.md',   0],
  ['빈 SPEC + 툴무관',  'empty',       'pre',  null,          0],
  ['정상 SPEC',         'i1-cart-r1',  'pre',  'src/app.ts',  0],
  ['C5 미달 SPEC',      'sd1-cart-r1', 'pre',  'src/app.ts',  0],
  ['SPEC 없이 완료',    'none',        'stop', null,          0],
  ['C5 미달 완료',      'sd1-cart-r1', 'stop', null,          2],
  ['정상 완료',         'i1-cart-r1',  'stop', null,          0],
  ['재진입 가드',       'sd1-cart-r1', 'stop', null,          0, true],

  // ── 델타 분기(G11~G23) ──
  ['델타 분기 통과',    'none',  'pre',  'src/app.ts', 0, false, D_OK],
  ['델타 D1 위반',      'none',  'pre',  'src/app.ts', 2, false, D_NOSEC,  said('D1')],
  ['델타 D2 위반',      'none',  'pre',  'src/app.ts', 2, false, D_NOTGT,  said('D2')],
  ['활성 문서 우선',    'empty', 'pre',  'src/app.ts', 0, false, D_OK],      // 빈 SPEC의 C 위반이 안 잡힌다
  ['델타 + 문서 Write', 'none',  'pre',  'README.md',  0, false, D_OK],      // SRC 필터가 먼저다
  ['대조 미기입 완료',  'mini',  'stop', null,         2, false, D_OK,     (d, e) => said('D4')(d, e) ?? left(d)],
  ['전건 통과 완료',    'mini',  'stop', null,         0, false, D_FULL,   (d) => {
    const s = rd(d, 'SPEC.md');
    if (rd(d, 'SPEC.delta.md')) return '델타가 남아 있다';
    if (!s.includes('항목과 쿠폰을 함께 제거한다')) return 'MODIFIED가 반영되지 않았다';
    if (s.includes('S2. 수량이 0이면 항목을 제거한다.')) return '옛 문장이 남아 있다';
    return ordered(s, 'S2. 수량이', 'S3. 쿠폰이', '| S3 | src/coupon.ts:12 |');
  }],
  ['콜드스타트 완료',   'none',  'stop', null,         0, false, D_COLD,   (d) => {
    const s = rd(d, 'SPEC.md');
    if (!s) return 'SPEC.md가 생기지 않았다';
    if (/Clear|Partial|Missing/.test(s)) return '점검표를 만들었다 — 판단은 기계 몫이 아니다';
    return ordered(s, 'S1. 담기를', 'I2. 수량 기본값', '| S1 | src/cart.ts:10 |');
  }],
  ['D5 위반 완료',      'mini',  'stop', null,         2, false, D_GHOST,  (d, e) => said('D5')(d, e) ?? left(d)],
  ['재진입 + 위반',     'mini',  'stop', null,         0, true,  D_OK,     (d) => (rd(d, 'SPEC.md') !== MINI ? '병합됐다' : left(d))],
  ['재진입 + 정상',     'mini',  'stop', null,         0, true,  D_FULL,   (d) => (rd(d, 'SPEC.delta.md') ? '병합되지 않았다 — 가드는 차단 전용이다'
    : rd(d, 'SPEC.md').includes('항목과 쿠폰을 함께 제거한다') ? null : 'MODIFIED가 반영되지 않았다')],
  ['병합 실패 초회',    'mini',  'stop', null,         2, false, D_BADSEC, intact],
  ['병합 실패 재진입',  'mini',  'stop', null,         0, true,  D_BADSEC, intact],
];

function selftest() {
  const proj = mkdtempSync(join(tmpdir(), 'spec-gate-'));
  const spec = join(proj, 'SPEC.md');
  const self = fileURLToPath(import.meta.url);
  let bad = 0;
  try {
    for (const [name, src, mode, file, want, reentry, delta, check] of CASES) {
      for (const f of ['SPEC.md', 'SPEC.delta.md']) rmSync(join(proj, f), { force: true });
      if (src === 'empty') writeFileSync(spec, '# SPEC\n\n대충 만든다.\n');
      else if (src === 'mini') writeFileSync(spec, MINI);
      else if (src !== 'none') copyFileSync(join(HERE, '..', 'smoke', src, 'SPEC.md'), spec);
      if (delta) writeFileSync(join(proj, 'SPEC.delta.md'), delta);

      const ev = { cwd: proj, hook_event_name: mode === 'pre' ? 'PreToolUse' : 'Stop' };
      if (file) { ev.tool_name = 'Write'; ev.tool_input = { file_path: join(proj, file) }; }
      if (reentry) ev.stop_hook_active = true;

      // spawnSync — execFileSync는 exit 0이면 던지지 않아 stderr를 못 준다. «exit 0 + 경고»가
      // 병합 실패 재진입의 정의라 그 층을 못 보면 케이스가 통째로 빈손이 된다.
      const r = spawnSync(process.execPath, [self, mode], { input: JSON.stringify(ev), encoding: 'utf8' });
      const err = (r.stderr ?? '').trim();
      const why = r.status !== want
        ? `exit=${r.status} (기대 ${want}) ${err.split('\n')[0].slice(0, 44)}`
        : check?.(proj, err) ?? null;

      if (why) bad++;
      console.log(`${why ? 'FAIL' : 'ok  '} ${mode.padEnd(4)} ${name.padEnd(16)} ${why ?? `exit=${r.status}`}`);
    }
  } finally { rmSync(proj, { recursive: true, force: true }); }
  console.log(bad ? `selftest 실패 — ${bad}건 어긋남` : `selftest 통과 — ${CASES.length}건 전건 일치`);
  process.exit(bad ? 1 : 0);
}

// ── CLI ────────────────────────────────────────────────────────────────────
const mode = process.argv[2];
if (mode === '--selftest') selftest();
else {
  let ev = {};
  try { ev = JSON.parse(readFileSync(0, 'utf8')); } catch { /* stdin 없음 = 빈 이벤트 = 통과 */ }
  const d = decide(mode, ev);
  // 실사용 관측 — 차단을 사람이 받아적지 않는다(FIELD-GUIDE §1). 로그가 터져도 판정은 그대로 간다.
  if (d.log) {
    try {
      appendFileSync(join(ev.cwd ?? process.cwd(), '.specgate-log.jsonl'), JSON.stringify(d.log) + '\n');
    } catch { /* 관측이 게이트를 망가뜨리면 안 된다 */ }
  }
  if (d.msg) console.error(d.msg);
  process.exit(d.exit);
}
