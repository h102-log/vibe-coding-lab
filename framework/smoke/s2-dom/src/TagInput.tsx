import { useState } from 'react';

/**
 * 태그 입력 컴포넌트.
 *
 * - Enter 로 입력값을 태그에 추가하고 입력창을 비운다.
 * - 태그는 앞뒤 공백을 제거해 저장하고, 제거 후 빈 문자열이면 추가하지 않는다.
 * - 공백 제거 후 이미 있는 태그와 같으면 추가하지 않는다.
 * - 태그마다 제거 버튼이 있고, 누르면 그 태그만 목록에서 언렌더된다.
 * - 태그가 0개면 목록 대신 "태그 없음" 을 렌더한다.
 */
export default function TagInput() {
  const [draft, setDraft] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const tag = draft.trim();
    // 공백만 입력한 경우: 추가하지 않고 입력값도 그대로 둔다.
    if (tag === '') return;

    setDraft('');
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  return (
    <div>
      <label htmlFor="tag-input">태그</label>
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
              <button type="button" aria-label={`${tag} 삭제`} onClick={() => removeTag(tag)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
