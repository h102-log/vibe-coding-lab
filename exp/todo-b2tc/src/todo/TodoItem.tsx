import type { Todo } from './types';

type Props = {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

export default function TodoItem({ todo, onToggle, onDelete }: Props) {
  return (
    <li data-testid="todo-item">
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.completed}
        aria-label={`${todo.title} 완료`}
        onChange={() => onToggle(todo.id)}
      />
      <span data-testid="todo-title">{todo.title}</span>
      <button data-testid="todo-delete" type="button" onClick={() => onDelete(todo.id)}>
        삭제
      </button>
    </li>
  );
}
