import { useState } from 'react';
import type { KeyboardEvent } from 'react';

export default function TagInput() {
  const [draft, setDraft] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  function commitDraft() {
    const tag = draft.trim();
    // 공백 제거 후 빈 문자열이면 추가하지 않는다 (입력창도 그대로 둔다).
    if (tag === '') return;
    setDraft('');
    // 공백 제거 후 비교해 이미 있는 태그면 다시 추가하지 않는다.
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    commitDraft();
  }

  function removeTag(target: string) {
    setTags((prev) => prev.filter((tag) => tag !== target));
  }

  return (
    <div>
      <label htmlFor="tag-input">태그 입력</label>
      <input
        id="tag-input"
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      {tags.length === 0 ? (
        <p>태그 없음</p>
      ) : (
        <ul>
          {tags.map((tag) => (
            <li key={tag}>
              <span>{tag}</span>
              <button type="button" onClick={() => removeTag(tag)} aria-label={`${tag} 제거`}>
                제거
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
