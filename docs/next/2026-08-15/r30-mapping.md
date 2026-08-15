# r30 작업 A — 라벨 매핑 (재판정 전 선커밋)

**커밋 시각**: 2026-08-15T17:5x+09:00 (정확한 시각은 이 파일을 담은 커밋의 타임스탬프가 증거다)
**용도**: 순서 봉인. 이 파일은 재판정이 끝날 때까지 열지 않는다(미열람은 자기보고 — r26 §3).

| 라벨 | 실제 출처 | r25 판정 축 |
|---|---|---|
| P1 | framework/smoke/sd2-cart-full/SPEC.md | S-B — 질문 3버킷 · §1 승격 · 부기준 1·2 → A 대조 가능: ③⑤ + 질문 수 |
| P2 | framework/smoke/runs/sd4-cart-r1.json `result`(최종 응답) + `sd4-cart-r1/src/CartList.tsx:29` 주석 | 대조군 — r25 판정 없음. r31 §1(실험자 판정)과 대조 |
| P3 | framework/smoke/sd3b-cart-ask/SPEC.md | S-C 2차 — 확정 3방식 등 → A 대조 가능: ①③④⑤만(시나리오 판정 제외) |
| P4 | framework/smoke/sd1-cart-r1/SPEC.md | S-A — 판정 ①~⑤ 전건 + 질문 수 → **유일한 완전 대조** |
| P5 | framework/smoke/sd3-cart-ask/SPEC.md | S-C 1차 **무효 런** — r25 판정에 안 씀 → 대조 상대 없음(새 판정) |

**대조군**: P2 (= sd4-cart-r1)
**무효 런 산출물**: P5 (= sd3-cart-ask)

## 조립 기록

- 팩 위치: `%TEMP%\sdc-judge\judge-pack\`(조립 원본) → 세션별 `J1`~`J5\`(각각 `P<n>.md`·`RUBRIC.md`·`req-a.md`·`req-b.md`·
  `runs\`만) — «그 장 하나 + RUBRIC + 요구 2장만 준다»(r30 §4-4-3)를 cwd 격리로 물리화.
- `P1`·`P3`·`P4`·`P5`는 SPEC.md **바이트 동일 사본**(`cmp` 확인). `P2`는 SPEC.md가 없어 r30 §3-6ⓐ 규정대로 최종 응답
  텍스트 전문 + 코드 주석 1건(`---` 구분, 경로 표기)으로 구성 — 이 구성 자체가 그룹을 노출하지만 r30 §4-6-1이 미리 인정한 한계.
- `RUBRIC.md` = r30 §부록 A-0~A-5 전문(`sed -n '470,552p'`), 그 밖의 절 없음. `req-a.md`=`sent-sd1.txt`, `req-b.md`=`sent-sd2.txt`.
- 오염 grep(r30 §6-3) — SPEC 4장 + P2 전부 0건.
- 재판정 세션 UUID(런 전 생성): P1 `7e96174b-7d5f-417a-b2cc-25eb1d1fc9bc` · P2 `a1852a3a-6730-4c69-922a-07c6faf419f0` ·
  P3 `a24a6e29-c718-4cef-9bcc-66f5ab22b501` · P4 `77e98b56-a994-42f6-a2b8-0eb39e5e8af6` · P5 `a4a5c606-15c0-4b4d-8521-3129999da1be`.
- 재판정 커맨드(예정): `cat ../prompt-P<n>.txt | claude -p --safe-mode --model opus --effort xhigh --permission-mode acceptEdits
  --session-id <UUID> --output-format json` — cwd = `J<n>\`. `--allowedTools` 없음(Bash 불필요, cwd 밖 `ls` 경로 차단).
  `--safe-mode`는 글로벌 CLAUDE.md·플러그인 훅(r28 §3-2 실측)을 판정 세션에서 빼기 위해서다.
- 프롬프트 4줄(P 번호만 다름): «이 디렉터리에는 RUBRIC.md, P<n>.md, req-a.md, req-b.md 네 파일이 있다. / RUBRIC.md를 먼저 읽고,
  그 지시대로 P<n>.md 한 장을 판정하라. / 결과는 RUBRIC.md의 A-5 산출 형식 그대로, 이 디렉터리에 verdict-P<n>.md 파일로
  저장하라. / 이 디렉터리 밖의 파일이나 디렉터리는 열지 마라. 문서를 평가하거나 고치지 마라.»
