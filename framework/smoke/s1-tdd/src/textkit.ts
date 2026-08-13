/**
 * 제목·태그·본문 문자열을 다루는 소도구 모음.
 */

const ELLIPSIS = "…";

/**
 * 제목을 URL 슬러그로 바꾼다.
 *
 * - 앞뒤 공백 제거
 * - 연속 공백은 하이픈 1개로
 * - 영문 대문자는 소문자로 (한글 등 그 밖의 문자는 그대로)
 * - 결과 앞뒤에 하이픈을 남기지 않는다
 */
export function slugify(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[A-Z]/g, (c) => c.toLowerCase())
    .replace(/^-+|-+$/g, "");
}

/**
 * 쉼표로 구분된 태그 문자열을 배열로 바꾼다.
 *
 * 각 태그는 앞뒤 공백을 제거하고, 빈 태그는 버리고, 중복은 첫 등장만 남긴다.
 */
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const raw of input.split(",")) {
    const tag = raw.trim();
    if (tag === "" || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }

  return tags;
}

/**
 * 글자 수가 max를 넘으면 잘라서 끝에 "…"(1글자)를 붙인다.
 *
 * 길이는 코드 유닛이 아니라 코드 포인트로 센다 — 이모지 같은 서로게이트 쌍을
 * 반 토막 내지 않기 위해서다. 결과의 글자 수는 max를 넘지 않는다.
 */
export function truncate(s: string, max: number): string {
  const chars = Array.from(s);
  if (chars.length <= max) return s;
  // 말줄임표 1글자조차 들어갈 자리가 없다.
  if (max <= 0) return "";
  return chars.slice(0, max - 1).join("") + ELLIPSIS;
}
