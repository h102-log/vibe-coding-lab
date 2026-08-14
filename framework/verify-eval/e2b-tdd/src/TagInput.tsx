import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

export function TagInput() {
  const [draft, setDraft] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  function addTag() {
    const tag = draft.trim();
    setDraft('');
    if (tag === '') return;
    // 저장된 태그는 항상 trim된 값이므로 trim된 입력과 그대로 비교하면 된다.
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addTag();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((existing) => existing !== tag));
  }

  return (
    <div className="tag-input">
      <label htmlFor="tag-input-field">태그</label>
      <input
        id="tag-input-field"
        type="text"
        value={draft}
        placeholder="태그를 입력하고 Enter"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {tags.length === 0 ? (
        <p className="tag-input-empty">태그 없음</p>
      ) : (
        <ul className="tag-input-list">
          {tags.map((tag) => (
            <li key={tag}>
              <span>{tag}</span>
              <button type="button" onClick={() => removeTag(tag)}>
                제거
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TagInput;
