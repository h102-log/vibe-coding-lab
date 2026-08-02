import type { Todo } from './types';

type Props = {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function TodoItem({ todo, onToggle, onDelete }: Props) {
  return (
    <li data-testid="todo-item">
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.done}
        aria-label={todo.title}
        onChange={() => onToggle(todo.id)}
      />
      <span
        data-testid="todo-title"
        style={todo.done ? { textDecoration: 'line-through' } : undefined}
      >
        {todo.title}
      </span>
      <button type="button" data-testid="todo-delete" onClick={() => onDelete(todo.id)}>
        삭제
      </button>
    </li>
  );
}
