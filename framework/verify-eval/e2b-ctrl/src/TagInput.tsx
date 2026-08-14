import { useState } from 'react';
import type { KeyboardEvent } from 'react';

export default function TagInput() {
  const [value, setValue] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const addTag = () => {
    const tag = value.trim();
    if (tag === '') return;
    setValue('');
    if (tags.includes(tag)) return;
    setTags([...tags, tag]);
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    // 한글 등 IME 조합 중의 Enter는 확정용이므로 무시한다.
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    addTag();
  };

  return (
    <div className="tag-input">
      <label htmlFor="tag-input-field">태그</label>
      <input
        id="tag-input-field"
        type="text"
        value={value}
        placeholder="태그를 입력하고 Enter"
        onChange={(event) => setValue(event.target.value)}
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
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
