#!/usr/bin/env node
// specprobe — SPEC.md 판정 보조기. 센다. 막지 않고, 런 중에 돌지 않고, 종료 코드에 판정을 싣지 않는다.
// 앵커는 리터럴 4종뿐(Clear / Partial / Missing / 선택 대기) — 표 헤더·섹션 제목을 앵커로 쓰지 않는다.
// **이 규칙은 기존 4종에 한한다.** v2의 `volume`은 spec-verify `inspect()`의 파생값이다 —
// 파서를 중복 구현하지 않기 위한 성격 변경이고(개발 규칙 2), 선택 대기 #9로 열려 있다(KF5 §10).
// 출력 4종(r22 §5-5): ① 리터럴 3종 수(전체 / `|` 줄 안 2값) ② [추론] 수 ③ [MISSING 수 ④ 선택 대기(전체 수 / `|` 행 수).
//   node framework/specprobe.mjs <SPEC.md 경로>   # JSON
//   node framework/specprobe.mjs --selftest       # P-1~P-4
// exit는 사용법·파일 오류만 2, 그 외 **0 고정**이다. 임계값을 모른다 — 판정은 KF4의 `.specgate.json`.
// specprobe와 육안이 어긋나면 육안이 이긴다 — 불일치는 이 스크립트의 버그로 기록하고 스크립트를 고친다.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspect, KA, KA_PEND } from './spec-verify.mjs';

const SELF = fileURLToPath(import.meta.url);

const r3 = (x) => Math.round(x * 1000) / 1000; // 소수 셋째 자리 — P-1의 0.333이 이 규칙에서 나온다

export function probe(text, path) {
  // ── 기존 4종 — 원문 리터럴 계수. 펜스도 아카이브도 **제외하지 않는다**(과거 기록과의 비교 연속성).
  const pipeLines = text.split('\n').filter((l) => l.trimStart().startsWith('|'));
  const occurAll = (s) => text.split(s).length - 1;
  const occurPipe = (s) => pipeLines.reduce((n, l) => n + (l.split(s).length - 1), 0);
  const rowsPipe = (s) => pipeLines.filter((l) => l.includes(s)).length;

  // ── volume — inspect() 파생(펜스·아카이브 밖만 본다). 값만 낸다. 임계는 여기 없다.
  const r = inspect(text, path);
  const ids = r.c4?.ids ?? null;
  let activeSentences = null, inferenceRatio = null, archiveCandidates = null;
  if (ids) {
    const by = {};
    for (const id of ids) { const p = id.match(/^[A-Z]{1,3}/)[0]; by[p] = (by[p] ?? 0) + 1; }
    // S·I 외 접두어(골격 «직접 정의» 프로젝트의 R·T 등)는 참고용이다 — total에 넣지 않는다.
    const { S = 0, I = 0, ...otherPrefixes } = by;
    const U = r.counts.pending; // 확정돼 §1로 올라간 행은 S로 이미 잡힌다
    activeSentences = { S, I, U, total: S + I + U, otherPrefixes };
    // 분모에서 U를 뺀다 — 재려는 것은 «확정 문장 중 근거 없는 것의 비중»이다.
    // `[추론]` 리터럴(inferenceMarks)이 아니라 ID 기반인 이유: 리터럴은 산문 인용에 오염된다.
    inferenceRatio = S + I ? r3(I / (S + I)) : null;
    archiveCandidates = { count: r.c4.located.length, ids: r.c4.located };
  }

  return {
    spec: path,
    statusLiterals: {
      Clear: { all: occurAll('Clear'), inPipeRows: occurPipe('Clear') },
      Partial: { all: occurAll('Partial'), inPipeRows: occurPipe('Partial') },
      Missing: { all: occurAll('Missing'), inPipeRows: occurPipe('Missing') },
    },
    inferenceMarks: occurAll('[추론]'),
    missingMarks: occurAll('[MISSING'), // [MISSING: <주제>] 형태 — 여는 쪽까지만 앵커
    pendingChoice: { all: occurAll('선택 대기'), pipeRowCount: rowsPipe('선택 대기') },
    volume: {
      activeSentences, inferenceRatio,
      tableRows: r.counts.tableRows,
      archive: r.counts.archive,
      archiveCandidates,
      // 결측 표기지 판정이 아니다. ID 없는 SPEC은 C4 «판정 불가»와 같은 결이다.
      note: ids ? null : '문장 ID 없음 — 볼륨 판정 불가',
    },
  };
}
// 전체값과 `|` 줄 값이 크게 벌어지면 산문 오염 신호 — 실패 선언이 아니라 육안 판정으로 넘기라는 신호다.

// ── --selftest ─────────────────────────────────────────────────────────────
// 재료 KA는 spec-verify의 인라인 픽스처를 **그대로 import**한다 — 두 selftest가 같은 재료를
// 봐야 값이 갈라졌을 때 어느 쪽이 참인지 가릴 수 있다(사본을 두면 그게 안 된다).
const NO_ID = `# SPEC — 산문

## 1. 명시된 것

증가 버튼을 누르면 카운터가 1 증가한다. 초기값은 0이다. [추론]
`;
// KA에 S3 하나 — 정의 줄에만 위치 표기가 있고(근거), 대조표 지목은 «실행 확인»이다.
const KA_S3 = KA
  .replace('### 2.2 추론으로', '- S3. 초기화는 계약대로 동작한다. (근거: CONTRACT.md:12)\n### 2.2 추론으로')
  .replace('| I1 | 실행 확인 |', '| I1 | 실행 확인 |\n| S3 | 실행 확인 |');

// exit 계약은 함수 반환으로 못 잰다 — 실프로세스로 돌린다(spec-gate·specgate 선례).
const cli = (p) => spawnSync(process.execPath, [SELF, p], { encoding: 'utf8' });
const FX = (n) => join(dirname(SELF), 'smoke', 'runs', `r32-fixture-${n}.md`);

const CASES = [
  ['P-1 볼륨 기본', () => {
    const v = probe(KA, 'KA').volume;
    const a = v.activeSentences;
    const got = [a.S, a.I, a.U, a.total, v.inferenceRatio, v.tableRows, v.archive.sentences, v.archiveCandidates.count];
    const want = [2, 1, 1, 4, 0.333, 6, 1, 2];
    if (JSON.stringify(got) !== JSON.stringify(want)) return `[S,I,U,total,ratio,rows,arch,cand] ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`;
    return JSON.stringify(v.archiveCandidates.ids) === '["S1","S2"]' ? null : `candidates ${JSON.stringify(v.archiveCandidates.ids)}`;
  }],
  // ID 없음은 결측이고, 그래도 exit는 0이다 — «센다, 판정하지 않는다»가 종료 코드로도 참이어야 한다.
  ['P-2 ID 없음·exit', () => {
    const v = probe(NO_ID, 'NO_ID').volume;
    if (v.activeSentences !== null || v.archiveCandidates !== null) return `결측이 아니다: ${JSON.stringify(v)}`;
    if (v.note !== '문장 ID 없음 — 볼륨 판정 불가') return `note «${v.note}»`;
    if (typeof v.tableRows !== 'number') return 'ID와 무관한 값까지 결측이다';
    const bad = cli(FX('F3')); // 위반 8건짜리 픽스처 — 그래도 0
    if (bad.status !== 0) return `위반 있는 SPEC에서 exit=${bad.status} (판정을 실었다)`;
    const none = cli('없는파일.md');
    return none.status === 2 ? null : `파일 없음 exit=${none.status} ≠ 2`;
  }],
  // 회귀 축 — v2가 4종을 펜스·아카이브 인지로 «개선»하면 과거 기록과의 비교 연속성이 끊긴다.
  // KA만으로는 못 잡는다(KA의 아카이브 절에 리터럴이 없다). KA_PEND가 그 차분이다.
  ['P-3 기존 출력 불변', () => {
    const a = probe(KA, 'KA');
    const lit = (o) => [o.Clear.all, o.Partial.all, o.Missing.all];
    if (JSON.stringify(lit(a.statusLiterals)) !== '[0,0,0]') return `statusLiterals ${JSON.stringify(a.statusLiterals)}`;
    if (a.inferenceMarks !== 1 || a.missingMarks !== 0) return `[추론] ${a.inferenceMarks}/1 · [MISSING ${a.missingMarks}/0`;
    if (a.pendingChoice.all !== 1 || a.pendingChoice.pipeRowCount !== 1) return `pendingChoice ${JSON.stringify(a.pendingChoice)}`;
    const b = probe(KA_PEND, 'KA_PEND').pendingChoice;
    return b.all === 2 && b.pipeRowCount === 2 ? null : `아카이브 안 리터럴이 빠졌다 — ${JSON.stringify(b)}`;
  }],
  // §9-10의 알려진 위양성을 **기대값으로 고정**한다. 이게 깨지면 계산 계약이 바뀐 것이다(선택 대기 #11).
  ['P-4 근거 위치 위양성', () => {
    const c = probe(KA_S3, 'KA_S3').volume.archiveCandidates;
    return c.ids.includes('S3') ? null : `S3이 후보에 없다 — ${JSON.stringify(c.ids)}`;
  }],
];

function selftest() {
  let bad = 0;
  for (const [name, fn] of CASES) {
    let why;
    try { why = fn(); } catch (e) { why = `예외: ${e.message}`; }
    if (why) bad++;
    console.log(`${why ? 'FAIL' : 'ok  '} ${name.padEnd(18)} ${why ?? ''}`);
  }
  console.log(bad ? `selftest 실패 — ${bad}건 어긋남` : `selftest 통과 — ${CASES.length}건 전건 일치`);
  process.exit(bad ? 1 : 0);
}

// ── CLI ────────────────────────────────────────────────────────────────────
// 직접 실행일 때만 돈다 — KF4의 verify가 probe()를 프로세스 재실행 없이 import한다(spec-verify 선례).
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
if (isMain && args[0] === '--selftest' && args.length === 1) selftest();
else if (isMain) {
  const p = args.find((a) => !a.startsWith('--'));
  if (!p) {
    console.error('usage: node framework/specprobe.mjs <SPEC.md 경로> | --selftest');
    process.exit(2); // 2 = 사용법·파일 오류. 판정은 종료 코드에 싣지 않는다(0 고정).
  }
  let text;
  try { text = readFileSync(p, 'utf8'); } catch (e) {
    console.error(`읽기 실패: ${e.message}`);
    process.exit(2);
  }
  console.log(JSON.stringify(probe(text, p.split(/[\/]/).join('/')), null, 2));
}
