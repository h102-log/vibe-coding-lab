import TodoEdit from "./TodoEdit";
import type { Todo } from "./types";

type TodoItemProps = {
  todo: Todo;
  /** 이 항목의 편집 초안. null이면 이 항목은 편집 중이 아니다. */
  editDraft: string | null;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onStartEdit: (id: number) => void;
  onEditChange: (draft: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
};

export default function TodoItem({
  todo,
  editDraft,
  onToggle,
  onDelete,
  onStartEdit,
  onEditChange,
  onEditCommit,
  onEditCancel,
}: TodoItemProps) {
  // 편집 중에도 토글·삭제는 그대로 렌더한다. (SPEC U-55)
  return (
    <li data-testid="todo-item">
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`${todo.title} 완료`}
      />
      {editDraft === null ? (
        // 더블클릭 핸들러는 제목에만 붙인다 — 토글·삭제·여백의 더블클릭은 편집을 열지 않는다. (SPEC U-51)
        <span data-testid="todo-title" onDoubleClick={() => onStartEdit(todo.id)}>
          {todo.title}
        </span>
      ) : (
        // 제목 자리를 편집 입력창이 대체한다. CSS로 감추는 방식은 쓸 수 없다. (SPEC U-49)
        <TodoEdit
          draft={editDraft}
          onChange={onEditChange}
          onCommit={onEditCommit}
          onCancel={onEditCancel}
        />
      )}
      <button
        data-testid="todo-delete"
        type="button"
        onClick={() => onDelete(todo.id)}
        aria-label={`${todo.title} 삭제`}
      >
        삭제
      </button>
    </li>
  );
}
