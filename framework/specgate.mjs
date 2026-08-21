#!/usr/bin/env node
// specgate — 검사기들의 위반을 SG 번호 룰 + 정적 힌트로 재포장하는 단일 CLI.
// **검사를 하나도 재구현하지 않는다** — 기존 export를 부르고 번호·포맷만 입힌다(KF4).
//   node framework/specgate.mjs verify <SPEC.md 경로>       [--json]   # spec-verify.inspect() 랩 — C1~C5
//   node framework/specgate.mjs delta  <SPEC.delta.md 경로> [--json]   # spec-delta.inspectDelta() 랩 — D1~D5
//   node framework/specgate.mjs drift  <SPEC.md 경로>       [--json]   # spec-anchor.drift() 랩 — 3범주 + A4
//   node framework/specgate.mjs probe  <SPEC.md 경로>                  # specprobe 패스스루 — 판정 없음
//   node framework/specgate.mjs --selftest
// exit 0 Error 없음 / 1 있음 / 2 파일 없음·사용법 오류. Warning만 있으면 0(경고는 판정이 아니다).
// 검출력은 한 건도 늘지 않는다 — C4·C5가 «ID를 다시 적었는가»만 재는 한계는 번호를 붙여도 그대로다.
// ⚠ `drift`의 `loc.file`만 **SPEC이 아니라 코드 파일**이다 — 드리프트의 조치 대상이 코드이기
// 때문이다. verify·delta에서 성립하는 «loc.file === target» 불변식이 거기서만 깨진다.
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, rmSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { inspect } from './spec-verify.mjs';
import { inspectDelta } from './spec-delta.mjs';
import { drift as anchorDrift } from './spec-anchor.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SELF = fileURLToPath(import.meta.url);

// ── 룰 표 ──────────────────────────────────────────────────────────────────
// 키 = finding의 `kind ?? check`. C 블록만 kind가 필요하다(C2·C4는 한 check에 여러 kind).
// D·A 블록은 check 하나가 룰 하나라 그대로 키가 된다 — 그래서 spec-delta·spec-anchor는 무수정이다.
// **심각도는 여기 없다.** finding이 violations에 있었으면 Error, warnings면 Warning — 검사기의
// 현행 구분을 그대로 옮긴다(이중 정의를 두면 어느 쪽이 참인지 갈린다).
// 힌트는 룰당 **정적 1줄**이다. 상황별 안내에는 LLM이 필요하고, 그건 차단 경로에 넣지 않는다.
export const RULES = {
  // 게이트 전용 — spec-verify에는 없는 룰이다(SPEC 파일 자체가 없는 상태).
  'gate.noSpec':        { id: 'SG1000', hint: 'sdd 절차(§1 명시 · §2 점검표 10범주 · 미확정 6열 표)로 SPEC.md를 먼저 쓴다' },
  'C1.none':            { id: 'SG1001', hint: '§2에서 추론으로 확정한 문장 끝에 `[추론]`을 단다' },
  'C2.none':            { id: 'SG1002', hint: '`| 범주 | 상태 |` 2열 점검표에 10범주를 적는다' },
  'C2.missingCat':      { id: 'SG1002', hint: '점검표의 빠진 범주 행을 채운다' },
  'C2.badLiteral':      { id: 'SG1002', hint: '상태를 Clear · Partial · Missing 중 하나로 적는다' },
  'C3.none':            { id: 'SG1003', hint: '`| # | 침묵 지점 | 적용한 기본값 | 대안 | 상태 | 번복 조건 |` 6열 표를 만든다' },
  'C3.badCols':         { id: 'SG1003', hint: '미확정표를 6열로 맞춘다 — 열이 밀리면 `선택 대기` 행이 판정에서 샌다' },
  'C4.miss':            { id: 'SG1004', hint: '그 문장의 구현 위치를 완료 전 대조에 «파일:줄»로 지목하거나 기각 사유를 적는다' },
  'C5.miss':            { id: 'SG1005', hint: '그 `선택 대기` 항목을 재확인 목록에 올린다' },
  'C4.vague':           { id: 'SG1006', hint: '위치를 붙일 수 있으면 붙인다 — «실행 확인»·«부재로 충족»이면 그대로 둔다' },
  'C3.pendingLost':     { id: 'SG1007', hint: '미확정표의 상태 열 위치를 사람이 확인한다 — C5 판정이 통째로 꺼져 있다' },
  'C4.noId':            { id: 'SG1008', hint: 'S1·I2 형태의 문장 ID를 매기면 C4 대조가 검사된다' },
  'C5.numericId':       { id: 'SG1009', hint: '미확정 항목 ID를 U1·U2 형태로 바꾸면 재확인이 검사된다' },
  'C5.numericExcluded': { id: 'SG1009', hint: '순수 번호 ID는 판정에서 빠진다 — 검사하려면 U1 형태로 바꾼다' },
  'C3.archivePending':  { id: 'SG1010', hint: '그 행을 §2.3 미확정표로 되돌린다 — 아카이브는 «구현·검증 완료» 보존이다' },
  // D 블록 — 훅이 델타 위반을 stderr로 내므로 여기 없으면 개정된 훅이 SG----를 뱉는다.
  // (계획서는 R3에 뒀지만 소비자가 R2에 있다. 코드가 아니라 표 5행이다.)
  D1: { id: 'SG1011', hint: '`## ADDED` `## MODIFIED` `## REMOVED` 3절을 다 둔다 — 빈 절이어도 된다' },
  D2: { id: 'SG1012', hint: 'MODIFIED 항목에 고칠 대상을 `` `파일:심볼` ``로 적는다' },
  D3: { id: 'SG1013', hint: 'ID 접두어를 S/I/U로 맞추고 본 SPEC과 번호가 겹치지 않게 한다' },
  D4: { id: 'SG1014', hint: '그 문장을 `## 대조`에 «파일:줄»로 지목한다' },
  D5: { id: 'SG1015', hint: 'REMOVED가 지목한 ID가 본 SPEC에 실제로 있는지 확인한다' },
  // A 블록 — spec-anchor. A1~A3은 `record`가 내는데 **specgate는 record를 감싸지 않는다**
  // (선택 대기 #8: 이 CLI는 읽기 전용 판정만 감싸고, record는 SPEC.anchors.json을 쓴다).
  // 그래도 등재하는 이유는 매핑 전수성 하나다 — 소스에 있는 check가 RULES에 없으면 T3b가 깬다.
  A1: { id: 'SG1021', hint: '§3 지목의 파일 경로를 실존 파일로 고친 뒤 `spec-anchor record`를 다시 돌린다' },
  A2: { id: 'SG1022', hint: '줄 범위를 파일 실제 길이 안의 start-end로 고친 뒤 `spec-anchor record`를 다시 돌린다' },
  A3: { id: 'SG1023', hint: '드리프트 감시가 필요한 문장이면 그 지목에 «파일:줄»을 붙인다' },
  // 3범주의 조치가 서로 다르다 — missing·stale은 «문장을 다시 읽어라»고 modified는 기계적 갱신이다.
  // 힌트가 같으면 이 구분이 사라지고, 그러면 범주를 셋으로 가른 이유가 없어진다(r45 §1).
  'drift.missing':  { id: 'SG1024', hint: '파일이 사라졌다 — 그 문장이 아직 참인지 다시 읽고 SPEC의 지목을 고친다' },
  'drift.stale':    { id: 'SG1025', hint: '스팬이 갈라졌다 — 그 문장이 아직 참인지 다시 읽고, 참이면 `spec-anchor record`로 갱신한다' },
  'drift.modified': { id: 'SG1026', hint: '델타가 선언한 수정이다 — `spec-anchor record`를 다시 돌려 앵커만 갱신한다' },
  A4: { id: 'SG1027', hint: '앵커가 현행 SPEC과 어긋난다 — `spec-anchor record`를 다시 돌린다' },
};

// 룰이 없는 kind를 조용히 숨기지 않는다 — 눈에 띄어야 표에 등재된다.
export const UNASSIGNED = 'SG----';
export const ruleOf = (f) => RULES[f.kind ?? f.check] ?? null;

// 훅과 CLI가 공유하는 한 줄 포맷. loc는 붙이지 않는다 — spec-verify 메시지 4종이 이미
// «(SPEC.md:12 «…»)»를 품고 있어 중복이 된다. 위치의 기계 계약은 --json의 loc다.
export const line1 = (f) => `${f.ruleId} (${f.severity}): ${f.msg}`;

const mk = (f, severity, file) => {
  const r = ruleOf(f);
  return {
    ruleId: r?.id ?? UNASSIGNED, severity, check: f.check, kind: f.kind ?? null, msg: f.msg,
    loc: { file, line: f.line ?? null }, hint: r?.hint ?? null,
  };
};

// ── .specgate.json ─────────────────────────────────────────────────────────
// 대상 프로젝트 루트 = SPEC.md가 있는 디렉터리. `interview`(KF2)·`volume`(KF5)은 예약 키고
// 이 라운드는 읽지 않는다. 깨진 설정이 판정을 뒤집지 않는다 — mute만 죽고 검사는 그대로 간다.
function loadConfig(dir) {
  const p = join(dir, '.specgate.json');
  if (!existsSync(p)) return { mute: [], notes: [] };
  try {
    const j = JSON.parse(readFileSync(p, 'utf8'));
    return { mute: Array.isArray(j.mute) ? j.mute : [], notes: [] };
  } catch {
    return { mute: [], notes: ['구성 무시: .specgate.json 파싱 실패 — mute를 적용하지 않았다'] };
  }
}

// Error는 mute할 수 없다 — 게이트를 설정 파일로 끄는 구멍을 열지 않는다. 오차단의 조치는
// mute가 아니라 FIELD-GUIDE §2대로 SRC·PRE 조정이다.
function applyMute(findings, mute) {
  const notes = [], muted = [];
  for (const id of new Set(mute))
    if (findings.some((f) => f.severity === 'Error' && f.ruleId === id)) notes.push(`mute 불가: ${id}는 Error다`);
  const kept = findings.filter((f) => {
    if (f.severity === 'Error' || !mute.includes(f.ruleId)) return true;
    if (!muted.includes(f.ruleId)) muted.push(f.ruleId);
    return false;
  });
  return { kept, muted, notes };
}

// ── 서브커맨드 ──────────────────────────────────────────────────────────────
// 셋이 공유하는 꼬리 — 설정 로드 · mute · 집계 · exit. 앞머리(무엇을 읽고 어느 검사기를 부르나)만 다르다.
const slash = (p) => p.split(/[\\/]/).join('/');
const fromInspect = (r, file) => [
  ...r.violations.map((f) => mk(f, 'Error', file)),
  ...r.warnings.map((f) => mk(f, 'Warning', file)),
];

function pack(subcommand, target, findings, dir) {
  const cfg = loadConfig(dir);
  const { kept, muted, notes } = applyMute(findings, cfg.mute);
  const counts = {
    error: kept.filter((f) => f.severity === 'Error').length,
    warning: kept.filter((f) => f.severity === 'Warning').length,
  };
  return {
    tool: 'specgate', subcommand, target,
    findings: kept, muted, notes: [...cfg.notes, ...notes], counts, exit: counts.error ? 1 : 0,
  };
}

export function verify(specPath) {
  let text;
  try { text = readFileSync(specPath, 'utf8'); }
  catch (e) { return { fatal: `파싱 실패: ${e.message}`, exit: 2 }; }
  const target = slash(specPath);
  return pack('verify', target, fromInspect(inspect(text, target), target), dirname(resolve(specPath)));
}

// base 탐색은 spec-delta.mjs의 load()와 같은 규칙이다(델타 옆 SPEC.md, 없으면 콜드스타트).
// 그쪽 load()는 export가 아니고 실패 시 exit(2)를 직접 부른다 — 4줄 재구현이 verify의 fatal
// 패턴과 맞는다. 규칙이 갈라지면 T16(exit 패스스루)이 잡는다.
export function delta(deltaPath) {
  let dtext;
  try { dtext = readFileSync(deltaPath, 'utf8'); }
  catch (e) { return { fatal: `읽기 실패: ${e.message}`, exit: 2 }; }
  const dir = dirname(resolve(deltaPath));
  const bp = join(dir, 'SPEC.md');
  const btext = existsSync(bp) ? readFileSync(bp, 'utf8') : null;
  const target = slash(deltaPath);
  return pack('delta', target, fromInspect(inspectDelta(dtext, btext, target), target), dir);
}

// drift()의 반환에는 violations가 없다 — 3범주를 Error finding으로 **변환**한다(파일 머리 ⚠ 참조:
// 여기서만 loc가 코드 파일이다). SPEC이나 SPEC.anchors.json이 없으면 spec-anchor의 die()가 그
// 자리에서 exit 2를 낸다 — specgate의 exit 규약과 일치하고, verify가 fatal일 때 --json을 내지
// 않는 것과도 동작이 같다. 그래서 spec-anchor.mjs는 한 글자도 안 고친다.
const rng = (a, b) => (a === b ? `${a}` : `${a}-${b}`);
export function driftReport(specPath) {
  const target = slash(specPath);
  const r = anchorDrift(specPath);
  const findings = [];
  for (const k of ['missing', 'stale', 'modified'])
    for (const a of r.drift[k])
      findings.push(mk(
        { check: `drift.${k}`, msg: `${a.id} → ${a.file}:${rng(a.startLine, a.endLine)} (${a.why})`, line: a.startLine },
        'Error', a.file));
  findings.push(...r.warnings.map((w) => mk(w, 'Warning', target)));
  return pack('drift', target, findings, dirname(resolve(specPath)));
}

function report(r) {
  for (const n of r.notes) console.log(n);
  for (const f of r.findings) {
    console.log(line1(f));
    if (f.hint) console.log(`  ↳ ${f.hint}`);
  }
  console.log(`→ Error ${r.counts.error} · Warning ${r.counts.warning} · muted ${r.muted.length} · exit ${r.exit}`);
}

// ── probe ──────────────────────────────────────────────────────────────────
// 패스스루다. specprobe는 끝까지 판정을 종료 코드에 싣지 않는다(planmain §5-3) — 그 성격을
// 래퍼가 바꾸면 «세기만 하는 도구»가 조용히 게이트가 된다.
function probe(specPath) {
  const r = spawnSync(process.execPath, [join(HERE, 'specprobe.mjs'), specPath], { encoding: 'utf8' });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status === 0 ? 0 : 2;   // 판정 없음. 파일 부재·사용법 오류만 2로 넘긴다.
}

// ── --selftest ─────────────────────────────────────────────────────────────
// spec-gate.mjs 선례대로 실프로세스로 돌리고 exit까지 본다. 픽스처 6장은 읽기만(절대 규칙 6).
const F = (n) => join(HERE, 'smoke', 'runs', `r32-fixture-${n}.md`);
const NAMES = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'];
const call = (argv) => spawnSync(process.execPath, [SELF, ...argv], { encoding: 'utf8' });
const vjson = (p) => JSON.parse(spawnSync(process.execPath, [join(HERE, 'spec-verify.mjs'), p, '--json'], { encoding: 'utf8' }).stdout);
const vexit = (p) => spawnSync(process.execPath, [join(HERE, 'spec-verify.mjs'), p], { encoding: 'utf8' }).status;

// 픽스처가 커버하는 kind는 4종뿐이라(C5.miss · C4.vague · C4.noId · C5.numericId) 런타임
// 대조만으로는 전수성이 안 나온다. 인라인 SPEC 2장이 4종을 더하고, 나머지는 T3b가 정적으로 잡는다.
const MIXED = `# SPEC — 혼합 ID

## 미확정
| # | 침묵 지점 | 적용한 기본값 | 대안 | 상태 | 번복 조건 |
| --- | --- | --- | --- | --- | --- |
| 1 | 가 | 나 | 다 | 선택 대기 | 라 |
| U2 | 마 | 바 | 사 | 선택 대기 | 아 |

## 대조
U2는 이번 범위에서 유지한다.
`;
const EMPTY = '# SPEC\n\n대충 만든다.\n';

// 델타 2장 — 위반 없음(3절 다 있고 S9가 위치까지 지목됨) / D1 위반(`## ADDED` 절 없음).
const DELTA_OK = `# DELTA

## ADDED
- S9. 새 문장이 있다.

## MODIFIED

## REMOVED

## 대조
| 문장 | 코드 위치 |
| --- | --- |
| S9 | src/x.ts:1 |
`;
const DELTA_BAD = `# DELTA — ADDED 절이 없다

## MODIFIED

## REMOVED
`;

// drift 3범주를 한 시드에서 전부 밟는다 — S1은 델타로 선언하고 고쳐서 modified,
// I1은 선언 없이 고쳐서 stale, S2는 파일을 지워서 missing. 정적 대조로는 이 3키를 못 잡는다
// (specgate가 만드는 이름이라 spec-anchor 소스에 리터럴이 없다).
const A_SPEC = `# SPEC — anchor

## 1. 명시된 것
- S1. 더하기가 있다.
- S2. 빼기가 있다.
- I1. 상수 b가 있다.

## 3. 완료 전 대조
| 문장 | 코드 위치 |
| --- | --- |
| S1 | src/a.ts:1 |
| S2 | src/c.ts:1 |
| I1 | src/b.ts:1 |
`;
const A_DELTA = `# DELTA — 더하기를 고친다

## ADDED

## MODIFIED
- S1. 더하기가 둘을 더한다 — 대상 \`src/a.ts:add\`

## REMOVED

## 대조
| 문장 | 코드 위치 |
| --- | --- |
| S1 | src/a.ts:1 |
`;
const A_SRC = { 'src/a.ts': 'export const a = 1;\n', 'src/b.ts': 'export const b = 2;\n', 'src/c.ts': 'export const c = 3;\n' };

function selftest() {
  const proj = mkdtempSync(join(tmpdir(), 'specgate-'));
  const spec = join(proj, 'SPEC.md');
  const T = [];
  const t = (name, fn) => T.push([name, fn]);
  const clean = () => { for (const f of ['SPEC.md', 'SPEC.delta.md', 'SPEC.anchors.json', '.specgate.json', '.specgate-log.jsonl']) rmSync(join(proj, f), { force: true }); };
  const seed = (fixture, cfg) => { clean(); copyFileSync(F(fixture), spec); if (cfg) writeFileSync(join(proj, '.specgate.json'), cfg); return spec; };
  const inline = (text) => { clean(); writeFileSync(spec, text); return spec; };
  const indelta = (text) => { clean(); const p = join(proj, 'SPEC.delta.md'); writeFileSync(p, text); return p; };

  // T1 finding 수 · T2 exit 패스스루 · T3a 미배정 0 — 픽스처 6장
  for (const n of NAMES) t(`T1/T2/T3a ${n}`, () => {
    const r = call(['verify', F(n), '--json']);
    const j = JSON.parse(r.stdout);
    const raw = vjson(F(n));
    const want = raw.violations.length + raw.warnings.length;
    if (j.findings.length !== want) return `finding ${j.findings.length} ≠ 위반+경고 ${want}`;
    if (j.counts.error !== raw.violations.length) return `Error ${j.counts.error} ≠ 위반 ${raw.violations.length}`;
    const ve = vexit(F(n));
    if (r.status !== ve) return `exit ${r.status} ≠ spec-verify ${ve}`;
    const un = j.findings.filter((f) => f.ruleId === UNASSIGNED);
    return un.length ? `미배정 ${un.map((f) => f.kind).join(',')}` : null;
  });

  // T3b — 매핑 전수성. 픽스처가 못 밟는 kind까지 소스에서 직접 뽑아 대조한다(이쪽이 진짜 전수다).
  // A 블록(r47의 T20)도 여기서 잡는다 — 성질이 같고 읽는 파일만 다르다. drift 3범주는 소스에
  // 리터럴이 없어 정적으로 못 잡히고, T18이 런타임으로 밟는다.
  t('T3b 소스 kind 전수', () => {
    const miss = [];
    const vs = readFileSync(join(HERE, 'spec-verify.mjs'), 'utf8');
    for (const m of vs.matchAll(/'(C\d\.\w+)'/g)) if (!RULES[m[1]]) miss.push(m[1]);
    const ds = readFileSync(join(HERE, 'spec-delta.mjs'), 'utf8');
    for (const m of ds.matchAll(/(?:violate|warn)\('(D\d)'/g)) if (!RULES[m[1]]) miss.push(m[1]);
    const as = readFileSync(join(HERE, 'spec-anchor.mjs'), 'utf8');
    for (const m of as.matchAll(/check: '(A\d)'/g)) if (!RULES[m[1]]) miss.push(m[1]);
    return miss.length ? `RULES 미등재: ${[...new Set(miss)].join(', ')}` : null;
  });

  t('T4 한 줄 포맷', () => {
    const ls = call(['verify', F('F3')]).stdout.trim().split('\n');
    if (!/^SG(\d{4}|----) \((Error|Warning)\): .+$/.test(ls[0])) return `첫 줄: ${ls[0]}`;
    if (!ls[1].startsWith('  ↳ ')) return `힌트 줄: ${ls[1]}`;
    if (!/^→ Error \d+ · Warning \d+ · muted \d+ · exit \d$/.test(ls[ls.length - 1])) return `요약: ${ls[ls.length - 1]}`;
    return null;
  });

  t('T5 Warning mute', () => {
    const r = call(['verify', seed('F5', '{"mute":["SG1006"]}'), '--json']);
    const j = JSON.parse(r.stdout);
    if (j.findings.some((f) => f.ruleId === 'SG1006')) return 'SG1006이 남았다';
    if (!j.muted.includes('SG1006')) return `muted=${JSON.stringify(j.muted)}`;
    return r.status === 0 ? null : `exit=${r.status} (F5는 위반 0)`;
  });

  // 계획서 T6은 F3 + SG1004였는데 F3의 Error는 SG1005다(실측). ID를 실물에 맞춘다 —
  // 재는 것은 그대로 «Error mute 시도가 무시되는가»다.
  t('T6 Error mute 시도', () => {
    const r = call(['verify', seed('F3', '{"mute":["SG1005"]}')]);
    if (!r.stdout.includes('mute 불가')) return '통지가 없다';
    if (!r.stdout.includes('SG1005')) return 'SG1005가 사라졌다';
    return r.status === 1 ? null : `exit=${r.status}`;
  });

  t('T7 깨진 설정', () => {
    const r = call(['verify', seed('F3', '{mute: [SG1006')]);
    if (!r.stdout.includes('구성 무시')) return '경고가 없다';
    return r.status === 1 ? null : `exit=${r.status}`;
  });

  t('T8 파일 없음', () => {
    const r = call(['verify', join(proj, 'nosuch.md')]);
    return r.status === 2 ? null : `exit=${r.status}`;
  });

  t('T9 서브커맨드 오타', () => {
    const r = call(['verfy', F('F1')]);
    if (!/usage/.test(r.stderr)) return 'usage가 없다';
    return r.status === 2 ? null : `exit=${r.status}`;
  });

  t('T10 probe 패스스루', () => {
    const r = call(['probe', F('F2')]);
    const direct = spawnSync(process.execPath, [join(HERE, 'specprobe.mjs'), F('F2')], { encoding: 'utf8' });
    if (r.stdout !== direct.stdout) return 'specprobe 출력과 다르다';
    return r.status === 0 ? null : `exit=${r.status} (판정을 실으면 안 된다)`;
  });

  t('T12 --json 스키마', () => {
    const j = JSON.parse(call(['verify', F('F3'), '--json']).stdout);
    for (const f of j.findings) {
      for (const k of ['ruleId', 'severity', 'loc', 'hint']) if (!(k in f)) return `${f.kind}에 ${k} 없음`;
      if (!(f.loc.line === null || Number.isInteger(f.loc.line))) return `loc.line=${f.loc.line}`;
      if (f.loc.file !== j.target) return `loc.file=${f.loc.file}`;
    }
    return j.findings.length ? null : 'findings가 비었다';
  });

  t('T14 혼합 ID kind', () => {
    const j = JSON.parse(call(['verify', inline(MIXED), '--json']).stdout);
    const f = j.findings.find((x) => x.kind === 'C5.numericExcluded');
    if (!f) return `C5.numericExcluded가 안 나왔다 (${j.findings.map((x) => x.kind).join(',')})`;
    if (f.ruleId !== 'SG1009') return `ruleId=${f.ruleId}`;
    const un = j.findings.filter((x) => x.ruleId === UNASSIGNED);
    return un.length ? `미배정 ${un.map((x) => x.kind).join(',')}` : null;
  });

  t('T15 빈 SPEC C1~C3', () => {
    const j = JSON.parse(call(['verify', inline(EMPTY), '--json']).stdout);
    const ids = j.findings.filter((f) => f.severity === 'Error').map((f) => f.ruleId).sort();
    const want = ['SG1001', 'SG1002', 'SG1003'];
    return JSON.stringify(ids) === JSON.stringify(want) ? null : `Error ${JSON.stringify(ids)} ≠ ${JSON.stringify(want)}`;
  });

  // T13 — 훅이 stderr에 낸 룰 ID가 로그에도 남는가. 이 필드가 없으면 «같은 룰 반복 차단» 판독이
  // 처음부터 측정 불능이다(계획서 §9-3). 기존 4필드 보존까지 같이 본다.
  t('T13 로그 rules 복원', () => {
    inline(EMPTY);
    const ev = { cwd: proj, hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: join(proj, 'src', 'app.ts') } };
    const r = spawnSync(process.execPath, [join(HERE, 'hooks', 'spec-gate.mjs'), 'pre'], { input: JSON.stringify(ev), encoding: 'utf8' });
    if (r.status !== 2) return `훅 exit=${r.status} (기대 2)`;
    const ids = [...new Set(r.stderr.match(/SG\d{4}/g) ?? [])].sort();
    if (!ids.length) return 'stderr에 SG 번호가 없다';
    const lines = readFileSync(join(proj, '.specgate-log.jsonl'), 'utf8').trim().split('\n');
    const last = JSON.parse(lines[lines.length - 1]);
    for (const k of ['t', 'mode', 'file', 'first']) if (!(k in last)) return `기존 필드 ${k} 소실`;
    const got = JSON.stringify([...(last.rules ?? [])].sort());
    return got === JSON.stringify(ids) ? null : `rules=${got} ≠ stderr=${JSON.stringify(ids)}`;
  });

  // ── R3 — delta·drift ────────────────────────────────────────────────────
  // 래퍼의 exit가 감싼 도구의 판정과 어긋나면 안 된다(계획서 §4-1 패스스루 원칙).
  t('T16 delta exit 패스스루', () => {
    for (const [name, text] of [['위반없음', DELTA_OK], ['위반있음', DELTA_BAD]]) {
      const p = indelta(text);
      const mine = call(['delta', p]).status;
      const direct = spawnSync(process.execPath, [join(HERE, 'spec-delta.mjs'), 'verify', p], { encoding: 'utf8' }).status;
      if (mine !== direct) return `${name}: exit ${mine} ≠ spec-delta ${direct}`;
    }
    return null;
  });

  t('T17 D 블록 매핑', () => {
    const j = JSON.parse(call(['delta', indelta(DELTA_BAD), '--json']).stdout);
    if (!j.findings.some((f) => f.ruleId === 'SG1011' && f.severity === 'Error'))
      return `SG1011이 없다 (${j.findings.map((f) => f.ruleId).join(',')})`;
    const un = j.findings.filter((f) => f.ruleId === UNASSIGNED);
    return un.length ? `미배정 ${un.map((f) => f.check).join(',')}` : null;
  });

  // 3범주를 한 번에 밟는다. loc가 SPEC이 아니라 코드 파일이라는 비대칭도 여기서 단언한다 —
  // --json 소비자에게 그게 계약이다.
  t('T18 drift 3범주', () => {
    const p = mkdtempSync(join(tmpdir(), 'specgate-drift-'));
    try {
      writeFileSync(join(p, 'SPEC.md'), A_SPEC);
      mkdirSync(join(p, 'src'), { recursive: true });
      for (const [f, body] of Object.entries(A_SRC)) writeFileSync(join(p, f), body);
      const rec = spawnSync(process.execPath, [join(HERE, 'spec-anchor.mjs'), 'record', join(p, 'SPEC.md')], { encoding: 'utf8' });
      if (rec.status !== 0) return `시드 record exit=${rec.status} ${rec.stdout}${rec.stderr}`;
      writeFileSync(join(p, 'SPEC.delta.md'), A_DELTA);
      writeFileSync(join(p, 'src', 'a.ts'), 'export const a = 99;\n');   // 선언된 수정 → modified
      writeFileSync(join(p, 'src', 'b.ts'), 'export const b = 99;\n');   // 미선언 수정 → stale
      rmSync(join(p, 'src', 'c.ts'));                                    // 파일 소멸 → missing
      const r = call(['drift', join(p, 'SPEC.md'), '--json']);
      const j = JSON.parse(r.stdout);
      const by = (id) => j.findings.filter((f) => f.ruleId === id);
      const dump = JSON.stringify(j.findings.map((f) => [f.ruleId, f.msg]));
      for (const id of ['SG1024', 'SG1025', 'SG1026'])
        if (by(id).length !== 1) return `${id} ${by(id).length}건 ≠ 1 — ${dump}`;
      if (by('SG1024')[0].loc.file !== 'src/c.ts') return `loc.file=${by('SG1024')[0].loc.file} (코드 파일이어야 한다)`;
      const un = j.findings.filter((f) => f.ruleId === UNASSIGNED);
      if (un.length) return `미배정 ${un.map((f) => f.check).join(',')}`;
      return r.status === 1 ? null : `exit=${r.status}`;
    } finally { rmSync(p, { recursive: true, force: true }); }
  });

  // 앵커 없이 drift = spec-anchor의 die() 경유 exit 2. verify의 fatal과 같은 자리다(--json 없음).
  t('T19 drift 앵커 없음', () => {
    const r = call(['drift', inline(A_SPEC)]);
    if (!r.stderr.includes('record')) return `안내가 없다: ${r.stderr.trim()}`;
    return r.status === 2 ? null : `exit=${r.status}`;
  });

  let bad = 0;
  try {
    for (const [name, fn] of T) {
      let why;
      try { why = fn(); } catch (e) { why = `예외: ${e.message}`; }
      if (why) bad++;
      console.log(`${why ? 'FAIL' : 'ok  '} ${name.padEnd(20)} ${why ?? ''}`);
    }
  } finally { rmSync(proj, { recursive: true, force: true }); }
  console.log(bad ? `selftest 실패 — ${bad}건 어긋남` : `selftest 통과 — ${T.length}건 전건 일치`);
  process.exit(bad ? 1 : 0);
}

// ── CLI ────────────────────────────────────────────────────────────────────
// hooks/spec-gate.mjs가 RULES를 import한다 — 이 가드가 없으면 훅의 인자를 서브커맨드로 읽는다.
const USAGE = `usage: node framework/specgate.mjs verify <SPEC.md 경로>       [--json]
       node framework/specgate.mjs delta  <SPEC.delta.md 경로> [--json]
       node framework/specgate.mjs drift  <SPEC.md 경로>       [--json]
       node framework/specgate.mjs probe  <SPEC.md 경로>
       node framework/specgate.mjs --selftest`;
const RUN = { verify, delta, drift: driftReport };
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(SELF);
if (isMain) {
  const args = process.argv.slice(2);
  const [sub, ...rest] = args;
  const path = rest.find((a) => !a.startsWith('--'));
  if (sub === '--selftest' && args.length === 1) selftest();
  else if (!(sub in RUN || sub === 'probe') || !path) {
    console.error(USAGE);
    process.exit(2);
  } else if (sub === 'probe') process.exit(probe(path));
  else {
    const r = RUN[sub](path);
    if (r.fatal) { console.error(r.fatal); process.exit(r.exit); }
    if (rest.includes('--json')) console.log(JSON.stringify(r, null, 2));
    else report(r);
    process.exit(r.exit);
  }
}
