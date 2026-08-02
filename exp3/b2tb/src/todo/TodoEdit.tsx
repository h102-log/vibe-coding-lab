import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

type Props = {
  title: string;
  onCommit: (title: string) => void;
  onCancel: () => void;
};

/**
 * 편집 중인 항목의 제목 자리에 들어가는 입력창 (SPEC C-02, C-03).
 * 편집 중 값은 이 컴포넌트 안에만 있고, 확정될 때만 밖으로 나간다 (SPEC E-11).
 */
export default function TodoEdit({ title, onCommit, onCancel }: Props) {
  const [draft, setDraft] = useState(title);
  // TodoInput과 같은 이유로 값을 ref로도 들고 있다 — 키 처리와 blur가 겹쳐도 같은 값을 본다.
  const draftRef = useRef(title);
  const inputRef = useRef<HTMLInputElement>(null);
  // 편집 1회당 확정·취소는 정확히 1번만 (SPEC E-27).
  const settled = useRef(false);

  // Enter·Escape가 입력창에 오려면 포커스가 있어야 한다 (SPEC E-07).
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const settle = (finish: () => void) => {
    if (settled.current) return;
    settled.current = true;
    finish();
  };

  const commit = () => {
    const next = draftRef.current.trim();
    // 빈 제목은 확정하지 않는다 — 원래 제목을 두고 편집만 끝낸다 (SPEC E-17).
    if (!next) {
      onCancel();
      return;
    }
    onCommit(next);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    draftRef.current = event.target.value;
    setDraft(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      settle(commit);
      return;
    }
    if (event.key === "Escape" || event.key === "Esc") {
      event.preventDefault();
      settle(onCancel);
    }
  };

  return (
    <input
      ref={inputRef}
      data-testid="todo-edit"
      type="text"
      value={draft}
      aria-label="할 일 제목 수정"
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={() => settle(commit)}
    />
  );
}
