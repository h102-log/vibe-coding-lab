import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

type Props = {
  onAdd: (title: string) => void;
};

export default function TodoInput({ onAdd }: Props) {
  const [value, setValue] = useState('');

  const submit = () => {
    const title = value.trim();
    setValue('');
    if (title !== '') onAdd(title);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    // 기본 동작(암묵적 form submit)을 막아야 한 번의 Enter가 두 번 추가되지 않는다.
    event.preventDefault();
    submit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        data-testid="todo-input"
        type="text"
        value={value}
        aria-label="새 할 일"
        placeholder="할 일을 입력하고 Enter"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button type="submit">추가</button>
    </form>
  );
}
