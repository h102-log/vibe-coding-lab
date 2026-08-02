// 세션 로그에서 과정 지표를 뽑는다.  usage: node exp/logprobe.mjs <session-uuid> [cwd-slug]
//
// 왜 필요한가: judge.mjs는 라운드 끝의 스냅샷만 본다. 그래서 (a)가 R6/R7에서
// scratch/*.test.tsx를 쓰고 돌리고 지운 것을 M1이 "테스트 0개"로 잘못 기록했다.
// 여기서 뽑는 값은 전부 "무엇을 했는가"이지 "무엇이 남았는가"가 아니다.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const [uuid, slug = "C--Users-bhy99-proj-proj3-exp-todo-a"] = process.argv.slice(2);
if (!uuid) {
  console.error("usage: node exp/logprobe.mjs <session-uuid> [cwd-slug]");
  process.exit(2);
}

const path = join(homedir(), ".claude", "projects", slug, `${uuid}.jsonl`);
const entries = readFileSync(path, "utf8")
  .split("\n")
  .filter(Boolean)
  .flatMap((l) => {
    try {
      return [JSON.parse(l)];
    } catch {
      return [];
    }
  });

// 동결 AC를 도는 것만 오라클이다. 에이전트가 제 설정으로 돌린 vitest는 자체 테스트로 따로 센다.
const IS_ORACLE = /test:ac|tests[\\/]ac[\\/]/;
const IS_VITEST = /vitest/;
const IS_TEST_FILE = /\.(test|spec)\.[jt]sx?$/;
const IS_SRC = /src[\\/]/;
// Read도 file_path를 쓴다. 쓰기 도구만 "작성"으로 세지 않으면 읽기가 작성으로 잡힌다.
const WRITES = new Set(["Write", "Edit", "NotebookEdit"]);

const pending = new Map();
// 스텁 상태에서 돌린 RED 실행과 "첫 구현을 제출한 실행"을 가른다.
// 이걸 안 가르면 오라클을 먼저 돌리는 에이전트가 항상 0/8로 찍힌다 (얇은·Haiku 실측).
let srcWritten = false;
const oracle = [];       // 동결 AC 실행: 순번 + 통과 수
const ownRuns = [];      // 에이전트 자체 테스트 실행
const testFiles = new Map(); // 에이전트가 쓴 테스트 파일 → 삭제 여부
const deletions = [];

for (const e of entries) {
  const content = e.message?.content;
  if (!Array.isArray(content)) continue;
  for (const b of content) {
    if (b.type === "tool_use") {
      const { command = "", file_path = "" } = b.input ?? {};
      if (WRITES.has(b.name) && IS_SRC.test(file_path)) srcWritten = true;
      if (IS_ORACLE.test(command)) pending.set(b.id, { cmd: command, own: false, afterSrc: srcWritten });
      else if (IS_VITEST.test(command)) pending.set(b.id, { cmd: command, own: true, afterSrc: srcWritten });
      if (WRITES.has(b.name) && IS_TEST_FILE.test(file_path)) testFiles.set(file_path, false);
      // 맨 앞만 보면 `cd <dir> && rm -rf selfcheck` 같은 복합 커맨드를 놓친다 ((b) R0 실측).
      if (/(^|[;&|]\s*)(Remove-Item|rm)\b/.test(command)) deletions.push(command.trim());
    }
    if (b.type === "tool_result" && pending.has(b.tool_use_id)) {
      const text = typeof b.content === "string"
        ? b.content
        : (b.content ?? []).map((x) => x.text ?? "").join("");
      // 실패가 많으면 vitest 출력이 길어져 tool_result가 잘리고 맨 아래 "Tests …" 요약이 통째로 사라진다.
      // 파일 요약 줄 "❯ tests/ac/todo.ac.test.tsx (8 tests | 2 failed)"은 위쪽에 있어 살아남는다 — 이걸 먼저 본다.
      const perFile = text.match(/\((\d+) tests?(?: \| (\d+) failed)?\)/);
      const tail = text.match(/Tests\s+(?:(\d+) failed(?: \| (\d+) passed)?|(\d+) passed) \((\d+)\)/);
      let passed = null, total = null;
      if (perFile) {
        total = Number(perFile[1]);
        passed = total - Number(perFile[2] ?? 0);
      } else if (tail) {
        total = Number(tail[4]);
        passed = Number(tail[2] ?? tail[3] ?? 0);
      }
      // 실패 ID: "× AC-07 …" 마커와 "FAIL … > AC-07 …" 줄 양쪽에서 긁는다.
      const failed = [...new Set(
        [...text.matchAll(/(?:×|>)\s*(AC-\d+)/g)].map((x) => x[1]),
      )];
      const { cmd, own, afterSrc } = pending.get(b.tool_use_id);
      (own ? ownRuns : oracle).push({ cmd: cmd.slice(0, 50), passed, total, failed, afterSrc });
      pending.delete(b.tool_use_id);
    }
  }
}

// 삭제 커맨드에 경로가 언급된 테스트 파일은 지워진 것으로 본다.
for (const f of testFiles.keys()) {
  const leaf = f.split(/[\\/]/).slice(-2).join("/");
  const dir = f.split(/[\\/]/).slice(-2, -1)[0];
  if (deletions.some((d) => d.includes(leaf) || (dir && d.includes(dir)))) testFiles.set(f, true);
}

const fmt = (r) => (r.passed === null ? "실행실패" : `${r.passed}/${r.total}`);
const first = oracle[0] ?? null;
const firstImpl = oracle.find((r) => r.afterSrc) ?? null;
console.log(JSON.stringify({
  session: uuid,
  // ★ 1순위: src/에 최소 1회 쓴 뒤의 첫 오라클 실행 = "첫 구현을 제출한 순간"의 점수.
  firstImplOracle: firstImpl ? fmt(firstImpl) : "없음",
  firstImplFailed: firstImpl ? firstImpl.failed : [],
  // 원형(구현 전 RED 실행을 포함). 1순위에서는 내렸지만 계산된 값이라 남긴다.
  firstOracle: first ? fmt(first) : "없음",
  firstFailed: first ? first.failed : [],
  oracleRuns: oracle.length,
  oracleTrace: oracle.map((r) => fmt(r) + (r.afterSrc ? "" : "[RED]")).join(" → "),
  ownTestRuns: ownRuns.length,
  ownTestTrace: ownRuns.map(fmt).join(" → "),
  testsWritten: testFiles.size,
  testsDeleted: [...testFiles.values()].filter(Boolean).length,
  testFiles: [...testFiles.keys()].map((f) => f.split(/[\\/]/).slice(-2).join("/")),
}, null, 2));
