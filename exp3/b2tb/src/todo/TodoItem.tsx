import TodoEdit from "./TodoEdit";
import type { Todo } from "./types";

type Props = {
  todo: Todo;
  editing: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onStartEdit: (id: number) => void;
  onCommitEdit: (id: number, title: string) => void;
  onCancelEdit: () => void;
};

export default function TodoItem({
  todo,
  editing,
  onToggle,
  onDelete,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
}: Props) {
  return (
    <li data-testid="todo-item" data-completed={todo.completed}>
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.completed}
        aria-label={`${todo.title} 완료`}
        onChange={() => onToggle(todo.id)}
      />
      {/* 편집 중에는 제목 자리를 입력창이 대체한다 (SPEC E-02).
          토글·삭제는 편집 중에도 그대로 남는다 (SPEC E-03). */}
      {editing ? (
        <TodoEdit
          title={todo.title}
          onCommit={(title) => onCommitEdit(todo.id, title)}
          onCancel={onCancelEdit}
        />
      ) : (
        <span data-testid="todo-title" onDoubleClick={() => onStartEdit(todo.id)}>
          {todo.title}
        </span>
      )}
      <button
        data-testid="todo-delete"
        type="button"
        aria-label={`${todo.title} 삭제`}
        onClick={() => onDelete(todo.id)}
      >
        삭제
      </button>
    </li>
  );
}
