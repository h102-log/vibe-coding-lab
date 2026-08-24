#!/usr/bin/env node
// spec-interview — /spec 침묵 인터뷰의 3택 응답을 기록하고 집계한다. 판정도 차단도 없다.
// 질문을 뽑는 판단은 에이전트 몫이고(SKILL.md §2 선별), 여기는 센다 — 같은 입력에 항상 같은 답.
//   node framework/spec-interview.mjs log --cat <1..10> --resp <answer|accept|skip> --q "<질문>" [--u U3] [--dir <루트>]
//   node framework/spec-interview.mjs stats [--json] [--dir <루트>]
//   node framework/spec-interview.mjs --selftest
// exit 0 정상(기록 실패 포함 — 관측이 인터뷰를 막으면 안 된다) / 2 사용법 오류.
// 판정을 exit에 싣지 않는다(specprobe와 같은 성격) — 차단은 spec-gate·spec-verify 몫이고 여기는 Advisory다.
import { appendFileSync, existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const FILE = '.specgate-interview.jsonl';
const RESP = ['answer', 'accept', 'skip'];   // 답한다 / Enter 수락 / 건너뜀
// 창 10·임계 9는 «아는 답»이 아니라 «모르는 값을 강제하지 않기 위한 기본값»이다(과잉 플래깅 임계는
// 아무도 모른다 — 조사 Q3). 인자로 노출하지 않는다: 설정 파일은 KF4 `.specgate.json` 몫이다.
const WINDOW = 10, MUTE = 9;
const CATS = 10;   // 점검표 10범주(SKILL.md:43-53). 새 택소노미를 만들지 않는다.

// ── 기록 ───────────────────────────────────────────────────────────────────
// 기록 실패는 경고 한 줄로 끝난다 — spec-gate.mjs:101-106과 같은 이유(FIELD-GUIDE §1).
// 관측이 플로우를 망가뜨리면 다음 세션에 그 도구를 끄게 된다.
function append(dir, row) {
  try {
    appendFileSync(join(dir, FILE), JSON.stringify(row) + '\n');
  } catch (e) {
    console.error(`기록 실패: ${e.code ?? e.message} — 인터뷰는 계속한다`);
  }
}

// KF4 R4 — 저장된 카테고리 mute. `.specgate.json`의 `interview.mute`(범주 번호 배열)를 **읽기만**
// 한다 — 쓰는 쪽은 /spec 문안의 사용자 승인 절차다. specgate.mjs의 로더를 import하지 않는 이유:
// 그쪽 정적 import 사슬(spec-verify·spec-delta·spec-anchor)이 통째로 딸려온다 — 읽을 것은 JSON 한 파일이다.
// 파일 없음·파싱 실패·규약 밖 값 = mute 없음. 깨진 설정이 인터뷰를 막으면 안 된다.
export function readMuted(dir) {
  try {
    const m = JSON.parse(readFileSync(join(dir, '.specgate.json'), 'utf8'))?.interview?.mute;
    return Array.isArray(m)
      ? [...new Set(m.filter((c) => Number.isInteger(c) && c >= 1 && c <= CATS))].sort((a, b) => a - b)
      : [];
  } catch { return []; }
}

// 깨진 줄은 세고 버린다 — 이 파일은 도구 밖에서도 손댈 수 있다. `\r`는 CRLF 환경(이 리포) 몫.
export function readRows(dir) {
  const p = join(dir, FILE);
  let text = '';
  try { if (existsSync(p)) text = readFileSync(p, 'utf8'); } catch { return { rows: [], malformed: 0 }; }
  const rows = [];
  let malformed = 0;
  for (const raw of text.split('\n')) {
    const s = raw.replace(/\r$/, '').trim();
    if (!s) continue;
    let o;
    try { o = JSON.parse(s); } catch { malformed++; continue; }
    // 범주·응답이 규약 밖이면 집계에서 뺀다. 여기서 안 거르면 stats가 유령 범주를 만든다.
    if (!Number.isInteger(o?.cat) || o.cat < 1 || o.cat > CATS || !RESP.includes(o?.resp)) { malformed++; continue; }
    rows.push(o);
  }
  return { rows, malformed };
}

// ── 집계 ───────────────────────────────────────────────────────────────────
export function stats(dir) {
  const { rows, malformed } = readRows(dir);
  const muted = readMuted(dir);
  const byCategory = {};
  for (const r of rows) {
    const c = (byCategory[r.cat] ??= { asked: 0, answer: 0, accept: 0, skip: 0, recent10skip: 0, muteSuggest: false });
    c.asked++;
    c[r.resp]++;
  }
  // 창은 그 범주의 파일 순서(=시간 순서) 최근 10건. 10건 미만이면 제안하지 않는다 — 콜드스타트 침묵.
  for (const [cat, c] of Object.entries(byCategory)) {
    const recent = rows.filter((r) => String(r.cat) === cat).slice(-WINDOW);
    c.recent10skip = recent.filter((r) => r.resp === 'skip').length;
    // 저장된 mute에는 권장을 반복하지 않는다 — 권장은 «저장할까»라는 질문이고 이미 답이 있다.
    c.muteSuggest = recent.length === WINDOW && c.recent10skip >= MUTE && !muted.includes(Number(cat));
  }
  return {
    file: FILE,
    total: rows.length,
    malformed,
    muted,
    byCategory,
    muteSuggest: Object.keys(byCategory).filter((c) => byCategory[c].muteSuggest).map(Number),
  };
}

function report(s) {
  if (s.muted.length) console.log(`저장된 mute: 범주 ${s.muted.join(', ')} — 질문으로 승격하지 않는다`);
  if (!s.total) {
    console.log(`인터뷰 기록이 없다 (${s.file}).`);
    return;
  }
  for (const cat of Object.keys(s.byCategory).map(Number).sort((a, b) => a - b)) {
    const c = s.byCategory[cat];
    const tail = c.muteSuggest ? ` | 최근 ${WINDOW}회 중 무시 ${c.recent10skip} → mute 권장` : '';
    console.log(`범주 ${cat}: 질문 ${c.asked} · 답변 ${c.answer} · 수락 ${c.accept} · 무시 ${c.skip}${tail}`);
  }
  if (s.malformed) console.log(`깨진 줄 ${s.malformed}건 — 집계에서 뺐다`);
  // 권장이지 결정이 아니다 — 저장하지 않고, 이번 세션에서 멈출지는 사용자가 답한다.
  console.log(s.muteSuggest.length ? `→ mute 권장 범주: ${s.muteSuggest.join(', ')}` : '→ mute 권장 없음');
}

// ── --selftest ─────────────────────────────────────────────────────────────
// 실프로세스로 돈다(spec-gate.mjs 선례) — 인자 파싱과 exit code까지 덮는다. r39 §2에서 인라인
// 픽스처만 부르는 selftest가 CLI 파싱 버그를 9건 전건 통과시킨 적이 있다.
// execFileSync가 아니라 spawnSync를 쓴다: T12는 «exit 0인데 stderr가 있는» 케이스라
// throw 여부로 갈리는 execFileSync로는 못 잡는다. spawnSync는 {status, stdout, stderr}를 그냥 준다.
const SELF = fileURLToPath(import.meta.url);
const run = (dir, argv) => spawnSync(process.execPath, [SELF, ...argv, '--dir', dir], { encoding: 'utf8' });

const clean = (dir) => rmSync(join(dir, FILE), { recursive: true, force: true });
// 준비용 직접 기록 — log CLI를 30번 spawn해도 덮는 층이 늘지 않는다(그 층은 T1~T5가 덮는다).
const seed = (dir, list) => writeFileSync(join(dir, FILE), list
  .map(([cat, resp], i) => JSON.stringify({ t: `2026-08-20T00:00:${String(i).padStart(2, '0')}.000Z`, cat, q: `q${i}`, resp, u: null }))
  .join('\n') + '\n');
const rep = (cat, resp, n) => Array.from({ length: n }, () => [cat, resp]);

const Q = ['--q', '항목을 전부 삭제하면 진행률 표시는 무엇을 보여야 하는가'];
const json = (r) => { try { return JSON.parse(r.stdout); } catch { return null; } };

// [이름, 준비(dir) — null이면 앞 케이스 상태를 잇는다, 인자, 검사(r, dir) → 어긋난 이유 또는 null]
const CASES = [
  ['T1 log 정상', clean, ['log', '--cat', '3', '--resp', 'accept', ...Q], (r, d) => {
    const { rows } = readRows(d);
    if (r.status !== 0) return `exit ${r.status}`;
    if (rows.length !== 1) return `줄 ${rows.length}`;
    const o = rows[0];
    return o.t && o.cat === 3 && o.q && o.resp === 'accept' ? null : `필수 필드 ${JSON.stringify(o)}`;
  }],
  ['T2 log 누적', null, ['log', '--cat', '3', '--resp', 'skip', ...Q], (r, d) => {
    const { rows } = readRows(d);
    if (r.status !== 0) return `exit ${r.status}`;
    return rows.length === 2 && rows[0].resp === 'accept' && rows[1].resp === 'skip'
      ? null : `순서 ${rows.map((x) => x.resp).join(',')}`;
  }],
  ['T3 cat 범위 밖', null, ['log', '--cat', '11', '--resp', 'skip', ...Q], (r, d) =>
    r.status === 2 && readRows(d).rows.length === 2 ? null : `exit ${r.status} · 줄 ${readRows(d).rows.length}`],
  ['T4 resp 미상', null, ['log', '--cat', '3', '--resp', 'maybe', ...Q], (r, d) =>
    r.status === 2 && readRows(d).rows.length === 2 ? null : `exit ${r.status} · 줄 ${readRows(d).rows.length}`],
  ['T5 q 없음', null, ['log', '--cat', '3', '--resp', 'skip'], (r) =>
    r.status === 2 ? null : `exit ${r.status}`],
  ['T6 stats 파일 없음', clean, ['stats', '--json'], (r) => {
    const s = json(r);
    if (r.status !== 0 || !s) return `exit ${r.status}`;
    return s.total === 0 && s.muteSuggest.length === 0 ? null : `total ${s.total} · ${JSON.stringify(s.muteSuggest)}`;
  }],
  ['T7 경계 미달', (d) => seed(d, [...rep(3, 'skip', 8), ...rep(3, 'accept', 2)]), ['stats', '--json'], (r) => {
    const s = json(r);
    return s && !s.muteSuggest.includes(3) ? null : `muteSuggest ${JSON.stringify(s?.muteSuggest)}`;
  }],
  ['T8 mute 발동', (d) => seed(d, [...rep(3, 'skip', 9), ...rep(3, 'answer', 1)]), ['stats', '--json'], (r) => {
    const s = json(r);
    if (!s) return 'JSON 파싱 실패';
    return JSON.stringify(s.muteSuggest) === '[3]' && s.byCategory['3'].recent10skip === 9
      ? null : `${JSON.stringify(s.muteSuggest)} · recent ${s.byCategory['3']?.recent10skip}`;
  }],
  ['T9 콜드스타트 침묵', (d) => seed(d, rep(5, 'skip', 9)), ['stats', '--json'], (r) => {
    const s = json(r);
    return s && s.muteSuggest.length === 0 ? null : `muteSuggest ${JSON.stringify(s?.muteSuggest)}`;
  }],
  ['T10 창의 최근성', (d) => seed(d, [...rep(4, 'skip', 9), ...rep(4, 'answer', 10)]), ['stats', '--json'], (r) => {
    const s = json(r);
    return s && s.muteSuggest.length === 0 ? null : `muteSuggest ${JSON.stringify(s?.muteSuggest)}`;
  }],
  ['T11 깨진 줄 내성', (d) => {
    seed(d, [[6, 'answer'], [6, 'skip']]);
    const p = join(d, FILE);
    const [a, b] = readFileSync(p, 'utf8').trim().split('\n');
    writeFileSync(p, `${a}\n이건 JSON이 아니다\n${b}\n`);
  }, ['stats', '--json'], (r) => {
    const s = json(r);
    if (r.status !== 0 || !s) return `exit ${r.status}`;
    return s.malformed === 1 && s.total === 2 ? null : `malformed ${s.malformed} · total ${s.total}`;
  }],
  ['T12 기록 실패 무해', (d) => { clean(d); mkdirSync(join(d, FILE)); },
    ['log', '--cat', '3', '--resp', 'skip', ...Q], (r) =>
      r.status === 0 && /기록 실패/.test(r.stderr) ? null : `exit ${r.status} · stderr ${JSON.stringify(r.stderr.trim().slice(0, 40))}`],
  // ── KF4 R4 — `.specgate.json`의 저장 mute ──
  // T8과 같은 시드에 저장 mute만 더한다 — 권장 [3]이 억제되는 것이 차분이다.
  ['T13 저장 mute 로드', (d) => {
    clean(d);
    seed(d, [...rep(3, 'skip', 9), ...rep(3, 'answer', 1)]);
    writeFileSync(join(d, '.specgate.json'), '{"interview":{"mute":[3]}}');
  }, ['stats', '--json'], (r) => {
    const s = json(r);
    if (!s) return 'JSON 파싱 실패';
    if (JSON.stringify(s.muted) !== '[3]') return `muted ${JSON.stringify(s.muted)}`;
    return s.muteSuggest.length === 0 ? null : `저장된 범주에 권장 반복 ${JSON.stringify(s.muteSuggest)}`;
  }],
  ['T14 규약 밖 mute 값', (d) => {
    writeFileSync(join(d, '.specgate.json'), '{"interview":{"mute":[0, 11, "3", 5, 5]}}');
  }, ['stats', '--json'], (r) => {
    const s = json(r);
    return s && JSON.stringify(s.muted) === '[5]' ? null : `muted ${JSON.stringify(s?.muted)}`;
  }],
  ['T15 깨진 설정 무해', (d) => {
    writeFileSync(join(d, '.specgate.json'), '{interview:');
  }, ['stats', '--json'], (r) => {
    const s = json(r);
    if (r.status !== 0 || !s) return `exit ${r.status}`;
    return JSON.stringify(s.muted) === '[]' ? null : `muted ${JSON.stringify(s.muted)}`;
  }],
];

function selftest() {
  const dir = mkdtempSync(join(tmpdir(), 'spec-interview-'));
  let bad = 0;
  try {
    for (const [name, prep, argv, check] of CASES) {
      if (prep) prep(dir);
      const r = run(dir, argv);
      const why = check(r, dir);
      if (why) bad++;
      console.log(`${why ? 'FAIL' : 'ok  '} ${name.padEnd(20)} ${why ?? ''}`);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
  console.log(bad ? `selftest 실패 — ${bad}건 어긋남` : `selftest 통과 — ${CASES.length}건 전건 일치`);
  process.exit(bad ? 1 : 0);
}

// ── CLI ────────────────────────────────────────────────────────────────────
// 직접 실행일 때만 돈다 — KF4의 specgate.mjs가 stats를 import할 자리다(spec-verify와 같은 가드).
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(SELF);
const args = process.argv.slice(2);

function usage() {
  console.error('usage: node framework/spec-interview.mjs log --cat <1..10> --resp <answer|accept|skip> --q "<질문>" [--u U3] [--dir <루트>]');
  console.error('       node framework/spec-interview.mjs stats [--json] [--dir <루트>] | --selftest');
  process.exit(2);
}

if (isMain && args[0] === '--selftest' && args.length === 1) selftest();
else if (isMain) {
  // `--key value` | `--flag`. spec-delta의 indexOf+skip 트릭은 쓰지 않는다 — 값 있는 플래그가
  // 5종이라 r39 §2의 «--base 없으면 첫 인자를 삼킨다» 버그를 5번 반복하게 된다.
  // ponytail: `--q "--로 시작하는 질문"`은 플래그로 읽힌다. 실무상 안 나오고, 나오면 그때 판다.
  const rest = args.slice(1);
  const flags = Object.fromEntries(rest.flatMap((a, i) => (a.startsWith('--')
    ? [[a.slice(2), rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : true]] : [])));
  const dir = typeof flags.dir === 'string' ? flags.dir : process.cwd();

  if (args[0] === 'log') {
    const cat = Number(flags.cat);
    if (!Number.isInteger(cat) || cat < 1 || cat > CATS) usage();
    if (!RESP.includes(flags.resp) || typeof flags.q !== 'string' || !flags.q.trim()) usage();
    append(dir, {
      t: new Date().toISOString(),
      cat,
      q: flags.q,
      resp: flags.resp,
      u: typeof flags.u === 'string' ? flags.u : null,
    });
    process.exit(0);
  } else if (args[0] === 'stats') {
    const s = stats(dir);
    if (flags.json) console.log(JSON.stringify(s, null, 2));
    else report(s);
    process.exit(0);
  } else usage();
}
