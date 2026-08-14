import { describe, it, expect } from "vitest";
import { slugify } from "../src/textkit.js";

/**
 * 지키는 요구 (SPEC.md 없음 — 과제 요구사항 1번):
 *   "slugify(title: string): string — 제목을 URL 슬러그로 바꾼다.
 *    앞뒤 공백을 제거하고, 연속 공백은 하이픈 1개로 바꾸고, 영문 대문자는 소문자로 바꾼다.
 *    한글은 그대로 둔다. 결과 슬러그의 앞뒤에 하이픈이 남으면 안 된다."
 */
describe("slugify", () => {
  it("앞뒤 공백을 제거한다", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });

  it("연속 공백을 하이픈 1개로 바꾼다", () => {
    expect(slugify("hello    world")).toBe("hello-world");
    expect(slugify("a b  c   d")).toBe("a-b-c-d");
  });

  it("탭·줄바꿈 같은 공백 문자도 하이픈 1개로 합친다", () => {
    expect(slugify("hello \t\n world")).toBe("hello-world");
  });

  it("영문 대문자를 소문자로 바꾼다", () => {
    expect(slugify("Hello World")).toBe("hello-world");
    expect(slugify("ALL CAPS")).toBe("all-caps");
  });

  it("한글은 그대로 둔다", () => {
    expect(slugify("한글 제목")).toBe("한글-제목");
    expect(slugify("  한글  Title  ")).toBe("한글-title");
  });

  it("결과 앞뒤에 하이픈을 남기지 않는다", () => {
    // 제목 자체가 하이픈으로 시작/끝나는 경우에도 슬러그 양끝은 깨끗해야 한다.
    expect(slugify("-hello-")).toBe("hello");
    expect(slugify("  --hello world--  ")).toBe("hello-world");
    expect(slugify("- 시작과 끝 -")).toBe("시작과-끝");
  });

  it("공백뿐이거나 빈 제목은 빈 슬러그가 된다", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
    expect(slugify(" - ")).toBe("");
  });

  it("단어 사이의 하이픈은 유지한다", () => {
    expect(slugify("Well-Known Title")).toBe("well-known-title");
  });
});
