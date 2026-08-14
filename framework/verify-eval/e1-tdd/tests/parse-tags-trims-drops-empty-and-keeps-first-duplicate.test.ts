import { describe, it, expect } from "vitest";
import { parseTags } from "../src/textkit.js";

/**
 * 지키는 요구 (SPEC.md 없음 — 과제 요구사항 2번):
 *   "parseTags(input: string): string[] — 쉼표로 구분된 태그 문자열을 배열로 바꾼다.
 *    각 태그는 앞뒤 공백을 제거하고, 빈 태그는 버리고, 중복은 첫 등장만 남긴다."
 */
describe("parseTags", () => {
  it("쉼표로 나눈다", () => {
    expect(parseTags("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("각 태그의 앞뒤 공백을 제거한다", () => {
    expect(parseTags(" a , b ,  c  ")).toEqual(["a", "b", "c"]);
  });

  it("빈 태그를 버린다", () => {
    expect(parseTags("a,,b")).toEqual(["a", "b"]);
    expect(parseTags(",a,")).toEqual(["a"]);
    expect(parseTags("a, ,b")).toEqual(["a", "b"]);
  });

  it("중복은 첫 등장만 남기고 순서를 유지한다", () => {
    expect(parseTags("b,a,b,c,a")).toEqual(["b", "a", "c"]);
    // 공백만 다른 태그도 트림 후에는 같은 태그로 본다.
    expect(parseTags("a, a ,  a")).toEqual(["a"]);
  });

  it("빈 문자열이나 구분자뿐인 입력은 빈 배열이 된다", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags("   ")).toEqual([]);
    expect(parseTags(",,,")).toEqual([]);
  });

  it("한글 태그와 공백이 든 태그를 그대로 담는다", () => {
    expect(parseTags(" 한글 , 두 단어 , 한글 ")).toEqual(["한글", "두 단어"]);
  });
});
