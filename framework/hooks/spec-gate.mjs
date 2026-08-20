#!/usr/bin/env node
// spec-gate — SPEC.md 없이 구현에 들어가는 것을 훅에서 «실제로» 막는다.
// 판정 로직은 여기 없다. spec-verify.mjs의 inspect()를 그대로 쓰고, 시점만 가른다.
//   node hooks/spec-gate.mjs pre   < PreToolUse JSON   # 구현 소스를 «새로» 쓰기 직전(Write만)
//   node hooks/spec-gate.mjs stop  < Stop JSON         # 완료를 선언하기 직전
//   node hooks/spec-gate.mjs --selftest
// exit 0 통과 / 2 차단 — 2일 때 stderr가 에이전트에게 되돌아간다.
import { existsSync, readFileSync, writeFileSync, copyFileSync, rmSync, mkdtempSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { inspect } from '../spec-verify.mjs';

// 게이트 대상 = 구현 소스. 문서·설정·SPEC 자신은 SPEC 없이도 쓸 수 있어야 한다
// (여기에 .md를 넣으면 SPEC.md를 쓰려는 첫 Write가 자기 자신에게 막힌다).
const SRC = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|rb|php|swift|kt|c|cc|cpp|h|hpp|cs|vue|svelte)$/i;
// 구현 시작 시점에 참이 될 수 있는 검사만 pre에 건다. C4(문장 지목)·C5(`선택 대기` 재확인)는
// 구현이 끝나야 쓸 수 있는 것이라 pre에 걸면 첫 줄부터 영원히 막힌다.
const PRE = new Set(['C1', 'C2', 'C3']);

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

export function decide(mode, ev) {
  const spec = join(ev.cwd ?? process.cwd(), 'SPEC.md');

  if (mode === 'pre') {
    const f = ev.tool_input?.file_path ?? '';
    if (!SRC.test(f)) return PASS;
    if (!existsSync(spec))
      return blocked(mode, ev, `SPEC.md가 없다. 구현 전에 프로젝트 루트에 SPEC.md를 써라 — 명시된 것(§1) · 침묵 지점 10범주 점검표와 미확정 6열 표(§2).\n막힌 것: ${f}`);
    const v = read(spec).violations.filter((x) => PRE.has(x.check));
    return v.length ? blocked(mode, ev, `SPEC.md가 아직 구현에 들어갈 상태가 아니다:\n${list(v)}\n막힌 것: ${f}`) : PASS;
  }

  if (mode === 'stop') {
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
const CASES = [
  //  이름                SPEC 재료      모드    Write 대상     기대exit  재진입
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
];

function selftest() {
  const proj = mkdtempSync(join(tmpdir(), 'spec-gate-'));
  const spec = join(proj, 'SPEC.md');
  const self = fileURLToPath(import.meta.url);
  let bad = 0;
  try {
    for (const [name, src, mode, file, want, reentry] of CASES) {
      if (existsSync(spec)) rmSync(spec);
      if (src === 'empty') writeFileSync(spec, '# SPEC\n\n대충 만든다.\n');
      else if (src !== 'none') copyFileSync(join(HERE, '..', 'smoke', src, 'SPEC.md'), spec);

      const ev = { cwd: proj, hook_event_name: mode === 'pre' ? 'PreToolUse' : 'Stop' };
      if (file) { ev.tool_name = 'Write'; ev.tool_input = { file_path: join(proj, file) }; }
      if (reentry) ev.stop_hook_active = true;

      let code = 0, msg = '';
      try {
        execFileSync(process.execPath, [self, mode], { input: JSON.stringify(ev), encoding: 'utf8' });
      } catch (e) { code = e.status; msg = (e.stderr ?? '').trim().split('\n')[0]; }

      const ok = code === want;
      if (!ok) bad++;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${mode.padEnd(4)} ${name.padEnd(15)} exit=${code} (기대 ${want})  ${msg.slice(0, 44)}`);
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
