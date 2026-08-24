// 층B 시드 조립 — 락·스냅샷 해시는 eval-verify hash8 실계산 (planedd6 §5-1 mkproj 방식, 가짜 해시 금지)
import { writeFileSync, readFileSync } from 'node:fs';
import { hash8 } from './eval-verify.mjs';
const evalText = readFileSync('EVAL.md', 'utf8');
const testText = readFileSync('tests/eval/cart.test.ts', 'utf8');
const lockRaw = JSON.stringify({
  approvedAt: '2026-08-24T00:00:00Z',
  evalMd: hash8(evalText),
  tests: { 'tests/eval/cart.test.ts': hash8(testText) },
  sentences: {},
}, null, 2);
writeFileSync('.specgate-eval.lock', lockRaw);
if (process.argv[2] === 'red') {
  writeFileSync('.specgate-eval.json', JSON.stringify({
    phase: 'red', at: '2026-08-24T00:00:00Z', runOk: true, runner: 'vitest',
    items: [{ id: 'EV1', status: 'red' }], evalLockHash: hash8(lockRaw), implHash: {},
  }, null, 2));
}
