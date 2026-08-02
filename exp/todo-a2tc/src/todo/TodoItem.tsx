import type { Todo } from './types.ts';

type TodoItemProps = {
  todo: Todo;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function TodoItem({ todo, onToggle, onRemove }: TodoItemProps) {
  return (
    <li data-testid="todo-item" data-completed={todo.completed}>
      <input
        type="checkbox"
        data-testid="todo-toggle"
        checked={todo.completed}
        aria-label={`${todo.title} 완료`}
        onChange={() => onToggle(todo.id)}
      />
      <span data-testid="todo-title">{todo.title}</span>
      <button
        type="button"
        data-testid="todo-delete"
        aria-label={`${todo.title} 삭제`}
        onClick={() => onRemove(todo.id)}
      >
        삭제
      </button>
    </li>
  );
}
