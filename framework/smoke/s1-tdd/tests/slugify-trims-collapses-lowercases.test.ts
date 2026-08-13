/**
 * slugify(title)가 지키는 요구 (과제 명세 1항):
 *
 *   "제목을 URL 슬러그로 바꾼다. 앞뒤 공백을 제거하고, 연속 공백은 하이픈 1개로
 *    바꾸고, 영문 대문자는 소문자로 바꾼다. 한글은 그대로 둔다. 결과 슬러그의
 *    앞뒤에 하이픈이 남으면 안 된다."
 *
 * (이 저장소에는 SPEC.md가 없어 과제 명세문을 그대로 인용한다.)
 */
import { describe, expect, it } from "vitest";
import { slugify } from "../src/textkit.js";

describe("slugify", () => {
  it("앞뒤 공백을 제거한다", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });

  it("연속 공백을 하이픈 1개로 바꾼다", () => {
    expect(slugify("hello   world")).toBe("hello-world");
    expect(slugify("a \t\n b")).toBe("a-b");
  });

  it("영문 대문자를 소문자로 바꾼다", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("한글은 그대로 둔다", () => {
    expect(slugify("한글 제목")).toBe("한글-제목");
    expect(slugify("한글 Title 섞임")).toBe("한글-title-섞임");
  });

  it("결과 앞뒤에 하이픈을 남기지 않는다", () => {
    // 앞뒤 공백이 하이픈으로 바뀌어 남는 경우
    expect(slugify("\t hello world \n")).toBe("hello-world");
    // 제목 자체가 하이픈으로 시작·끝나는 경우
    expect(slugify("-hello-")).toBe("hello");
    expect(slugify(" - hello - ")).toBe("hello");
  });

  it("공백뿐인 제목은 빈 슬러그가 된다", () => {
    expect(slugify("   ")).toBe("");
    expect(slugify("")).toBe("");
  });
});
