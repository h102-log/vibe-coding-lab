import { useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

type Props = {
  onAdd: (title: string) => void;
};

export default function TodoInput({ onAdd }: Props) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const input = inputRef.current;
    onAdd(input ? input.value : draft);
    setDraft('');
    if (input) input.value = '';
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commit();
  };

  // Enter의 기본 동작(암묵적 폼 제출)을 막아, 한 번의 Enter가 submit 경로로
  // 한 번 더 추가되지 않게 한다.
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    commit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        data-testid="todo-input"
        type="text"
        value={draft}
        aria-label="할 일 입력"
        placeholder="할 일을 입력하세요"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button type="submit">추가</button>
    </form>
  );
}
