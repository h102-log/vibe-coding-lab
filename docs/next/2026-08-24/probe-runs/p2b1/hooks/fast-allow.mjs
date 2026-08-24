#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
const log = (m) => appendFileSync(new URL('../hook-log.jsonl', import.meta.url),
  JSON.stringify({ t: new Date().toISOString(), ...m }) + '\n');
log({ hook: 'fast-allow', phase: 'start' });
log({ hook: 'fast-allow', phase: 'end' });
process.exit(0);
