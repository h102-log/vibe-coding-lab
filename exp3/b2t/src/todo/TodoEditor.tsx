import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

type Props = {
  initialTitle: string;
  onCommit: (title: string) => void;
  onCancel: () => void;
};

export default function TodoEditor({ initialTitle, onCommit, onCancel }: Props) {
  const [value, setValue] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  // 편집을 시작하면 클릭 없이 바로 Enter/Escape를 받을 수 있어야 한다.
  // 텍스트를 선택 상태로 두면 이어서 친 글자가 기존 제목을 통째로 지우므로 커서만 끝으로 옮긴다.
  useEffect(() => {
    const input = inputRef.current;
    if (input === null) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // 기본 동작을 막지 않으면 이 Enter가 form submit으로 새어나갈 수 있다.
      event.preventDefault();
      onCommit(value);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      data-testid="todo-edit"
      type="text"
      value={value}
      aria-label="할 일 수정"
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={handleKeyDown}
      // 포커스를 잃는 경우는 계약이 정하지 않았다. 확정으로 정한다 (SPEC E-18).
      // Enter/Escape로 끝낸 뒤에는 이 요소가 이미 언마운트되어 여기로 오지 않는다.
      onBlur={() => onCommit(value)}
    />
  );
}
