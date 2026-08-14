#!/usr/bin/env node
// specprobe — SPEC.md 판정 보조기. 센다. 막지 않고, 런 중에 돌지 않고, 종료 코드에 판정을 싣지 않는다.
// 앵커는 리터럴 4종뿐(Clear / Partial / Missing / 선택 대기) — 표 헤더·섹션 제목을 앵커로 쓰지 않는다.
// 출력 4종(r22 §5-5): ① 리터럴 3종 수(전체 / `|` 줄 안 2값) ② [추론] 수 ③ [MISSING 수 ④ 선택 대기(전체 수 / `|` 행 수).
// specprobe와 육안이 어긋나면 육안이 이긴다 — 불일치는 이 스크립트의 버그로 기록하고 스크립트를 고친다.
import { readFileSync } from 'node:fs';

const p = process.argv[2];
if (!p) {
  console.error('usage: node framework/specprobe.mjs <SPEC.md 경로>');
  process.exit(2); // 2 = 사용법 오류. 판정은 종료 코드에 싣지 않는다(0 고정).
}

const text = readFileSync(p, 'utf8');
const pipeLines = text.split('\n').filter((l) => l.trimStart().startsWith('|'));

const occurAll = (s) => text.split(s).length - 1;
const occurPipe = (s) => pipeLines.reduce((n, l) => n + (l.split(s).length - 1), 0);
const rowsPipe = (s) => pipeLines.filter((l) => l.includes(s)).length;

const out = {
  spec: p,
  statusLiterals: {
    Clear: { all: occurAll('Clear'), inPipeRows: occurPipe('Clear') },
    Partial: { all: occurAll('Partial'), inPipeRows: occurPipe('Partial') },
    Missing: { all: occurAll('Missing'), inPipeRows: occurPipe('Missing') },
  },
  inferenceMarks: occurAll('[추론]'),
  missingMarks: occurAll('[MISSING'), // [MISSING: <주제>] 형태 — 여는 쪽까지만 앵커
  pendingChoice: { all: occurAll('선택 대기'), pipeRowCount: rowsPipe('선택 대기') },
};

console.log(JSON.stringify(out, null, 2));
// 전체값과 `|` 줄 값이 크게 벌어지면 산문 오염 신호 — 실패 선언이 아니라 육안 판정으로 넘기라는 신호다.
