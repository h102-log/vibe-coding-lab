const ELLIPSIS = "…";

/**
 * 제목을 URL 슬러그로 바꾼다.
 * 앞뒤 공백 제거 → 연속 공백은 하이픈 1개 → 영문 대문자는 소문자.
 * 한글은 그대로 두고, 결과 앞뒤에 하이픈이 남지 않는다.
 */
export function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    // 원래 제목이 하이픈으로 시작/끝나던 경우를 정리한다.
    .replace(/^-+|-+$/g, "");
}

/**
 * 쉼표로 구분된 태그 문자열을 배열로 바꾼다.
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
 * 결과 글자 수는 max를 넘지 않는다.
 * 서로게이트 쌍을 반 토막 내지 않도록 UTF-16 단위가 아닌 코드 포인트 단위로 센다.
 */
export function truncate(s: string, max: number): string {
  if (max <= 0) return "";

  const chars = Array.from(s);
  if (chars.length <= max) return s;

  return chars.slice(0, max - 1).join("") + ELLIPSIS;
}
