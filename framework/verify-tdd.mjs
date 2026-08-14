// tdd 산출물 검사기 (계측 — 처치 아님. 에이전트에게 주지 않는다. r20 §1)
//   usage: node framework/verify-tdd.mjs <app-dir> <label>
//          → framework/smoke/runs/verify-<label>.json + 콘솔 사람용 요약
//          node framework/verify-tdd.mjs --selftest
//          → 음성 픽스처 4종을 OS 임시 디렉터리에 생성·검사 (r20 §4)
//
// 종료 코드에 판정을 싣지 않는다 (r20 §3): 0 = 판정 산출 완료(A가 "fail"이어도 0),
// 1 = 계측 실패(run-error), 2 = 사용법 오류. 판정은 전부 JSON 안에만 있다.
// JSON 최상위에 ok/success/pass 류 불리언을 만들지 않는다 — 만드는 순간 그게 게이트다.
import { spawn, execSync } from "node:child_process";
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync,
  renameSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS = join(HERE, "smoke", "runs");
const posix = (p) => p.split(sep).join("/");

// ---------------------------------------------------------------------------
// 검사 A — 잔존·실행: 자체 테스트를 내용 기반으로 열거한다 (파일명 규약 의존 금지 —
// REPORT2 §5.2-1). 정의는 exp2/selftest.sh(FROZEN2 §4.2)와 동일:
// ① tests/ac/ 밖 ② node_modules·dist·.git·coverage 밖 ③ expect( 와 it(/test( 를 모두 가짐
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "coverage"]);

function enumerateTests(appAbs) {
  const out = [];
  (function walk(rel) {
    let ents;
    try {
      ents = readdirSync(join(appAbs, rel), { withFileTypes: true });
    } catch (e) {
      // 앱 루트 자체를 못 읽는 것(ENOTDIR·EACCES)은 판정("none")이 아니라 계측 실패다 —
      // 하위 디렉터리 read 실패만 관용한다
      if (rel === "") throw e;
      return;
    }
    for (const e of ents) {
      const r = rel ? join(rel, e.name) : e.name;
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(r);
        continue;
      }
      if (!e.isFile() || !/\.[cm]?[jt]sx?$/.test(e.name)) continue;
      if (posix(r).startsWith("tests/ac/")) continue;
      let s;
      try {
        s = readFileSync(join(appAbs, r), "utf8");
      } catch {
        continue;
      }
      if (/\bexpect\s*\(/.test(s) && /(^|\s)(it|test)\s*\(/m.test(s)) out.push(posix(r));
    }
  })("");
  return out.sort();
}

// ---------------------------------------------------------------------------
// 검사 B — 요구 인용: 선두 헤더 주석 추출. 빈 줄·shebang·지시어성 라인은 건너뛰고
// 그다음 첫 주석 블록(/* */ 또는 연속 //)을 헤더로 본다. 헤더 부재는 지시 위반 확정이
// 아니라 사람 확인 트리거다 — 스킬 문안은 «파일 안에 적는다»라 위치를 특정하지 않는다.
const DIRECTIVE_LINE =
  /^(#!|\/\/\s*@ts-|\/\/\s*@(?:vitest|jest)-environment(?:-options)?\b|\/\/\/\s*<reference|["']use \w[\w-]*["'];?$)/;
// 독블록으로 왔을 때 지시어로 인정하는 태그 — @see·@file 등 일반 JSDoc 태그 헤더를
// 독블록으로 오인해 «헤더 부재» 오탐을 내지 않도록 environment 지시어로만 좁힌다
const DIRECTIVE_BLOCK_TAG = /^@(?:vitest|jest)-environment(?:-options)?(\s|$)/;

function extractHeader(src) {
  const lines = src.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === "" || DIRECTIVE_LINE.test(t)) {
      i++;
      continue;
    }
    if (t.startsWith("/*")) {
      const block = [];
      let j = i;
      for (; j < lines.length; j++) {
        block.push(lines[j]);
        if (lines[j].includes("*/")) break;
      }
      const body = block.join("\n");
      // @vitest-environment 독블록(지시어만 담은 블록)은 헤더가 아니다 — 건너뛴다
      const inner = body
        .replace(/^\s*\/\*+/, "").replace(/\*+\/\s*$/, "")
        .split("\n").map((l) => l.replace(/^\s*\*?\s?/, "").trim()).filter(Boolean);
      if (inner.length > 0 && inner.every((l) => DIRECTIVE_BLOCK_TAG.test(l))) {
        // 닫는 */ 뒤 같은 줄에 코드가 남아 있으면 코드 라인 도달로 본다 — 통째 스킵하면
        // 뒤따르는 무관 주석이 헤더로 승격된다
        const closing = lines[j] ?? "";
        const rest = closing.slice(closing.indexOf("*/") + 2).trim();
        if (rest !== "") return null;
        i = j + 1;
        continue;
      }
      return body;
    }
    if (t.startsWith("//")) {
      const block = [];
      let j = i;
      for (; j < lines.length; j++) {
        const tj = lines[j].trim();
        if (!tj.startsWith("//") || DIRECTIVE_LINE.test(tj)) break;
        block.push(lines[j]);
      }
      return block.join("\n");
    }
    return null; // 코드 라인 도달 — 헤더 없음
  }
  return null;
}

// SPEC 참조/인용 흔적 검사 — 파일 전체 (r20 §2-B). 판정 없이 재료로만 출력한다
// (B flags 카운트는 헤더 부재만 센다 — 인용의 의미 판정은 사람 몫).
const SPEC_REF = /\bSPEC\b/;

function scanSpecRefs(src) {
  const refs = [];
  const lines = src.split(/\r?\n/);
  for (let n = 0; n < lines.length; n++) {
    if (SPEC_REF.test(lines[n])) refs.push({ line: n + 1, text: lines[n].trim() });
  }
  return refs;
}

// ---------------------------------------------------------------------------
// 검사 C — 환경 의존 단언 패턴. 오탐 전제(flag), 사람 최종 확인.
// 식별자 경계: 선행이 [\w$]면 제외(prefetch(·refetch( 오탐 방지), .·공백 선행은
// 매치(globalThis.fetch(·window.performance.now( 포착). mtime은 후행 경계를 두지 않아
// mtimeMs도 잡는다. vi.useFakeTimers·vi.setSystemTime·고정 인자 new Date("…")는
// 완화 장치이므로 패턴에 없다. 구조 분해(const { now } = Date)는 기지 미탐(r20 §6-4).
const PATTERN_LIST_VERSION = 1;
const ENV_PATTERNS = [
  ["Date.now(", /(?<![\w$])Date\s*\.\s*now\s*\(/g],
  ["new Date()", /(?<![\w$])new\s+Date\s*\(\s*\)/g],
  ["Math.random(", /(?<![\w$])Math\s*\.\s*random\s*\(/g],
  ["fetch(", /(?<![\w$])fetch\s*\(/g],
  ["XMLHttpRequest", /(?<![\w$])XMLHttpRequest/g],
  ["fs.stat", /(?<![\w$])fs\s*\.\s*stat/g],
  ["mtime", /(?<![\w$])mtime/g],
  ["performance.now(", /(?<![\w$])performance\s*\.\s*now\s*\(/g],
];

// 주석 판정은 보수 휴리스틱까지만(r20 §6-8) — 라인 선두 //와 /* */ 블록 추적.
// 판정 결과는 버리지 않고 inComment: true로 강등해 함께 출력한다(카운트만 제외).
function scanEnvFlags(src) {
  const flags = [];
  const lines = src.split(/\r?\n/);
  let inBlock = false;
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    const lineStartsInBlock = inBlock;
    for (const [label, re] of ENV_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        const before = line.slice(0, m.index);
        let inComment;
        if (lineStartsInBlock) {
          // 첫 */ 로 닫힌 뒤 같은 줄에서 /* 가 재개방됐을 수 있다 — else 분기와 같은 검사
          const close = before.indexOf("*/");
          if (close === -1) {
            inComment = true;
          } else {
            const rest = before.slice(close + 2);
            const lastOpen = rest.lastIndexOf("/*");
            inComment = lastOpen !== -1 && !rest.slice(lastOpen).includes("*/");
          }
        } else {
          const lastOpen = before.lastIndexOf("/*");
          inComment =
            /^\s*\/\//.test(line) ||
            (lastOpen !== -1 && !before.slice(lastOpen).includes("*/"));
        }
        flags.push({ line: n + 1, match: label, text: line.trim(), inComment });
      }
    }
    // 다음 라인용 블록 상태 갱신 (문자열 안 /*는 오판 가능 — 감수하는 휴리스틱)
    let idx = 0;
    while (idx < line.length) {
      if (inBlock) {
        const close = line.indexOf("*/", idx);
        if (close === -1) break;
        inBlock = false;
        idx = close + 2;
      } else {
        const lineComment = line.indexOf("//", idx);
        const open = line.indexOf("/*", idx);
        if (open === -1 || (lineComment !== -1 && lineComment < open)) break;
        inBlock = true;
        idx = open + 2;
      }
    }
  }
  return flags;
}

// ---------------------------------------------------------------------------
// 검사 D — 파일명 자기설명: 명백한 일회용 이름만 지적한다(정확 일치, flag).
const GENERIC_NAMES = new Set([
  "scratch", "tmp", "temp", "check", "test", "test1", "test2", "test3",
  "foo", "bar", "baz", "wip", "untitled", "asdf",
]);

function nameFlagOf(fileName) {
  const stem = fileName
    .replace(/\.[cm]?[jt]sx?$/, "")
    .replace(/\.(test|spec)$/, "")
    .replace(/^[_.]+/, "")
    .toLowerCase();
  return GENERIC_NAMES.has(stem) ? `generic: ${stem}` : null;
}

// ---------------------------------------------------------------------------
// 검사 A 실행 — 앱의 vitest 설정을 쓰지 않고, 발견 파일을 절대경로 명시 include로 박은
// 임시 config를 리포 밖 OS 임시 디렉터리에 생성한다(앱 워킹 트리에 쓰는 파일 0개).
// 고정값 5개는 r20 §3 (전부 실측 근거).
function vitestVersionOf(appAbs) {
  try {
    return JSON.parse(
      readFileSync(join(appAbs, "node_modules", "vitest", "package.json"), "utf8"),
    ).version;
  } catch {
    return null;
  }
}

function spawnGroupKill(cmd, args, { cwd, timeoutMs }) {
  return new Promise((resolvePromise) => {
    const isWin = process.platform === "win32";
    // 고정값 5: 타임아웃 + 프로세스 «그룹» 킬 — 자식만 죽이면 워커 포크가 고아로 남아
    // CPU를 점유한다(실측). POSIX는 detached+음수 PID SIGKILL, Windows는 taskkill /T /F.
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

async function runVitest(appAbs, files) {
  // 고정값 4: vitest 호출은 명시 경로. 폴백 없음 — 다른 버전이 조용히 섞이는 경로를 닫는다.
  const entry = join(appAbs, "node_modules", "vitest", "vitest.mjs");
  if (!existsSync(entry)) {
    return { runError: "vitest 미설치 — node_modules/vitest/vitest.mjs 부재 (r20 §5-6 npm ci 선행)" };
  }
  const tmp = mkdtempSync(join(tmpdir(), "verify-tdd-"));
  try {
    const cfgPath = join(tmp, "verify.vitest.config.mjs");
    const outPath = join(tmp, "result.json");
    // 고정값 2: jsdom은 파일 확장자/import로 판정. react 플러그인은 넣지 않는다(실측 불필요).
    const needsDom = files.some(
      (f) =>
        /\.[cm]?[jt]sx$/.test(f) ||
        readFileSync(join(appAbs, f), "utf8").includes("@testing-library"),
    );
    // 고정값 1: globals: true 항상 (RTL 자동 cleanup의 전역 afterEach — s2-dom 17/17↔4/17 실측).
    // 직렬화는 JSON.stringify로만, 경로는 POSIX 구분자 — 템플릿 리터럴은 Windows 경로의
    // \u·\t에서 깨진다(r20 §10-②). import 없는 순수 객체 export.
    const cfg = {
      test: {
        root: posix(appAbs),
        globals: true,
        environment: needsDom ? "jsdom" : "node",
        include: files.map((f) => posix(join(appAbs, f))),
      },
    };
    writeFileSync(cfgPath, `export default ${JSON.stringify(cfg, null, 2)};\n`);
    // 고정값 3: --reporter=json --outputFile (stdout 오염 회피, 텍스트 파싱 금지 — r20 §6-1)
    const res = await spawnGroupKill(
      process.execPath,
      [entry, "run", "--config", cfgPath, "--reporter=json", `--outputFile=${outPath}`],
      { cwd: appAbs, timeoutMs: 120_000 },
    );
    if (res.timedOut) return { runError: "타임아웃(120s) — 프로세스 그룹 SIGKILL" };
    if (!existsSync(outPath)) {
      return {
        runError:
          `결과 파일 부재 — 수집 단계 사망 (vitest exit ${res.code})` +
          (res.stderrTail ? ` stderr: ${res.stderrTail.trim()}` : ""),
      };
    }
    try {
      return { report: JSON.parse(readFileSync(outPath, "utf8")) };
    } catch (e) {
      return { runError: `결과 JSON 파싱 실패 — ${e.message}` };
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true }); // 보증 수단이 아니라 청소
  }
}

// ---------------------------------------------------------------------------
async function verify(appDir, label) {
  const appAbs = resolve(appDir);
  const files = enumerateTests(appAbs);

  // B·C·D는 A와 독립으로 산출한다(r20 §3) — run-error에서도 재료가 남는다.
  const testFiles = files.map((f) => {
    const src = readFileSync(join(appAbs, f), "utf8");
    const header = extractHeader(src);
    return {
      path: f,
      cases: null,
      passed: null,
      failed: null,
      header,
      headerPresent: header !== null,
      specRefs: scanSpecRefs(src),
      envFlags: scanEnvFlags(src),
      nameFlag: nameFlagOf(f.split("/").pop()),
    };
  });

  let A = "none";
  let runOk = true;
  let runError = null;
  const totals = { files: files.length, cases: 0, passed: 0, failed: 0 };
  if (files.length > 0) {
    const r = await runVitest(appAbs, files);
    if (r.runError) {
      A = "run-error";
      runOk = false;
      runError = r.runError;
    } else {
      const report = r.report;
      const byPath = new Map();
      for (const tr of report.testResults ?? []) {
        const cases = tr.assertionResults ?? [];
        byPath.set(posix(tr.name).toLowerCase(), {
          cases: cases.length,
          passed: cases.filter((a) => a.status === "passed").length,
          failed: cases.filter((a) => a.status === "failed").length,
        });
      }
      for (const tf of testFiles) {
        const hit = byPath.get(posix(join(appAbs, tf.path)).toLowerCase());
        if (hit) Object.assign(tf, hit);
      }
      totals.cases = report.numTotalTests ?? 0;
      totals.passed = report.numPassedTests ?? 0;
      totals.failed = report.numFailedTests ?? 0;
      // numRuntimeErrorTestSuites는 vitest 3·4 어디에도 없는 키다(양쪽 실측 — r20 §6-1의
      // 예시 키가 틀렸다, §12). import 단계에서 죽은 스위트는 케이스 실패 0으로 남으므로
      // 실존 키 numFailedTestSuites·success로 잡는다.
      const suiteFailures = report.numFailedTestSuites ?? 0;
      A = totals.failed > 0 || suiteFailures > 0 || report.success === false ? "fail" : "pass";
    }
  }

  const bFlags = testFiles.filter((t) => !t.headerPresent).length;
  const cFlags = testFiles.reduce(
    (n, t) => n + t.envFlags.filter((f) => !f.inComment).length, 0);
  const dFlags = testFiles.filter((t) => t.nameFlag !== null).length;

  const result = {
    label,
    appDir: posix(appAbs),
    when: new Date().toISOString(),
    patternListVersion: PATTERN_LIST_VERSION,
    vitestVersion: vitestVersionOf(appAbs),
    testFiles,
    totals,
    runOk,
    runError,
    verdict: {
      A,
      B: `flags:${bFlags}`,
      C: `flags:${cFlags}`, // inComment: false 매치만 센다
      D: `flags:${dFlags}`,
    },
    // 최상위 ok/success/pass 없음 — 의도적 부재 (r20 §3)
  };

  mkdirSync(RUNS, { recursive: true });
  const outFile = join(RUNS, `verify-${label}.json`);
  writeFileSync(outFile, JSON.stringify(result, null, 2) + "\n");

  // 콘솔 사람용 요약 — 판정 재료를 빠짐없이, 같은 방식으로 (r20 §2)
  console.log(`verify-tdd ${label} (${posix(appAbs)})`);
  console.log(`  A 잔존·실행 : ${A} — ${totals.files}파일 ${totals.cases}케이스 (passed ${totals.passed} / failed ${totals.failed})${runError ? ` — ${runError}` : ""}`);
  console.log(`  B 요구 인용 : flags:${bFlags} — 헤더 ${testFiles.length - bFlags}/${testFiles.length} · SPEC 흔적 ${testFiles.reduce((n, t) => n + t.specRefs.length, 0)}건`);
  console.log(`  C 환경 단언 : flags:${cFlags}`);
  console.log(`  D 파일명    : flags:${dFlags}`);
  for (const tf of testFiles) {
    if (!tf.headerPresent) console.log(`    [B] 헤더 부재 — ${tf.path} (SPEC 흔적 ${tf.specRefs.length}건 — 사람 확인)`);
    for (const f of tf.envFlags)
      console.log(`    [C] ${tf.path}:${f.line} ${f.match}${f.inComment ? " (주석 안 — 강등)" : ""} | ${f.text}`);
    if (tf.nameFlag) console.log(`    [D] ${tf.path} — ${tf.nameFlag}`);
  }
  console.log(`  → ${posix(outFile)}`);
  return result;
}

// ---------------------------------------------------------------------------
// --selftest — 음성 픽스처 4종 (r20 §4). 변형은 여기 상수로 고정하고 기대값은 r20 §4
// 표(문서)에만 있다 — 스크립트가 자기 기대값을 정의하지 않으므로 순환이 아니다(§6-9).
// 산출된 JSON을 사람이 §4 표와 대조한다.
const SELFTEST_SRC = () => join(HERE, "smoke", "s1-tdd");
const MUT_TARGET = "tests/slugify-trims-collapses-lowercases.test.ts";
const MUTATIONS = [
  {
    label: "selftest-1-noheader", // 기대: B 플래그 검출
    apply(dir) {
      const p = join(dir, MUT_TARGET);
      writeFileSync(p, readFileSync(p, "utf8").replace(/^\/\*[\s\S]*?\*\/\s*\r?\n/, ""));
    },
  },
  {
    label: "selftest-2-envdep", // 기대: C 검출(inComment:false) + 주석 매치 강등(카운트 불변)
    apply(dir) {
      const p = join(dir, MUT_TARGET);
      writeFileSync(
        p,
        readFileSync(p, "utf8") +
          '\n// 주석 안 Date.now( — inComment 강등 확인용\nit("환경 의존 단언 (음성 ②)", () => {\n  expect(Date.now()).toBeGreaterThan(0);\n});\n',
      );
    },
  },
  {
    label: "selftest-3-genericname", // 기대: D 플래그 검출
    apply(dir) {
      renameSync(join(dir, MUT_TARGET), join(dir, "tests", "_scratch.test.ts"));
    },
  },
  {
    label: "selftest-4-timeout", // 기대: A "run-error"(타임아웃) + 고아 프로세스 0(사람 확인)
    needsNodeModules: true, // 동기 무한 루프는 실제 vitest 실행이 필요하다
    apply(dir) {
      const p = join(dir, MUT_TARGET);
      writeFileSync(
        p,
        readFileSync(p, "utf8") +
          '\nit("동기 무한 루프 (음성 ④)", () => {\n  while (true) {}\n});\n',
      );
    },
  },
];

async function selftest() {
  const src = SELFTEST_SRC();
  for (const mut of MUTATIONS) {
    const tmp = mkdtempSync(join(tmpdir(), `verify-tdd-${mut.label}-`));
    const app = join(tmp, "app");
    try {
      // 픽스처 코드는 리포에 남기지 않는다 — 임시 디렉터리 사본 (node_modules 제외)
      cpSync(src, app, {
        recursive: true,
        filter: (p) => !p.split(sep).includes("node_modules"),
      });
      if (mut.needsNodeModules) {
        // ④만 실제 vitest 필요 — 심링크로 붙인다 (Windows는 junction, 관리자 권한 불필요)
        const type = process.platform === "win32" ? "junction" : "dir";
        symlinkSync(join(src, "node_modules"), join(app, "node_modules"), type);
      }
      mut.apply(app);
      await verify(app, mut.label);
      console.log("");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
  console.log("selftest 산출 완료 — 판정은 r20 §4 표와 사람이 대조한다");
}

// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
if (args[0] === "--selftest" && args.length === 1) {
  // selftest에서 A "run-error"는 기대 동작(①②③ vitest 미설치·④ 타임아웃)이므로
  // 4건 JSON 산출 완료 = 0. 산출 자체가 죽으면 아래 catch에서 1.
  selftest().catch((e) => {
    console.error(`계측 실패: ${e.stack ?? e}`);
    process.exit(1);
  });
} else if (args.length === 2 && !args[0].startsWith("--")) {
  const [appDir, label] = args;
  if (!existsSync(appDir)) {
    console.error(`계측 실패: 앱 디렉터리 없음 — ${appDir}`);
    process.exit(1);
  }
  verify(appDir, label)
    .then((r) => {
      if (r.verdict.A === "run-error") process.exit(1); // 계측 실패 — 판정이 아니다
    })
    .catch((e) => {
      console.error(`계측 실패: ${e.stack ?? e}`);
      process.exit(1);
    });
} else {
  console.error("usage: node framework/verify-tdd.mjs <app-dir> <label> | --selftest");
  process.exit(2);
}
