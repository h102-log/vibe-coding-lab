#!/usr/bin/env node
// spec-anchor — SPEC §3의 «지목»이 실제로 존재하는지 확인하고(record), 그 뒤 코드가 앵커 시점에서
// 갈라졌는지 본다(drift). 정적·결정론이고 **어떤 훅에도 걸지 않는다**(명시 실행 전용 — Stop에 걸면
// FIELD-GUIDE 예언 P2 «제일 먼저 끄고 싶어질 것»을 재생산한다).
//   node framework/spec-anchor.mjs record <SPEC.md 경로> [--json]
//   node framework/spec-anchor.mjs drift  <SPEC.md 경로> [--json]
//   node framework/spec-anchor.mjs --selftest
// exit 0 이상없음 / 1 위반(A1·A2)·드리프트 / 2 파일없음·JSON손상·사용법오류 — 1과 2를 반드시 가른다.
//
// 확인하는 것은 «그 위치에 그 텍스트가 있(었)다»까지다. 그 코드가 문장을 참으로 만드는지는
// 검사하지 않는다 — 임의 코드와 산문 스펙의 의미 일치를 결정론으로 검증한 선례가 없다(조사 Q2).
// **drift exit 0은 «문장이 아직 참»이 아니라 «앵커 스팬이 그대로»라는 뜻이다.** 스팬 밖 변경
// (호출부·의존 모듈·설정)으로 문장이 거짓이 돼도 이 도구는 침묵한다.
// 지목 파싱은 spec-verify.mjs의 `c4.positions`를 그대로 쓴다 — 재구현하면 두 판정이 갈라진다.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { inspect } from './spec-verify.mjs';
import { inspectDelta } from './spec-delta.mjs';

const ANCHORS = 'SPEC.anchors.json';
const DELTA = 'SPEC.delta.md';
const die = (msg) => { console.error(msg); process.exit(2); };
const slash = (p) => p.split('\\').join('/');
const rng = (a, b) => (a === b ? `${a}` : `${a}-${b}`);

// 개행 정규화 후 해시 — judge.mjs의 `frozen`과 같은 계열이고 이유도 같다. Windows/Unix 개행 차이
// (autocrlf 변환)만으로 stale이 나는 위양성을 원천 차단한다. 바이트 해시(Get-FileHash)와 값이
// 다른 것이 정상이고 대조는 이 도구끼리 한다. 개행 밖의 정규화(끝 공백 제거 등)는 하지 않는다 —
// 규칙이 늘수록 «무엇이 변경인가»가 흐려진다. 포매터 위양성은 감수하는 한계다.
function lines(file) {
  const ls = readFileSync(file, 'utf8').replace(/\r\n?/g, '\n').split('\n');
  if (ls.length > 1 && ls[ls.length - 1] === '') ls.pop();  // 끝 개행이 만드는 빈 줄은 «줄 수»가 아니다
  return ls;
}
const hashSpan = (ls, start, end) => createHash('sha256').update(ls.slice(start - 1, end).join('\n')).digest('hex');

function readSpec(specPath) {
  let text;
  try { text = readFileSync(specPath, 'utf8'); }
  catch (e) { die(e.code === 'ENOENT' ? `SPEC이 없다: ${slash(specPath)}` : `SPEC을 읽을 수 없다: ${e.message}`); }
  // 원문을 얹어 둔다 — drift가 inspectDelta에 본 SPEC 텍스트를 넘겨야 한다. record·drift의 반환은
  // 둘 다 명시 필드만 만들므로 `--json`에 SPEC 전문이 새지 않는다.
  return { ...inspect(text, slash(specPath)), text };
}

// ── record ─────────────────────────────────────────────────────────────────
// A1 파일 실존 · A2 줄 범위 유효 · A3 위치 없는 지목(경고). 전건 통과 시에**만** 기록한다 —
// 부분 기록은 «어디까지 실증됐는가»를 흐린다(계획서 §10 #2, 번복 조건부).
export function record(specPath) {
  const root = dirname(resolve(specPath));
  const r = readSpec(specPath);
  const V = [], W = [], anchors = {}, unanchored = [];
  const at = (s) => `${r.spec}:${s.specLine}`;
  const recordedAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  const positions = r.c4?.positions;
  if (!positions) {
    W.push({ check: 'A3', msg: '문장 ID가 없다 — 앵커 대상 0건 (C4와 같은 «판정 불가»)' });
    return { subcommand: 'record', spec: r.spec, anchors, unanchored, spans: 0, wrote: false, violations: V, warnings: W, exit: 0 };
  }

  let spans = 0;
  for (const [id, list] of Object.entries(positions)) {
    if (!list.length) { unanchored.push(id); continue; }
    const out = [];
    for (const s of list) {
      const file = slash(s.file);
      const where = `${id} → ${file}:${rng(s.start, s.end)}`;
      let ls;
      try { ls = lines(resolve(root, file)); }
      catch (e) {
        V.push({ check: 'A1', msg: `${where} — ${e.code === 'ENOENT' ? '파일이 없다' : `읽을 수 없다 (${e.code})`} (${at(s)})` });
        continue;
      }
      if (s.start < 1 || s.end < s.start) V.push({ check: 'A2', msg: `${where} — 줄 범위가 뒤집혔다 (${at(s)})` });
      else if (s.end > ls.length) V.push({ check: 'A2', msg: `${where} — 파일이 ${ls.length}줄뿐이다 (${at(s)})` });
      else out.push({ file, startLine: s.start, endLine: s.end, hash: hashSpan(ls, s.start, s.end), recordedAt });
    }
    if (out.length) { anchors[id] = out; spans += out.length; }
  }
  if (unanchored.length)
    W.push({ check: 'A3', msg: `${unanchored.join(', ')} — 파일:줄 없음, 드리프트 감시 밖` });

  // 키 순서 = SPEC의 문장 정의 순서(사전순보다 읽기 쉽고, 같은 입력에 같은 순서라 결정론은 같다).
  const wrote = V.length === 0 && spans > 0;
  if (wrote)
    writeFileSync(join(root, ANCHORS),
      JSON.stringify({ version: 1, spec: r.spec.split('/').pop(), hashAlgo: 'sha256/lf', anchors, unanchored }, null, 2) + '\n');

  return { subcommand: 'record', spec: r.spec, anchors, unanchored, spans, wrote, violations: V, warnings: W, exit: V.length ? 1 : 0 };
}

// ── drift ──────────────────────────────────────────────────────────────────
// 앵커 하나마다 순서대로 판정한다(같은 파일시스템 상태 → 항상 같은 답).
// stale은 «문장이 거짓이 됐다»가 아니라 **«다시 읽을 우선순위»**다 — 그것이 3범주의 정확한 의미다.
export function drift(specPath) {
  const root = dirname(resolve(specPath));
  const r = readSpec(specPath);
  let doc;
  try { doc = JSON.parse(readFileSync(join(root, ANCHORS), 'utf8')); }
  catch (e) { die(e.code === 'ENOENT' ? `${ANCHORS}가 없다 — 먼저 record를 돌려라` : `${ANCHORS} 파싱 실패: ${e.message}`); }

  const anchors = doc.anchors ?? {};
  const missing = [], stale = [], modified = [], W = [];

  // 활성 델타가 있을 때만 modified가 산다 — 게이트가 Stop에서 병합하고 지우므로(spec-gate.mjs)
  // 이 창은 «수정 세션 진행 중»이다. 재방문 시점엔 델타가 없어 modified가 0이고, 그건 고장이 아니다.
  // 델타의 위반 여부는 보지 않는다 — 차단은 게이트 몫이고 여기서 재는 것은 «선언이 있었는가»뿐이다.
  let declared = null;
  const dpath = join(root, DELTA);
  if (existsSync(dpath)) {
    try { declared = new Set(inspectDelta(readFileSync(dpath, 'utf8'), r.text, DELTA).ids.modified); }
    catch (e) { W.push({ check: 'A4', msg: `${DELTA}를 읽지 못해 modified 판정 없이 진행한다 (${e.code ?? e.message})` }); }
  }

  let checked = 0;
  for (const [id, list] of Object.entries(anchors)) {
    for (const a of list) {
      checked++;
      const hit = { id, file: a.file, startLine: a.startLine, endLine: a.endLine };
      let ls;
      try { ls = lines(resolve(root, a.file)); }
      catch (e) {
        if (e.code === 'ENOENT') missing.push({ ...hit, why: '파일 소멸' });
        else stale.push({ ...hit, why: `읽기 실패 (${e.code})` });
        continue;
      }
      if (a.endLine > ls.length) { stale.push({ ...hit, why: '범위 소멸' }); continue; }
      // 3범주의 갈림길 — 선언된 수정이면 조치가 «record 재실행»이고, 아니면 «문장 재검토»다.
      // 해시 일치는 드리프트가 아니다(그렇다고 문장이 참이라는 뜻은 아니다 — 파일 머리 주석).
      if (hashSpan(ls, a.startLine, a.endLine) !== a.hash) {
        if (declared?.has(id)) modified.push({ ...hit, why: '선언된 수정, 앵커 미갱신' });
        else stale.push({ ...hit, why: '해시 불일치' });
      }
    }
  }

  // 부수 대조 2건은 경고로만 낸다(exit에 안 싣는다) — 앵커가 오래됐다는 신호이지 드리프트가 아니다.
  const pos = r.c4?.positions ?? {};
  const gone = Object.keys(anchors).filter((id) => !(id in pos));
  const fresh = Object.entries(pos).filter(([id, l]) => l.length && !(id in anchors)).map(([id]) => id);
  if (gone.length) W.push({ check: 'A4', msg: `앵커에는 있으나 현행 SPEC에 없는 문장 ${gone.join(', ')} — record 재실행 권장` });
  if (fresh.length) W.push({ check: 'A4', msg: `SPEC에 있으나 앵커가 없는 지목 ${fresh.join(', ')} — record 재실행 권장` });

  const stamps = Object.values(anchors).flat().map((a) => a.recordedAt).filter(Boolean).sort();
  const drifted = new Set([...missing, ...stale, ...modified].map((x) => x.id));
  return {
    subcommand: 'drift', spec: r.spec, delta: declared ? DELTA : null,
    checked, recordedAt: stamps.pop() ?? null,
    drift: { missing, stale, modified }, drifted: [...drifted],
    ids: Object.keys(anchors).length, warnings: W, exit: drifted.size ? 1 : 0,
  };
}

// ── 사람용 출력 ─────────────────────────────────────────────────────────────
function reportRecord(r) {
  console.log(`spec-anchor record ${r.spec}`);
  console.log(`  앵커 ${Object.keys(r.anchors).length}건(스팬 ${r.spans}) · 무위치 ${r.unanchored.length}건`);
  for (const v of r.violations) console.log(`    [위반 ${v.check}] ${v.msg}`);
  for (const w of r.warnings) console.log(`    [경고 ${w.check}] ${w.msg}`);
  if (r.wrote) console.log(`  → ${ANCHORS} 기록 (${Object.keys(r.anchors).length} anchors · ${r.spans} spans)`);
  else if (r.violations.length) console.log(`  → 앵커 미기록 (위반 ${r.violations.length} — 지목이 실존과 어긋난다. SPEC §3의 지목을 고치고 재실행하라)`);
  else console.log('  → 앵커 미기록 (기록할 지목이 없다)');
}

function reportDrift(r) {
  const one = (x) => `${x.id} → ${x.file}:${rng(x.startLine, x.endLine)} (${x.why})`;
  const row = (name, list, tail) =>
    console.log(`  ${name.padEnd(9)}${String(list.length).padStart(2)}  ${list.length ? list.map(one).join(' · ') : (tail ?? '')}`.trimEnd());
  console.log(`spec-anchor drift ${r.spec}`);
  console.log(`  앵커 ${r.checked}건 대조 (기록 ${r.recordedAt ?? '?'})`);
  row('missing', r.drift.missing);
  row('stale', r.drift.stale);
  row('modified', r.drift.modified, r.delta ? '' : `(활성 델타 없음 — ${DELTA}가 있을 때만 사는 범주다)`);
  for (const w of r.warnings) console.log(`    [경고 ${w.check}] ${w.msg}`);
  console.log(`  → 갈라진 문장 ${r.drifted.length} · 앵커 그대로인 문장 ${r.ids - r.drifted.length}`
    + (r.drift.modified.length ? ` · 선언된 수정 ${r.drift.modified.length}건은 record 재실행으로 갱신하라` : ''));
}

// ── --selftest ─────────────────────────────────────────────────────────────
// mkdtemp 임시 프로젝트 + **실프로세스**(spec-gate.mjs 선례). 인라인 픽스처만 부르는 selftest는
// CLI 인자 파싱 버그를 전건 통과시킨다(r39 §2 실측). execFileSync가 아니라 spawnSync를 쓰는 것은
// exit 1·2에서도 stdout(--json)을 그대로 읽어야 하기 때문이다(r40 §2-② 선례).
const SELF = fileURLToPath(import.meta.url);
const DIRS = [];

const SPEC_OK = `# SPEC — mini

## 1. 명시된 것
- S1. 더하기 함수가 있다.
- I1. 상수 b가 있다.

## 3. 완료 전 대조
| 문장 | 코드 위치 |
| --- | --- |
| S1 | src/a.ts:2-4 |
| I1 | src/b.ts:1 |
`;

// S1만 MODIFIED로 선언한다 — 같은 시드에서 I1도 함께 바꿔야 «선언 유무가 곧 범주 경계»가 고정된다
// (미선언 쪽이 없으면 «전부 modified가 됐다»와 구별되지 않는다). 형식은 spec-delta.mjs의 V1을 따른다.
const DELTA_S1 = `# DELTA — 더하기를 둘로

## ADDED

## MODIFIED
- S1. 더하기 함수가 두 인자를 더한다 — 대상 \`src/a.ts:add\`

## REMOVED

## 대조
| 문장 | 코드 위치 |
| --- | --- |
| S1 | src/a.ts:2-4 |
`;

const SPEC_NOID = `# SPEC — 산문만

장바구니를 만든다. 코드 위치는 src/a.ts:2 근처다.
`;

const SRC = {
  'src/a.ts': 'export const a = 1;\nexport function add(x) {\n  return x + 1;\n}\nexport const z = 9;\n',
  'src/b.ts': 'export const b = 2;\n',
};

// 치환이 안 먹으면 그 케이스는 조용히 SPEC_OK가 되고 selftest가 자기 자신을 속인다(spec-delta 선례).
const edit = (s, a, b) => { const r = s.replace(a, b); if (r === s) throw new Error(`픽스처 치환 실패: ${a}`); return r; };
const crlf = (files) => Object.fromEntries(Object.entries(files).map(([k, v]) => [k, v.replace(/\n/g, '\r\n')]));

function seed(spec, files) {
  const p = mkdtempSync(join(tmpdir(), 'spec-anchor-'));
  DIRS.push(p);
  if (spec != null) writeFileSync(join(p, 'SPEC.md'), spec);
  for (const [f, body] of Object.entries(files ?? {})) {
    mkdirSync(join(p, dirname(f)), { recursive: true });
    writeFileSync(join(p, f), body);
  }
  return p;
}

function call(p, sub) {
  const r = spawnSync(process.execPath, [SELF, sub, join(p, 'SPEC.md'), '--json'], { encoding: 'utf8' });
  let j = {};
  try { j = JSON.parse(r.stdout); } catch { /* exit 2는 stdout이 비어 있다 */ }
  return { status: r.status, j, err: (r.stderr ?? '').trim() };
}
const wrote = (p) => existsSync(join(p, ANCHORS));

// d1~d5는 같은 시드에서 record를 돌린 뒤 소스만 건드린다 — «record 시점과 지금의 차이»가 곧 케이스다.
function afterRecord(mutate) {
  const p = seed(SPEC_OK, SRC);
  const rec = call(p, 'record');
  if (rec.status !== 0) throw new Error(`시드 record가 실패했다: exit=${rec.status} ${rec.err}`);
  mutate?.(p);
  return { p, ...call(p, 'drift') };
}
const put = (p, f, body) => writeFileSync(join(p, f), body);

// d7·d8 공통 — 델타가 S1만 선언한 채로 S1·I1 스팬이 둘 다 바뀐 상태. 줄 수는 유지한다(줄이 늘면
// A2로 막혀 d8의 record 재실행이 «범위 무효»로 실패하고, 그러면 재기록 경로를 못 잰다).
const declareAndBreak = (p) => {
  put(p, DELTA, DELTA_S1);
  put(p, 'src/a.ts', SRC['src/a.ts'].replace('x + 1', 'x + 2'));
  put(p, 'src/b.ts', 'export const b = 3;\n');
};

const CASES = [
  ['r1 정상 지목 2건', () => {
    const { status, j } = call(seed(SPEC_OK, SRC), 'record');
    return (status === 0 && Object.keys(j.anchors).length === 2 && j.spans === 2 && j.unanchored.length === 0)
      || `exit=${status} anchors=${Object.keys(j.anchors ?? {})} unanchored=${JSON.stringify(j.unanchored)}`;
  }],
  ['r2 유령 파일', () => {
    const p = seed(edit(SPEC_OK, 'src/a.ts:2-4', 'src/ghost.ts:3'), SRC);
    const { status, j } = call(p, 'record');
    return (status === 1 && j.violations.length === 1 && j.violations[0].check === 'A1' && !wrote(p))
      || `exit=${status} 위반=${JSON.stringify(j.violations)} 기록=${wrote(p)}`;
  }],
  ['r3 줄 범위 무효 2종', () => {
    const p = seed(edit(edit(SPEC_OK, 'src/a.ts:2-4', 'src/a.ts:4-9'), 'src/b.ts:1', 'src/a.ts:7-3'), SRC);
    const { status, j } = call(p, 'record');
    const a2 = j.violations.filter((v) => v.check === 'A2');
    return (status === 1 && a2.length === 2 && !wrote(p)) || `exit=${status} A2=${JSON.stringify(a2)}`;
  }],
  ['r4 위치 없는 지목', () => {
    const p = seed(edit(SPEC_OK, '- I1. 상수 b가 있다.', '- I1. 상수 b가 있다.\n- S2. 빌드가 통과한다.')
      .replace('| I1 | src/b.ts:1 |', '| I1 | src/b.ts:1 |\n| S2 | 실행 확인 |'), SRC);
    const { status, j } = call(p, 'record');
    return (status === 0 && JSON.stringify(j.unanchored) === '["S2"]' && j.warnings.some((w) => w.check === 'A3') && wrote(p))
      || `exit=${status} unanchored=${JSON.stringify(j.unanchored)} 경고=${JSON.stringify(j.warnings)}`;
  }],
  ['r5 CRLF 소스', () => {
    const lf = call(seed(SPEC_OK, SRC), 'record').j;
    const cr = call(seed(SPEC_OK, crlf(SRC)), 'record').j;
    return (lf.anchors.S1[0].hash === cr.anchors.S1[0].hash && lf.anchors.I1[0].hash === cr.anchors.I1[0].hash)
      || `LF=${lf.anchors.S1[0].hash.slice(0, 12)} CRLF=${cr.anchors.S1[0].hash.slice(0, 12)}`;
  }],
  ['r6 SPEC 없음', () => {
    const { status } = call(seed(null, SRC), 'record');
    return status === 2 || `exit=${status}`;
  }],
  ['r7 문장 ID 없는 SPEC', () => {
    const p = seed(SPEC_NOID, SRC);
    const { status, j } = call(p, 'record');
    return (status === 0 && !wrote(p) && j.warnings.length === 1) || `exit=${status} 기록=${wrote(p)} 경고=${JSON.stringify(j.warnings)}`;
  }],
  ['d1 무변경', () => {
    const { status, j } = afterRecord();
    return (status === 0 && j.checked === 2 && j.drifted.length === 0) || `exit=${status} ${JSON.stringify(j.drift)}`;
  }],
  ['d2 파일 삭제', () => {
    const { status, j } = afterRecord((p) => rmSync(join(p, 'src/a.ts')));
    return (status === 1 && j.drift.missing.length === 1 && j.drift.stale.length === 0) || `exit=${status} ${JSON.stringify(j.drift)}`;
  }],
  ['d3 스팬 내용 수정', () => {
    const { status, j } = afterRecord((p) => put(p, 'src/a.ts', SRC['src/a.ts'].replace('x + 1', 'x + 2')));
    return (status === 1 && j.drift.stale.length === 1 && j.drift.stale[0].why === '해시 불일치') || `exit=${status} ${JSON.stringify(j.drift)}`;
  }],
  // 의도된 보수적 동작 — 줄이 밀리면 내용이 그대로여도 stale이다. 해시로는 «의미 보존 변경»과
  // «의미 변경»을 가를 수 없고, 가르려는 순간 판단이 들어와 결정론이 깨진다(개발 규칙 5).
  ['d4 스팬 위 줄 삽입(위양성)', () => {
    const { status, j } = afterRecord((p) => put(p, 'src/a.ts', '// added\n' + SRC['src/a.ts']));
    return (status === 1 && j.drift.stale.length === 1) || `exit=${status} ${JSON.stringify(j.drift)}`;
  }],
  ['d5 개행만 CRLF 변환', () => {
    const { status, j } = afterRecord((p) => put(p, 'src/a.ts', SRC['src/a.ts'].replace(/\n/g, '\r\n')));
    return (status === 0 && j.drifted.length === 0) || `exit=${status} ${JSON.stringify(j.drift)}`;
  }],
  ['d6 anchors 없음', () => {
    const { status } = afterRecord((p) => rmSync(join(p, ANCHORS)));
    return status === 2 || `exit=${status}`;
  }],
  ['d7 선언된 수정 + 미선언', () => {
    const { status, j } = afterRecord(declareAndBreak);
    const m = j.drift.modified, s = j.drift.stale;
    return (status === 1 && j.delta === DELTA && m.length === 1 && m[0].id === 'S1' && s.length === 1 && s[0].id === 'I1')
      || `exit=${status} delta=${j.delta} ${JSON.stringify(j.drift)}`;
  }],
  ['d8 재기록으로 회복', () => {
    const { p } = afterRecord(declareAndBreak);
    const rec = call(p, 'record');
    if (rec.status !== 0) return `record 재실행 exit=${rec.status} ${JSON.stringify(rec.j.violations)}`;
    const { status, j } = call(p, 'drift');
    return (status === 0 && j.drifted.length === 0) || `exit=${status} ${JSON.stringify(j.drift)}`;
  }],
];

function selftest() {
  let bad = 0;
  try {
    for (const [name, fn] of CASES) {
      let got;
      try { got = fn(); } catch (e) { got = `throw: ${e.message}`; }
      const ok = got === true;
      if (!ok) bad++;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(24)} ${ok ? '' : got}`);
    }
  } finally { for (const d of DIRS) rmSync(d, { recursive: true, force: true }); }
  console.log(bad ? `selftest 실패 — ${bad}건 어긋남` : `selftest 통과 — ${CASES.length}건 전건 일치`);
  process.exit(bad ? 1 : 0);
}

// ── CLI ────────────────────────────────────────────────────────────────────
// 직접 실행일 때만 돈다(spec-verify.mjs 선례). 값 있는 플래그가 없으므로 인자 파싱은 한 줄이다 —
// spec-delta의 indexOf+skip 트릭은 베끼지 않는다(r39 §2에서 첫 인자를 삼키는 버그를 냈다).
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(SELF);
const args = process.argv.slice(2);
if (isMain && args[0] === '--selftest' && args.length === 1) selftest();
else if (isMain) {
  const sub = args[0];
  const path = args.slice(1).find((a) => !a.startsWith('--'));
  if (!['record', 'drift'].includes(sub) || !path)
    die('usage: node framework/spec-anchor.mjs record|drift <SPEC.md 경로> [--json] | --selftest');
  const r = sub === 'record' ? record(path) : drift(path);
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else (sub === 'record' ? reportRecord : reportDrift)(r);
  process.exit(r.exit);
}
