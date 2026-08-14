/** 제목을 URL 슬러그로 변환한다. 한글 등 비 ASCII 문자는 그대로 남는다. */
export function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 쉼표로 구분된 태그 문자열을 파싱한다. 빈 태그는 버리고 중복은 첫 등장만 남긴다. */
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
 * 글자 수가 max를 넘으면 잘라내고 "…"를 붙인다. 결과의 글자 수는 max를 넘지 않는다.
 * 길이는 코드 포인트 단위로 세므로 서로게이트 쌍(이모지 등)이 반으로 잘리지 않는다.
 */
export function truncate(s: string, max: number): string {
  if (max <= 0) return "";

  const chars = Array.from(s);
  if (chars.length <= max) return s;

  return chars.slice(0, max - 1).join("") + "…";
}
