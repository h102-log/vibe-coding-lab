/**
 * truncate(s, max)가 지키는 요구 (과제 명세 3항):
 *
 *   "글자 수가 max를 넘으면 잘라서 끝에 \"…\"(1글자)를 붙인다. 결과의 글자 수는
 *    max를 넘지 않는다. 이모지 같은 서로게이트 쌍을 반 토막 내면 안 된다."
 *
 * (이 저장소에는 SPEC.md가 없어 과제 명세문을 그대로 인용한다.)
 *
 * 여기서 "글자 수"는 코드 유닛(s.length)이 아니라 코드 포인트 수로 센다 —
 * 서로게이트 쌍을 쪼개지 않으려면 그래야 한다.
 */
import { describe, expect, it } from "vitest";
import { truncate } from "../src/textkit.js";

/** 코드 포인트 기준 글자 수. */
const len = (s: string) => Array.from(s).length;

describe("truncate", () => {
  it("max 이하면 그대로 둔다", () => {
    expect(truncate("hello", 5)).toBe("hello");
    expect(truncate("hi", 5)).toBe("hi");
    expect(truncate("", 5)).toBe("");
  });

  it("max를 넘으면 잘라서 말줄임표를 붙인다", () => {
    expect(truncate("hello", 4)).toBe("hel…");
    expect(truncate("한글 제목입니다", 5)).toBe("한글 제…");
  });

  it("결과의 글자 수가 max를 넘지 않는다", () => {
    const s = "abcdefghij";
    for (let max = 1; max <= 12; max++) {
      expect(len(truncate(s, max))).toBeLessThanOrEqual(max);
    }
  });

  it("서로게이트 쌍을 반 토막 내지 않는다", () => {
    const emoji = "😀😀😀"; // 코드 포인트 3개, 코드 유닛 6개
    const cut = truncate(emoji, 2);

    expect(cut).toBe("😀…");
    expect(len(cut)).toBe(2);
    // 반 토막 난 서로게이트가 남으면 U+FFFD로 깨진다 — 왕복 검사로 잡는다.
    expect(cut).not.toContain("�");
    expect(Array.from(cut).join("")).toBe(cut);
  });

  it("잘린 자리에 서로게이트 쌍이 걸쳐도 온전한 글자만 남긴다", () => {
    // "a" + 이모지 2개를 max=2로 자르면 "a…"가 되어야 한다 (이모지 반쪽 금지)
    expect(truncate("a😀😀", 2)).toBe("a…");
  });

  it("말줄임표조차 들어갈 자리가 없으면 빈 문자열이다", () => {
    expect(truncate("hello", 0)).toBe("");
    expect(len(truncate("hello", 0))).toBeLessThanOrEqual(0);
  });

  it("max가 1이면 말줄임표만 남는다", () => {
    expect(truncate("hello", 1)).toBe("…");
    expect(len(truncate("hello", 1))).toBe(1);
  });
});
