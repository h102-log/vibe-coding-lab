#!/usr/bin/env node
// eval-run — 평가(tests/eval/)를 러너로 실행해 스냅샷을 남기는 어댑터 (처치 도구 — planedd5).
// 게이트(hooks/eval-gate.mjs)는 러너를 돌리지 않고 이 스냅샷만 읽는다. 이 파일을 hooks.json에
// 배선하면 Stop 타임아웃 fail-open이 되살아난다(planedd5 §6) — 훅 배선 금지.
//   node framework/eval-run.mjs <app-dir> --phase red|final [--json]   # → <app-dir>/.specgate-eval.json
//   node framework/eval-run.mjs <app-dir> --lock                        # 승인 시 1회 — 락 생성 + 해시 열 채움
//   node framework/eval-run.mjs --selftest
// 종료 코드에 판정을 싣지 않는다(verify-tdd 선례): 0 = 스냅샷 산출 완료(빨간불이어도 0),
// 1 = 계측 실패, 2 = 사용법 오류. red/green은 스냅샷 안에만 있다 — 최상위 ok/success/pass 금지
// (runOk는 판정이 아니라 계측 성공 여부라 예외, verify-tdd.mjs:391 선례).
// verify-tdd.mjs는 import하지 않는다(r20 §7-5 — 계측기·처치 축 분리, 필요한 코드는 복사).
// eval-verify.mjs의 parseEval·hash8·canonical은 import한다(planedd4 §3-2 — 사본 금지).
import { spawn, execSync } from "node:child_process";
import {
  existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEval, hash8, canonical } from "./eval-verify.mjs";

const posix = (p) => p.split(sep).join("/"); // 사본: verify-tdd.mjs:23
// 사본: hooks/spec-gate.mjs:19 — 훅 모듈 import는 방향이 반대다(처치 도구가 훅을 import하면
// 훅 수정이 러너를 흔든다). 값 복사만.
const SRC_RE = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|rb|php|swift|kt|c|cc|cpp|h|hpp|cs|vue|svelte)$/i;
// 동일 값: verify-tdd.mjs:29
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "coverage"]);
const TIMEOUT_MS = 120_000; // verify-tdd 고정값 5 복사 — 조정은 planedd5 §7 #4 선택 대기
// SPEC 정의 줄 — spec-verify SENT_ID가 허용하는 폭(`*`/`+` 마커·`S7a`형 접미)과 같게 (planedd5 §3-1)
const SENT_DEF_RE = /^\s*[-*+]\s+([SI]\d{1,3}[a-z]?)\./;

// ── 순수층 — selftest가 실물 vitest 없이 여기만 검사한다 (planedd5 §3-9 층 분리) ──

// 본표에서 러너가 읽는 것만 검증·추출한다. 6열 완결성·형식 검사는 재구현하지 않는다(E1·E2 몫).
function parseManifest(evalText) {
  const p = parseEval(evalText);
  if (!p.main) return { error: "본표 없음 — `## 평가 항목` 절의 첫 표가 없다" };
  for (const c of ["ID", "근거", "근거 해시", "테스트"])
    if (!(c in p.cols)) return { error: `본표에 «${c}» 열이 없다` };
  const items = p.items.filter((it) => /^EV\d+$/.test(it.id));
  if (items.length === 0) return { error: "본표에 EV 행이 0건" };
  // `## 기각` EV도 본표에 있으면 실행·기록 대상 — 기각 참작은 게이트 E6 몫 (planedd5 §3-2)
  const testFiles = [...new Set(items.map((it) => it.test).filter(Boolean))];
  return { items, cols: p.cols, testFiles };
}

function parseReport(text) {
  try {
    return { report: JSON.parse(text) };
  } catch (e) {
    return { runError: `결과 JSON 파싱 실패 — ${e.message}` };
  }
}

// 매핑 규약(9장 공통 인터페이스): 이름의 /\bEV\d+\b/ 전부. describe의 EV도 fullName에 합쳐져 온다.
const evsInName = (a) =>
  (a.fullName ?? [...(a.ancestorTitles ?? []), a.title ?? ""].join(" ")).match(/\bEV\d+\b/g) ?? [];

function mapReport(report, manifest, appAbs) {
  const known = new Set(manifest.items.map((it) => it.id));
  const results = new Map();
  const push = (id, s) => results.set(id, [...(results.get(id) ?? []), s]);
  const warnings = new Set();
  for (const tr of report.testResults ?? []) {
    const cases = tr.assertionResults ?? [];
    if (cases.length === 0) {
      // 크래시 폴백 — import 단계 사망(구현 전 red-check의 정상 경로). 경로 대조는 verify-tdd.mjs:364 사본.
      const trKey = posix(String(tr.name ?? "")).toLowerCase();
      for (const it of manifest.items)
        if (it.test && posix(join(appAbs, it.test)).toLowerCase() === trKey) push(it.id, "crashed");
      continue;
    }
    for (const a of cases)
      for (const id of evsInName(a)) {
        if (!known.has(id)) { warnings.add(`본표에 없는 ${id} — items에서 제외`); continue; }
        push(id, a.status);
      }
  }
  const notes = [];
  // skipped를 green으로 새게 두지 않는다 — .skip 한 줄이 E6 우회 구멍이 된다 (fail-closed, planedd5 §3-5)
  const items = manifest.items.map((it) => {
    const rs = results.get(it.id) ?? [];
    let status;
    if (rs.length === 0) status = "missing";
    else if (rs.every((s) => s === "passed")) status = "green";
    else {
      status = "red";
      const sk = rs.filter((s) => ["skipped", "todo", "pending", "disabled"].includes(s)).length;
      if (sk) notes.push(`${it.id}: skipped ${sk}건 — 통과 증거 아님`);
    }
    return { id: it.id, status };
  });
  const mapped = items.filter((i) => i.status !== "missing").length;
  return { items, mapped, warnings: [...warnings], notes };
}

function buildSnapshot({ phase, at, runError, mapped, items, prev, evalLockHash, implHash }) {
  if (!runError && mapped === 0) runError = "매핑된 EV 0건 — 테스트 이름에 EV 접두가 없다";
  const runOk = !runError;
  const snapshot = { phase, at, runOk, runner: "vitest", items: runOk ? items : [], evalLockHash, implHash };
  if (runError) snapshot.runError = runError; // 진단용 — 게이트는 읽지 않는다 (planedd5 §3-6)
  if (phase === "final") {
    // redAt 승계 — planedd5 §3-7. 문면 이탈 2건(2026-08-24 사용자 승인, rN 기록):
    // 직전이 final이면 그 redAt을 그대로 승계(재실행 유실 방지) · runOk false인 red의 at은 승계하지
    // 않는다(안 돈 red가 red 증거가 되는 fail-open 방지).
    const redAt = prev?.phase === "red" && prev.runOk !== false ? prev.at : prev?.redAt;
    if (redAt) snapshot.redAt = redAt;
  }
  const advisories = [];
  if (phase === "red" && runOk)
    for (const it of items)
      if (it.status === "green") advisories.push(`${it.id}: 구현 전인데 green — 이 항목은 구현을 재지 못할 수 있다`);
  return { snapshot, exit: runOk ? 0 : 1, advisories };
}

// --lock ① — 빈 근거 해시 셀만 채운 새 전문. 재작성은 원문 split('\n') 기준(parseEval().lines는
// 펜스 내용이 ''로 소실된 배열 — line 번호만 빌리고 바이트는 원문에서). 다른 줄·다른 셀 바이트 불변.
function fillHashCells(evalText, manifest, sentences) {
  const raw = evalText.split("\n");
  for (const it of manifest.items) {
    if (it.hash !== "") continue; // 찬 셀은 두고, 불일치는 E5 몫
    const h = sentences[it.basis];
    if (!h) continue; // SPEC 부재 모드 — 빈 채로 둔다
    raw[it.line - 1] = replaceHashCell(raw[it.line - 1], manifest.cols["근거 해시"], h);
  }
  return raw.join("\n");
}

// 셀 k ↔ 토큰 k+1(선두 `|` 앞 빈 토큰). 분리 정규식은 cellsOf(spec-verify.mjs:16-18)와 동일해야
// 열 인덱스가 parseEval과 어긋나지 않는다. 선두·말미 토큰(선행 공백·말미 \r)은 건드리지 않는다.
function replaceHashCell(rawLine, cellIdx, h8) {
  const tokens = rawLine.split(/(?<!\\)\|/);
  tokens[cellIdx + 1] = ` ${h8} `;
  return tokens.join("|");
}

// ── 실행층 ─────────────────────────────────────────────────────────────────

// 사본: verify-tdd.mjs:235-266 (고정값 5 — 타임아웃 + 프로세스 «그룹» 킬)
function spawnGroupKill(cmd, args, { cwd, timeoutMs }) {
  return new Promise((resolvePromise) => {
    const isWin = process.platform === "win32";
    const child = spawn(cmd, args, {
      cwd,
      detached: !isWin,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderrTail = "";
    child.stderr.on("data", (d) => {
      stderrTail = (stderrTail + d.toString()).slice(-500);
    });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        if (isWin) execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" });
        else process.kill(-child.pid, "SIGKILL");
      } catch {}
    }, timeoutMs);
    child.on("error", (err) => {
      clearTimeout(timer);
      resolvePromise({ code: null, timedOut, stderrTail: String(err) });
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      resolvePromise({ code, timedOut, stderrTail });
    });
  });
}

// 골격 사본: verify-tdd.mjs:268-318 (고정값 3·4). 차이 하나 — 임시 config를 만들지 않는다:
// 앱 자신의 vitest 설정(jsdom 등)으로 돈다. eval-run에게는 앱의 러너 규약이 곧 판정 조건이다(planedd5 §1).
// paths는 매니페스트의 상대 posix 문자열 그대로(cwd=appAbs) — 절대화하면 Windows 역슬래시가
// vitest 파일 필터에서 미매치될 수 있다.
async function runVitestRaw(appAbs, paths) {
  const entry = join(appAbs, "node_modules", "vitest", "vitest.mjs");
  if (!existsSync(entry)) return { runError: "vitest 미설치 — node_modules/vitest/vitest.mjs 부재" };
  const tmp = mkdtempSync(join(tmpdir(), "eval-run-"));
  try {
    const outPath = join(tmp, "result.json");
    const res = await spawnGroupKill(
      process.execPath,
      [entry, "run", ...paths, "--reporter=json", `--outputFile=${outPath}`],
      { cwd: appAbs, timeoutMs: TIMEOUT_MS },
    );
    if (res.timedOut) return { runError: "타임아웃(120s)" };
    if (res.code === null) return { runError: `spawn: ${res.stderrTail.trim()}` };
    if (!existsSync(outPath))
      return {
        runError:
          `결과 파일 부재 (exit ${res.code})` +
          (res.stderrTail ? ` stderr: ${res.stderrTail.trim()}` : ""),
      };
    return { outText: readFileSync(outPath, "utf8") }; // 파싱은 순수층(parseReport) 몫
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function walkImpl(appAbs) {
  const out = {};
  (function walk(rel) {
    let ents;
    try {
      ents = readdirSync(join(appAbs, rel), { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(r);
      } else if (SRC_RE.test(e.name)) {
        // tests/도 SRC 매치면 포함(의도 — final 뒤 테스트를 고쳐도 stale이 잡힌다, planedd5 §3-7)
        out[r] = hash8(readFileSync(join(appAbs, r), "utf8"));
      }
    }
  })("");
  return out;
}

// ── 커맨드 ─────────────────────────────────────────────────────────────────

function lockCmd(appAbs) {
  const evalPath = join(appAbs, "EVAL.md");
  let evalText;
  try {
    evalText = readFileSync(evalPath, "utf8");
  } catch {
    console.error(`계측 실패: EVAL.md 부재 — ${evalPath}`);
    return 1;
  }
  const m = parseManifest(evalText);
  if (m.error) {
    console.error(`계측 실패: ${m.error}`);
    return 1;
  }
  const specPath = join(appAbs, "SPEC.md");
  const hasSpec = existsSync(specPath);
  const sentences = {};
  if (hasSpec) {
    // 정의 줄 스캔 — 첫 매치, 중복은 stderr 경고. 펜스 안 줄은 예시라 스킵
    // (문면 이탈 ③ — 2026-08-24 사용자 승인: 원문 전 줄 스캔이면 예시 S1이 먼저 잡힌다).
    const defs = new Map();
    let inFence = false;
    for (const l of readFileSync(specPath, "utf8").split("\n")) {
      if (/^\s*(```|~~~)/.test(l)) { inFence = !inFence; continue; }
      if (inFence) continue;
      const mm = SENT_DEF_RE.exec(l);
      if (!mm) continue;
      if (defs.has(mm[1])) console.error(`경고: ${mm[1]} 정의 줄 중복 — 첫 매치를 쓴다`);
      else defs.set(mm[1], hash8(canonical(l)));
    }
    for (const it of m.items) {
      // 비 ID 자유 텍스트 근거는 SPEC 부재 모드에서만 정상 — SPEC이 있으면 실존 ID여야 한다(planedd5 §3-1)
      if (!defs.has(it.basis)) {
        console.error(`계측 실패: 근거 «${it.basis}»(${it.id})가 SPEC.md에 없다 — 락은 반쪽을 만들지 않는다`);
        return 1;
      }
      sentences[it.basis] = defs.get(it.basis);
    }
  }
  // ① 빈 해시 셀 채움 → 파일부터 쓴다 (② evalMd가 «채운 뒤» 전문이어야 한다 — 순서가 규약)
  const filled = fillHashCells(evalText, m, sentences);
  if (filled !== evalText) writeFileSync(evalPath, filled);
  // ② ③ ④ ⑤
  const evalMd = hash8(filled);
  const tests = {};
  for (const rel of m.testFiles) {
    try {
      tests[rel] = hash8(readFileSync(join(appAbs, rel), "utf8"));
    } catch {
      console.error(`계측 실패: 테스트 파일 부재 — ${rel}`);
      return 1;
    }
  }
  const lock = { approvedAt: new Date().toISOString(), evalMd, tests, sentences };
  writeFileSync(join(appAbs, ".specgate-eval.lock"), JSON.stringify(lock, null, 2) + "\n");
  console.log(
    `lock 생성 — sentences ${Object.keys(sentences).length} · tests ${Object.keys(tests).length}` +
      ` · evalMd ${evalMd}${hasSpec ? "" : " (SPEC 부재 — edd 단독, 해시 열 빈 채)"}`,
  );
  return 0;
}

async function runCmd(appAbs, phase, wantJson) {
  const evalPath = join(appAbs, "EVAL.md");
  let evalText;
  try {
    evalText = readFileSync(evalPath, "utf8");
  } catch {
    // 매니페스트 실패는 runOk:false 4종 밖(전건 열거 — planedd5 §3-6) — 스냅샷 없이 exit 1
    console.error(`계측 실패: EVAL.md 부재 — ${evalPath}`);
    return 1;
  }
  const m = parseManifest(evalText);
  if (m.error) {
    console.error(`계측 실패: ${m.error}`);
    return 1;
  }
  const snapPath = join(appAbs, ".specgate-eval.json");
  let prev = null;
  try {
    prev = JSON.parse(readFileSync(snapPath, "utf8"));
  } catch {}
  let evalLockHash = null; // 락 부재 = null — 차단은 pre 게이트의 락 부재 검사 몫, 러너는 사실만 남긴다
  try {
    evalLockHash = hash8(readFileSync(join(appAbs, ".specgate-eval.lock"), "utf8"));
  } catch {}
  const implHash = walkImpl(appAbs);
  const at = new Date().toISOString();
  const r = await runVitestRaw(appAbs, m.testFiles);
  let runError = r.runError ?? null;
  let items = [], mapped = 0, warnings = [], notes = [];
  if (!runError) {
    const pr = parseReport(r.outText);
    if (pr.runError) runError = pr.runError;
    else ({ items, mapped, warnings, notes } = mapReport(pr.report, m, appAbs));
  }
  const { snapshot, exit, advisories } = buildSnapshot({
    phase, at, runError, mapped, items, prev, evalLockHash, implHash,
  });
  writeFileSync(snapPath, JSON.stringify(snapshot, null, 2) + "\n"); // 파일은 항상 쓴다 — 무효 스냅샷이 곧 SG1048의 재료
  for (const w of warnings) console.error(`경고: ${w}`);
  for (const n of notes) console.error(n);
  for (const a of advisories) console.error(a); // red 단계 green Advisory — 경고일 뿐 exit 0 (planedd5 §3-8)
  if (wantJson) console.log(JSON.stringify(snapshot, null, 2));
  else {
    console.log(`eval-run --phase ${phase} — runOk ${snapshot.runOk}${runError ? ` (${runError})` : ""} → .specgate-eval.json`);
    for (const it of snapshot.items) console.log(`  ${it.id} ${it.status}`);
  }
  return exit;
}

// ── selftest — 인라인 픽스처만, 실물 vitest 금지 (planedd5 §3-9 — 실물 통합은 §5-2·planedd8 몫) ──

async function selftest() {
  // 모의 매니페스트 = planedd3manifest.md §3-7 예시 EVAL.md 원문 (기대 해시는 그쪽 §5 표와 교차)
  const EVAL_FIX = `# EVAL — 조회 버튼

- SPEC: ./SPEC.md
- 러너: vitest

## 1. 평가 항목

| ID | 근거 | 근거 해시 | 무엇을 어떻게 재나 | 테스트 | 승인 |
| --- | --- | --- | --- | --- | --- |
| EV1 | S1 | e297df68 | 초기 렌더 → 접근 가능한 이름이 «조회»인 버튼 1개가 렌더된다 | tests/eval/lookup.test.tsx | 사용자, 2026-08-24 |
| EV2 | S1 | e297df68 | 버튼 클릭 1회 → 조회 호출 스파이가 정확히 1회 호출된다 | tests/eval/lookup.test.tsx | 사용자, 2026-08-24 |
| EV3 | S1 | e297df68 | 3건 응답 스텁 → 목록 행 3개가 렌더된다 | tests/eval/lookup.test.tsx | 사용자, 2026-08-24 |
| EV4 | I2 | d4f21f56 | 0건 응답 스텁 → «결과 없음» 텍스트가 렌더된다 | tests/eval/lookup-edge.test.tsx | 사용자, 2026-08-24 |
| EV5 | I3 | 14c4c44c | 실패 응답 스텁 → 에러 텍스트가 렌더되고 직전 목록 행 수가 유지된다 | tests/eval/lookup-edge.test.tsx | 사용자, 2026-08-24 |

## 기각

| EV# | 사유 |
| --- | --- |

## 개정

| EV# | 새 해시 | 사유 | 날짜 |
| --- | --- | --- | --- |
`;
  const S1_LINE = "- S1. 접근 가능한 이름이 «조회»인 버튼이 렌더되고, 클릭하면 조회 요청이 정확히 1회 발생하며, 응답의 각 행이 목록의 행으로 렌더된다. (근거: 요청 문장)";
  const APP = "/fake/app";
  const M = parseManifest(EVAL_FIX);

  // 기준 리포터 픽스처(전건 passed) — 케이스는 이걸 한 군데씩 고쳐 만든다(spec-gate D_FULL 선례)
  const AR = (fullName, status) => ({ fullName, status });
  const BASE = () => ({
    testResults: [
      { name: `${APP}/tests/eval/lookup.test.tsx`, assertionResults: [
        AR("EV1: 조회 버튼 렌더", "passed"), AR("EV2: 클릭 1회 호출", "passed"), AR("EV3: 목록 행 3개", "passed"),
      ] },
      { name: `${APP}/tests/eval/lookup-edge.test.tsx`, assertionResults: [
        AR("EV4: 결과 없음", "passed"), AR("EV5: 에러 후 유지", "passed"),
      ] },
    ],
  });
  const mut = (fn) => { const r = BASE(); fn(r); return r; };
  const run = (report, phase = "red", prev = null) => {
    const g = mapReport(report, M, APP);
    return { ...g, ...buildSnapshot({ phase, at: "T-now", runError: null, mapped: g.mapped, items: g.items, prev, evalLockHash: "deadbeef", implHash: {} }) };
  };
  const st = (s) => s.items.map((i) => `${i.id}:${i.status}`).join(" ");
  const want = (g, items, exit) =>
    st(g.snapshot) !== items ? `items «${st(g.snapshot)}»`
    : g.exit !== exit ? `exit ${g.exit}`
    : g.snapshot.runOk !== (exit === 0) ? `runOk ${g.snapshot.runOk}`
    : null;

  const fails = [];
  let total = 0;
  const t = (name, fn) => {
    total++;
    let why;
    try { why = fn(); } catch (e) { why = String(e?.message ?? e); }
    console.log(`${why ? "FAIL" : "ok  "} ${name.padEnd(20)} ${why ?? ""}`);
    if (why) fails.push(name);
  };

  t("0 매니페스트", () => (M.error ? M.error : M.items.length !== 5 || M.testFiles.length !== 2 ? `items ${M.items.length} tests ${M.testFiles.length}` : null));
  t("1 전건 통과", () => want(run(BASE()), "EV1:green EV2:green EV3:green EV4:green EV5:green", 0));
  t("2 일부 실패", () => want(run(mut((r) => { r.testResults[0].assertionResults[1].status = "failed"; })),
    "EV1:green EV2:red EV3:green EV4:green EV5:green", 0));
  t("3 한 케이스 두 EV", () => want(run(mut((r) => {
    r.testResults[0].assertionResults = [AR("EV1 EV2: 렌더와 호출", "failed"), AR("EV3: 목록 행 3개", "passed")];
  })), "EV1:red EV2:red EV3:green EV4:green EV5:green", 0));
  t("4 describe 승계", () => want(run(mut((r) => {
    r.testResults[0].assertionResults[2] = { ancestorTitles: ["EV3: 목록"], title: "행 수가 3이다", fullName: "EV3: 목록 행 수가 3이다", status: "passed" };
  })), "EV1:green EV2:green EV3:green EV4:green EV5:green", 0));
  t("4b fullName 폴백", () => {
    const evs = evsInName({ ancestorTitles: ["EV3: 목록"], title: "행 수가 3이다", status: "passed" });
    return JSON.stringify(evs) === '["EV3"]' ? null : `evs ${JSON.stringify(evs)}`;
  });
  t("5 결과 누락", () => want(run(mut((r) => { r.testResults[1].assertionResults = [AR("EV5: 에러 후 유지", "passed")]; })),
    "EV1:green EV2:green EV3:green EV4:missing EV5:green", 0));
  t("6 크래시 폴백", () => want(run(mut((r) => { r.testResults[1].assertionResults = []; })),
    "EV1:green EV2:green EV3:green EV4:red EV5:red", 0));
  t("7 skipped 혼재", () => {
    const g = run(mut((r) => { r.testResults[0].assertionResults.push(AR("EV1: 다른 각도", "skipped")); }));
    return want(g, "EV1:red EV2:green EV3:green EV4:green EV5:green", 0) ??
      (g.notes.some((n) => /^EV1: skipped 1건/.test(n)) ? null : `notes ${JSON.stringify(g.notes)}`);
  });
  t("8 파싱 불가", () => {
    const pr = parseReport("not-json");
    if (!pr.runError?.startsWith("결과 JSON 파싱 실패")) return `runError «${pr.runError}»`;
    const b = buildSnapshot({ phase: "red", at: "T", runError: pr.runError, mapped: 0, items: [], prev: null, evalLockHash: null, implHash: {} });
    return b.snapshot.runOk === false && b.snapshot.items.length === 0 && b.exit === 1 ? null
      : `runOk ${b.snapshot.runOk} items ${b.snapshot.items.length} exit ${b.exit}`;
  });
  t("9 매핑 0건", () => {
    const g = run(mut((r) => { for (const tf of r.testResults) for (const a of tf.assertionResults) a.fullName = a.fullName.replace(/\bEV\d+\b/g, "케이스"); }));
    return g.snapshot.runOk === false && g.exit === 1 && g.snapshot.items.length === 0 && /매핑된 EV 0건/.test(g.snapshot.runError)
      ? null : `runOk ${g.snapshot.runOk} exit ${g.exit} runError «${g.snapshot.runError}»`;
  });
  t("10 본표 밖 EV", () => {
    const g = run(mut((r) => { r.testResults[0].assertionResults.push(AR("EV9: 외부", "passed")); }));
    return want(g, "EV1:green EV2:green EV3:green EV4:green EV5:green", 0) ??
      (g.warnings.some((w) => w.includes("EV9")) ? null : `warnings ${JSON.stringify(g.warnings)}`);
  });
  t("11 redAt 승계", () => {
    const redAtOf = (prev) => run(BASE(), "final", prev).snapshot.redAt;
    if (redAtOf({ phase: "red", at: "T1", runOk: true }) !== "T1") return "red at 미승계";
    if (redAtOf({ phase: "final", at: "T2", redAt: "T1", runOk: true }) !== "T1") return "final redAt 미승계";
    if (redAtOf({ phase: "red", at: "T1", runOk: false }) !== undefined) return "runOk false red의 at이 승계됨";
    if (redAtOf(null) !== undefined) return "prev 없음인데 redAt";
    return "redAt" in run(BASE(), "red").snapshot ? "red 스냅샷에 redAt" : null;
  });
  t("12 red green Advisory", () => {
    const g = run(BASE()); // red 단계 전건 green — 항목별 Advisory, 위반 아님(exit 0)
    return g.advisories.length === 5 && g.advisories.every((a) => a.includes("구현 전인데 green")) && g.exit === 0
      ? null : `advisories ${g.advisories.length} exit ${g.exit}`;
  });
  t("a 해시 교차검증", () => (hash8(canonical(S1_LINE)) === "e297df68" ? null : `h8 ${hash8(canonical(S1_LINE))}`)); // planedd3 §5 기대표
  t("b walk 제외", () => {
    const tmp = mkdtempSync(join(tmpdir(), "eval-run-self-"));
    try {
      mkdirSync(join(tmp, "src"), { recursive: true });
      mkdirSync(join(tmp, "node_modules", "x"), { recursive: true });
      writeFileSync(join(tmp, "src", "a.ts"), "export {}\n");
      writeFileSync(join(tmp, "node_modules", "x", "b.ts"), "export {}\n");
      const keys = Object.keys(walkImpl(tmp));
      return JSON.stringify(keys) === '["src/a.ts"]' ? null : `keys ${JSON.stringify(keys)}`;
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
  t("c 해시 셀 채움", () => {
    // 해시 열만 비운 판 → 채우면 원판과 바이트 동일해야 한다 (--lock ①의 회귀 감시)
    const empty = EVAL_FIX.replace(/ (e297df68|d4f21f56|14c4c44c) /g, "  ");
    if (empty === EVAL_FIX) return "픽스처 파생 실패 — 비운 것이 없다";
    const me = parseManifest(empty);
    if (me.error) return `빈 판 파싱 실패 — ${me.error}`;
    const filled = fillHashCells(empty, me, { S1: "e297df68", I2: "d4f21f56", I3: "14c4c44c" });
    return filled === EVAL_FIX ? null : "채운 결과가 원판과 다르다";
  });

  console.log(fails.length ? `selftest 실패 — ${fails.length}건 어긋남` : `selftest 통과 — 인라인 ${total}건`);
  process.exit(fails.length ? 1 : 0);
}

// ── CLI ────────────────────────────────────────────────────────────────────
// 직접 실행일 때만 돈다 (eval-verify.mjs:502 선례)
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const args = process.argv.slice(2);
  if (args[0] === "--selftest" && args.length === 1) {
    selftest();
  } else {
    let appDir = null, phase = null, lock = false, wantJson = false, bad = false;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "--phase") phase = args[++i];
      else if (a === "--lock") lock = true;
      else if (a === "--json") wantJson = true;
      else if (a.startsWith("--")) bad = true;
      else if (appDir === null) appDir = a;
      else bad = true;
    }
    if (bad || !appDir || (lock ? phase !== null || wantJson : !["red", "final"].includes(phase))) {
      console.error(
        "usage: node framework/eval-run.mjs <app-dir> --phase red|final [--json]\n" +
          "       node framework/eval-run.mjs <app-dir> --lock\n" +
          "       node framework/eval-run.mjs --selftest",
      );
      process.exit(2);
    }
    try {
      if (lock) process.exit(lockCmd(resolve(appDir)));
      else runCmd(resolve(appDir), phase, wantJson).then((c) => process.exit(c)).catch((e) => {
        console.error(`계측 실패: ${e.stack ?? e}`);
        process.exit(1);
      });
    } catch (e) {
      console.error(`계측 실패: ${e.stack ?? e}`);
      process.exit(1);
    }
  }
}
