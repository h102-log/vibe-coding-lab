import { describe, it, expect } from "vitest";
import { truncate } from "../src/textkit.js";

/**
 * 지키는 요구 (SPEC.md 없음 — 과제 요구사항 3번):
 *   "truncate(s: string, max: number): string — 글자 수가 max를 넘으면 잘라서 끝에 "…"(1글자)를 붙인다.
 *    결과의 글자 수는 max를 넘지 않는다. 이모지 같은 서로게이트 쌍을 반 토막 내면 안 된다."
 *
 * 여기서 "글자 수"는 UTF-16 단위가 아니라 코드 포인트 수로 센다 —
 * 그래야 이모지 1개를 1글자로 세고 반 토막도 나지 않는다.
 */

/** 코드 포인트 기준 글자 수 (s.length는 이모지를 2로 세므로 쓰지 않는다). */
const charCount = (s: string) => Array.from(s).length;

describe("truncate", () => {
  it("max 이하면 그대로 둔다", () => {
    expect(truncate("hello", 10)).toBe("hello");
    expect(truncate("hello", 5)).toBe("hello");
    expect(truncate("", 3)).toBe("");
  });

  it("max를 넘으면 잘라서 끝에 …를 붙인다", () => {
    expect(truncate("hello world", 8)).toBe("hello w…");
    expect(truncate("abcdef", 3)).toBe("ab…");
  });

  it("결과의 글자 수가 max를 넘지 않는다", () => {
    for (const max of [1, 2, 3, 5, 8, 13]) {
      expect(charCount(truncate("abcdefghijklmnopqrstuvwxyz", max))).toBeLessThanOrEqual(max);
      expect(charCount(truncate("가나다라마바사아자차카타파하", max))).toBeLessThanOrEqual(max);
      expect(charCount(truncate("😀😃😄😁😆😅😂🤣", max))).toBeLessThanOrEqual(max);
    }
  });

  it("서로게이트 쌍(이모지)을 반 토막 내지 않는다", () => {
    // 이모지 4개(코드 포인트 4개, s.length는 8)를 3글자로 자른다.
    const result = truncate("😀😃😄😁", 3);
    expect(result).toBe("😀😃…");
    // 잘린 조각이 남지 않았는지 — 짝 없는 서로게이트가 있으면 안 된다.
    expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(result)).toBe(false);
  });

  it("이모지는 1글자로 센다", () => {
    // "😀😃"는 s.length로 4지만 2글자이므로 max=2에서는 자르지 않는다.
    expect(truncate("😀😃", 2)).toBe("😀😃");
  });

  it("max가 1이면 …만 남긴다", () => {
    expect(truncate("hello", 1)).toBe("…");
    expect(truncate("😀😃", 1)).toBe("…");
  });

  it("max가 0 이하면 빈 문자열이 된다", () => {
    expect(truncate("hello", 0)).toBe("");
    expect(truncate("hello", -1)).toBe("");
  });

  it("한글도 1글자씩 센다", () => {
    expect(truncate("가나다라마", 3)).toBe("가나…");
    expect(truncate("가나다", 3)).toBe("가나다");
  });
});
