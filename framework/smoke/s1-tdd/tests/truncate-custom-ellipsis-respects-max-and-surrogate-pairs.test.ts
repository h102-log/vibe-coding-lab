/**
 * truncate(s, max, ellipsis?)의 세 번째 인자가 지키는 요구 (확장 과제 명세):
 *
 *   "truncate(s: string, max: number, ellipsis?: string): string — 잘릴 때 끝에
 *    \"…\" 대신 ellipsis를 붙인다(기본값 \"…\"). 결과의 글자 수는 max를 넘지 않아야
 *    하고, 서로게이트 쌍을 반 토막 내면 안 되는 규칙은 그대로다. 세 번째 인자를
 *    생략하면 기존과 완전히 동일하게 동작한다."
 *
 * (이 저장소에는 SPEC.md가 없어 과제 명세문을 그대로 인용한다.)
 *
 * 기본값 "…"만 쓰던 시절의 요구는
 * tests/truncate-respects-max-and-surrogate-pairs.test.ts가 그대로 지킨다.
 * 이 파일은 그 위에 얹힌 ellipsis 인자만 다룬다.
 *
 * 말줄임표는 1글자라는 보장이 없으므로, 잘라낼 본문 길이는 max에서 말줄임표의
 * 코드 포인트 수를 뺀 만큼이다. 본문이든 말줄임표든 코드 포인트 단위로 잘라야
 * 서로게이트 쌍이 반 토막 나지 않는다.
 */
import { describe, expect, it } from "vitest";
import { truncate } from "../src/textkit.js";

/** 코드 포인트 기준 글자 수. */
const len = (s: string) => Array.from(s).length;

describe("truncate의 ellipsis 인자", () => {
  it("잘릴 때 기본 말줄임표 대신 ellipsis를 붙인다", () => {
    expect(truncate("hello", 4, "...")).toBe("h...");
    expect(truncate("hello", 4, ">")).toBe("hel>");
    expect(truncate("한글 제목입니다", 5, "..")).toBe("한글 ..");
  });

  it("max 이하로 짧으면 ellipsis를 붙이지 않는다", () => {
    expect(truncate("hello", 5, "...")).toBe("hello");
    expect(truncate("hi", 5, "[더보기]")).toBe("hi");
    expect(truncate("", 5, "...")).toBe("");
  });

  it("ellipsis가 길어도 결과의 글자 수가 max를 넘지 않는다", () => {
    const s = "abcdefghij";
    for (const ellipsis of ["", ">", "...", "…", "[...]", "🙂", "🙂🙂"]) {
      for (let max = 1; max <= 12; max++) {
        expect(len(truncate(s, max, ellipsis))).toBeLessThanOrEqual(max);
      }
    }
  });

  it("빈 ellipsis면 말줄임표 없이 max 글자로 자른다", () => {
    expect(truncate("hello", 3, "")).toBe("hel");
    expect(len(truncate("hello", 3, ""))).toBe(3);
  });

  it("본문의 서로게이트 쌍을 반 토막 내지 않는다", () => {
    // 이모지 4개(코드 포인트 4개, 코드 유닛 8개)를 2글자 말줄임표로 자른다.
    const cut = truncate("😀😀😀😀", 3, "..");

    expect(cut).toBe("😀..");
    expect(len(cut)).toBe(3);
    expect(cut).not.toContain("�");
    // 본문 자리가 1글자뿐이면 이모지 반쪽 대신 앞 글자까지만 남긴다.
    expect(truncate("a😀😀😀", 3, "..")).toBe("a..");
  });

  it("ellipsis 자체의 서로게이트 쌍도 반 토막 내지 않는다", () => {
    const cut = truncate("abcdef", 3, "🙂");

    expect(cut).toBe("ab🙂");
    expect(len(cut)).toBe(3);
    expect(cut).not.toContain("�");
  });

  it("ellipsis가 max만큼 길면 본문 없이 ellipsis만 남는다", () => {
    expect(truncate("hello", 3, "...")).toBe("...");
    expect(truncate("hello", 1, "…")).toBe("…");
  });

  it("ellipsis가 max보다 길면 ellipsis를 글자 단위로 잘라 max에 맞춘다", () => {
    expect(truncate("hello", 2, "...")).toBe("..");
    expect(truncate("hello", 1, "[...]")).toBe("[");

    // 잘린 ellipsis에도 서로게이트 반쪽이 남으면 안 된다.
    const cut = truncate("hello", 1, "🙂🙂");
    expect(cut).toBe("🙂");
    expect(len(cut)).toBe(1);
    expect(cut).not.toContain("�");
  });

  it("max가 0 이하면 ellipsis와 무관하게 빈 문자열이다", () => {
    expect(truncate("hello", 0, "...")).toBe("");
    expect(truncate("hello", -1, "...")).toBe("");
  });

  it("세 번째 인자를 생략하면 \"…\"를 넘긴 것과 완전히 동일하다", () => {
    const samples = ["", "hi", "hello", "한글 제목입니다", "😀😀😀", "a😀😀"];

    for (const s of samples) {
      for (let max = -1; max <= 12; max++) {
        expect(truncate(s, max)).toBe(truncate(s, max, "…"));
      }
    }
  });
});
