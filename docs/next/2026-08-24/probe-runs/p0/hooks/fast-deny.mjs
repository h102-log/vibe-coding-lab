#!/usr/bin/env node
// fast-deny.mjs — 즉시 exit 2. slow-deny에서 sleep만 제거한 형태.
import { appendFileSync } from 'node:fs';
const log = (m) => appendFileSync(new URL('../hook-log.jsonl', import.meta.url),
  JSON.stringify({ t: new Date().toISOString(), ...m }) + '\n');
log({ hook: 'fast-deny', phase: 'start' });
log({ hook: 'fast-deny', phase: 'end' });
console.error('PROBE-P0-DENY');
process.exit(2);
