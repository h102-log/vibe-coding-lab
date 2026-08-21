#!/usr/bin/env node
// spec-verify — SPEC.md가 framework/skills/sdd/SKILL.md의 «셀 수 있는» 요구를 지키는지 정적 검사.
// 판단하지 않는다: 세고, 집합 차를 내고, 종료 코드로 뱉는다 (r36).
//   node framework/spec-verify.mjs <SPEC.md 경로>          # 사람용 출력 + exit code
//   node framework/spec-verify.mjs <SPEC.md 경로> --json    # 기계용
//   node framework/spec-verify.mjs --selftest               # r32 픽스처 6장 대조
// exit 0 위반 없음 / 1 위반 있음 / 2 파일 없음·파싱 실패 — 1과 2를 반드시 가른다.
// A층(골격 독립)만 본다. 헤딩 번호·절 순서·절 제목은 검사하지 않는다.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── 표 파싱 ────────────────────────────────────────────────────────────────
// GFM 이스케이프 `\|`는 셀 구분자가 아니다 — 이걸 쪼개면 그 행만 열이 밀려 상태 열이
// 어긋나고, `선택 대기` 행 하나가 조용히 빠져 exit 1이 exit 0으로 뒤집힌다.
export const cellsOf = (l) =>
  l.trim().replace(/^\|/, '').replace(/\|$/, '')
    .split(/(?<!\\)\|/).map((s) => s.trim().replace(/\\\|/g, '|'));
const isRule = (cs) => cs.every((c) => /^:?-{2,}:?$/.test(c));

// 코드펜스 안의 줄은 예시지 산출물이 아니다 — 표·리터럴을 실물로 세면 «예시만 있는 SPEC»이 통과한다.
export function stripFences(lines) {
  let inFence = false;
  return lines.map((l) => {
    if (/^\s*(```|~~~)/.test(l)) { inFence = !inFence; return ''; }
    return inFence ? '' : l;
  });
}

export function tables(lines) {
  const out = [];
  let cur = null;
  lines.forEach((l, i) => {
    if (l.trim().startsWith('|')) {
      const cs = cellsOf(l);
      if (!cur) cur = { start: i, end: i, cols: cs.length, rows: [] };
      cur.end = i;
      if (!isRule(cs)) cur.rows.push({ line: i, cells: cs });
    } else if (cur) { out.push(cur); cur = null; }
  });
  if (cur) out.push(cur);
  return out;
}

// 미확정표 특정 — C3·C5가 쓰고, spec-delta의 병합이 «같은 표»에 U행을 붙일 때도 이걸 쓴다.
// 갈라지면 검사가 보는 표와 병합이 쓰는 표가 달라진다.
export function undecidedTables(tbls) {
  const byHeader = tbls.filter((t) => t.rows[0]?.cells.some((c) => c.includes('침묵 지점')) && t.rows[0].cells.some((c) => c.includes('상태')));
  return byHeader.length ? byHeader : tbls.filter((t) => t.rows.some((r) => r.cells.some((c) => c.includes('선택 대기'))));
}

// ── ID 토큰 ────────────────────────────────────────────────────────────────
// 문장 ID = 줄 선두(표 첫 셀 / 리스트 마커 뒤)에 오는 S1 · I12 · R3 · S7a 형태.
export const SENT_ID = /^\*{0,2}([A-Z]{1,3}\d{1,3}[a-z]?)\*{0,2}(?=[\s.):|]|$)/;
// 줄 선두 토큰 하나. C4의 정의 탐지와 아카이브 문장 계수가 같은 규칙을 써야 한다 —
// 갈라지면 «검사에서 뺀 문장 수»와 «접힌 문장 수»가 서로 다른 것을 세게 된다.
const headId = (raw) => SENT_ID.exec((raw.trim().startsWith('|') ? cellsOf(raw)[0] : raw.replace(/^\s*[-*+]\s+/, '')) ?? '')?.[1] ?? null;

// 아카이브 절 = 구현·검증이 끝나 접은 문장의 보존소. 검사 분모에서 뺀다 — 안 빼면 접는 행위가
// 곧 C4 위반이 되어 Stop 게이트가 «정리된 SPEC»을 막는다(KF5 §4-3).
// `아카이브\b`는 쓸 수 없다 — `\b`는 ASCII `\w` 기준이라 한글 뒤에서 절대 성립하지 않는다(실측).
// 같은 뜻(«아카이브»로 끝나는 낱말)의 한글 경계는 부정 전방탐색이다.
const ARCHIVE_H = /^##\s+(?:\d+[.)]\s*)?아카이브(?![가-힣])/;
export function maskArchive(lines) {
  const out = lines.slice();
  const sentences = new Set();
  let present = false, pendingInArchive = 0, inArchive = false;
  for (let i = 0; i < lines.length; i++) {
    if (ARCHIVE_H.test(lines[i])) { inArchive = true; present = true; }
    else if (inArchive && /^##\s/.test(lines[i])) inArchive = false;
    if (!inArchive) continue;
    const id = headId(lines[i]);
    if (id) sentences.add(id);
    pendingInArchive += lines[i].split('선택 대기').length - 1;
    out[i] = ''; // 줄을 지우지 않고 비운다 — 줄 번호가 밀리면 모든 메시지의 위치가 어긋난다
  }
  return { lines: out, archive: { present, sentences: sentences.size, pendingInArchive } };
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
const hasToken = (text, id) => new RegExp(`(?<![A-Za-z0-9])${esc(id)}(?![0-9A-Za-z])`).test(text);
// 지목의 «위치 표기» = `파일:줄` · `` `:12` `` · `:12-20`. C4 경고와 spec-delta의 D4가 같은 기준을 쓴다.
// POS_FILE = 그중 앵커가 가능한 «파일:줄[-끝줄]»의 캡처판(spec-anchor가 쓴다). POS가 이것의
// source를 첫 대안으로 삼아 한 소스를 공유한다 — 갈라지면 «경고는 없는데 앵커는 못 하는» 지목이 생긴다.
// /g라서 test()에 쓰면 lastIndex가 남는다. matchAll 전용이다.
export const POS_FILE = /([\w./\\-]+\.\w{1,5}):(\d+)(?:\s*[-–—]\s*(\d+))?/g;
export const POS = new RegExp(`${POS_FILE.source}|\`:\\d+\`|:\\d+\\s*[-–—]\\s*\\d+`);

// `R1~R8` · `U1-U10` · `T1–T8` 같은 범위 표기를 개별 ID로 편다. SKILL.md는 열거 형식을
// 규정하지 않으므로 범위 표기도 지목으로 인정한다.
export function expandRanges(text) {
  const set = new Set();
  for (const m of text.matchAll(/([A-Z]{1,3})(\d{1,3})\s*[~\-–—]\s*(?:([A-Z]{1,3}))?(\d{1,3})/g)) {
    const [, pre, a, pre2, b] = m;
    if (pre2 && pre2 !== pre) continue;
    const from = +a, to = +b;
    if (to < from || to - from > 60) continue;
    for (let n = from; n <= to; n++) set.add(pre + n);
  }
  return set;
}

export const mentions = (text, ids) => {
  const ranged = expandRanges(text);
  return ids.filter((id) => ranged.has(id) || hasToken(text, id));
};

// ── 검사 ──────────────────────────────────────────────────────────────────
export function inspect(text, spec) {
  const fenced = stripFences(text.split('\n'));
  // C1의 `[추론]` 계수만 마스킹 **전** 원문으로 센다 — 추론 문장이 전부 접힌 성숙한 SPEC에서
  // C1이 위양성 위반으로 pre 게이트를 막지 않게 하기 위해서다(KF5 §4-3).
  const inferMarks = fenced.join('\n').split('[추론]').length - 1;
  const { lines, archive } = maskArchive(fenced);
  text = lines.join('\n'); // 이하 모든 계수는 코드펜스·아카이브 절 밖만 본다
  const tbls = tables(lines);
  const V = [], W = []; // 위반 / 경고
  // kind = 룰 매핑용 안정 문자열, line = 아는 것만(1-based). specgate.mjs의 RULES가 이 kind로
  // 번호를 붙인다 — 메시지 문구로 룰을 추정하면 문구 수정이 곧 매핑 파손이라 필드로 싣는다.
  const violate = (c, msg, kind, line = null) => V.push({ check: c, msg, kind, line });
  const warn = (c, msg, kind, line = null) => W.push({ check: c, msg, kind, line });

  // C1 — 추론 표기 (SKILL.md:34·38). 셀 수 있는 것은 «있는가»뿐이다.
  if (inferMarks === 0) violate('C1', '`[추론]` 표기 0건 — §2가 추론 문장을 하나도 남기지 않았다', 'C1.none');

  // C2 — 점검표 10범주 + 상태 리터럴 (SKILL.md:40-53)
  const LIT = /\b(Clear|Partial|Missing)\b/;
  const checkRows = [];
  for (const t of tbls) if (t.cols === 2) for (const r of t.rows) if (/^\d{1,2}[a-z]?\.\s*\S/.test(r.cells[0])) checkRows.push(r);
  const nums = new Set(checkRows.map((r) => +r.cells[0].match(/^(\d{1,2})/)[1]));
  const missingCats = [];
  for (let n = 1; n <= 10; n++) if (!nums.has(n)) missingCats.push(n);
  const badLit = checkRows.filter((r) => !LIT.test(r.cells[1] ?? ''));
  if (checkRows.length === 0) violate('C2', '점검표 없음 — `| 범주 | 상태 |` 2열 표에 10범주가 없다', 'C2.none');
  else {
    if (missingCats.length) violate('C2', `점검표 누락 범주: ${missingCats.join(', ')}`, 'C2.missingCat');
    for (const r of badLit) violate('C2', `상태가 Clear/Partial/Missing이 아니다 — ${spec}:${r.line + 1} «${r.cells[0]}» → «${r.cells[1] ?? ''}»`, 'C2.badLiteral', r.line + 1);
  }

  // C3 — 미확정표 6열 + `선택 대기` 리터럴 (SKILL.md:64-68)
  // 표 특정은 SKILL.md:65가 문자열로 준 헤더로 한다. 헤더가 다르면 `선택 대기` 행으로 되찾는다.
  // 침묵 지점을 두 표로 쪼개 적는 SPEC이 있다 — 첫 표만 보면 나머지 표의 `선택 대기`가 C5 밖으로 샌다.
  // 헤더(SKILL.md:65 문자열)로 잡는 것이 우선이다. `선택 대기` 폴백을 같이 쓰면 §3 대조표처럼
  // 그 리터럴을 «인용»하는 표까지 미확정표로 삼켜, 거기 실린 문장 ID가 통째로 C4 분모에서 빠진다.
  const undecidedTbls = undecidedTables(tbls);
  let pendingIds = [], undecidedIds = new Set(), undecidedEnd = -1;
  if (!undecidedTbls.length) violate('C3', '미확정표 없음 — `| # | 침묵 지점 | 적용한 기본값 | 대안 | 상태 | 번복 조건 |` 6열 표가 없다', 'C3.none');
  else {
    undecidedEnd = Math.max(...undecidedTbls.map((t) => t.end));
    for (const t of undecidedTbls) {
      if (t.cols !== 6) violate('C3', `미확정표가 ${t.cols}열 — 6열이어야 한다 (${spec}:${t.start + 1})`, 'C3.badCols', t.start + 1);
      // 헤더에 «상태»를 포함하는 열이 둘이면(«기본값 상태» 등) 뒤쪽을 쓴다 — SKILL.md:65의 상태는 5열이다
      const hdr = t.rows[0].cells;
      const exact = hdr.lastIndexOf('상태');
      const si = exact >= 0 ? exact : hdr.map((c) => c.includes('상태')).lastIndexOf(true);
      const rows = t.rows.slice(1);
      for (const r of rows) undecidedIds.add(r.cells[0].replace(/\*/g, '').trim());
      for (const r of rows)
        if ((si >= 0 ? (r.cells[si] ?? '') : r.cells.join(' ')).includes('선택 대기'))
          pendingIds.push({ id: r.cells[0].replace(/\*/g, '').trim(), line: r.line });
    }
    // 상태 열을 잘못 집거나 셀이 밀리면 pending이 0이 되고 C5가 통째로 꺼진다 — 그때 침묵하지 않는다.
    if (!pendingIds.length && text.includes('선택 대기'))
      warn('C3', '`선택 대기`가 본문에는 있는데 미확정표의 상태 열에서는 잡히지 않았다 — 열 위치를 사람이 확인해야 한다', 'C3.pendingLost');
  }

  // 접힌 자리에 미확정이 섞이면 «정해지지 않은 것»이 검사 시야 밖으로 빠진다. 인용일 수도
  // 있으므로 차단이 아니라 경고다 — 축은 C3(미확정표 담당)이고 새 축을 만들지 않는다.
  if (archive.pendingInArchive)
    warn('C3', `아카이브 절에 \`선택 대기\` ${archive.pendingInArchive}건 — 미확정은 아카이브 자격이 없다`, 'C3.archivePending');

  // C4 — §1·§2 문장이 완료 전 대조에서 전건 지목됐는가 (SKILL.md:74-78)
  // 정의 = ID가 줄 선두에 처음 오는 곳. 지목 = **그 ID의 정의 줄보다 뒤**에서의 등장.
  // 대조 영역을 «마지막 정의 이후» 하나로 잡으면, 문장 ID처럼 생긴 토큰 하나가 파일 뒤쪽에
  // 있을 때 cut이 밀려 전 문장이 한꺼번에 «미지목»으로 뒤집힌다(카스케이드). ID별로 자른다.
  const defs = new Map();
  for (let i = 0; i < lines.length; i++) {
    if (undecidedTbls.some((t) => i >= t.start && i <= t.end)) continue; // 미확정표 행은 C5 몫
    const id = headId(lines[i]);
    // 미확정표 ID는 표 밖 산문에서 다시 선두에 와도 문장 정의가 아니다 (C5 몫)
    if (id && !defs.has(id) && !undecidedIds.has(id)) defs.set(id, i);
  }
  const sentIds = [...defs.keys()];
  let c4 = null;
  if (!sentIds.length) warn('C4', '문장 ID가 없다 — 판정 불가 (S1·I2 형태의 ID로 문장을 매기면 대조가 검사된다)', 'C4.noId');
  else {
    const hit = new Set(sentIds.filter((id) => mentions(lines.slice(defs.get(id) + 1).join('\n'), [id]).length));
    const miss = sentIds.filter((id) => !hit.has(id));
    c4 = { total: sentIds.length, hit: hit.size, miss, ids: sentIds };
    // 원문을 붙인다 — 문장 ID처럼 생긴 질문 라벨(`Q1 (답변 완료…)`)을 사람이 바로 가려내야 한다
    for (const id of miss)
      violate('C4', `문장 ${id}이 완료 전 대조에서 지목되지 않았다 (${spec}:${defs.get(id) + 1} «${lines[defs.get(id)].trim().slice(0, 50)}»)`, 'C4.miss', defs.get(id) + 1);
    // SKILL.md:77은 «"있을 것이다"가 아니라 어느 파일 어느 줄인지» 요구한다. ID 재등장만으로는
    // 빈 셀·«구현 안 함»도 통과하므로, 위치 표기가 없는 지목은 위반이 아니라 경고로 낸다
    // («실행 확인»·«부재로 충족»처럼 위치가 없어도 정당한 지목이 실물에 있다 — 게이트로 올리면 위양성).
    const located = new Set(mentions(lines.filter((l) => POS.test(l)).join('\n'), sentIds));
    const vague = [...hit].filter((id) => !located.has(id));
    c4.vague = vague;
    // 아카이브 후보의 재료(KF5) — «파일:줄 보유 줄 어딘가에서 언급된 활성 문장». 판정 축이 아니다.
    // 정의 줄을 제외하지 않아 «(근거: 문서:줄)»만 있는 문장도 오르는 위양성이 있다(계획서 §9-10,
    // specprobe P-4가 그 동작을 기대값으로 고정한다). 승인이 뒤에 있어 실해는 제한적이다.
    c4.located = [...hit].filter((id) => located.has(id));
    if (vague.length) warn('C4', `지목은 있으나 «파일:줄»이 없는 문장 ${vague.length}건: ${vague.join(', ')} (SKILL.md:77)`, 'C4.vague');
    // 앵커 대상 위치(spec-anchor용). **판정 축이 아니다** — 위반도 경고도 한 건 더하지 않는다.
    // 위치 표기가 있는 줄만 훑는다(ID×줄 전수 대조는 큰 SPEC에서 낭비다). 정의 줄과 그 앞은
    // 제외 — §1의 `(근거: CONTRACT.md:12)` 같은 근거 위치가 구현 위치로 오인되면 안 된다.
    // 값이 빈 배열인 키가 곧 «지목은 있으나 앵커 못 하는 문장»이다(spec-anchor의 A3).
    const positions = Object.fromEntries(sentIds.map((id) => [id, []]));
    for (let i = 0; i < lines.length; i++) {
      const ms = [...lines[i].matchAll(POS_FILE)];
      if (!ms.length) continue;
      for (const id of mentions(lines[i], sentIds)) {
        if (i <= defs.get(id)) continue;
        for (const m of ms) {
          const span = { file: m[1], start: +m[2], end: +(m[3] ?? m[2]), specLine: i + 1 };
          if (!positions[id].some((p) => p.file === span.file && p.start === span.start && p.end === span.end))
            positions[id].push(span);
        }
      }
    }
    c4.positions = positions;
  }

  // C5 — `선택 대기` 항목이 재확인 목록에 전건 나오는가 (SKILL.md:79)
  let c5 = null;
  if (pendingIds.length) {
    const numeric = pendingIds.filter((p) => /^\d+$/.test(p.id));
    if (numeric.length === pendingIds.length)
      warn('C5', `미확정 항목 ID가 순수 번호(${pendingIds.map((p) => p.id).join(', ')}) — 문서 안 재등장을 셀 수 없어 판정 불가`, 'C5.numericId');
    else {
      const ids = pendingIds.filter((p) => !/^\d+$/.test(p.id)).map((p) => p.id);
      const tail = lines.slice(undecidedEnd + 1).join('\n');
      const hit = new Set(mentions(tail, ids));
      const miss = ids.filter((id) => !hit.has(id));
      c5 = { total: ids.length, hit: hit.size, miss };
      for (const id of miss) {
        const at = pendingIds.find((p) => p.id === id).line + 1;
        violate('C5', `\`선택 대기\` 항목 ${id}이 재확인 목록에 없다 (${spec}:${at})`, 'C5.miss', at);
      }
      if (numeric.length) warn('C5', `번호 ID ${numeric.length}건은 판정에서 제외했다`, 'C5.numericExcluded');
    }
  }

  return {
    spec,
    counts: {
      inferMarks, checkRows: checkRows.length, pending: pendingIds.length,
      undecidedCols: undecidedTbls.length ? undecidedTbls.map((t) => t.cols).join('+') : null,
      // 볼륨 재료(KF5). 헤더 포함·구분선 제외 — tables()의 rows가 이미 그렇게 모은다.
      tableRows: tbls.reduce((n, t) => n + t.rows.length, 0), archive,
    },
    c4, c5, violations: V, warnings: W,
  };
}

function report(r) {
  console.log(`spec-verify ${r.spec}`);
  console.log(`  C1 [추론] 표기      : ${r.counts.inferMarks}건`);
  console.log(`  C2 점검표           : ${r.counts.checkRows}행`);
  console.log(`  C3 미확정표         : ${r.counts.undecidedCols ?? '없음'}열 · 선택 대기 ${r.counts.pending}행`);
  console.log(`  C4 문장 지목        : ${r.c4 ? `${r.c4.hit}/${r.c4.total}` : '판정 불가'}`);
  console.log(`  C5 선택 대기 재확인 : ${r.c5 ? `${r.c5.hit}/${r.c5.total}` : '판정 불가'}`);
  for (const v of r.violations) console.log(`    [위반 ${v.check}] ${v.msg}`);
  for (const w of r.warnings) console.log(`    [경고 ${w.check}] ${w.msg}`);
  console.log(`  → 위반 ${r.violations.length} · 경고 ${r.warnings.length}`);
}

function run(path) {
  let text;
  try { text = readFileSync(path, 'utf8'); } catch (e) {
    console.error(`파싱 실패: ${e.message}`);
    process.exit(2);
  }
  return inspect(text, path.split(/[\\/]/).join('/'));
}

// ── --selftest ─────────────────────────────────────────────────────────────
// r33이 만든 합성 픽스처 6장을 그대로 쓴다(읽기만 — 절대 규칙 6). 기대값은 r36 §4 표와 같다.
// F2가 유일한 «위반 0» 양성 픽스처다 — 이게 없으면 «항상 위반»으로 고장난 검사기를 못 잡는다.
const HERE = dirname(fileURLToPath(import.meta.url));
// 경고 축은 r36 §9-2에서 «파일:줄 없는 지목» 검사를 더하며 1씩 올랐다(6장 전부 S9 = 빌드 문장 하나).
// 판정 축(위반 수·C5 미제시 목록)은 그 수정 전후로 한 건도 바뀌지 않았다 — 그게 대조의 값이다.
const EXPECTED = {
  F1: { violations: 6, warnings: 1, c5miss: ['K3', 'K4', 'K5', 'K6', 'K9', 'K10'] },
  F2: { violations: 0, warnings: 1, c5miss: [] },
  F3: { violations: 8, warnings: 1, c5miss: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8'] },
  F4: { violations: 6, warnings: 1, c5miss: ['Q1', 'Q2', 'Q3', 'Q4', 'Q6', 'Q7'] },
  F5: { violations: 0, warnings: 2, c5miss: null },
  F6: { violations: 6, warnings: 1, c5miss: ['U-a', 'U-b', 'U-c', 'U-d', 'U-e', 'U-f'] },
};

// 아카이브 절은 픽스처 6장에 **없다** — 그래서 6장이 «마스킹이 새지 않는가»의 회귀가 되고,
// 새 동작은 인라인으로 밟는다(파일 신설 금지 — 개발 규칙 4, framework/smoke/는 읽기 전용이다).
export const KA = `## 1. 명시된 것
- S1. 증가 버튼을 누르면 카운터가 1 증가한다. (근거: 요청 문장)
- S2. 카운터 초기값은 0이다. (근거: 요청 문장)
### 2.2 추론으로 확정한 문장
- I1. 카운터는 음수가 되지 않는다. [추론]
### 2.3 미확정 항목
| # | 침묵 지점 | 적용한 기본값 | 대안 | 상태 | 번복 조건 |
| --- | --- | --- | --- | --- | --- |
| U1 | 카운터 상한 | 없음 | 99 고정 | 선택 대기 | 오버플로 관측 시 |
## 3. 완료 전 대조
| 문장 | 코드 위치 |
| --- | --- |
| S1 | src/counter.ts:10 |
| S2 | src/counter.ts:3 |
| I1 | 실행 확인 |
- U1. 카운터 상한 — 기본값 «없음»으로 진행 중. 확정 필요.
## 4. 아카이브
| ID | 문장(원문 그대로) | 최종 지목 | 접은 날짜 | 근거 |
| --- | --- | --- | --- | --- |
| S0 | 카운터가 화면에 렌더된다. | src/app.ts:12 | 2026-08-20 | verify 0위반 · 사용자 승인 |
`;
export const KA_PEND = KA.replace('verify 0위반 · 사용자 승인', '선택 대기');
const KA_NOHEAD = KA.split('\n').filter((l) => l !== '## 4. 아카이브').join('\n');
const kinds = (r) => [...r.violations, ...r.warnings].map((f) => f.kind).join(',');

const CASES = [
  ['V-A1 아카이브 제외', () => {
    const r = inspect(KA, 'KA');
    if (r.violations.length !== 1 || r.warnings.length !== 1) return `위반 ${r.violations.length}/1 · 경고 ${r.warnings.length}/1 — ${kinds(r)}`;
    if (r.c4.total !== 3) return `c4.total ${r.c4.total} ≠ 3 — S0이 안 빠졌다 (${r.c4.ids})`;
    const a = r.counts.archive;
    return a.present && a.sentences === 1 && a.pendingInArchive === 0 ? null : `archive ${JSON.stringify(a)}`;
  }],
  ['V-A2 접힌 선택 대기', () => {
    const r = inspect(KA_PEND, 'KA');
    if (r.violations.length !== 1 || r.warnings.length !== 2) return `위반 ${r.violations.length}/1 · 경고 ${r.warnings.length}/2 — ${kinds(r)}`;
    return r.warnings.some((w) => w.kind === 'C3.archivePending') ? null : `C3.archivePending 없음 — ${kinds(r)}`;
  }],
  // 이 케이스만 «마스킹이 없으면 판정이 달라진다»를 본다. 없으면 마스킹이 통째로 죽어 있어도 통과한다.
  ['V-A3 마스킹 차분', () => {
    const r = inspect(KA_NOHEAD, 'KA');
    if (r.counts.archive.present) return '헤딩을 지웠는데 present=true';
    if (r.violations.length !== 2) return `위반 ${r.violations.length} ≠ 2 — ${kinds(r)}`;
    return r.c4.miss.includes('S0') ? null : `C4 미지목에 S0이 없다 — miss=${r.c4.miss}`;
  }],
];

function selftest() {
  let bad = 0;
  for (const [f, exp] of Object.entries(EXPECTED)) {
    const r = run(join(HERE, 'smoke', 'runs', `r32-fixture-${f}.md`));
    const got = { violations: r.violations.length, warnings: r.warnings.length, c5miss: r.c5 ? r.c5.miss : null };
    const ok = got.violations === exp.violations && got.warnings === exp.warnings &&
      JSON.stringify(got.c5miss) === JSON.stringify(exp.c5miss);
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${f} — 위반 ${got.violations}/${exp.violations} · 경고 ${got.warnings}/${exp.warnings} · C5 미제시 ${JSON.stringify(got.c5miss)}`);
    if (!ok) console.log(`       기대 C5 미제시 ${JSON.stringify(exp.c5miss)}`);
  }
  for (const [name, fn] of CASES) {
    let why;
    try { why = fn(); } catch (e) { why = `예외: ${e.message}`; }
    if (why) bad++;
    console.log(`${why ? 'FAIL' : 'ok  '} ${name.padEnd(16)} ${why ?? ''}`);
  }
  console.log(bad ? `selftest 실패 — ${bad}건 어긋남` : `selftest 통과 — 픽스처 6장 + 인라인 ${CASES.length}건`);
  process.exit(bad ? 1 : 0);
}

// ── CLI ────────────────────────────────────────────────────────────────────
// 직접 실행일 때만 돈다 — hooks/spec-gate.mjs가 inspect()를 import하므로, 이 가드가 없으면
// 훅의 인자(`pre`)를 SPEC 경로로 읽고 exit 2를 내며 매 Write를 오차단한다.
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
if (isMain && args[0] === '--selftest' && args.length === 1) selftest();
else if (isMain) {
  const path = args.find((a) => !a.startsWith('--'));
  if (!path) {
    console.error('usage: node framework/spec-verify.mjs <SPEC.md 경로> [--json] | --selftest');
    process.exit(2);
  }
  const r = run(path);
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else report(r);
  process.exit(r.violations.length ? 1 : 0);
}
