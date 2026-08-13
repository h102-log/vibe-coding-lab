import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

type Props = {
  onAdd: (rawTitle: string) => void;
};

export default function TodoInput({ onAdd }: Props) {
  const [text, setText] = useState('');

  // U1/U3: 빈 값·공백뿐인 값은 onAdd 쪽에서 걸러진다. U4: 어느 쪽이든 입력창은 비운다.
  const submit = () => {
    onAdd(text);
    setText('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    // U37: IME 조합을 끝내는 Enter는 추가가 아니다.
    if (event.nativeEvent.isComposing) return;
    // U9: 기본 폼 제출을 막아 keydown과 submit이 겹쳐 두 번 추가되는 것을 막는다.
    event.preventDefault();
    submit();
  };

  // keydown이 막지 못한 경로(제출 이벤트가 직접 오는 경우)도 같은 동작을 한다.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        data-testid="todo-input"
        type="text"
        value={text}
        placeholder="할 일을 입력하고 Enter"
        aria-label="할 일 입력"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </form>
  );
}
