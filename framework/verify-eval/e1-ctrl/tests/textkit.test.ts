import { describe, expect, it } from "vitest";
import { parseTags, slugify, truncate } from "../src/textkit.js";

describe("slugify", () => {
  it("앞뒤 공백을 제거하고 연속 공백을 하이픈 하나로 바꾼다", () => {
    expect(slugify("  Hello   World  ")).toBe("hello-world");
  });

  it("영문 대문자를 소문자로 바꾼다", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("한글은 그대로 둔다", () => {
    expect(slugify("안녕  하세요")).toBe("안녕-하세요");
    expect(slugify("Hello 세계")).toBe("hello-세계");
  });

  it("앞뒤에 하이픈을 남기지 않는다", () => {
    expect(slugify("--Hello--")).toBe("hello");
    expect(slugify(" - Hello - ")).toBe("hello");
  });

  it("공백뿐인 제목은 빈 문자열이 된다", () => {
    expect(slugify("   ")).toBe("");
  });
});

describe("parseTags", () => {
  it("쉼표로 나누고 각 태그를 트림한다", () => {
    expect(parseTags("a, b ,  c")).toEqual(["a", "b", "c"]);
  });

  it("빈 태그를 버린다", () => {
    expect(parseTags("a,,  ,b,")).toEqual(["a", "b"]);
    expect(parseTags("")).toEqual([]);
  });

  it("중복은 첫 등장만 남긴다", () => {
    expect(parseTags("a, b, a, c, b")).toEqual(["a", "b", "c"]);
  });
});

describe("truncate", () => {
  it("max 이하면 그대로 둔다", () => {
    expect(truncate("hello", 5)).toBe("hello");
    expect(truncate("hi", 10)).toBe("hi");
  });

  it("max를 넘으면 잘라내고 …를 붙인다", () => {
    expect(truncate("hello world", 8)).toBe("hello w…");
    expect(truncate("hello world", 8)).toHaveLength(8);
  });

  it("결과 글자 수가 max를 넘지 않는다", () => {
    for (let max = 1; max <= 6; max++) {
      expect(Array.from(truncate("abcdefghij", max)).length).toBeLessThanOrEqual(max);
    }
    expect(truncate("abcdef", 1)).toBe("…");
    expect(truncate("abcdef", 0)).toBe("");
  });

  it("서로게이트 쌍을 반으로 자르지 않는다", () => {
    const emoji = "😀😀😀😀";
    const out = truncate(emoji, 3);
    expect(out).toBe("😀😀…");
    expect(Array.from(out).length).toBe(3);
    expect(out).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
    expect(truncate("a😀b😀c", 4)).toBe("a😀b…");
  });
});
