#!/usr/bin/env node
// slow-deny.mjs — timeout(5s)보다 길게(20s) 버틴 뒤 exit 2. end 줄이 찍히면 타임아웃 미발동 = 그 런 무효.
import { appendFileSync } from 'node:fs';
const log = (m) => appendFileSync(new URL('../hook-log.jsonl', import.meta.url),
  JSON.stringify({ t: new Date().toISOString(), ...m }) + '\n');
log({ hook: 'slow-deny', phase: 'start' });
await new Promise((r) => setTimeout(r, 20000));
log({ hook: 'slow-deny', phase: 'end' });
console.error('PROBE-P1-DENY');
process.exit(2);
