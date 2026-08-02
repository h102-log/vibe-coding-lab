#!/usr/bin/env bash
# 6단계 (FROZEN2 §4.3) — 산출물에 결함을 하나씩 주입하고, 그 산출물에 남은 자체 테스트가
# 잡아내는지 본다. AC 오라클이 아니라 에이전트가 남긴 테스트로 잰다.
#
#   usage: bash exp2/mutation.sh <app-name> [F-ID ...]
#   예   : bash exp2/mutation.sh todo-d
#          bash exp2/mutation.sh todo-a2t          # (a)(b)는 주입 없이 none 확인만
#
# 전제: 주입 파일이 exp2/faults-d/<app>/<F-ID>/src/… 에 준비돼 있어야 한다.
#       (의미 단위 주입이므로 위치는 산출물마다 다르다 — 사람이 만든다)
#       준비된 결함이 하나도 없으면 selftest 만 1회 돌리고 끝낸다.
set -uo pipefail
cd "$(dirname "$0")/.."

APP="$1"; shift
DIR="exp/$APP"; [ -d "exp2/$APP" ] && DIR="exp2/$APP"
[ -d "$DIR" ] || { echo "!!! 없는 디렉터리: $DIR"; exit 2; }
PRISTINE="exp2/pristine/$APP-src"
OUT="exp2/faults-d/$APP"
mkdir -p "$OUT" "exp2/pristine"

srchash() { (cd "$1" && find . -type f | sort | xargs sha256sum) | sha256sum | cut -d' ' -f1; }

if [ ! -d "$PRISTINE" ]; then
  cp -r "$DIR/src" "$PRISTINE"
  echo "백업 생성: $PRISTINE"
fi
CLEAN=$(srchash "$PRISTINE")

restore() {
  rm -rf "$DIR/src"
  cp -r "$PRISTINE" "$DIR/src"
  local h; h=$(srchash "$DIR/src")
  [ "$h" = "$CLEAN" ] || { echo "!!! 복원 실패: $h != $CLEAN"; exit 1; }
}

FAULTS=("$@")
if [ ${#FAULTS[@]} -eq 0 ]; then
  while read -r f; do FAULTS+=("$(basename "$f")"); done < <(find "$OUT" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort)
fi

restore
echo "--- $APP : 주입 없는 상태의 자체 테스트 ---"
echo "baseline $(bash exp2/selftest.sh "$DIR")"

for F in "${FAULTS[@]}"; do
  restore
  # 주입 파일이 없으면 조용히 "결함 없는 실행"을 내지 말고 멈춘다.
  [ -d "$OUT/$F" ] || { echo "!!! 주입 파일 없음: $OUT/$F"; exit 1; }
  while read -r rel; do
    cp "$OUT/$F/$rel" "$DIR/$rel"
  done < <(cd "$OUT/$F" && find src -type f)
  diff -ru "$PRISTINE" "$DIR/src" > "$OUT/$F.diff" || true
  echo "$F $(bash exp2/selftest.sh "$DIR")"
done

restore
echo "--- 복원 완료 (src 해시 = $CLEAN) ---"
