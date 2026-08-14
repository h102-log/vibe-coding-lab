import { useState } from 'react'
import type { KeyboardEvent } from 'react'

export default function TagInput() {
  const [draft, setDraft] = useState('')
  const [tags, setTags] = useState<string[]>([])

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    // 한글 등 IME 조합 중의 Enter는 조합 확정이지 제출이 아니다.
    if (event.nativeEvent.isComposing) return

    const tag = draft.trim()
    if (tag === '') return

    setDraft('')
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]))
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  return (
    <div>
      <input
        type="text"
        value={draft}
        aria-label="태그 입력"
        placeholder="태그를 입력하고 Enter"
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
              <button type="button" aria-label={`${tag} 제거`} onClick={() => removeTag(tag)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
