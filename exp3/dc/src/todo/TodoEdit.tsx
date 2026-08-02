import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

type Props = {
  initialTitle: string;
  onCommit: (title: string) => void;
  onCancel: () => void;
};

/**
 * SPEC.md §6 — 인라인 편집 입력창.
 * 초안(draft)은 이 컴포넌트가 들고 있다. 편집이 끝나면 언마운트되므로 초안도 함께 사라진다(X21).
 */
export function TodoEdit({ initialTitle, onCommit, onCancel }: Props) {
  const [draft, setDraft] = useState(initialTitle); // X2: 초기값은 현재 제목.
  const ref = useRef<HTMLInputElement>(null);

  // X3: 진입과 동시에 포커스 — 없으면 Enter/Escape가 도달할 수 없는 경로가 된다.
  // X4: 캐럿은 끝에. 전체 선택하면 type()이 append가 아니라 치환이 되어버린다.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // X23: keyCode가 아니라 event.key로 판정한다.
    if (e.key === 'Enter') {
      e.preventDefault(); // X16: 어떤 form에도 submit이 새어 나가지 않게.
      const title = draft.trim(); // X12: 추가 경로(U5)와 같은 트림 규칙.
      // X17: 빈 제목으로는 확정하지 않는다. 지우지도, 빈 제목을 저장하지도 않고 편집만 끝낸다.
      if (title) onCommit(title);
      else onCancel();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <input
      ref={ref}
      data-testid="todo-edit"
      type="text" // X11
      value={draft}
      aria-label="제목 편집" // X31
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onCancel} // X24: 포커스를 잃으면 확정이 아니라 취소다. 확정 경로는 Enter뿐.
    />
  );
}
