import { useState } from 'react';
import type { FormEvent } from 'react';

type Props = {
  onAdd: (title: string) => void;
};

/**
 * U1/U2: 추가 버튼 testid가 없으므로 Enter(=form submit)가 유일한 추가 경로다.
 * U4: 공백만 있는 값은 아무 상태도 바꾸지 않는다.
 */
export function TodoInput({ onAdd }: Props) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    onAdd(title);
    setValue('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        data-testid="todo-input"
        type="text"
        value={value}
        placeholder="할 일을 입력하세요"
        aria-label="할 일 입력"
        onChange={(e) => setValue(e.target.value)}
      />
    </form>
  );
}
