import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";

type Props = {
  onAdd: (title: string) => void;
};

export default function TodoInput({ onAdd }: Props) {
  const [draft, setDraft] = useState("");
  // 입력값을 ref로도 들고 있어, Enter 처리 경로가 둘(keydown / form submit)이어도
  // 먼저 실행된 쪽이 ref를 비우면 나머지는 빈 값이 되어 no-op이 된다 (SPEC U-02).
  const draftRef = useRef("");

  const commit = () => {
    const title = draftRef.current.trim();
    if (!title) return;
    onAdd(title);
    draftRef.current = "";
    setDraft("");
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    draftRef.current = event.target.value;
    setDraft(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    commit();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        data-testid="todo-input"
        type="text"
        value={draft}
        placeholder="할 일을 입력하고 Enter"
        aria-label="할 일 입력"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </form>
  );
}
