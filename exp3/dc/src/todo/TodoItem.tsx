import type { Todo } from './types.ts';
import { TodoEdit } from './TodoEdit.tsx';

type Props = {
  todo: Todo;
  editing: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onStartEdit: (id: number) => void;
  onCommitEdit: (id: number, title: string) => void;
  onCancelEdit: () => void;
};

/**
 * U8/X9: toggle/delete는 편집 중에도 이 항목의 todo-item 내부에 하나씩 있다.
 * X1: 편집 중에는 todo-title이 DOM에서 빠지고 그 자리에 todo-edit이 들어간다(감추는 게 아니다).
 */
export function TodoItem({
  todo,
  editing,
  onToggle,
  onDelete,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
}: Props) {
  return (
    <li data-testid="todo-item">
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.completed}
        aria-label={todo.title}
        onChange={() => onToggle(todo.id)}
      />
      {editing ? (
        <TodoEdit
          initialTitle={todo.title}
          onCommit={(title) => onCommitEdit(todo.id, title)}
          onCancel={onCancelEdit}
        />
      ) : (
        // X7/X8: 진입 조작은 제목 더블클릭뿐. 단일 클릭·다른 요소 더블클릭은 편집을 시작하지 않는다.
        <span data-testid="todo-title" onDoubleClick={() => onStartEdit(todo.id)}>
          {todo.title}
        </span>
      )}
      <button data-testid="todo-delete" type="button" onClick={() => onDelete(todo.id)}>
        삭제
      </button>
    </li>
  );
}
