#!/usr/bin/env node
// spec-delta — 기존 코드 수정의 델타 문서(SPEC.delta.md)를 정적 검사한다. D1~D5.
// 판단하지 않는다: 세고, 집합 차를 내고, 종료 코드로 뱉는다(spec-verify와 같은 성질).
//   node framework/spec-delta.mjs verify <SPEC.delta.md> [--base <SPEC.md>] [--json]
//   node framework/spec-delta.mjs --selftest
// exit 0 위반없음 / 1 위반있음 / 2 파일없음·사용법오류 — 1과 2를 반드시 가른다.
// 표 파싱·ID 토큰·위치 표기는 spec-verify.mjs의 것을 그대로 쓴다. 재구현하면 두 판정이 갈라진다.
// 병합(mergeDelta)은 여기 없다 — 라운드 2 몫이다.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cellsOf, stripFences, SENT_ID, mentions, POS } from './spec-verify.mjs';

// MODIFIED 대상 = `경로:심볼`. 심볼은 식별자(점 경로 허용) 또는 `*`(심볼 없는 설정 파일 등).
// 구현 전에는 줄 번호가 없다 — 심볼이 그 시점에 존재하는 유일한 안정 핸들이고, 줄 지목은 D4 몫이다.
const TARGET = /`[\w./-]+\.\w{1,5}:(?:[A-Za-z_$][\w$.]*|\*)`/;
const SECTIONS = ['ADDED', 'MODIFIED', 'REMOVED'];

// 줄 선두의 문장 ID — 리스트 마커 뒤 / 표 첫 셀. spec-verify의 C4 정의 수집과 같은 규칙이다.
function headId(raw) {
  const head = raw.trim().startsWith('|') ? cellsOf(raw)[0] : raw.replace(/^\s*[-*+]\s+/, '');
  const m = SENT_ID.exec(head ?? '');
  return m ? m[1] : null;
}

// 절 = 헤딩 줄 다음부터 다음 헤딩 전까지. 헤딩 레벨·번호는 보지 않는다(spec-verify의 A층 원칙 준용).
// 항목은 `- `로 시작하는 불릿 블록 하나 — 이어지는 줄까지 같은 항목이다.
function sections(lines) {
  const out = {};
  let cur = null, item = null;
  const flush = () => { if (item) { out[cur].items.push(item); item = null; } };
  lines.forEach((l, i) => {
    const h = /^\s*#{1,6}\s+(.+?)\s*$/.exec(l);
    if (h) {
      flush();
      const name = h[1].toUpperCase();
      cur = SECTIONS.includes(name) ? name : null;
      if (cur && !(cur in out)) out[cur] = { line: i, items: [] };
      return;
    }
    if (!cur) return;
    if (/^\s*[-*+]\s+/.test(l)) { flush(); item = { line: i, text: l, id: headId(l) }; }
    else if (item && l.trim()) item.text += '\n' + l;
    else flush();
  });
  flush();
  return out;
}

// 본 SPEC의 ID 공간 — 문장 정의 + 미확정표 U행. D3(충돌)·D5(실존)가 이 집합을 쓴다.
function baseIds(text) {
  const ids = new Set();
  for (const l of stripFences(text.split('\n'))) { const id = headId(l); if (id) ids.add(id); }
  return ids;
}

export function inspectDelta(deltaText, baseText, label = 'SPEC.delta.md') {
  const lines = stripFences(deltaText.split('\n'));
  const sec = sections(lines);
  const cold = baseText == null;
  const base = cold ? new Set() : baseIds(baseText);
  const V = [], W = [];
  const violate = (c, msg) => V.push({ check: c, msg });
  const warn = (c, msg) => W.push({ check: c, msg });
  const at = (it) => `${label}:${it.line + 1}`;

  // D1 — 3절 구조. 빈 절은 허용하되 절 자체는 필수다. 코드펜스 안 헤딩은 stripFences가 이미 지웠다
  // (예시만 있는 델타가 통과하면 D2~D5가 통째로 빈손 판정이 된다).
  for (const s of SECTIONS) if (!(s in sec)) violate('D1', `\`## ${s}\` 절이 없다`);

  const items = (s) => sec[s]?.items ?? [];
  const added = items('ADDED'), modified = items('MODIFIED'), removed = items('REMOVED');

  // D2 — MODIFIED가 «구현 전 열거»라는 행위를 강제한다. 재는 것은 열거의 완전성이 아니다.
  let targets = 0;
  for (const it of modified) {
    if (TARGET.test(it.text)) targets++;
    else violate('D2', `MODIFIED 항목에 대상 \`경로:심볼\`이 없다 (${at(it)} «${it.text.split('\n')[0].trim().slice(0, 40)}»)`);
  }

  // D3 — ID 규약. 전부 경고다: 번호 공간이 어긋나도 델타 자체의 대조는 검사할 수 있다.
  // 연번은 강제하지 않는다 — 병합 이력이 쌓이면 유지 불가능하고, 값은 «본 SPEC과 같은 ID 공간»에 있다.
  for (const [name, list] of [['ADDED', added], ['MODIFIED', modified], ['REMOVED', removed]])
    for (const it of list) {
      if (!it.id) { warn('D3', `${name} 항목에 문장 ID가 없다 (${at(it)}) — ID가 없으면 D4 대조 분모에서 빠진다`); continue; }
      if (!/^[SIU]\d/.test(it.id)) warn('D3', `ID 접두어가 S/I/U가 아니다: ${it.id} (${at(it)})`);
      if (cold) continue;   // 대조할 본 SPEC이 없다 — 충돌·실존은 판정 대상이 아니다
      if (name === 'ADDED' && base.has(it.id)) warn('D3', `ADDED ${it.id}이 본 SPEC에 이미 있다 — 번호 충돌 (${at(it)})`);
      if (name === 'MODIFIED' && !base.has(it.id)) warn('D3', `MODIFIED ${it.id}이 본 SPEC에 없다 (${at(it)})`);
    }

  // D4 — C4의 델타 범위판. ADDED의 `U*`는 제외한다: 미확정 항목은 구현 대조가 성립하지 않는다.
  const defs = new Map();
  for (const it of added) if (it.id && !/^U/.test(it.id) && !defs.has(it.id)) defs.set(it.id, it.line);
  for (const it of modified) if (it.id && !defs.has(it.id)) defs.set(it.id, it.line);
  const ids = [...defs.keys()];
  let d4 = null;
  if (!ids.length) warn('D4', '대조 대상 문장이 없다 — 판정 불가 (ADDED·MODIFIED에 S/I ID를 매기면 대조가 검사된다)');
  else {
    // 정의 줄 «이후»만 본다. 통짜로 자르면 ID 하나가 밀려 전건이 미지목으로 뒤집힌다(spec-verify.mjs 참조).
    const hit = new Set(ids.filter((id) => mentions(lines.slice(defs.get(id) + 1).join('\n'), [id]).length));
    const miss = ids.filter((id) => !hit.has(id));
    const located = new Set(mentions(lines.filter((l) => POS.test(l)).join('\n'), ids));
    const vague = [...hit].filter((id) => !located.has(id));
    d4 = { total: ids.length, hit: hit.size, miss, vague };
    for (const id of miss) violate('D4', `${id}이 «## 대조»에서 지목되지 않았다 (${label}:${defs.get(id) + 1})`);
    // C4와 같은 한계를 상속한다 — 재는 것은 «ID를 다시 적었는가»다. 위치 없는 지목은 경고에 그친다.
    if (vague.length) warn('D4', `지목은 있으나 «파일:줄»이 없는 문장 ${vague.length}건: ${vague.join(', ')}`);
  }

  // D5 — REMOVED는 본 SPEC에 실존하는 ID만 지울 수 있다(병합의 전제조건).
  for (const it of removed) {
    if (!it.id) continue;   // ID 부재는 D3이 이미 말했다
    if (cold) warn('D5', `콜드스타트라 REMOVED ${it.id}의 실존을 판정할 수 없다`);
    else if (!base.has(it.id)) violate('D5', `REMOVED ${it.id}이 본 SPEC에 없다 (${at(it)})`);
  }

  return {
    delta: label, base: null, coldstart: cold,
    counts: { added: added.length, modified: modified.length, removed: removed.length, targets },
    d4, violations: V, warnings: W,
  };
}

function report(r) {
  const d5bad = r.violations.filter((v) => v.check === 'D5').length;
  console.log(`spec-delta ${r.delta}${r.base ? ` (base: ${r.base})` : ' (콜드스타트 — 본 SPEC 없음)'}`);
  console.log(`  D1 3절 구조       : ADDED ${r.counts.added} · MODIFIED ${r.counts.modified} · REMOVED ${r.counts.removed}`);
  console.log(`  D2 대상 파일:심볼 : ${r.counts.targets}/${r.counts.modified}`);
  console.log(`  D3 ID 규약        : 경고 ${r.warnings.filter((w) => w.check === 'D3').length}건`);
  console.log(`  D4 델타 대조      : ${r.d4 ? `${r.d4.hit}/${r.d4.total}` : '판정 불가'}`);
  console.log(`  D5 REMOVED 실존   : ${r.coldstart ? '판정 불가' : `${r.counts.removed - d5bad}/${r.counts.removed}`}`);
  for (const v of r.violations) console.log(`    [위반 ${v.check}] ${v.msg}`);
  for (const w of r.warnings) console.log(`    [경고 ${w.check}] ${w.msg}`);
  console.log(`  → 위반 ${r.violations.length} · 경고 ${r.warnings.length}`);
}

function run(deltaPath, basePath) {
  let dtext;
  try { dtext = readFileSync(deltaPath, 'utf8'); } catch (e) {
    console.error(`읽기 실패: ${e.message}`);
    process.exit(2);
  }
  // --base 생략 시 델타 옆의 SPEC.md. 그것도 없으면 콜드스타트 — «본 SPEC이 아직 없다»는 정상 상태다.
  // 반대로 명시한 --base가 없는 것은 사용법 오류이므로 조용히 콜드스타트로 넘기지 않는다.
  const bp = basePath ?? join(dirname(resolve(deltaPath)), 'SPEC.md');
  if (basePath && !existsSync(bp)) {
    console.error(`--base 파일이 없다: ${basePath}`);
    process.exit(2);
  }
  const btext = existsSync(bp) ? readFileSync(bp, 'utf8') : null;
  const r = inspectDelta(dtext, btext, deltaPath.split(/[\\/]/).join('/'));
  r.base = btext == null ? null : bp.split(/[\\/]/).join('/');
  return r;
}

// ── --selftest ─────────────────────────────────────────────────────────────
// 인라인 픽스처만 쓴다 — 새 픽스처 디렉터리를 만들지 않고, 실물 스모크는 읽지도 않는다.
// V2~V7은 V1을 한 군데만 고쳐 만든다: «V1과 무엇이 다른가»가 곧 그 케이스의 정의다.
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

const V1 = `# DELTA — 쿠폰 중복 적용을 막아줘

## ADDED
- S3. 쿠폰이 이미 적용돼 있으면 두 번째 쿠폰을 거부한다. (근거: 사용자, 2026-08-19)

## MODIFIED
- S2. 수량이 0이면 항목과 쿠폰을 함께 제거한다 — 대상 \`src/cart.ts:setQty\` (근거: 사용자, 2026-08-19)

## REMOVED
- U1. 기각 사유: 재고 기능을 이번 범위에서 뺀다.

## 대조
| 문장 | 코드 위치 |
| --- | --- |
| S3 | src/coupon.ts:12 |
| S2 | src/cart.ts:31 |
`;

// 치환이 안 먹으면 그 케이스는 조용히 V1이 되고 selftest가 자기 자신을 속인다.
const edit = (s, a, b) => {
  const r = s.replace(a, b);
  if (r === s) throw new Error(`픽스처 치환 실패: ${a}`);
  return r;
};

const V5 = `# DELTA — 태그를 붙일 수 있게

## ADDED
- 사용자가 항목에 태그를 붙일 수 있다. (근거: 사용자, 2026-08-19)

## MODIFIED

## REMOVED

## 대조
| 문장 | 코드 위치 |
| --- | --- |
`;

const V9 = `# DELTA — 예시만 있는 델타

\`\`\`markdown
## ADDED
- S3. 무언가 한다.
## MODIFIED
## REMOVED
\`\`\`

## 대조
| 문장 | 코드 위치 |
| --- | --- |
`;

const CASES = [
  ['V1 정상',            V1,                                                          MINI, { exit: 0, viol: [],     warn: [] }],
  ['V2 REMOVED 절 없음', edit(V1, /## REMOVED\n- U1[^\n]*\n\n/, ''),                   MINI, { exit: 1, viol: ['D1'], warn: [] }],
  ['V3 대상 없음',       edit(V1, ' — 대상 \`src/cart.ts:setQty\`', ' — 대상 setQty'), MINI, { exit: 1, viol: ['D2'], warn: [] }],
  ['V4 ID 충돌',         edit(V1, /S3/g, 'S1'),                                       MINI, { exit: 0, viol: [],     warn: ['D3'] }],
  ['V5 ID 없음·콜드',    V5,                                                          null, { exit: 0, viol: [],     warn: ['D3', 'D4'] }],
  ['V6 대조 누락',       edit(V1, '| S2 | src/cart.ts:31 |\n', ''),                    MINI, { exit: 1, viol: ['D4'], warn: [] }],
  ['V7 REMOVED 유령',    edit(V1, '- U1. 기각', '- S9. 기각'),                         MINI, { exit: 1, viol: ['D5'], warn: [] }],
  ['V8 콜드 + REMOVED',  V1,                                                          null, { exit: 0, viol: [],     warn: ['D5'] }],
  ['V9 펜스 안 헤딩',    V9,                                                          MINI, { exit: 1, viol: ['D1'], warn: ['D4'] }],
];

function selftest() {
  let bad = 0;
  for (const [name, delta, base, exp] of CASES) {
    const r = inspectDelta(delta, base, 'fixture.md');
    const got = {
      exit: r.violations.length ? 1 : 0,
      viol: [...new Set(r.violations.map((v) => v.check))].sort(),
      warn: [...new Set(r.warnings.map((w) => w.check))].sort(),
    };
    const ok = got.exit === exp.exit &&
      JSON.stringify(got.viol) === JSON.stringify(exp.viol) &&
      JSON.stringify(got.warn) === JSON.stringify(exp.warn);
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(20)} exit=${got.exit}/${exp.exit} · 위반 ${JSON.stringify(got.viol)} · 경고 ${JSON.stringify(got.warn)}`);
    if (!ok) console.log(`       기대 위반 ${JSON.stringify(exp.viol)} · 경고 ${JSON.stringify(exp.warn)}`);
  }
  console.log(bad ? `selftest 실패 — ${bad}건 어긋남` : `selftest 통과 — ${CASES.length}건 전건 일치`);
  process.exit(bad ? 1 : 0);
}

// ── CLI ────────────────────────────────────────────────────────────────────
// 직접 실행일 때만 돈다 — 라운드 3의 spec-gate가 inspectDelta를 import한다(spec-verify와 같은 가드).
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
if (isMain && args[0] === '--selftest' && args.length === 1) selftest();
else if (isMain) {
  const rest = args.slice(1);
  const bi = rest.indexOf('--base');
  const basePath = bi >= 0 ? rest[bi + 1] : null;
  const skip = bi >= 0 ? bi + 1 : -1;   // --base 가 없으면 -1+1 = 0 이 되어 첫 인자를 삼킨다
  const path = rest.filter((a, i) => !a.startsWith('--') && i !== skip)[0];
  if (args[0] !== 'verify' || !path || (bi >= 0 && !basePath)) {
    console.error('usage: node framework/spec-delta.mjs verify <SPEC.delta.md> [--base <SPEC.md>] [--json] | --selftest');
    process.exit(2);
  }
  const r = run(path, basePath);
  if (rest.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else report(r);
  process.exit(r.violations.length ? 1 : 0);
}
