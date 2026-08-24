#!/usr/bin/env node
// slow-deny.mjs (P-3 변형) — timeout(5s)보다 길게(20s) 버틴 뒤 exit 2.
import { appendFileSync } from 'node:fs';
const log = (m) => appendFileSync(new URL('../hook-log.jsonl', import.meta.url),
  JSON.stringify({ t: new Date().toISOString(), ...m }) + '\n');
log({ hook: 'slow-deny', phase: 'start' });
await new Promise((r) => setTimeout(r, 20000));
log({ hook: 'slow-deny', phase: 'end' });
console.error('PROBE-P3-DENY');
process.exit(2);
