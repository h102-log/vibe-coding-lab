#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
const log = (m) => appendFileSync(new URL('../hook-log.jsonl', import.meta.url),
  JSON.stringify({ t: new Date().toISOString(), ...m }) + '\n');
log({ hook: 'fast-deny', phase: 'start' });
log({ hook: 'fast-deny', phase: 'end' });
console.error('PROBE-P2-DENY');
process.exit(2);
