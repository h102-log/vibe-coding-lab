import TodoEditor from './TodoEditor';
import type { Todo } from './types';

type Props = {
  todo: Todo;
  editing: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onBeginEdit: (id: string) => void;
  onCommitEdit: (id: string, title: string) => void;
  onCancelEdit: () => void;
};

export default function TodoItem({
  todo,
  editing,
  onToggle,
  onDelete,
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
}: Props) {
  return (
    <li data-testid="todo-item">
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.done}
        aria-label={todo.title}
        onChange={() => onToggle(todo.id)}
      />
      {editing ? (
        // 제목이 있던 자리를 편집 입력창이 대신한다. 둘을 함께 두지 않는다.
        <TodoEditor
          initialTitle={todo.title}
          onCommit={(title) => onCommitEdit(todo.id, title)}
          onCancel={onCancelEdit}
        />
      ) : (
        <span
          data-testid="todo-title"
          onDoubleClick={() => onBeginEdit(todo.id)}
          style={todo.done ? { textDecoration: 'line-through' } : undefined}
        >
          {todo.title}
        </span>
      )}
      <button type="button" data-testid="todo-delete" onClick={() => onDelete(todo.id)}>
        삭제
      </button>
    </li>
  );
}
