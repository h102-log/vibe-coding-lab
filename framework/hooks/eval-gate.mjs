#!/usr/bin/env node
// eval-gate — EVAL.md 승인·red-check 없이 구현에 들어가거나, final 스냅샷·신선도 확인 없이
// 완료를 선언하는 것을 훅에서 «실제로» 막는다. 판정 로직은 여기 없다 — eval-verify.mjs의
// inspectEval()을 그대로 쓰고 시점만 가른다(spec-gate.mjs와 같은 성질).
//   node hooks/eval-gate.mjs pre   < PreToolUse JSON   # 구현 SRC를 쓰기 직전(Write·Edit·MultiEdit)
//   node hooks/eval-gate.mjs stop  < Stop JSON         # 완료를 선언하기 직전
//   node hooks/eval-gate.mjs --selftest
// exit 0 통과 / 2 차단 — 2일 때 stderr가 에이전트에게 되돌아간다.
// ⚠ 차단력 조건(r52 실측): PreToolUse·Stop 타임아웃은 둘 다 fail-open이다. 이 파일의 훅 경로
//   작업은 파일 읽기·정규식·해시 대조만이어야 한다(ms) — 러너·네트워크·설치가 들어오는 순간
//   차단력이 조용히 사라진다. 러너는 eval-run.mjs 몫이고 여기는 그 스냅샷을 읽기만 한다.
// hooks.json의 spec-gate-먼저 순서는 «stderr 도착 순서 보장»이 아니라 항목 순서 규약이다
//   (r52 P-2 — 순서 무관 차단만 실측됐다, 각 n=1·보장 아님).
import {
  existsSync, readFileSync, writeFileSync, copyFileSync, rmSync, mkdtempSync, mkdirSync, appendFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { inspectEval, loadEval, hash8, canonical } from '../eval-verify.mjs';
import { RULES, ruleOf, UNASSIGNED, line1 } from '../specgate.mjs';

// 사본: spec-gate.mjs:19 — 그쪽이 바뀌면 여기도 (export하지 않고, export 추가는 수정이라 금지.
// 두 게이트의 대상 일치가 기본값이다 — planeddmain §7 #7).
const SRC = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|rb|php|swift|kt|c|cc|cpp|h|hpp|cs|vue|svelte)$/i;
// 평가 테스트 자신 — SRC보다 먼저 갈라낸다. 순서가 바뀌면 평가 테스트 작성이 자기 락에 막힌다.
const TESTS_EVAL = /tests[\\/]eval[\\/]/;

// 사본: eval-verify.mjs:307-315의 규약 — 그쪽이 바뀌면 여기도. loadEval을 못 쓰는 이유는
// 동결 분기가 EVAL.md 없이도(락만으로) 성립해서다 — loadEval은 EVAL.md 부재가 fatal이다.
// 깨진 설정·부재는 기본값 reason — 설정이 판정을 뒤집지 않는다.
const freezeOf = (dir) => {
  try {
    const v = JSON.parse(readFileSync(join(dir, '.specgate.json'), 'utf8')).evalFreeze;
    return ['warn', 'reason', 'block'].includes(v) ? v : 'reason';
  } catch { return 'reason'; }
};

// 룰 ID + 정적 힌트로 낸다 — 사람 터미널·훅 stderr·CI가 같은 한 줄 포맷을 공유한다(KF4).
// 훅이 내는 finding은 전부 violations라 심각도는 항상 Error다.
const list = (vs) => vs.map((x) => {
  const r = ruleOf(x);
  return `  - ${line1({ ruleId: r?.id ?? UNASSIGNED, severity: 'Error', msg: x.msg })}`
    + (r ? `\n    ↳ ${r.hint}` : '');
}).join('\n');
const rulesOf = (vs) => [...new Set(vs.map((x) => ruleOf(x)?.id ?? UNASSIGNED))];

// 판정은 항상 객체다 — { msg: 사람이 읽을 것|null, exit: 0|2, log: 남길 줄|null }.
// 같은 .specgate-log.jsonl을 쓴다(additive) — spec-gate 줄과는 mode('eval-pre'/'eval-stop')로 갈라 읽는다.
const PASS = { msg: null, exit: 0, log: null };
const blocked = (mode, ev, msg, vs = []) => ({
  msg, exit: 2,
  log: {
    t: new Date().toISOString(), mode, file: ev.tool_input?.file_path ?? null,
    first: msg.split('\n')[0], rules: rulesOf(vs),
  },
});

export function decide(mode, ev) {
  const cwd = ev.cwd ?? process.cwd();
  const evalMd = join(cwd, 'EVAL.md');
  const lock = join(cwd, '.specgate-eval.lock');

  if (mode === 'pre') {
    const f = ev.tool_input?.file_path ?? '';
    if (!SRC.test(f)) return PASS;          // 문서·설정·EVAL.md·스냅샷 .json은 여기서 빠진다
    if (TESTS_EVAL.test(f)) {
      if (!existsSync(lock)) return PASS;   // 승인 전 작성 단계 — 동결의 실체는 락이다
      const fz = freezeOf(cwd);
      if (fz === 'block')
        return blocked('eval-pre', ev, `${line1({ ruleId: RULES['E7.frozen'].id, severity: 'Error', msg: '동결된 평가다 — `## 개정`으로도 못 푼다(evalFreeze=block)' })}\n막힌 것: ${f}`, [{ kind: 'E7.frozen' }]);
      // warn·reason은 통과 + 로그만 — 경고를 stderr로 내면 «에이전트에겐 조용히» 기본값이 뒤집힌다.
      // «개정 행 없음»은 pre 시점엔 판정 불가(수정이 아직 안 일어났다) — 판정은 stop의 E7이 한다.
      return { msg: null, exit: 0, log: { t: new Date().toISOString(), mode: 'eval-pre', file: f, first: `freeze-${fz}: ${f}` } };
    }
    if (!existsSync(evalMd)) return PASS;   // 축 꺼짐 — 산출물 존재로만 연결(r16 조합 원칙)
    const io = loadEval(evalMd, 'pre');
    if (io.fatal) return PASS;              // existsSync 후 레이스 — 계측 문제는 차단이 아니다
    const r = inspectEval(io.evalText, io.options);
    // 락 존재(E7.noLock)·red 스냅샷 존재·runOk(snapshot.*)·E1~E5 — 전부 pre phase가 이미 낸다.
    // final 뒤 SRC 재수정이 안 막히는 것은 redAt 예외가 inspectEval 안에 있어서다(planedd4 §3-3).
    return r.violations.length
      ? blocked('eval-pre', ev, `EVAL.md가 아직 구현에 들어갈 상태가 아니다:\n${list(r.violations)}\n막힌 것: ${f}`, r.violations)
      : PASS;
  }

  if (mode === 'stop') {
    if (ev.stop_hook_active) return PASS;   // 재진입 — eval-gate는 stop에 쓰기 동작이 없어 최상단 가드로 충분하다
    if (!existsSync(evalMd)) {
      if (!existsSync(lock)) return PASS;   // 축을 안 쓴 세션
      // EVAL.md 삭제로 stop 게이트 전체를 우회하는 구멍 — 게이트 고유 검사는 이것 하나뿐이다.
      return blocked('eval-stop', ev, line1({ ruleId: RULES['E7.frozen'].id, severity: 'Error', msg: 'EVAL.md가 동결 후 사라졌다 — 되살리거나 락을 지운 사유를 남겨라' }), [{ kind: 'E7.frozen' }]);
    }
    const io = loadEval(evalMd, 'stop');
    if (io.fatal) return PASS;
    // 신선도(implHash) 재해시·tests/eval 글롭·락 파싱은 전부 loadEval이 한다 — fs 로직을 중복 구현하지 않는다.
    const r = inspectEval(io.evalText, io.options);
    return r.violations.length
      ? blocked('eval-stop', ev, `완료 전 평가 대조가 끝나지 않았다:\n${list(r.violations)}`, r.violations)
      : PASS;
  }
  return PASS;
}

// ── --selftest ─────────────────────────────────────────────────────────────
// 실제 프로세스로 돈다 — stdin 파싱과 exit code까지 덮는다(spec-gate:240-271 형식).
// SPEC은 인라인 MINI_EDD — spec-gate의 MINI를 import하지 않는다: 그쪽 재료를 잡아 쓰면 한쪽
// 수정이 양쪽을 흔든다(spec-gate.mjs:120-121 동일 근거). G1만 실물 스모크 SPEC을 복사해 읽는다.
const HERE = dirname(fileURLToPath(import.meta.url));

const MINI_EDD = `# SPEC — mini-edd

## 1. 명시된 것
- S1. 담기를 누르면 장바구니에 항목이 추가된다. (근거: 사용자, 2026-08-24)
### 2.2 추론으로 확정한 문장
- I2. 수량 기본값은 1이다. [추론]
### 2.3 미확정 항목
| # | 침묵 지점 | 적용한 기본값 | 대안 | 상태 | 번복 조건 |
| --- | --- | --- | --- | --- | --- |
| U1 | 재고 초과 담기 | 허용 | 차단 | 선택 대기 | 재고 사건 1건 |
## 3. 완료 전 대조
| 문장 | 코드 위치 |
| --- | --- |
| S1 | src/cart.ts:10 |
| I2 | src/cart.ts:4 |
- U1. 재고 초과 담기 — 기본값 «허용»으로 진행 중. 확정 필요.
`;
// 근거 해시는 실계산 — 골든 고정은 eval-verify H-0 몫이라 여기서 중복하지 않는다.
const S1H = hash8(canonical(MINI_EDD.split('\n').find((l) => l.startsWith('- S1.'))));

const row = (id, basis, hash, method = '담기 클릭 1회 → 항목 1건 추가를 단언한다', test = 'tests/eval/cart.test.ts', appr = '사용자, 2026-08-24') =>
  `| ${id} | ${basis} | ${hash} | ${method} | ${test} | ${appr} |`;
const doc = ({ rows, rejectedRows = [], revisedRows = [] }) => `# EVAL — cart

- SPEC: ./SPEC.md
- 러너: vitest

## 1. 평가 항목

| ID | 근거 | 근거 해시 | 무엇을 어떻게 재나 | 테스트 | 승인 |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## 기각

| EV# | 사유 |
| --- | --- |
${rejectedRows.join('\n')}

## 개정

| EV# | 새 해시 | 사유 | 날짜 |
| --- | --- | --- | --- |
${revisedRows.join('\n')}
`;
const EVAL_OK = doc({ rows: [row('EV1', 'S1', S1H)] });
const TEST_TS = `// EV1: 담기 클릭 1회 → 항목 1건 추가\nexport {};\n`;
const IMPL_V1 = `export const add = (items, item) => [...items, item];\n`;
const REJ = '| EV1 | jsdom 레이아웃 제약 — 렌더 단언으로 대체 불가 |';

// 임시 프로젝트 조립 — 해시 연쇄가 핵심이다: 파일 내용 → EVAL 텍스트 → 락(evalMd·tests 해시)
// → 스냅샷(evalLockHash = 락 «원문»의 hash8). 정상 스냅샷 계약은 eval-run의 출력 그대로.
// lock: true = 현 evalText 승인 / 문자열 = 그 텍스트 승인(동결 후 수정 케이스용).
function mkproj({ spec = MINI_EDD, evalText = null, lock = false, snap = null, config = null, impl = IMPL_V1 } = {}) {
  const proj = mkdtempSync(join(tmpdir(), 'eval-gate-'));
  mkdirSync(join(proj, 'src'), { recursive: true });
  mkdirSync(join(proj, 'tests', 'eval'), { recursive: true });
  if (spec) writeFileSync(join(proj, 'SPEC.md'), spec);
  writeFileSync(join(proj, 'src', 'cart.ts'), impl);
  writeFileSync(join(proj, 'tests', 'eval', 'cart.test.ts'), TEST_TS);
  if (evalText) writeFileSync(join(proj, 'EVAL.md'), evalText);
  let lockRaw = null;
  if (lock) {
    lockRaw = JSON.stringify({
      approvedAt: '2026-08-24T00:00:00Z', evalMd: hash8(typeof lock === 'string' ? lock : evalText ?? ''),
      tests: { 'tests/eval/cart.test.ts': hash8(TEST_TS) }, sentences: {},
    }, null, 2);
    writeFileSync(join(proj, '.specgate-eval.lock'), lockRaw);
  }
  if (snap) {
    const s = {
      phase: 'red', at: '2026-08-24T00:00:00Z', runOk: true, runner: 'vitest',
      items: [{ id: 'EV1', status: 'red' }], evalLockHash: lockRaw ? hash8(lockRaw) : null, implHash: {}, ...snap,
    };
    if (s.phase === 'final' && !('implHash' in snap)) s.implHash = { 'src/cart.ts': hash8(impl) };
    writeFileSync(join(proj, '.specgate-eval.json'), JSON.stringify(s, null, 2));
  }
  if (config) writeFileSync(join(proj, '.specgate.json'), JSON.stringify(config));
  return proj;
}

const FINAL = { phase: 'final', items: [{ id: 'EV1', status: 'green' }] };
const said = (w) => (p, e) => (e.includes(w) ? null : `stderr가 ${w}을 말하지 않았다`);
const logHas = (w) => (p) => {
  const t = existsSync(join(p, '.specgate-log.jsonl')) ? readFileSync(join(p, '.specgate-log.jsonl'), 'utf8') : '';
  return t.includes(w) ? null : `로그에 ${w} 줄이 없다`;
};

function selftest() {
  const self = fileURLToPath(import.meta.url);
  const run = (proj, mode, file, o = {}) => {
    const ev = { cwd: proj, hook_event_name: mode === 'pre' ? 'PreToolUse' : 'Stop' };
    if (file) { ev.tool_name = 'Write'; ev.tool_input = { file_path: join(proj, file) }; }
    if (o.reentry) ev.stop_hook_active = true;
    return spawnSync(process.execPath, [self, mode], { input: o.raw !== undefined ? o.raw : JSON.stringify(ev), encoding: 'utf8' });
  };
  // G18·G19 재료 — 동결(EVAL_OK 승인) 후 «무엇을 어떻게 재나» 셀만 고친 EVAL. 개정 행의 새 해시는
  // 현재 문장 해시 실계산이어야 한다(eval-verify N-4 선례 — 아니면 E5.outdated가 덤으로 터진다).
  const MOD = (rev) => doc({ rows: [row('EV1', 'S1', S1H, '담기 2회 → 항목 2건 추가를 단언한다')], revisedRows: rev ? [`| EV1 | ${S1H} | 방법 문구 수정 | 2026-08-24 |`] : [] });

  const CASES = [
    // 이름                모드    Write 대상                  기대  mkproj                                                             부수 확인
    ['EVAL 없음(실물 SPEC)', 'pre', 'src/app.ts', 0, () => { const p = mkproj({ spec: null }); copyFileSync(join(HERE, '..', 'smoke', 'i1-cart-r1', 'SPEC.md'), join(p, 'SPEC.md')); return p; }],
    ['툴 무관',           'pre',  null,                       0, () => mkproj()],
    ['비SRC',             'pre',  'README.md',                0, () => mkproj({ evalText: EVAL_OK, lock: true, snap: {} }),
      (p) => { const r = run(p, 'pre', '.specgate-eval.json'); return r.status === 0 ? null : `.specgate-eval.json Write가 exit ${r.status}`; }],
    ['락 없이 구현 Write', 'pre',  'src/cart.ts',              2, () => mkproj({ evalText: EVAL_OK }),
      (p, e) => said('SG1047')(p, e) ?? (() => {
        const last = JSON.parse(readFileSync(join(p, '.specgate-log.jsonl'), 'utf8').trim().split('\n').pop());
        return last.rules.includes('SG1047') ? null : `로그 rules에 SG1047 없음: ${last.rules}`;
      })()],
    ['red 스냅샷 없음',   'pre',  'src/cart.ts',              2, () => mkproj({ evalText: EVAL_OK, lock: true }), said('SG1048')],
    ['runOk false',       'pre',  'src/cart.ts',              2, () => mkproj({ evalText: EVAL_OK, lock: true, snap: { runOk: false } }),
      (p, e) => said('SG1048')(p, e) ?? said('통과가 아니다')(p, e)],
    ['정상 pre(green 무해)', 'pre', 'src/cart.ts',             0, () => mkproj({ evalText: EVAL_OK, lock: true, snap: { items: [{ id: 'EV1', status: 'green' }] } })],
    ['E4 U 지목',         'pre',  'src/cart.ts',              2, () => { const t = doc({ rows: [row('EV1', 'U1', '')] }); return mkproj({ evalText: t, lock: t, snap: {} }); }, said('SG1044')],
    ['tests/eval 작성 단계', 'pre', 'tests/eval/cart.test.ts', 0, () => mkproj({ evalText: EVAL_OK })],
    ['freeze=warn',       'pre',  'tests/eval/cart.test.ts',  0, () => mkproj({ evalText: EVAL_OK, lock: true, config: { evalFreeze: 'warn' } }), logHas('freeze-warn:')],
    ['freeze=reason(기본)', 'pre', 'tests/eval/cart.test.ts', 0, () => mkproj({ evalText: EVAL_OK, lock: true }), logHas('freeze-reason:')],
    ['freeze=block',      'pre',  'tests/eval/cart.test.ts',  2, () => mkproj({ evalText: EVAL_OK, lock: true, config: { evalFreeze: 'block' } }),
      (p, e) => said('SG1047')(p, e) ?? said('block')(p, e)],
    ['stop EVAL·락 없음', 'stop', null,                       0, () => mkproj()],
    ['final 스냅샷 없음', 'stop', null,                       2, () => mkproj({ evalText: EVAL_OK, lock: true }),
      (p, e) => said('SG1048')(p, e) ?? said('eval-run')(p, e)],
    ['stale',             'stop', null,                       2, () => { const p = mkproj({ evalText: EVAL_OK, lock: true, snap: FINAL }); writeFileSync(join(p, 'src', 'cart.ts'), '// 스냅샷 뒤 수정\n'); return p; },
      (p, e) => said('SG1049')(p, e) ?? said('다시 돌려라')(p, e)],
    ['E6 red 잔존',       'stop', null,                       2, () => mkproj({ evalText: EVAL_OK, lock: true, snap: { ...FINAL, items: [{ id: 'EV1', status: 'red' }] } }), said('SG1046')],
    ['기각으로 통과',     'stop', null,                       0, () => { const t = doc({ rows: [row('EV1', 'S1', S1H)], rejectedRows: [REJ] }); return mkproj({ evalText: t, lock: t, snap: { ...FINAL, items: [{ id: 'EV1', status: 'red' }] } }); }],
    ['E7 개정으로 통과',  'stop', null,                       0, () => mkproj({ evalText: MOD(true), lock: EVAL_OK, snap: FINAL })],
    ['E7 개정 없이 수정', 'stop', null,                       2, () => mkproj({ evalText: MOD(false), lock: EVAL_OK, snap: FINAL }), said('SG1047')],
    ['재진입 가드',       'stop', null,                       0, () => mkproj({ evalText: EVAL_OK, lock: true, snap: { ...FINAL, items: [{ id: 'EV1', status: 'red' }] } }), null, { reentry: true }],
    ['EVAL 소멸 우회',    'stop', null,                       2, () => { const p = mkproj({ evalText: EVAL_OK, lock: true, snap: FINAL }); rmSync(join(p, 'EVAL.md')); return p; }, said('SG1047')],
    ['stdin 파싱 실패',   'pre',  null,                       0, () => mkproj(), null, { raw: '' }],
  ];

  let bad = 0;
  for (const [name, mode, file, want, mk, check, o = {}] of CASES) {
    const proj = mk();
    try {
      const r = run(proj, mode, file, o);
      const err = (r.stderr ?? '').trim();
      const why = r.status !== want
        ? `exit=${r.status} (기대 ${want}) ${err.split('\n')[0].slice(0, 44)}`
        : check?.(proj, err) ?? null;
      if (why) bad++;
      console.log(`${why ? 'FAIL' : 'ok  '} ${mode.padEnd(4)} ${name.padEnd(16)} ${why ?? `exit=${r.status}`}`);
    } finally { rmSync(proj, { recursive: true, force: true }); }
  }
  console.log(bad ? `selftest 실패 — ${bad}건 어긋남` : `selftest 통과 — ${CASES.length}건 전건 일치`);
  process.exit(bad ? 1 : 0);
}

// ── CLI ────────────────────────────────────────────────────────────────────
const mode = process.argv[2];
if (mode === '--selftest') selftest();
else {
  let ev = {};
  try { ev = JSON.parse(readFileSync(0, 'utf8')); } catch { /* stdin 없음 = 빈 이벤트 = 통과 — 파싱 실패는 에이전트 잘못이 아니라 계측 문제고, 여기서 막으면 훅 버그 하나가 세션 전체를 잠근다 */ }
  const d = decide(mode, ev);
  if (d.log) {
    try {
      appendFileSync(join(ev.cwd ?? process.cwd(), '.specgate-log.jsonl'), JSON.stringify(d.log) + '\n');
    } catch { /* 관측이 게이트를 망가뜨리면 안 된다 */ }
  }
  if (d.msg) console.error(d.msg);
  process.exit(d.exit);
}
