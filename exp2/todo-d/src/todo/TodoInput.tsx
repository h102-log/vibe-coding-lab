import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

type TodoInputProps = {
  onAdd: (title: string) => void;
};

export default function TodoInput({ onAdd }: TodoInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    onAdd(draft);
    setDraft("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commit();
  };

  // Enter는 keydown에서 직접 처리하고 기본 동작을 막는다.
  // preventDefault로 암묵적 submit이 차단되므로 한 번의 Enter가 두 항목을 만들지 않는다. (SPEC U-04)
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    commit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        data-testid="todo-input"
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="할 일을 입력하고 Enter"
        aria-label="할 일 입력"
      />
      <button type="submit">추가</button>
    </form>
  );
}
