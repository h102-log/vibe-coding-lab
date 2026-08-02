import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";

type TodoEditProps = {
  draft: string;
  onChange: (draft: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

export default function TodoEdit({
  draft,
  onChange,
  onCommit,
  onCancel,
}: TodoEditProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // 열리는 순간 한 번만 포커스 + 전체 선택. 매 렌더마다 select하면 타이핑이 덮어써진다. (SPEC U-50)
  useEffect(() => {
    const input = inputRef.current;
    input?.focus();
    input?.select();
  }, []);

  // Enter·Escape는 keydown에서만 처리한다. 이 입력창은 <form> 밖이라 암묵적 submit 경로가 없고,
  // 편집 중의 Enter가 새 항목을 추가하거나 확정을 두 번 일으키지 않는다. (SPEC U-62)
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) {
      return; // 한글 조합 중인 Enter는 확정이 아니다. (SPEC U-63)
    }
    if (event.key === "Enter") {
      event.preventDefault();
      onCommit();
      return;
    }
    if (event.key === "Escape" || event.key === "Esc") {
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
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onCommit} // 포커스를 잃으면 Enter와 같이 확정한다. (SPEC U-61)
      aria-label="제목 편집"
    />
  );
}
