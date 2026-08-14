import { useState } from "react";
import type { KeyboardEvent } from "react";

export default function TagInput() {
  const [value, setValue] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  function addTag() {
    const tag = value.trim();
    if (tag === "") return;
    setValue("");
    if (tags.includes(tag)) return;
    setTags([...tags, tag]);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    e.preventDefault();
    addTag();
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  return (
    <div>
      <input
        type="text"
        value={value}
        placeholder="태그 입력 후 Enter"
        aria-label="태그 입력"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {tags.length === 0 ? (
        <p>태그 없음</p>
      ) : (
        <ul>
          {tags.map((tag) => (
            <li key={tag}>
              <span>{tag}</span>
              <button type="button" aria-label={`${tag} 제거`} onClick={() => removeTag(tag)}>
                제거
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
