import type { Todo } from "./types";

type TodoItemProps = {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li data-testid="todo-item">
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`${todo.title} 완료`}
      />
      <span data-testid="todo-title">{todo.title}</span>
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
