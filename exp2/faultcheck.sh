#!/usr/bin/env bash
# Fault-Check (r7 §5-3단계) — 결함을 하나씩 주입하고 AC 오라클로 채점한다.
#   usage: bash exp2/faultcheck.sh            # 4개 전부
#          bash exp2/faultcheck.sh F-07       # 하나만
#
# 결함 정의는 파일 전체 사본이다 (exp2/faults/<ID>/src/...). patch 도구 없이 재현되고,
# 주입 = 복사, 복원 = pristine에서 복사. 회차마다 해시로 복원을 확인한다.
set -euo pipefail
cd "$(dirname "$0")/.."

BASE=exp2/faultbase
PRISTINE=exp2/faultbase-pristine-src
FAULTS=("${@:-F-07 F-08 F-03 F-06}")
# shellcheck disable=SC2206
FAULTS=(${FAULTS[@]})

# 경로가 아니라 내용만 본다 (pristine과 faultbase/src는 디렉터리 이름이 다르다).
srchash() { (cd "$1" && find . -type f | sort | xargs sha256sum) | sha256sum | cut -d' ' -f1; }
CLEAN=$(srchash "$PRISTINE")

restore() {
  rm -rf "$BASE/src"
  cp -r "$PRISTINE" "$BASE/src"
  local h
  h=$(srchash "$BASE/src")
  [ "$h" = "$CLEAN" ] || { echo "!!! 복원 실패: $h != $CLEAN"; exit 1; }
}

for F in "${FAULTS[@]}"; do
  restore
  echo "=== $F 주입 ==="
  while read -r rel; do
    cp "exp2/faults/$F/$rel" "$BASE/$rel"
  done < <(cd "exp2/faults/$F" && find src -type f)
  diff -ru "$PRISTINE" "$BASE/src" > "exp2/faults/$F.diff" || true
  echo "diff $(grep -c '^[+-][^+-]' "exp2/faults/$F.diff") 줄 변경 → exp2/faults/$F.diff"
  node exp2/judge.mjs "$BASE" "fault-$F"
done

restore
echo "=== 복원 완료 (src 해시 = $CLEAN) ==="
