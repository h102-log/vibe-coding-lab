#!/usr/bin/env bash
# 앱에 남은 자체 테스트만 실행한다 (동결 AC 제외).
#   usage: bash exp2/selftest.sh <app-dir>
#   출력 : {"files":N,"total":N,"failed":N,"verdict":"killed|survived|none"}
#
# verdict 의미 (mutation score 판정 규칙 — FROZEN2 §1.1):
#   killed   = 하나 이상 실패 → 이 결함을 잡았다
#   survived = 전부 통과      → 놓쳤다
#   none     = 돌릴 테스트가 없다 → 놓친 것으로 집계한다
#
# 자체 테스트의 정의 (파일명이 아니라 내용으로 판정한다 — FROZEN2 §4.2):
#   ① tests/ac/** 밖이고  ② node_modules·dist 밖이고
#   ③ vitest 단언 expect( 와 케이스 선언 it(/test( 를 모두 가진 파일
set -uo pipefail
cd "$(dirname "$0")/.."
APP="$1"
CFG=".selftest.vitest.config.ts"
RES=".selftest-result.json"

# --- 1) 열거 ------------------------------------------------------------
INCLUDE=$(node -e '
const {readdirSync,readFileSync}=require("fs"), {join,sep}=require("path");
const root=process.argv[1], SKIP=new Set(["node_modules","dist",".git","coverage"]);
const out=[];
(function walk(rel){
  for(const e of readdirSync(join(root,rel),{withFileTypes:true})){
    const r=rel?join(rel,e.name):e.name;
    if(e.isDirectory()){ if(!SKIP.has(e.name)) walk(r); continue; }
    if(!e.isFile()||!/\.[cm]?[jt]sx?$/.test(e.name)) continue;
    if(r.split(sep).join("/").startsWith("tests/ac/")) continue;
    let s=""; try{ s=readFileSync(join(root,r),"utf8") }catch{ continue }
    if(/\bexpect\s*\(/.test(s) && /(^|\s)(it|test)\s*\(/m.test(s)) out.push(r.split(sep).join("/"));
  }
})("");
console.log(JSON.stringify(out.sort()));
' "$APP")

if [ "$INCLUDE" = "[]" ]; then
  echo '{"files":0,"total":0,"failed":0,"verdict":"none"}'
  exit 0
fi

# --- 2) 실행 ------------------------------------------------------------
cp exp2/selftest.vitest.config.ts "$APP/$CFG"
rm -f "$APP/$RES"
(cd "$APP" && SELFTEST_INCLUDE="$INCLUDE" npx vitest run --config "$CFG" \
   --reporter=json --outputFile="$RES" >/dev/null 2>&1)

# --- 3) 판정 ------------------------------------------------------------
node -e '
const {readFileSync,existsSync}=require("fs");
const [p,inc]=process.argv.slice(1);
const files=JSON.parse(inc);
if(!existsSync(p)){
  // 설정을 찾은 파일이 있는데 결과가 없다 = 수집 단계에서 죽었다. 놓침이 아니라 잡음으로 센다.
  console.log(JSON.stringify({files:files.length,total:0,failed:0,verdict:"killed",note:"no result file"}));
  process.exit(0);
}
const j=JSON.parse(readFileSync(p,"utf8"));
const total=j.numTotalTests??0, failed=(j.numFailedTests??0)+(j.numRuntimeErrorTestSuites??0);
console.log(JSON.stringify({
  files:files.length, total, failed,
  verdict: total===0&&failed===0 ? "none" : (failed>0 ? "killed" : "survived"),
}));
' "$APP/$RES" "$INCLUDE"

rm -f "$APP/$CFG" "$APP/$RES"
