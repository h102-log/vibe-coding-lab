import type { Todo } from './types';
import TodoEditInput from './TodoEditInput';

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
    <li data-testid="todo-item">
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.completed}
        aria-label={`${todo.title} 완료`}
        onChange={() => onToggle(todo.id)}
      />
      {/* 편집 방아쇠는 제목이다. 처리기를 항목(li) 전체에 붙이면 체크박스·삭제 버튼을
          두 번 누르는 것까지 편집으로 이어지므로, 지정된 방아쇠에만 붙인다. */}
      {editing ? (
        <TodoEditInput
          initialTitle={todo.title}
          onCommit={(title) => onCommitEdit(todo.id, title)}
          onCancel={onCancelEdit}
        />
      ) : (
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
