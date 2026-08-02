import type { Todo } from './types.ts';

type Props = {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

/** U8: toggle/title/delete는 이 항목의 todo-item 내부에 각각 하나씩 있다. */
export function TodoItem({ todo, onToggle, onDelete }: Props) {
  return (
    <li data-testid="todo-item">
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.completed}
        aria-label={todo.title}
        onChange={() => onToggle(todo.id)}
      />
      <span data-testid="todo-title">{todo.title}</span>
      <button data-testid="todo-delete" type="button" onClick={() => onDelete(todo.id)}>
      </button>
    </li>
  );
}
