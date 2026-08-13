/**
 * parseTags(input)가 지키는 요구 (과제 명세 2항):
 *
 *   "쉼표로 구분된 태그 문자열을 배열로 바꾼다. 각 태그는 앞뒤 공백을 제거하고,
 *    빈 태그는 버리고, 중복은 첫 등장만 남긴다."
 *
 * (이 저장소에는 SPEC.md가 없어 과제 명세문을 그대로 인용한다.)
 */
import { describe, expect, it } from "vitest";
import { parseTags } from "../src/textkit.js";

describe("parseTags", () => {
  it("쉼표로 나눈다", () => {
    expect(parseTags("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("각 태그의 앞뒤 공백을 제거한다", () => {
    expect(parseTags(" a ,  b  ,c ")).toEqual(["a", "b", "c"]);
  });

  it("빈 태그를 버린다", () => {
    expect(parseTags("a,,b")).toEqual(["a", "b"]);
    expect(parseTags(",a,")).toEqual(["a"]);
    expect(parseTags("a, ,b")).toEqual(["a", "b"]);
    expect(parseTags("")).toEqual([]);
    expect(parseTags("  ,  ")).toEqual([]);
  });

  it("중복은 첫 등장만 남긴다 — 등장 순서를 유지한다", () => {
    expect(parseTags("b,a,b")).toEqual(["b", "a"]);
    // 공백만 다른 태그도 트림 후에는 같은 태그다
    expect(parseTags("a, a ,a")).toEqual(["a"]);
  });

  it("한글 태그를 그대로 담는다", () => {
    expect(parseTags("한글, 태그 ,한글")).toEqual(["한글", "태그"]);
  });
});
