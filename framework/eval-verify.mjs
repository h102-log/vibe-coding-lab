#!/usr/bin/env node
// eval-verify — EVAL.md(평가 매니페스트)가 EDD 계약을 지키는지 정적 검사.
// 세고, 대조하고, 종료 코드로 뱉는다 — **러너를 돌리지 않는다**(planedd4). 실행 판정은
// eval-run(planedd5)이 남긴 스냅샷을 읽기만 한다(Stop 훅은 타임아웃 fail-open — 설계 계약 5).
//   node framework/eval-verify.mjs <EVAL.md 경로> [--pre|--stop] [--json]
//   node framework/eval-verify.mjs --selftest
// exit 0 위반 없음 / 1 위반 있음 / 2 EVAL.md 파일 없음·사용법 오류.
// EVAL.md **내용** 파싱 실패는 2가 아니라 E1 위반(exit 1)이고, 스냅샷·락의 부재·파싱 실패도
// finding이지 2가 아니다(spec-verify 선례 — 1과 2를 반드시 가른다).
// ⚠ E7이 재는 것은 C4와 같은 계열의 한계다 — «사유를 적는 행위»지 사유의 내용이 아니다.
//   개정 행 한 줄이면 어떤 수정이든 reason 단계를 통과한다.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  SENT_ID, cellsOf, stripFences, maskArchive, tables, undecidedTables, inspect, KA,
} from './spec-verify.mjs';

// ── h8 — 문장·파일 공통 해시 규약 (규약 하나, 함수 하나 — planedd3 §3-3) ────
// judge.mjs frozen과 같은 «정규화 후 해시» 계열. 보안이 아니라 변경 감지 장치다.
export const hash8 = (s) => createHash('sha256').update(s.replace(/\r\n/g, '\n').trim()).digest('hex').slice(0, 8);
// 정의 줄 정규화 — 리스트 마커 뒤부터 줄 끝까지 원문 전체(ID·근거 꼬리·백틱 포함)를 해시 대상으로.
export const canonical = (line) => line.replace(/^\s*[-*+]\s+/, '').replace(/\r/g, '').trim();

// 사본: spec-verify.mjs:57 — 그쪽이 바뀌면 여기도 (export가 아니라서다. export 추가는 수정이라 금지)
const headId = (raw) => SENT_ID.exec((raw.trim().startsWith('|') ? cellsOf(raw)[0] : raw.replace(/^\s*[-*+]\s+/, '')) ?? '')?.[1] ?? null;

// ── EVAL.md 파싱 ───────────────────────────────────────────────────────────
// 헤딩은 번호 접두 허용 + 한글 경계는 부정 전방탐색 — 한글 뒤 `\b`는 절대 성립하지 않는다(r50 §2-1).
// 판정 대상은 본표 셀로 한정한다 — 주석·산문 속 ID 리터럴은 세지 않는다(planedd3 §3-1).
const REQ_COLS = ['ID', '근거', '근거 해시', '무엇을 어떻게 재나', '테스트', '승인'];

export function parseEval(evalText) {
  const lines = stripFences(evalText.split('\n'));
  const secOf = (name) => {
    const re = new RegExp(`^##\\s+(?:\\d+[.)]\\s*)?${name}(?![가-힣])`);
    const s = lines.findIndex((l) => re.test(l));
    if (s < 0) return null;
    let e = lines.length;
    for (let i = s + 1; i < lines.length; i++) if (/^##\s/.test(lines[i])) { e = i; break; }
    return { start: s, end: e };
  };
  const tbls = tables(lines);
  const itemsSec = secOf('평가 항목');
  // 본표 = 절 안의 **첫** 표(planedd3 §3-1) — 절이 없으면 표도 없다.
  const main = itemsSec ? (tbls.find((t) => t.start > itemsSec.start && t.start < itemsSec.end) ?? null) : null;

  let cols = null;
  const items = [];
  if (main) {
    const hdr = main.rows[0]?.cells ?? [];
    cols = {};
    const claimed = new Set();
    // 긴 이름부터 — «근거 해시»가 자기 열을 먼저 차지해야 «근거»가 엉뚱한 열을 잡지 않는다.
    for (const name of [...REQ_COLS].sort((a, b) => b.length - a.length)) {
      const i = hdr.findIndex((c, j) => !claimed.has(j) && c.includes(name));
      if (i >= 0) { cols[name] = i; claimed.add(i); }
    }
    const cell = (r, name) => (name in cols ? (r.cells[cols[name]] ?? '').trim() : '');
    for (const r of main.rows.slice(1))
      items.push({
        id: cell(r, 'ID'), basis: cell(r, '근거'), hash: cell(r, '근거 해시'),
        method: cell(r, '무엇을 어떻게 재나'), test: cell(r, '테스트'), approval: cell(r, '승인'),
        line: r.line + 1,
      });
  }

  // `## 기각` = 그 절 안에서 EV ID가 등장하는 각 줄. 사유 = ID·구두점 제거 후 잔여 텍스트.
  const rejected = new Map();
  const rejSec = secOf('기각');
  if (rejSec) for (let i = rejSec.start + 1; i < rejSec.end; i++) {
    const ids = lines[i].match(/\bEV\d+\b/g);
    if (!ids) continue;
    const reason = lines[i].replace(/\bEV\d+\b/g, '').replace(/[|#.,:;·—–-]/g, ' ').replace(/\s+/g, ' ').trim();
    for (const id of ids) rejected.set(id, reason);
  }
  // `## 개정` = EV ID 등장 줄의 첫 8hex 토큰. 같은 EV#가 여러 행이면 마지막 행이 이긴다.
  const revised = new Map();
  const revSec = secOf('개정');
  if (revSec) for (let i = revSec.start + 1; i < revSec.end; i++) {
    const ids = lines[i].match(/\bEV\d+\b/g);
    if (!ids) continue;
    const h = lines[i].match(/\b[0-9a-f]{8}\b/);
    if (h) for (const id of ids) revised.set(id, h[0]);
  }
  return { lines, main, cols, items, rejected, revised };
}

// ── SPEC 보충 파서 (planedd4 §3-1 — inspect() 반환에 원문 필드가 없어서다) ──
function parseSpec(specText) {
  const fenced = stripFences(specText.split('\n'));
  const { lines: masked } = maskArchive(fenced);
  // ① 아카이브 문장 ID — 마스킹 차분. ARCHIVE_H를 복사하지 않는다 — 차분이 현행 마스킹 규칙을 상속한다.
  const archived = new Set(fenced.flatMap((l, i) => (l && !masked[i] && headId(l)) ? [headId(l)] : []));
  // ② 활성 문장 ID(c4.ids 그대로) + 정의 줄 원문(미확정표 밖 첫 등장 줄)
  const active = new Set(inspect(specText, 'SPEC').c4?.ids ?? []);
  const undec = undecidedTables(tables(masked));
  const inU = (i) => undec.some((t) => i >= t.start && i <= t.end);
  const defLine = new Map();
  for (let i = 0; i < masked.length; i++) {
    if (inU(i)) continue;
    const id = headId(masked[i]);
    if (id && active.has(id) && !defLine.has(id)) defLine.set(id, masked[i]);
  }
  // ③ U 행 — {id → `선택 대기` 여부}
  const uRows = new Map();
  for (const t of undec) {
    const hdr = t.rows[0].cells;
    // 사본: spec-verify.mjs:152-155 — 상태 열은 lastIndexOf. 그쪽이 바뀌면 여기도.
    const exact = hdr.lastIndexOf('상태');
    const si = exact >= 0 ? exact : hdr.map((c) => c.includes('상태')).lastIndexOf(true);
    for (const r of t.rows.slice(1)) {
      const id = r.cells[0].replace(/\*/g, '').trim();
      if (id) uRows.set(id, (si >= 0 ? (r.cells[si] ?? '') : r.cells.join(' ')).includes('선택 대기'));
    }
  }
  return { archived, active, defLine, uRows, activeS: [...active].filter((id) => /^S\d/.test(id)) };
}

// ── 검사 E1~E7 + 스냅샷 + 커버리지 (전부 정적) ─────────────────────────────
// kind 리터럴은 작은따옴표 문자열 — specgate T3b가 소스 정규식으로 전수 대조한다.
export function inspectEval(evalText, {
  specText = null, snapshot = null, lock = null, lockHashNow = null,
  testsNow = null, implNow = null, phase = 'lint', evalFreeze = 'reason',
} = {}) {
  const V = [], W = [], skipped = [];
  const violate = (c, msg, kind, line = null) => V.push({ check: c, msg, kind, line });
  const warn = (c, msg, kind, line = null) => W.push({ check: c, msg, kind, line });
  const p = parseEval(evalText);
  const counts = { items: 0, rejected: 0, revised: 0, covered: null, uncovered: null };

  // E1 — 파싱·형식. 본표가 아예 없으면(필수 열 0종 포함) 이후 검사는 대상이 없다.
  const found = p.cols ? REQ_COLS.filter((n) => n in p.cols) : [];
  if (!p.main || !found.length) {
    violate('E1', '`## 1. 평가 항목` 절의 본표(ID·근거·근거 해시·무엇을 어떻게 재나·테스트·승인 6열)가 없다', 'E1.noTable');
    skipped.push('E1 이후 전부 — 본표 없음');
    return { counts, violations: V, warnings: W, skipped };
  }
  const missingCols = REQ_COLS.filter((n) => !(n in p.cols));
  if (missingCols.length)
    violate('E1', `본표 헤더에 필수 열 누락: ${missingCols.join(', ')}`, 'E1.badCols', p.main.rows[0].line + 1);
  counts.items = p.items.length;
  counts.rejected = p.rejected.size;
  counts.revised = p.revised.size;

  const seen = new Map();
  for (const it of p.items) seen.set(it.id, (seen.get(it.id) ?? 0) + 1);
  for (const [id, n] of seen)
    if (n > 1 && /^EV\d+$/.test(id)) violate('E1', `EV ID 중복: ${id} — 데이터 행 ${n}개`, 'E1.dupId');
  for (const it of p.items) {
    if (!/^EV\d+$/.test(it.id)) violate('E1', `ID «${it.id}» — EV+연번 형식이 아니다`, 'E1.badId', it.line);
    // 빈 셀은 제외 — 빈 셀 = 미승인이지 불일치가 아니다(planedd3 §3-2). 미승인 차단은 pre의 E7.noLock 몫.
    if (it.hash && !/^[0-9a-f]{8}$/.test(it.hash))
      violate('E1', `${it.id} 근거 해시 «${it.hash}» — 8자리 소문자 hex가 아니다`, 'E1.badHash', it.line);
    // E2 — 문자열 검사만. 파일 실존은 안 본다 — 실존은 스냅샷 E6.missing 몫(정적/실행 분리).
    if (!it.test || !it.test.startsWith('tests/eval/'))
      violate('E2', `${it.id} 테스트 경로 «${it.test}» — tests/eval/ 아래가 아니다`, 'E2.noTest', it.line);
    if (!it.method) violate('E2', `${it.id} «무엇을 어떻게 재나»가 비어 있다`, 'E2.noMethod', it.line);
  }

  // E3·E4·E5·커버리지 — SPEC이 있어야 판정된다. 없으면 경고 강등 + skipped(통과가 아니다).
  if (specText === null) {
    warn('E3', 'SPEC.md가 없다 — 근거 실존·U·해시는 판정되지 않았다(통과가 아니다)', 'E3.noSpec');
    skipped.push('E3·E4·E5·커버리지 — SPEC 없음');
  } else {
    const sp = parseSpec(specText);
    for (const it of p.items) {
      const id = it.basis;
      if (sp.active.has(id)) {
        // E5 — 형식 유효(8hex)한 해시 셀만 대조. 유효 해시 = `## 개정` 마지막 행 우선, 없으면 표 셀.
        if (/^[0-9a-f]{8}$/.test(it.hash)) {
          const cur = hash8(canonical(sp.defLine.get(id)));
          const eff = p.revised.get(it.id) ?? it.hash;
          if (eff !== cur)
            violate('E5', `${it.id} 근거 ${id} 문장이 승인 시점과 다르다 — 유효 해시 ${eff} ≠ 현재 ${cur}`, 'E5.outdated', it.line);
        }
      } else if (sp.archived.has(id)) {
        // 접힘 ≠ 소멸 — 실존은 통과. 단 아카이브 셀 원문은 정의 줄과 형태가 달라 E5 대조는 건너뛴다(§3-4).
        warn('E3', `${it.id} 근거 ${id}는 아카이브로 접힌 문장이다 — E5 대조는 건너뛴다`, 'E3.archived', it.line);
        skipped.push(`E5 ${it.id} — 아카이브 지목`);
      } else if (sp.uRows.has(id)) {
        // 출처별 게이트 강도의 셋째 단 — 아직 정해지지 않은 것은 단언의 재료가 아니다(r35 §2-4 오염 재발 방지).
        if (sp.uRows.get(id))
          violate('E4', `${it.id} 근거 ${id}는 \`선택 대기\` 미확정 행이다 — 확정해 §1로 올린 뒤 지목하라`, 'E4.undecided', it.line);
        else warn('E4', `${it.id} 근거 ${id}는 확정된 미확정 행이다 — 문장으로 승격하고 그 ID를 지목하라`, 'E4.settledU', it.line);
      } else {
        violate('E3', `${it.id} 근거 «${id}»가 SPEC 어디에도 없다`, 'E3.miss', it.line);
      }
    }
    // 커버리지 — 분모는 활성 S만(planeddmain §7 #6). C4 복제 금지 — 위반이 아니라 1건 집계 경고.
    const basisSet = new Set(p.items.map((it) => it.basis));
    const uncovered = sp.activeS.filter((id) => !basisSet.has(id));
    counts.covered = sp.activeS.length - uncovered.length;
    counts.uncovered = uncovered.length;
    if (uncovered.length)
      warn('coverage', `평가로 덮이지 않은 활성 S 문장 ${uncovered.length}건: ${uncovered.join(', ')}`, 'coverage.uncovered');
  }

  // 스냅샷 유효성 — 계측 실패는 통과도 실패도 아니다(exp judge acRunOk 규율).
  const snapWhy = () => {
    if (snapshot.parseError) return 'JSON 파싱 실패';
    if (!snapshot.runOk) return 'runOk=false — 계측 실패는 통과가 아니다';
    // pre는 red를 요구하되, redAt 있는 final은 유효 — final이 red를 덮은 뒤의 재수정을 막지 않는 승계 소비(planedd5 §3-7).
    if (phase === 'pre' && snapshot.phase !== 'red' && !(snapshot.phase === 'final' && snapshot.redAt))
      return `phase=${snapshot.phase} — pre는 red(또는 redAt 있는 final)를 요구한다`;
    if (phase === 'stop' && snapshot.phase !== 'final') return `phase=${snapshot.phase} — stop은 final을 요구한다`;
    if (lockHashNow && snapshot.evalLockHash !== lockHashNow) return '다른 승인본의 스냅샷(evalLockHash 불일치)';
    return null;
  };

  if (phase === 'pre') {
    if (!lock) {
      // 승인 전 구현 — pre에서만 위반이다. 락이 없으면 스냅샷 대조 자체가 무의미해 건너뛴다.
      violate('E7', '승인 락(.specgate-eval.lock)이 없다 — /eval 승인으로 락을 만든 뒤 구현한다', 'E7.noLock');
      skipped.push('스냅샷 — 락 없음(승인 전)');
    } else if (!snapshot) {
      violate('snapshot', 'red-check 스냅샷(.specgate-eval.json)이 없다 — 구현 전 실행 기록이 필요하다', 'snapshot.missing');
    } else {
      const why = snapWhy();
      if (why) violate('snapshot', `스냅샷 무효 — ${why}`, 'snapshot.invalid');
      // red 스냅샷의 green 항목은 어느 phase에서도 finding이 아니다(설계 계약 8) — Advisory는 러너 몫.
    }
  }

  if (phase === 'stop') {
    let snapOk = false;
    if (!snapshot) violate('snapshot', '완료 스냅샷(.specgate-eval.json)이 없다 — final 러너를 돌려라', 'snapshot.missing');
    else {
      const why = snapWhy();
      if (why) { violate('snapshot', `스냅샷 무효 — ${why}`, 'snapshot.invalid'); skipped.push('E6 — 스냅샷 무효'); }
      else snapOk = true;
    }
    if (snapOk) {
      // E6 — 전건 green 또는 기각 사유. 판정 주체는 러너의 빨간/초록불이다(sdd C4의 «지목»과 다른 점).
      const st = new Map((snapshot.items ?? []).map((x) => [x.id, x.status]));
      for (const [id, status] of st) {
        if (status !== 'red') continue;
        const reason = p.rejected.get(id);
        if (reason === undefined) violate('E6', `${id}가 red인데 \`## 기각\`에 없다`, 'E6.red');
        else if (!reason) violate('E6', `${id}가 red — 기각 행은 있으나 사유가 없다(기각 불인정)`, 'E6.red');
      }
      for (const it of p.items) {
        if (p.rejected.has(it.id)) continue;
        const status = st.get(it.id);
        if (status === undefined || status === 'missing')
          violate('E6', `${it.id}가 스냅샷에 없다 — 테스트 이름 «${it.id}: » 접두를 확인하라`, 'E6.missing', it.line);
      }
      for (const id of p.rejected.keys())
        if (st.get(id) === 'green')
          warn('E6', `기각한 ${id}가 green이다 — 기각 사유가 아직 참인지 본다`, 'E6.rejectedGreen');
      // 신선도 — 스냅샷 이후 구현 수정. loc.file은 EVAL.md 고정, 경로는 msg(planedd4 §7 #4).
      if (implNow && snapshot.implHash && typeof snapshot.implHash === 'object')
        for (const k of Object.keys(snapshot.implHash))
          if (implNow[k] === null || implNow[k] !== snapshot.implHash[k])
            violate('snapshot', `${k} — 스냅샷 이후 ${implNow[k] === null ? '소멸했다' : '바뀌었다'}. final 러너를 다시 돌려라`, 'snapshot.stale');
    }
    // E7 — 동결. evalFreeze 3단은 발행 심각도만 정한다 — 심각도는 검사기(발행 측) 몫(§3-5).
    if (!lock) warn('E7', '승인 락이 없다 — 동결 대조를 할 수 없다', 'E7.noLock');
    else {
      let why = null;
      if (hash8(evalText) !== lock.evalMd) why = 'EVAL.md 수정';
      else if (testsNow && lock.tests && typeof lock.tests === 'object') {
        const a = Object.keys(testsNow).sort(), b = Object.keys(lock.tests).sort();
        if (JSON.stringify(a) !== JSON.stringify(b)) why = 'tests/eval 파일 집합 변경';
        else if (a.some((k) => testsNow[k] !== lock.tests[k])) why = 'tests/eval 파일 수정';
      }
      if (why) {
        const hasRev = p.revised.size > 0;
        if (evalFreeze === 'block')
          violate('E7', `동결 후 수정(${why})${hasRev ? ' — 개정 행이 있어도 evalFreeze=block은 통과시키지 않는다' : ''}`, 'E7.frozen');
        else if (evalFreeze === 'warn')
          warn('E7', `동결 후 수정(${why}) — 개정 행 ${hasRev ? '있음' : '없음'}(evalFreeze=warn)`, 'E7.frozen');
        else if (!hasRev)
          violate('E7', `동결 후 수정(${why}) — \`## 개정\`에 새 해시·사유·날짜를 적거나 되돌린다`, 'E7.frozen');
        // reason + 개정 행 있음 → 통과. counts.revised가 그 계수다.
      }
    }
  }

  return { counts, violations: V, warnings: W, skipped };
}

// ── 파일 IO — CLI와 훅(planedd6)이 같은 적재를 쓴다 ────────────────────────
export function loadEval(evalPath, phase = 'lint') {
  let evalText;
  try { evalText = readFileSync(evalPath, 'utf8'); }
  catch (e) { return { fatal: `파싱 실패: ${e.message}`, exit: 2 }; }
  const dir = dirname(resolve(evalPath));
  const rd = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
  const notes = [];

  const specText = rd(join(dir, 'SPEC.md'));
  // 스냅샷·락의 부재·파싱 실패는 exit 2가 아니라 finding의 재료다.
  let snapshot = null;
  const snapRaw = rd(join(dir, '.specgate-eval.json'));
  if (snapRaw !== null) { try { snapshot = JSON.parse(snapRaw); } catch { snapshot = { parseError: true }; } }
  let lock = null, lockHashNow = null;
  const lockRaw = rd(join(dir, '.specgate-eval.lock'));
  if (lockRaw !== null) {
    lockHashNow = hash8(lockRaw);
    try { lock = JSON.parse(lockRaw); } catch { lock = null; } // 파싱 실패 = 부재와 같다(E7.noLock)
  }
  // .specgate.json은 evalFreeze 키만 읽는다. 깨진 설정이 판정을 뒤집지 않는다(specgate loadConfig 선례).
  let evalFreeze = 'reason';
  const cfgRaw = rd(join(dir, '.specgate.json'));
  if (cfgRaw !== null) {
    try {
      const j = JSON.parse(cfgRaw);
      if (['warn', 'reason', 'block'].includes(j.evalFreeze)) evalFreeze = j.evalFreeze;
      else if ('evalFreeze' in j) notes.push(`구성 무시: evalFreeze «${j.evalFreeze}» — 기본값 reason`);
    } catch { notes.push('구성 무시: .specgate.json 파싱 실패 — evalFreeze 기본값 reason'); }
  }
  const testsNow = {};
  const walk = (d, rel) => {
    let ents;
    try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (e.isDirectory()) { if (e.name !== "__pycache__") walk(join(d, e.name), `${rel}/${e.name}`); } // pytest 바이트코드는 테스트 파일이 아니다(r59)
      else testsNow[`${rel}/${e.name}`] = hash8(readFileSync(join(d, e.name), 'utf8'));
    }
  };
  walk(join(dir, 'tests', 'eval'), 'tests/eval');
  let implNow = null;
  if (snapshot && snapshot.implHash && typeof snapshot.implHash === 'object') {
    implNow = {};
    for (const k of Object.keys(snapshot.implHash)) {
      const t = rd(join(dir, k));
      implNow[k] = t === null ? null : hash8(t);
    }
  }
  return { evalText, options: { specText, snapshot, lock, lockHashNow, testsNow, implNow, phase, evalFreeze }, notes };
}

function report(r, phase) {
  console.log(`eval-verify (${phase})`);
  console.log(`  항목 ${r.counts.items} · 기각 ${r.counts.rejected} · 개정 ${r.counts.revised} · S 커버 ${r.counts.covered ?? '판정 안 함'}`);
  for (const v of r.violations) console.log(`    [위반 ${v.check}] ${v.msg}`);
  for (const w of r.warnings) console.log(`    [경고 ${w.check}] ${w.msg}`);
  for (const s of r.skipped) console.log(`    [건너뜀] ${s}`);
  console.log(`  → 위반 ${r.violations.length} · 경고 ${r.warnings.length}`);
}

// ── --selftest ─────────────────────────────────────────────────────────────
// SPEC 재료는 spec-verify의 KA를 import한다(r50 §2-5 — 사본 금지). EVAL 픽스처는 헬퍼가 조립하되
// 근거 해시는 이 모듈 자신의 hash8(canonical(…))로 끼운다. H-0만 골든 상수다 — 해시 함수 자체의
// 회귀를 순환 논증 없이 잡는 유일한 지점(구현 시 1회 실측값).
const H0_LINE = '- S1. 증가 버튼을 누르면 카운터가 1 증가한다. (근거: 요청 문장)';
const H0 = '3e5b8cb0';
const kaLine = (id) => KA.split('\n').find((l) => l.startsWith(`- ${id}.`));
const kh = (id) => hash8(canonical(kaLine(id)));

const row = (id, basis, hash, method = '클릭 1회 → 스파이가 정확히 1회 호출된다', test = 'tests/eval/counter.test.ts', appr = '사용자, 2026-08-24') =>
  `| ${id} | ${basis} | ${hash} | ${method} | ${test} | ${appr} |`;
const doc = ({ rows, rejectedRows = [], revisedRows = [] }) => `# EVAL — counter

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
const NORMAL = () => [row('EV1', 'S1', kh('S1')), row('EV2', 'I1', kh('I1'), '감소 연타 → 카운터가 0 밑으로 내려가지 않는다')];
const SNAP = (o = {}) => ({
  phase: 'final', at: '2026-08-24', runOk: true, runner: 'vitest',
  items: [{ id: 'EV1', status: 'green' }, { id: 'EV2', status: 'green' }], evalLockHash: null, implHash: {}, ...o,
});
const LOCK = (text) => ({ approvedAt: '2026-08-24', evalMd: hash8(text), tests: null, sentences: null });

function selftest() {
  // 파생 직전 단언 — 원문이 다르면 replace가 조용히 no-op이 되어 W-3이 엉뚱한 지점에서 실패한다.
  if (!KA.includes('선택 대기 | 오버플로 관측 시')) { console.log('FAIL KA 원문 변경 — KA_SET 파생 불가'); process.exit(1); }
  const KA_SET = KA.replace('선택 대기 | 오버플로 관측 시', '확정 (2026-08-24) | —');

  const kindsEq = (fs, want) => JSON.stringify(fs.map((f) => f.kind).sort()) === JSON.stringify([...want].sort());
  const expect = (r, vs, ws) => {
    if (!kindsEq(r.violations, vs)) return `위반 [${r.violations.map((f) => f.kind)}] ≠ [${vs}]`;
    if (!kindsEq(r.warnings, ws)) return `경고 [${r.warnings.map((f) => f.kind)}] ≠ [${ws}]`;
    return null;
  };
  const lint = (text, over = {}) => inspectEval(text, { specText: KA, ...over });
  const stop = (text, over = {}) => inspectEval(text, { specText: KA, phase: 'stop', snapshot: SNAP(), lock: LOCK(text), ...over });
  const pre = (text, over = {}) => inspectEval(text, { specText: KA, phase: 'pre', lock: LOCK(text), ...over });
  const COV = ['coverage.uncovered'];
  const REV_OK = () => `| EV1 | ${kh('S1')} | 문장 개정 | 2026-08-24 |`;
  const REJ = '| EV1 | jsdom 레이아웃 제약 — 렌더 단언으로 대체 불가 |';

  const CASES = [
    ['H-0 해시 골든', () => (hash8(canonical(H0_LINE)) === H0 ? null : `h8=${hash8(canonical(H0_LINE))} ≠ ${H0}`)],
    ['N-1 정상', () => {
      const r = lint(doc({ rows: NORMAL() }));
      return expect(r, [], COV) ?? (r.warnings[0].msg.includes('S2') ? null : `커버리지 msg에 S2 없음: ${r.warnings[0].msg}`);
    }],
    ['V-1 표 없음', () => expect(lint('# EVAL\n\n대충.'), ['E1.noTable'], [])],
    ['V-2 ID 중복', () => expect(lint(doc({ rows: [row('EV1', 'S1', kh('S1')), row('EV1', 'I1', kh('I1'))] })), ['E1.dupId'], COV)],
    ['V-3 해시 형식', () => expect(lint(doc({ rows: [row('EV1', 'S1', 'xyz'), NORMAL()[1]] })), ['E1.badHash'], COV)],
    ['V-4 테스트 경로', () => expect(lint(doc({ rows: [row('EV1', 'S1', kh('S1'), undefined, 'src/x.ts'), NORMAL()[1]] })), ['E2.noTest'], COV)],
    ['V-5 판정 한 줄 없음', () => expect(lint(doc({ rows: [row('EV1', 'S1', kh('S1'), ''), NORMAL()[1]] })), ['E2.noMethod'], COV)],
    ['V-6 근거 실존 안 함', () => expect(lint(doc({ rows: [row('EV1', 'S9', kh('S1')), NORMAL()[1]] })), ['E3.miss'], COV)],
    ['W-1 SPEC 부재', () => expect(inspectEval(doc({ rows: NORMAL() })), [], ['E3.noSpec'])],
    ['W-2 아카이브 지목', () => expect(lint(doc({ rows: [row('EV1', 'S0', ''), NORMAL()[1]] })), [], ['E3.archived', ...COV])],
    ['V-7 U 지목', () => expect(lint(doc({ rows: [row('EV1', 'U1', ''), NORMAL()[1]] })), ['E4.undecided'], COV)],
    ['W-3 확정 U 지목', () => expect(lint(doc({ rows: [row('EV1', 'U1', ''), NORMAL()[1]] }), { specText: KA_SET }), [], ['E4.settledU', ...COV])],
    ['V-8 해시 불일치', () => expect(lint(doc({ rows: [row('EV1', 'S1', 'deadbeef'), NORMAL()[1]] })), ['E5.outdated'], COV)],
    ['N-2 개정 해소', () => expect(lint(doc({ rows: [row('EV1', 'S1', 'deadbeef'), NORMAL()[1]], revisedRows: [REV_OK()] })), [], COV)],
    ['V-9 red 잔존', () => {
      const t = doc({ rows: NORMAL() });
      return expect(stop(t, { snapshot: SNAP({ items: [{ id: 'EV1', status: 'red' }, { id: 'EV2', status: 'green' }] }) }), ['E6.red'], COV);
    }],
    ['N-3 기각 통과', () => {
      const t = doc({ rows: NORMAL(), rejectedRows: [REJ] });
      return expect(stop(t, { snapshot: SNAP({ items: [{ id: 'EV1', status: 'red' }, { id: 'EV2', status: 'green' }] }) }), [], COV);
    }],
    ['V-10 스냅샷 누락 항목', () => {
      const t = doc({ rows: NORMAL() });
      return expect(stop(t, { snapshot: SNAP({ items: [{ id: 'EV1', status: 'green' }] }) }), ['E6.missing'], COV);
    }],
    ['W-4 기각인데 green', () => expect(stop(doc({ rows: NORMAL(), rejectedRows: [REJ] })), [], ['E6.rejectedGreen', ...COV])],
    ['V-11 freeze=reason 기본', () => {
      const t = doc({ rows: NORMAL() });
      return expect(stop(t, { lock: { ...LOCK(t), evalMd: '00000000' } }), ['E7.frozen'], COV);
    }],
    ['N-4 reason+개정', () => {
      const t = doc({ rows: NORMAL(), revisedRows: [REV_OK()] });
      return expect(stop(t, { lock: { ...LOCK(t), evalMd: '00000000' } }), [], COV);
    }],
    ['W-5 freeze=warn', () => {
      const t = doc({ rows: NORMAL() });
      return expect(stop(t, { lock: { ...LOCK(t), evalMd: '00000000' }, evalFreeze: 'warn' }), [], ['E7.frozen', ...COV]);
    }],
    ['V-12 freeze=block', () => {
      const t = doc({ rows: NORMAL(), revisedRows: [REV_OK()] });
      return expect(stop(t, { lock: { ...LOCK(t), evalMd: '00000000' }, evalFreeze: 'block' }), ['E7.frozen'], COV);
    }],
    ['V-13 스냅샷 무효', () => {
      const r = stop(doc({ rows: NORMAL() }), { snapshot: SNAP({ runOk: false }) });
      return expect(r, ['snapshot.invalid'], COV) ?? (r.violations.some((f) => f.check === 'E6') ? 'E6이 skipped가 아니다' : null);
    }],
    ['V-14 신선도', () => {
      const t = doc({ rows: NORMAL() });
      return expect(stop(t, { snapshot: SNAP({ implHash: { 'src/x.ts': 'aaaaaaaa' } }), implNow: { 'src/x.ts': 'bbbbbbbb' } }), ['snapshot.stale'], COV);
    }],
    ['P-1 승인 전 구현', () => expect(inspectEval(doc({ rows: NORMAL() }), { specText: KA, phase: 'pre' }), ['E7.noLock'], COV)],
    ['P-2 red-check 미실행', () => expect(pre(doc({ rows: NORMAL() })), ['snapshot.missing'], COV)],
    ['P-3 red green 무해', () => expect(pre(doc({ rows: NORMAL() }), { snapshot: SNAP({ phase: 'red', items: [{ id: 'EV1', status: 'green' }, { id: 'EV2', status: 'red' }] }) }), [], COV)],
    ['N-5 빈 해시 셀 통과', () => expect(lint(doc({ rows: [row('EV1', 'S1', ''), NORMAL()[1]] })), [], COV)],
    ['P-4 final+redAt 유효', () => expect(pre(doc({ rows: NORMAL() }), { snapshot: SNAP({ redAt: '2026-08-24' }) }), [], COV)],
  ];

  let bad = 0;
  for (const [name, fn] of CASES) {
    let why;
    try { why = fn(); } catch (e) { why = `예외: ${e.message}`; }
    if (why) bad++;
    console.log(`${why ? 'FAIL' : 'ok  '} ${name.padEnd(20)} ${why ?? ''}`);
  }

  // CLI 실측 4건 — 임시 파일은 mkdtempSync만 쓴다(픽스처 디렉터리 신설 금지, 개발 규칙 4).
  const proj = mkdtempSync(join(tmpdir(), 'eval-verify-'));
  const cli = (p) => spawnSync(process.execPath, [fileURLToPath(import.meta.url), p], { encoding: 'utf8' }).status;
  try {
    writeFileSync(join(proj, 'SPEC.md'), KA);
    writeFileSync(join(proj, 'EVAL.md'), doc({ rows: NORMAL() }));
    const CLI = [
      ['C-1 정상 → 0', () => (cli(join(proj, 'EVAL.md')) === 0 ? null : `exit=${cli(join(proj, 'EVAL.md'))}`)],
      ['C-2 위반 → 1', () => {
        writeFileSync(join(proj, 'EVAL.md'), doc({ rows: [row('EV1', 'S1', 'deadbeef'), NORMAL()[1]] }));
        return cli(join(proj, 'EVAL.md')) === 1 ? null : `exit=${cli(join(proj, 'EVAL.md'))}`;
      }],
      ['C-3 없는 경로 → 2', () => (cli(join(proj, 'nosuch.md')) === 2 ? null : `exit=${cli(join(proj, 'nosuch.md'))}`)],
      ['C-4 __pycache__ 무시', () => {
        // pytest가 tests/eval/ 아래 남기는 바이트코드가 «파일 집합 변경»(SG1047)으로 잡히면 안 된다 — r59 FastAPI 스모크 실측
        mkdirSync(join(proj, 'tests', 'eval', '__pycache__'), { recursive: true });
        writeFileSync(join(proj, 'tests', 'eval', 'a.test.ts'), 'export {}\n');
        writeFileSync(join(proj, 'tests', 'eval', '__pycache__', 'a.cpython-312.pyc'), 'x');
        const keys = Object.keys(loadEval(join(proj, 'EVAL.md')).options.testsNow);
        return JSON.stringify(keys) === '["tests/eval/a.test.ts"]' ? null : `keys ${JSON.stringify(keys)}`;
      }],
    ];
    for (const [name, fn] of CLI) {
      let why;
      try { why = fn(); } catch (e) { why = `예외: ${e.message}`; }
      if (why) bad++;
      console.log(`${why ? 'FAIL' : 'ok  '} ${name.padEnd(20)} ${why ?? ''}`);
    }
  } finally { rmSync(proj, { recursive: true, force: true }); }

  console.log(bad ? `selftest 실패 — ${bad}건 어긋남` : `selftest 통과 — 인라인 ${CASES.length}건 + CLI 4건`);
  process.exit(bad ? 1 : 0);
}

// ── CLI ────────────────────────────────────────────────────────────────────
// 직접 실행일 때만 돈다 — hooks/eval-gate.mjs(planedd6)가 inspectEval을 import한다(spec-verify 선례).
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
if (isMain && args[0] === '--selftest' && args.length === 1) selftest();
else if (isMain) {
  const path = args.find((a) => !a.startsWith('--'));
  if (!path) {
    console.error('usage: node framework/eval-verify.mjs <EVAL.md 경로> [--pre|--stop] [--json] | --selftest');
    process.exit(2);
  }
  const phase = args.includes('--stop') ? 'stop' : args.includes('--pre') ? 'pre' : 'lint';
  const io = loadEval(path, phase);
  if (io.fatal) { console.error(io.fatal); process.exit(io.exit); }
  const r = inspectEval(io.evalText, io.options);
  for (const n of io.notes) console.log(n);
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else report(r, phase);
  process.exit(r.violations.length ? 1 : 0);
}
