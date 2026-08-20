#!/usr/bin/env node
// spec-delta — 기존 코드 수정의 델타 문서(SPEC.delta.md)를 정적 검사한다. D1~D5.
// 판단하지 않는다: 세고, 집합 차를 내고, 종료 코드로 뱉는다(spec-verify와 같은 성질).
//   node framework/spec-delta.mjs verify <SPEC.delta.md> [--base <SPEC.md>] [--json]
//   node framework/spec-delta.mjs --selftest
// exit 0 위반없음 / 1 위반있음 / 2 파일없음·사용법오류 — 1과 2를 반드시 가른다.
// 표 파싱·ID 토큰·위치 표기는 spec-verify.mjs의 것을 그대로 쓴다. 재구현하면 두 판정이 갈라진다.
// 병합(mergeDelta)은 여기 없다 — 라운드 2 몫이다.
import { existsSync, readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cellsOf, tables, stripFences, undecidedTables, inspect, SENT_ID, mentions, POS } from './spec-verify.mjs';

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
// 표 행도 항목이다(ADDED의 U행 = 본 SPEC 미확정표와 같은 6열). 첫 셀이 문장 ID인 행만 잡으므로
// 헤더·구분자 행은 저절로 빠진다. `row`를 실어두면 병합이 셀을 다시 쪼개지 않는다.
// names로 관심 절을 바꾼다 — 병합이 `## 대조` 절을 같은 파서로 읽는다.
function sections(lines, names = SECTIONS) {
  const out = {};
  let cur = null, item = null;
  const flush = () => { if (item) { out[cur].items.push(item); item = null; } };
  lines.forEach((l, i) => {
    const h = /^\s*#{1,6}\s+(.+?)\s*$/.exec(l);
    if (h) {
      flush();
      const name = h[1].toUpperCase();
      cur = names.includes(name) ? name : null;
      if (cur && !(cur in out)) out[cur] = { line: i, items: [] };
      return;
    }
    if (!cur) return;
    if (/^\s*[-*+]\s+/.test(l)) { flush(); item = { line: i, text: l, id: headId(l) }; }
    else if (l.trim().startsWith('|') && headId(l)) { flush(); item = { line: i, text: l, id: headId(l), row: cellsOf(l) }; }
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

  // 문장 ID 목록 — KF3의 drift가 «MODIFIED 선언됐는데 앵커 미갱신»을 보려면 개수가 아니라 ID가 필요하다.
  const idsOf = (list) => list.map((it) => it.id).filter(Boolean);
  return {
    delta: label, base: null, coldstart: cold,
    ids: { added: idsOf(added), modified: idsOf(modified), removed: idsOf(removed) },
    counts: { added: added.length, modified: modified.length, removed: removed.length, targets },
    d4, violations: V, warnings: W,
  };
}

// ── 병합 ───────────────────────────────────────────────────────────────────
// ID 기준 append/replace/삭제. 텍스트 재배치이지 의미 통합이 아니다 — 문장 간 모순은 보지 않는다
// (계획서 §2 비목표 · 개발 규칙 5). 순수 함수이고 파일 IO는 CLI가 한다.

// 콜드스타트 골격 — 본 SPEC이 없을 때. 10범주 점검표는 만들지 않는다: 상태(Clear/Partial/Missing)는
// 판단이고 기계가 채우면 «기록 없는 확정»이다(개발 규칙 5·6). 대가는 이 «델타 급» SPEC이 다음
// 새 기능 Write에서 C2에 막혀 승급을 요구받는 것이고, 그건 의도된 동작이다(계획서 §9-8).
// 날짜를 넣지 않는다 — 같은 입력에 항상 같은 출력이어야 한다. 첫 델타 날짜는 git이 안다.
function coldBase(added) {
  const of = (f) => added.filter((it) => !it.row && f(it.id ?? '')).map((it) => it.text).join('\n');
  return `# SPEC — 델타 누적

## 0. 스펙 소스 판별

- 스펙 소스: 델타 누적 · 골격: 기계 생성(spec-delta merge) · 상태 \`선택 대기\`

## 1. 명시된 것

${of((id) => !/^I/.test(id))}

## 2. 명시되지 않은 것

### 2.2 추론으로 확정한 문장

${of((id) => /^I/.test(id))}

### 2.3 미확정 항목

| # | 침묵 지점 | 적용한 기본값 | 대안 | 상태 | 번복 조건 |
| --- | --- | --- | --- | --- | --- |

## 3. 완료 전 대조
`;
}

export function mergeDelta(deltaText, baseText) {
  const dlines = stripFences(deltaText.split('\n'));
  const sec = sections(dlines);
  const added = sec.ADDED?.items ?? [], modified = sec.MODIFIED?.items ?? [], removed = sec.REMOVED?.items ?? [];
  // 대조 행은 같은 파서로 읽는다 — 델타 안에서는 헤딩이 규약이고 D1이 이미 그것을 검사한다.
  const rows = sections(dlines, ['대조'])['대조']?.items ?? [];
  const W = [];
  const cold = baseText == null;

  // 콜드스타트는 골격을 델타의 S·I로 채워 만든다. U행·대조·MODIFIED·REMOVED는 그 뒤 공통 경로가
  // 그대로 본다 — 경로를 둘로 두면 «콜드에서만 나는 버그»가 생긴다.
  const base = cold ? coldBase(added) : baseText;
  const place = cold ? added.filter((it) => it.row) : [...added];
  for (const it of added) if (!it.row && /^U/.test(it.id ?? '')) W.push(`${it.id}은 불릿이라 미확정표로 가지 못한다 — U는 6열 표 행으로 적는다`);

  const lines = base.split('\n');
  const view = stripFences(lines);   // 길이를 보존하므로 인덱스를 그대로 공유한다
  const utbls = undecidedTables(tables(view));
  const uEnd = utbls.length ? Math.max(...utbls.map((t) => t.end)) : -1;
  const inU = (i) => utbls.some((t) => i >= t.start && i <= t.end);

  // 정의 = ID가 줄 선두에 «처음» 오는 줄. 첫 등장만 세는 것이 핵심이다 — 마지막 등장을 앵커로
  // 삼으면 §3 대조표의 `| S2 | … |` 행이 앵커가 되어 새 문장이 대조표 안으로 들어간다.
  const defs = new Map();
  view.forEach((l, i) => { if (inU(i)) return; const id = headId(l); if (id && !defs.has(id)) defs.set(id, i); });

  // 편집은 인덱스로 모았다가 마지막에 한 번 재구성한다. 그때그때 splice하면 뒤 인덱스가 밀린다.
  const del = new Set(), rep = new Map(), ins = new Map();
  const put = (i, ...ls) => ins.set(i, [...(ins.get(i) ?? []), ...ls]);
  const END = lines.length - 1;

  // REMOVED — 그 ID가 줄 선두에 오는 줄 전부. 정의 줄·대조 행·재확인 줄이 한 규칙으로 걷힌다.
  const rmIds = new Set(removed.map((it) => it.id).filter(Boolean));
  if (rmIds.size) view.forEach((l, i) => { const id = headId(l); if (id && rmIds.has(id)) del.add(i); });

  // MODIFIED — 정의 줄을 델타 문장으로 교체. 베이스에 없으면 append로 강등한다: 병합은 전 입력에서
  // 결정론적으로 완료돼야 한다. ponytail: 델타의 ` — 대상 `src/x.ts:f`` 표기는 떼지 않고 그대로
  // 옮긴다. 떼려면 구분자 판단이 들어가고, 남아도 «어디를 고쳤는가» 기록이라 해롭지 않다.
  for (const it of modified) {
    if (it.id && defs.has(it.id) && !del.has(defs.get(it.id))) rep.set(defs.get(it.id), it.text);
    else { place.push(it); W.push(`MODIFIED ${it.id ?? '(ID 없음)'}을 본 SPEC에서 찾지 못해 새 문장으로 붙였다`); }
  }

  // ADDED 배치 — 앵커 사슬: 같은 접두어의 마지막 정의 → 아무 접두어의 마지막 정의 → 파일 끝.
  // 헤딩 텍스트는 앵커로 쓰지 않는다(§0 골격이 프로젝트마다 다르다 — spec-verify의 A층 원칙).
  const lastDef = (f) => { let b = -1; for (const [id, i] of defs) if (f(id) && i > b) b = i; return b; };
  for (const it of place) {
    if (it.row) {
      if (uEnd >= 0) put(uEnd, it.text);
      else {
        put(END, '', '| # | 침묵 지점 | 적용한 기본값 | 대안 | 상태 | 번복 조건 |', '| --- | --- | --- | --- | --- | --- |', it.text);
        W.push('미확정표가 없어 파일 끝에 새로 만들었다');
      }
      continue;
    }
    const pre = (it.id ?? '')[0];
    let at = pre ? lastDef((id) => id[0] === pre) : -1;
    if (at < 0) at = lastDef(() => true);
    put(at < 0 ? END : at, it.text);
  }

  // 대조 표 — 미확정표를 뺀 표 중 «첫 열이 문장 ID인 마지막 표». 같은 ID의 기존 행은 교체한다
  // (MODIFIED로 구현 위치가 옮겨간 경우 낡은 위치가 남으면 안 된다).
  if (rows.length) {
    const cmp = tables(view).filter((t) => !utbls.includes(t)).reverse()
      .find((t) => t.rows.some((r) => SENT_ID.test(r.cells[0] ?? '')));
    let at = cmp ? cmp.end : END;
    if (!cmp) { put(END, '', '| 문장 | 코드 위치 |', '| --- | --- |'); W.push('대조 표가 없어 파일 끝에 새로 만들었다'); }
    for (const r of rows) {
      const hit = cmp?.rows.find((x) => (SENT_ID.exec(x.cells[0] ?? '') ?? [])[1] === r.id);
      if (hit && !del.has(hit.line)) rep.set(hit.line, r.text);
      else put(at, r.text);
    }
  }

  // 재확인 목록 — U를 새로 넣었으면 §3.2에도 한 줄. 이게 없으면 병합 직후 SPEC이 C5 위반이 되고,
  // 아래 완료 조건이 그것을 잡아 병합 자체가 실패한다. 목록 특정도 헤딩이 아니라 «미확정표 이후의
  // 마지막 U 불릿»으로 한다.
  const newU = place.filter((it) => it.row);
  if (newU.length) {
    let at = -1;
    for (let i = uEnd + 1; i < view.length; i++)
      if (/^\s*[-*+]\s/.test(view[i]) && /^U/.test(headId(view[i]) ?? '')) at = i;
    if (at < 0) { put(END, '', '### 3.2 재확인 목록 (`선택 대기`)', ''); at = END; }
    for (const it of newU) put(at, `- ${it.row[0]}. ${it.row[1]} — 기본값: «${it.row[2]}». 확정 필요.`);
  }

  const out = [];
  lines.forEach((l, i) => {
    if (!del.has(i)) out.push(rep.has(i) ? rep.get(i) : l);
    if (ins.has(i)) out.push(...ins.get(i));
  });
  // 마크다운 파일은 개행 하나로 끝난다 — 파일 끝에 append하면 그게 사라진다.
  const text = out.join('\n').replace(/\s*$/, '') + '\n';

  // 완료 조건 — 병합이 본 SPEC을 «더 나쁘게» 만들지 않는가. check별 위반 수가 하나라도 늘면 실패다.
  // «위반 0»은 요구하지 않는다: 실물 SPEC은 대개 위반을 안고 있고(점검표 없는 «델타 급» SPEC이
  // 대표다) 그걸 조건으로 걸면 모든 병합이 거부된다. 콜드스타트는 before를 빈 문서로 재서 같은
  // 규칙 하나로 덮는다.
  const tally = (t) => inspect(t, 'x').violations.reduce((a, v) => ((a[v.check] = (a[v.check] ?? 0) + 1), a), {});
  const before = tally(baseText ?? ''), after = tally(text);
  const worse = Object.keys(after).filter((k) => after[k] > (before[k] ?? 0));
  if (worse.length) throw new Error(`병합이 위반을 늘렸다: ${worse.map((k) => `${k} ${before[k] ?? 0}→${after[k]}`).join(' · ')}`);

  return { text, warnings: W };
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

function load(deltaPath, basePath) {
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
  // 표시용 경로는 여기서 한 번만 정규화한다 — 호출부가 각자 쪼개면 갈라진다.
  const norm = (x) => x.split(/[\\/]/).join('/');
  return { dtext, btext, bp, base: norm(bp), label: norm(deltaPath) };
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

// ── merge 케이스(M) ─────────────────────────────────────────────────────────
// mkdtemp 실파일 + 실프로세스로 돈다 — inspectDelta·mergeDelta를 직접 부르면 CLI 인자 파싱 버그가
// 전건 통과 상태로 숨는다(r39 §2에서 실제로 그랬다). spawnSync는 {status, stdout, stderr}를 그냥 준다.
const SELF = fileURLToPath(import.meta.url);
const cli = (dir, argv) => spawnSync(process.execPath, [SELF, ...argv], { encoding: 'utf8', cwd: dir });
const wf = (d, f, t) => writeFileSync(join(d, f), t);
const rf = (d, f) => (existsSync(join(d, f)) ? readFileSync(join(d, f), 'utf8') : null);
// «있는가»가 아니라 «어디에 놓였는가»를 본다 — 앵커가 틀리면 문장이 엉뚱한 절로 가는데 그래도
// 위반은 0일 수 있다(검사는 절을 모른다). 순서가 그것을 잡는 값싼 방법이다.
const ordered = (s, ...parts) => {
  let at = -1;
  for (const p of parts) {
    const i = s.indexOf(p);
    if (i < 0) return `«${p}» 없음`;
    if (i < at) return `«${p}»가 앞 항목보다 먼저 나온다`;
    at = i;
  }
  return null;
};

// ADDED S·I·U 각 1 — 웜에서는 접두어별 앵커를, 콜드에서는 골격 조립을 한 픽스처로 덮는다.
const DU = `# DELTA — 쿠폰을 붙일 수 있게

## ADDED
- S3. 쿠폰이 이미 적용돼 있으면 두 번째 쿠폰을 거부한다. (근거: 사용자, 2026-08-19)
- I4. 쿠폰 코드는 대소문자를 구분하지 않는다. \`[추론]\`
| U5 | 만료 쿠폰 표시 | 회색 처리 | 숨김 | 선택 대기 | 사용자 문의 1건 |

## MODIFIED

## REMOVED

## 대조
| 문장 | 코드 위치 |
| --- | --- |
| S3 | src/coupon.ts:12 |
| I4 | src/coupon.ts:30 |
`;

const D_BAD = edit(V1, '| S2 | src/cart.ts:31 |\n', '');   // V6과 같은 재료 — D4 위반
const D_GHOST = edit(V1, /S2/g, 'S7');                     // MODIFIED 대상이 본 SPEC에 없다

const seedMini = (d, delta) => { wf(d, 'SPEC.md', MINI); wf(d, 'SPEC.delta.md', delta); return ['merge', 'SPEC.delta.md']; };

// [이름, 준비(dir) → argv, 기대 exit, 검사(r, dir) → 어긋난 이유 또는 null]
const MCASES = [
  ['M1 웜 ADDED S/I/U', (d) => seedMini(d, DU), 0,
    (r, d) => ordered(rf(d, 'SPEC.md'), 'S2. 수량이', 'S3. 쿠폰이', 'I4. 쿠폰 코드', '| U5 |', '| S3 | src/coupon.ts:12 |')
      ?? (rf(d, 'SPEC.delta.md') ? '델타가 남아 있다' : null)],

  ['M2 MODIFIED 교체', (d) => seedMini(d, V1), 0,
    (r, d) => {
      const s = rf(d, 'SPEC.md');
      if (!s.includes('항목과 쿠폰을 함께 제거한다')) return '새 문장이 없다';
      return s.includes('S2. 수량이 0이면 항목을 제거한다.') ? '옛 문장이 남아 있다' : null;
    }],

  ['M3 REMOVED 삭제', (d) => seedMini(d, V1), 0,
    (r, d) => (rf(d, 'SPEC.md').includes('| U1 |') ? 'U1 행이 남아 있다' : null)],

  ['M4 콜드스타트 생성', (d) => { wf(d, 'SPEC.delta.md', DU); return ['merge', 'SPEC.delta.md']; }, 0,
    (r, d) => {
      const s = rf(d, 'SPEC.md');
      if (!s) return 'SPEC.md가 생기지 않았다';
      if (/Clear|Partial|Missing/.test(s)) return '점검표를 만들었다 — 판단은 기계 몫이 아니다';
      return ordered(s, 'S3. 쿠폰이', 'I4. 쿠폰 코드', '| U5 |', '| S3 | src/coupon.ts:12 |', '- U5.');
    }],

  ['M5 위반 델타 거부', (d) => seedMini(d, D_BAD), 1,
    (r, d) => (rf(d, 'SPEC.md') !== MINI ? 'SPEC.md가 바뀌었다'
      : rf(d, 'SPEC.delta.md') !== D_BAD ? '델타가 바뀌었다'
        : /D4/.test(r.stdout + r.stderr) ? null : 'D4를 말하지 않았다')],

  ['M6 델타 파일 없음', () => ['merge', '없는-델타.md'], 2, () => null],

  ['M7 유령 MODIFIED', (d) => seedMini(d, D_GHOST), 0,
    (r, d) => (!rf(d, 'SPEC.md').includes('S7. 수량이') ? 'S7이 붙지 않았다'
      : /경고/.test(r.stderr) ? null : '강등 경고가 없다')],

  ['M8 U행 → 표+재확인', (d) => seedMini(d, DU), 0,
    (r, d) => {
      const s = rf(d, 'SPEC.md');
      const c5 = inspect(s, 'x').violations.filter((v) => v.check === 'C5').length;
      return ordered(s, '| U5 | 만료 쿠폰 표시', '- U5.') ?? (c5 > 1 ? `C5 위반이 ${c5}건으로 늘었다` : null);
    }],

  ['M9 --dry-run', (d) => [...seedMini(d, DU), '--dry-run'], 0,
    (r, d) => (!r.stdout.includes('S3. 쿠폰이') ? '병합 결과가 stdout에 없다'
      : rf(d, 'SPEC.md') !== MINI ? 'SPEC.md가 바뀌었다'
        : rf(d, 'SPEC.delta.md') !== DU ? '델타가 지워졌다' : null)],
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

  const dir = mkdtempSync(join(tmpdir(), 'spec-delta-'));
  try {
    for (const [name, prep, want, check] of MCASES) {
      for (const f of ['SPEC.md', 'SPEC.delta.md']) rmSync(join(dir, f), { force: true });
      const r = cli(dir, prep(dir));
      const why = r.status !== want
        ? `exit=${r.status} (기대 ${want}) ${(r.stderr ?? '').trim().split('\n')[0].slice(0, 46)}`
        : check(r, dir);
      if (why) bad++;
      console.log(`${why ? 'FAIL' : 'ok  '} ${name.padEnd(20)} ${why ?? `exit=${r.status}`}`);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }

  console.log(bad ? `selftest 실패 — ${bad}건 어긋남` : `selftest 통과 — ${CASES.length + MCASES.length}건 전건 일치`);
  process.exit(bad ? 1 : 0);
}

// ── CLI ────────────────────────────────────────────────────────────────────
// 직접 실행일 때만 돈다 — 라운드 3의 spec-gate가 inspectDelta·mergeDelta를 import한다.
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
// 값을 먹는 플래그를 «명시»한다. r39 §2의 «--base가 없으면 첫 인자를 삼킨다» 버그는 indexOf+skip
// 트릭이 값 유무를 추측해서 났다(spec-interview.mjs가 먼저 이 방식으로 옮겼다).
const VALUED = new Set(['base']);

function usage() {
  console.error('usage: node framework/spec-delta.mjs verify <SPEC.delta.md> [--base <SPEC.md>] [--json]');
  console.error('       node framework/spec-delta.mjs merge  <SPEC.delta.md> [--base <SPEC.md>] [--dry-run]');
  console.error('       node framework/spec-delta.mjs --selftest');
  process.exit(2);
}

if (isMain && args[0] === '--selftest' && args.length === 1) selftest();
else if (isMain) {
  const flags = {}, pos = [];
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('--')) { pos.push(a); continue; }
    const k = a.slice(2);
    if (VALUED.has(k)) flags[k] = args[++i]; else flags[k] = true;
  }
  if (!['verify', 'merge'].includes(args[0]) || !pos[0] || ('base' in flags && !flags.base)) usage();

  const { dtext, btext, bp, base, label } = load(pos[0], flags.base ?? null);
  const r = inspectDelta(dtext, btext, label);
  r.base = btext == null ? null : base;

  if (args[0] === 'verify') {
    if (flags.json) console.log(JSON.stringify(r, null, 2));
    else report(r);
    process.exit(r.violations.length ? 1 : 0);
  }

  // merge — 위반이 하나라도 있으면 파일을 건드리지 않는다. 1(위반)과 2(실패)를 가른다.
  if (r.violations.length) {
    report(r);
    console.error('위반이 있어 병합하지 않았다 — 고친 뒤 다시 돌려라.');
    process.exit(1);
  }
  let m;
  try { m = mergeDelta(dtext, btext); } catch (e) {
    console.error(`병합 실패: ${e.message} — ${label}는 그대로 뒀다`);
    process.exit(2);
  }
  for (const w of m.warnings) console.error(`  [경고] ${w}`);
  if (flags['dry-run']) { console.log(m.text); process.exit(0); }
  // 쓰기 성공 뒤 삭제가 실패하면 델타가 남아 다음 merge가 중복 병합을 시도한다 — 조용히 넘기지
  // 않고 exit 2로 사람에게 넘긴다.
  try { writeFileSync(bp, m.text); rmSync(pos[0]); } catch (e) {
    console.error(`병합 실패: ${e.message} — ${label}는 그대로 뒀다`);
    process.exit(2);
  }
  console.log(`병합 완료 — ${base} (ADDED ${r.counts.added} · MODIFIED ${r.counts.modified} · REMOVED ${r.counts.removed}) · ${label} 삭제`);
}
