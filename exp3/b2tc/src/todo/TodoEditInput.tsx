import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

type Props = {
  initialTitle: string;
  onCommit: (title: string) => void;
  onCancel: () => void;
};

// 편집이 시작될 때만 마운트된다. 초안은 마운트마다 새로 잡히므로,
// 취소한 편집 내용이 다음 편집으로 새어 나가지 않는다.
export default function TodoEditInput({ initialTitle, onCommit, onCancel }: Props) {
  const [draft, setDraft] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // 기본 동작(암묵적 폼 제출)을 막는다. Enter 한 번이 추가 경로로 새지 않게 한다.
      event.preventDefault();
      const input = inputRef.current;
      onCommit(input ? input.value : draft);
      return;
    }
    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      data-testid="todo-edit"
      type="text"
      value={draft}
      autoFocus
      aria-label="할 일 제목 수정"
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}
